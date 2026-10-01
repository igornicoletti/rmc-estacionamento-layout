import { authEndpoints } from "../../src/shared/auth/auth-http-contracts"
import { authPolicy } from "../../src/shared/auth/auth-policy"
import { httpDeadline } from "../../src/lib/http/http-stream"
import { getAuthContext } from "./auth/worker-context"
import { createContextStore } from "./auth/worker-context-store"
import { WorkerCrypto } from "./auth/worker-crypto"
import { jsonResponse, problemResponse, validatePath, WorkerProblem } from "./http/worker-http"

export default {
  async fetch(request, env): Promise<Response> {
    const requestId = crypto.randomUUID()
    const started = Date.now()
    const deadline = httpDeadline(request.signal, authPolicy.workerSynchronousBudgetMs)
    let operation = "unknown"
    let response: Response
    try {
      const path = validatePath(request)
      if (!path.startsWith("/api/") && path !== "/api") return await env.ASSETS.fetch(request)
      if (path === authEndpoints.health.path) {
        operation = "health"
        if (request.method !== "GET") throw new WorkerProblem("AUTH_INVALID_REQUEST")
        response = jsonResponse(authEndpoints.health.response.parse({ status: "ok" }), requestId)
      } else if (path === authEndpoints.context.path && env.BFF_CONTEXT_ENABLED === "true") {
        operation = "context"
        if (request.method !== "GET") throw new WorkerProblem("AUTH_INVALID_REQUEST")
        if (env.ENVIRONMENT !== "LOCAL_PRODUCTION_LIKE" || env.AUTH_STAGE !== "disabled"
          || env.CANONICAL_ORIGIN !== "https://localhost:8787" || new URL(request.url).origin !== env.CANONICAL_ORIGIN) {
          throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
        }
        const { body, cookie } = await getAuthContext(request, env.CANONICAL_ORIGIN,
          new WorkerCrypto(env.AUTH_KEYRING), createContextStore(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY), deadline.signal)
        response = jsonResponse(body, requestId, cookie)
      } else throw new WorkerProblem("RESOURCE_NOT_FOUND")
    } catch (error) {
      response = problemResponse(deadline.timedOut() ? new WorkerProblem("AUTH_DEPENDENCY_TIMEOUT") : error, requestId)
    } finally { deadline.dispose() }
    console.log(JSON.stringify({ operation, requestId, status: response.status, durationMs: Date.now() - started }))
    return response
  },
} satisfies ExportedHandler<Env>
