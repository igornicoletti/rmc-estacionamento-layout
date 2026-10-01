import { createClient } from "@supabase/supabase-js"
import { authHttpPolicy } from "../../../src/shared/auth/auth-http-contracts"
import { authPolicy } from "../../../src/shared/auth/auth-policy"
import { httpDeadline, readHttpBytes } from "../../../src/lib/http/http-stream"
import { WorkerProblem } from "./worker-http"

// Server-only transport. Each factory is request-scoped and admits explicit RPC names.
export function createWorkerRpc(url: string, secret: string, operations: readonly string[]) {
  if (url !== "http://127.0.0.1:55321" || !secret || operations.some((name) => !/^[a-z_]+$/.test(name))) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
  const client = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    db: { schema: "rmc_auth_api" },
    global: { fetch: async (input, init) => {
      const target = new URL(input instanceof Request ? input.url : String(input))
      if (target.origin !== url || target.search || target.hash || init?.method !== "POST"
        || !operations.some((name) => target.pathname === `/rest/v1/rpc/${name}`)) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
      const deadline = httpDeadline(init.signal ?? undefined, authPolicy.upstreamAttemptTimeoutMs)
      try {
        const response = await fetch(input, { ...init, redirect: "manual", signal: deadline.signal })
        if (response.status >= 300 && response.status < 400
          || response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
          void response.body?.cancel().catch(() => {})
          throw new WorkerProblem("AUTH_PROVIDER_FAILURE")
        }
        const bytes = await readHttpBytes(response.body, authHttpPolicy.rpcResponseBytes, deadline.signal)
        try { JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes)) }
        catch { throw new WorkerProblem("AUTH_PROVIDER_FAILURE") }
        return new Response(bytes, { status: response.status, headers: response.headers })
      } catch (error) {
        if (error instanceof WorkerProblem) throw error
        if (deadline.timedOut() || init.signal?.aborted) throw new WorkerProblem("AUTH_DEPENDENCY_TIMEOUT")
        throw new WorkerProblem(error instanceof RangeError ? "AUTH_PROVIDER_FAILURE" : "AUTH_DEPENDENCY_UNAVAILABLE")
      } finally { deadline.dispose() }
    } },
  })
  return async (name: string, args: Record<string, string | number | boolean>, signal: AbortSignal): Promise<unknown> => {
    if (!operations.includes(name)) throw new WorkerProblem("AUTH_CONFIGURATION_ERROR")
    signal.throwIfAborted()
    try {
      const result = await client.rpc(name, args).abortSignal(signal).throwOnError()
      const data: unknown = result.data
      return data
    } catch (error) {
      if (error instanceof WorkerProblem) throw error
      const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined
      throw new WorkerProblem(code === "22023" ? "AUTH_INVALID_REQUEST" : "AUTH_DEPENDENCY_UNAVAILABLE")
    }
  }
}
