import { z } from "zod"
import { opaqueIdSchema } from "../../../src/shared/auth/auth-contracts"
import { httpDeadline } from "../../../src/lib/http/http-stream"
import { createWorkerRpc } from "../http/worker-rpc"
import { WorkerProvisioningProvider } from "./worker-provisioning-provider"
import { WorkerProvisioningSaga } from "./worker-provisioning-saga"
import { createProvisioningStore } from "./worker-provisioning-store"

const batchSchema = z.strictObject({ fence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  commandIds: z.array(opaqueIdSchema).max(3).refine((ids) => new Set(ids).size === ids.length) })
export type ProvisioningCycle = { kind: "SKIPPED" | "BUSY" | "COMPLETE" | "UNAVAILABLE"; attempted: number }

// Only explicitly enabled local validation. Scheduled composition is separate from HTTP.
export async function reconcileProvisioningLocal(config: { enabled: boolean; environment: string; authStage: string;
  url: string; secret: string }, parent: AbortSignal): Promise<ProvisioningCycle> {
  if (!config.enabled) return { kind: "SKIPPED", attempted: 0 }
  if (config.environment !== "LOCAL_PRODUCTION_LIKE" || config.authStage !== "disabled"
    || config.url !== "http://127.0.0.1:55321") return { kind: "UNAVAILABLE", attempted: 0 }
  const deadline = httpDeadline(parent, 25000), owner = crypto.randomUUID()
  let attempted = 0
  try {
    const rpc = createWorkerRpc(config.url, config.secret, ["claim_provisioning_batch", "settle_provisioning_batch"])
    const value = await rpc("claim_provisioning_batch", { p_owner: owner, p_limit: 3 }, deadline.signal)
    if (value === null) return { kind: "BUSY", attempted: 0 }
    const batch = batchSchema.parse(value)
    const store = createProvisioningStore(config.url, config.secret)
    const provider = new WorkerProvisioningProvider(config.url, config.secret, (r, c, mutate) => store.admit(r, c, mutate))
    const saga = new WorkerProvisioningSaga(store, provider)
    let healthy = true
    for (const commandId of batch.commandIds) {
      deadline.signal.throwIfAborted()
      attempted++
      const outcome = await saga.reconcile(commandId, owner, { commandId, requestId: crypto.randomUUID(), signal: deadline.signal })
      if (outcome.kind !== "COMMITTED" && outcome.kind !== "ABORTED") { healthy = false; break }
    }
    const settled = await rpc("settle_provisioning_batch", { p_owner: owner, p_fence: batch.fence, p_healthy: healthy }, deadline.signal)
    if (settled !== true) return { kind: "UNAVAILABLE", attempted }
    return { kind: healthy ? "COMPLETE" : "UNAVAILABLE", attempted }
  } catch {
    // On crash/abort the durable lease expires. Never invent rollback or issue a create.
    return { kind: "UNAVAILABLE", attempted }
  } finally { deadline.dispose() }
}
