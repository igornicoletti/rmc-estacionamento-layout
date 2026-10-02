// Local integration entry, never selected by the production build.
import { z } from "zod"
import { deliveryMessageSchema } from "../../../src/shared/auth/auth-delivery"
import { DeliveryCrypto } from "../../src/delivery/worker-delivery-crypto"
import { createDeliveryStore } from "../../src/delivery/worker-delivery-store"
import { LocalHttpSmsGateway } from "../../src/delivery/worker-sms-gateway"
import { consumeDelivery, dispatchDelivery, reconcileDelivery } from "../../src/delivery/worker-delivery"
import { httpDeadline, readHttpJson } from "../../../src/lib/http/http-stream"
type FixtureEnv = { SUPABASE_URL: string; SUPABASE_SECRET_KEY: string; DELIVERY_KEYRING: string; SMS_GATEWAY_TOKEN: string; AUTH_DELIVERY_QUEUE: Queue }
export default {
  async queue(batch, env) {
    const deadline = httpDeadline(undefined, 12000)
    try { await consumeDelivery(batch, { enabled: true, store: createDeliveryStore(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY),
      crypto: new DeliveryCrypto(JSON.parse(env.DELIVERY_KEYRING) as unknown, []), gateway: new LocalHttpSmsGateway("http://127.0.0.1:5791", env.SMS_GATEWAY_TOKEN),
      signal: deadline.signal, dlq: batch.queue === "auth-delivery-dlq" }) }
    finally { deadline.dispose() }
  },
  async fetch(request, env) {
    const headers = { "Cache-Control": "no-store" }, path = new URL(request.url).pathname
    if (path === "/health") return Response.json({ ready: true }, { headers })
    const deadline = httpDeadline(request.signal, 12000)
    try {
      const codec = new DeliveryCrypto(JSON.parse(env.DELIVERY_KEYRING) as unknown, [])
      const store = createDeliveryStore(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)
      if (path === "/prepare") {
        const input = z.strictObject({ identityId: z.uuid(), outboxId: z.uuid(), challengeId: z.uuid(), idempotencyKey: z.uuid() }).parse(await readHttpJson(request.body, 4096, deadline.signal))
        const meta = { outboxId: input.outboxId, challengeId: input.challengeId, idempotencyKey: input.idempotencyKey, generation: 1, purpose: "ACTIVATION" as const }
        return Response.json({ envelope: await codec.sealDelivery(meta, "12345678"), phone: await codec.sealPhone("+5511999999999", input.identityId, 1) }, { headers })
      }
      if (path === "/dispatch") return Response.json({ attempted: await dispatchDelivery(store, env.AUTH_DELIVERY_QUEUE, deadline.signal) }, { headers })
      if (path === "/reconcile") return Response.json(await reconcileDelivery(store,
        new LocalHttpSmsGateway("http://127.0.0.1:5791", env.SMS_GATEWAY_TOKEN), deadline.signal), { headers })
      if (path === "/redeliver") {
        const m = deliveryMessageSchema.parse(await readHttpJson(request.body, 4096, deadline.signal))
        await env.AUTH_DELIVERY_QUEUE.send(m)
        return Response.json({ queued: true }, { headers })
      }
      if (path === "/poison") {
        await env.AUTH_DELIVERY_QUEUE.send({ schemaVersion: 999, synthetic: true })
        return Response.json({ queued: true }, { headers })
      }
      return new Response(null, { status: 404, headers })
    } finally { deadline.dispose() }
  },
} satisfies ExportedHandler<FixtureEnv>
