import { authEndpoints } from "../../src/shared/auth/auth-http-contracts"
import { authPolicy } from "../../src/shared/auth/auth-policy"
import { httpDeadline } from "../../src/lib/http/http-stream"
import { getAuthContext } from "./auth/worker-context"
import { cancelActivation, completeActivation, enrollActivationTotp, requestActivation, verifyActivation,
  writeActivationPassword } from "./auth/worker-activation"
import { createContextStore } from "./auth/worker-context-store"
import { WorkerCrypto } from "./auth/worker-crypto"
import { reconcileProvisioningLocal } from "./auth/worker-provisioning-reconciler"
import { jsonResponse, problemResponse, validatePath, WorkerProblem } from "./http/worker-http"
import { consumeDelivery, dispatchDelivery, reconcileDelivery, receiveDeliveryReceipt } from "./delivery/worker-delivery"
import { deliveryRuntime } from "./delivery/worker-delivery-runtime"
import { createDeliveryStore } from "./delivery/worker-delivery-store"
import { readHttpBytes } from "../../src/lib/http/http-stream"
import { deliveryReceiptEndpoint } from "../../src/shared/auth/auth-delivery"

export default {
  async scheduled(_controller, env) {
    const deadline = httpDeadline(undefined, 25000)
    try {
      // Independent durable jobs share one total budget; either failure cannot suppress the other job.
      const results = await Promise.allSettled([
        (async () => {
          const delivery = deliveryRuntime(env)
          if (!delivery) return
          await reconcileDelivery(delivery.store, delivery.gateway, deadline.signal)
          const attempted = await dispatchDelivery(delivery.store, env.AUTH_DELIVERY_QUEUE, deadline.signal)
          console.log(JSON.stringify({ operation: "delivery-dispatch", attempted }))
        })(),
        (async () => {
          const result = await reconcileProvisioningLocal({ enabled: env.BFF_PROVISIONING_ENABLED === "true", environment: env.ENVIRONMENT,
            authStage: env.AUTH_STAGE, url: env.SUPABASE_URL, secret: env.SUPABASE_SECRET_KEY }, deadline.signal)
          console.log(JSON.stringify({ operation: "provisioning-reconciliation", outcome: result.kind, attempted: result.attempted }))
          if (result.kind === "UNAVAILABLE") throw new Error("Reconciliation unavailable")
        })(),
      ])
      if (results.some((result) => result.status === "rejected")) throw new Error("Scheduled reconciliation unavailable")
    } finally { deadline.dispose() }
  },
  async queue(batch, env) {
    const delivery = deliveryRuntime(env)
    if (!delivery) {
      for (const message of batch.messages) {
        try {
          if (batch.queue === "auth-delivery-dlq" && env.ENVIRONMENT === "LOCAL_PRODUCTION_LIKE"
            && env.AUTH_STAGE === "disabled" && env.SUPABASE_URL === "http://127.0.0.1:55321" && await createDeliveryStore(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)
              .quarantine(message.id, batch.queue, "DISABLED", AbortSignal.timeout(3000), message.body)) message.ack()
          else message.retry({ delaySeconds: 300 })
        } catch { message.retry({ delaySeconds: 300 }) }
      }
      return
    }
    const deadline = httpDeadline(undefined, 25000)
    try { await consumeDelivery(batch, { ...delivery, signal: deadline.signal, dlq: batch.queue === "auth-delivery-dlq" }) }
    finally { deadline.dispose() }
  },
  async fetch(request, env): Promise<Response> {
    const requestId = crypto.randomUUID()
    const started = Date.now()
    const deadline = httpDeadline(request.signal, authPolicy.workerSynchronousBudgetMs)
    let operation = "unknown"
    let response: Response
    try {
      const path = validatePath(request)
      if (!path.startsWith("/api/") && path !== "/api") return await env.ASSETS.fetch(request)
      if (path === deliveryReceiptEndpoint.path && env.BFF_DELIVERY_ENABLED === "true") {
        operation = "delivery-receipt"
        const delivery = deliveryRuntime(env)
        if (!delivery || request.method !== deliveryReceiptEndpoint.method || new URL(request.url).origin !== env.CANONICAL_ORIGIN
          || request.headers.get("Content-Type") !== deliveryReceiptEndpoint.mediaType) throw new WorkerProblem("AUTH_INVALID_REQUEST")
        const bytes = await readHttpBytes(request.body, deliveryReceiptEndpoint.maxBytes, deadline.signal)
        if (!await receiveDeliveryReceipt(bytes, request.headers.get("X-Receipt-Signature") ?? "", delivery.crypto, delivery.store, deadline.signal, request.headers.get("X-Receipt-Key-Version") ?? "")) {
          throw new WorkerProblem("AUTH_ACCESS_DENIED")
        }
        response = jsonResponse({ accepted: true }, requestId)
      } else if (path === authEndpoints.health.path) {
        operation = "health"
        if (request.method !== "GET") throw new WorkerProblem("AUTH_INVALID_REQUEST")
        response = jsonResponse(authEndpoints.health.response.parse({ status: "ok" }), requestId)
      } else if (path === authEndpoints.context.path && env.BFF_CONTEXT_ENABLED === "true") {
        operation = "context"
        if (request.method !== "GET") throw new WorkerProblem("AUTH_INVALID_REQUEST")
        if (env.ENVIRONMENT !== "LOCAL_PRODUCTION_LIKE" || env.AUTH_STAGE !== "disabled"
          || env.CANONICAL_ORIGIN !== "https://localhost:8787") {
          throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
        }
        const { body, cookie } = await getAuthContext(request, env.CANONICAL_ORIGIN,
          new WorkerCrypto(env.AUTH_KEYRING), createContextStore(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY), deadline.signal)
        deadline.signal.throwIfAborted()
        response = jsonResponse(body, requestId, cookie)
      } else if (path === "/api/auth/activation/request" && env.BFF_ACTIVATION_ENABLED === "true") {
        operation = "activation-request"
        if (request.method !== "POST") throw new WorkerProblem("AUTH_INVALID_REQUEST")
        response = await requestActivation(request, env, requestId, deadline.signal)
      } else if (path === "/api/auth/activation/verify" && env.BFF_ACTIVATION_ENABLED === "true") {
        operation = "activation-verify"
        if (request.method !== "POST") throw new WorkerProblem("AUTH_INVALID_REQUEST")
        response = await verifyActivation(request, env, requestId, deadline.signal)
      } else if (path === "/api/auth/activation/restart" && env.BFF_ACTIVATION_ENABLED === "true") {
        operation = "activation-restart"
        if (request.method !== "POST") throw new WorkerProblem("AUTH_INVALID_REQUEST")
        response = await cancelActivation(request, env, requestId, deadline.signal)
      } else if (path === "/api/auth/activation/password" && env.BFF_ACTIVATION_ENABLED === "true") {
        operation = "activation-password"
        if (request.method !== "POST") throw new WorkerProblem("AUTH_INVALID_REQUEST")
        response = await writeActivationPassword(request, env, requestId, deadline.signal)
      } else if (path === "/api/auth/activation/totp/enroll" && env.BFF_ACTIVATION_ENABLED === "true") {
        operation = "activation-totp-enroll"
        if (request.method !== "POST") throw new WorkerProblem("AUTH_INVALID_REQUEST")
        response = await enrollActivationTotp(request, env, requestId, deadline.signal)
      } else if (path === "/api/auth/activation/totp/verify" && env.BFF_ACTIVATION_ENABLED === "true") {
        operation = "activation-totp-verify"
        if (request.method !== "POST") throw new WorkerProblem("AUTH_INVALID_REQUEST")
        response = await completeActivation(request, env, requestId, deadline.signal, "TOTP")
      } else if (path === "/api/auth/activation/complete" && env.BFF_ACTIVATION_ENABLED === "true") {
        operation = "activation-complete"
        if (request.method !== "POST") throw new WorkerProblem("AUTH_INVALID_REQUEST")
        response = await completeActivation(request, env, requestId, deadline.signal, "SKIP")
      } else throw new WorkerProblem("RESOURCE_NOT_FOUND")
    } catch (error) {
      response = problemResponse(deadline.timedOut() ? new WorkerProblem("AUTH_DEPENDENCY_TIMEOUT") : error, requestId)
    } finally { deadline.dispose() }
    console.log(JSON.stringify({ operation, requestId, status: response.status, durationMs: Date.now() - started }))
    return response
  },
} satisfies ExportedHandler<Env>
