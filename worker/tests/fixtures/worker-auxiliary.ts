import type { AuthContextStore } from "../../../src/shared/auth/auth-http-contracts"
import type { WorkerCrypto } from "../../src/auth/worker-crypto"
import { protectMutation } from "../../src/auth/worker-context"
import { problemResponse, requestJson } from "../../src/http/worker-http"
import { z } from "zod"

// Test-only Worker; never imported by the production entry point.
export function auxiliaryWorker(origin: string, adapter: WorkerCrypto, store: AuthContextStore) {
  let effects = 0
  return {
    effects: () => effects,
    async fetch(request: Request): Promise<Response> {
      try {
        await protectMutation(request, origin, adapter, store, request.signal)
        z.strictObject({}).parse(await requestJson(request, request.signal))
        effects++
        return Response.json({ effects })
      } catch (error) { return problemResponse(error, crypto.randomUUID()) }
    },
  }
}
