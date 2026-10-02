// Test-only entrypoint. Never imported by the production Worker.
import { z } from "zod"
import { opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import { httpDeadline, readHttpJson } from "../../../src/lib/http/http-stream"
import { WorkerProvisioningProvider } from "../../src/auth/worker-provisioning-provider"
import { createProvisioningStore } from "../../src/auth/worker-provisioning-store"
import { WorkerProvisioningSaga } from "../../src/auth/worker-provisioning-saga"
import { reconcileProvisioningLocal } from "../../src/auth/worker-provisioning-reconciler"

const inputSchema = z.strictObject({ commandId: opaqueIdSchema, owner: opaqueIdSchema,
  operation: z.enum(["START", "RECONCILE"]), loseResponse: z.boolean() })
export default {
  async scheduled(_controller, env) {
    const result = await reconcileProvisioningLocal({ enabled: true, environment: "LOCAL_PRODUCTION_LIKE", authStage: "disabled",
      url: env.SUPABASE_URL, secret: env.SUPABASE_SECRET_KEY }, new AbortController().signal)
    if (result.kind !== "COMPLETE") throw new Error("Local reconciliation incomplete")
  },
  async fetch(request, env) {
    const headers = { "Cache-Control": "no-store" }
    if (new URL(request.url).pathname === "/health" && request.method === "GET") return Response.json({ ready: true }, { headers })
    if (request.method !== "POST" || new URL(request.url).pathname !== "/exercise") return new Response(null, { status: 404, headers })
    const deadline = httpDeadline(request.signal, 12000)
    try {
      const input = inputSchema.parse(await readHttpJson(request.body, 8192, deadline.signal))
      const context = { commandId: input.commandId, requestId: crypto.randomUUID(), signal: deadline.signal }
      const database = createProvisioningStore(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)
      const provider = new WorkerProvisioningProvider(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY,
        (reservation, ctx, mutation) => database.admit(reservation, ctx, mutation))
      let dispatched = 0
      const saga = new WorkerProvisioningSaga(database, {
        getReservedUser: (r, c) => provider.getReservedUser(r, c),
        async createReservedUser(r, c) {
          dispatched++
          const result = await provider.createReservedUser(r, c)
          // Fault injection after the real provider effect, not success fabricated by a mock.
          return input.loseResponse && result.kind === "OWNED" ? { kind: "UNKNOWN" } : result
        },
      })
      const result = input.operation === "START"
        ? await saga.start(input.commandId, 1, input.owner, context)
        : await saga.reconcile(input.commandId, input.owner, context)
      deadline.signal.throwIfAborted()
      return Response.json({ result, dispatched }, { headers })
    } catch { return Response.json({ failed: true }, { status: 503, headers }) }
    finally { deadline.dispose() }
  },
} satisfies ExportedHandler<Pick<Env, "SUPABASE_URL" | "SUPABASE_SECRET_KEY">>
