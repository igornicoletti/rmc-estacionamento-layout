import type { z } from "zod"
import { authEndpointMethods, type AuthEndpointPath } from "@/shared/auth/auth-endpoints"
import { authProblemSchema, type AuthProblem } from "@/shared/auth/auth-errors"
import { authSecretSchema, authHttpPolicy } from "@/shared/auth/auth-http-contracts"
import { authPolicy } from "@/shared/auth/auth-policy"
import { httpDeadline, readHttpJson } from "./http-stream"

export type HttpResult<T> = { kind: "success"; value: T } | {
  kind: "http"; problem: AuthProblem; retryAfterMs?: number;
} | { kind: "aborted" | "timeout" | "network" | "invalid-payload" | "invalid-request" }
export interface HttpOperation<T> {
  path: AuthEndpointPath
  method: "GET" | "POST"
  response: z.ZodType<T>
  body?: unknown
  input?: z.ZodType
}
export function parseRetryAfter(value: string | null, now: number): number | undefined {
  if (value === null) return undefined
  if (/^\d+$/.test(value)) {
    const result = Number(value) * 1000
    return Number.isSafeInteger(result) ? result : undefined
  }
  // Require an HTTP-date, not permissive Date.parse numeric/local-date syntax.
  if (!/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(value)) return undefined
  const result = Date.parse(value) - now
  return Number.isFinite(result) ? Math.max(0, result) : undefined
}
const retryStatuses = new Set([408, 425, 429, 500, 502, 503, 504])
const forbiddenHeaders = /^(authorization|cookie|set-cookie|apikey|proxy-authorization|x-rmc-csrf-token|x-actor-id|x-role|x-aal)$/i

export function createHttpClient({ fetcher = fetch, now = Date.now, random = Math.random }: {
  fetcher?: typeof fetch; now?: () => number; random?: () => number;
} = {}) {
  let csrfToken: string | undefined
  return {
    setCsrfToken(value: string | undefined) {
      if (value !== undefined && !authSecretSchema.safeParse(value).success) throw new TypeError("Invalid CSRF token")
      csrfToken = value
    },
    async request<T>(operation: HttpOperation<T>, { signal, headers: supplied }: { signal?: AbortSignal; headers?: HeadersInit } = {}): Promise<HttpResult<T>> {
      const path: string = operation.path
      if (!Object.hasOwn(authEndpointMethods, path) || authEndpointMethods[operation.path] !== operation.method
        || /[%\\?#]|\/\//.test(path) || new TextEncoder().encode(path).length > authPolicy.internalUrlBytes) return { kind: "invalid-request" }
      let headers: Headers
      try { headers = new Headers(supplied) } catch { return { kind: "invalid-request" } }
      if ([...headers.keys()].some((name) => forbiddenHeaders.test(name))) return { kind: "invalid-request" }
      let body: string | undefined
      if (operation.method === "POST") {
        if (!csrfToken || !operation.input) return { kind: "invalid-request" }
        const parsed = operation.input.safeParse(operation.body)
        if (!parsed.success) return { kind: "invalid-request" }
        try { body = JSON.stringify(parsed.data) } catch { return { kind: "invalid-request" } }
        if (body === undefined) return { kind: "invalid-request" }
        if (new TextEncoder().encode(body).length > authPolicy.authBodyBytes) return { kind: "invalid-request" }
        headers.set("Content-Type", "application/json")
        headers.set("X-RMC-CSRF-Token", csrfToken)
      } else if (operation.body !== undefined) return { kind: "invalid-request" }
      headers.set("Accept", "application/json, application/problem+json")
      const started = now()
      let result: HttpResult<T> = { kind: "network" }
      for (let attempt = 0; attempt < 2; attempt++) {
        if (signal?.aborted) return { kind: "aborted" }
        const remaining = authHttpPolicy.browserBudgetMs - (now() - started)
        if (remaining <= 0) return result
        const deadline = httpDeadline(signal, Math.min(authPolicy.browserAttemptTimeoutMs, remaining))
        let retryable: boolean
        let wait: number | undefined
        try {
          const response = await fetcher(path, { method: operation.method, body, headers,
            credentials: "same-origin", mode: "same-origin", cache: "no-store", redirect: "error", signal: deadline.signal })
          const mime = response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase()
          if (mime !== (response.ok ? "application/json" : "application/problem+json")) {
            void response.body?.cancel().catch(() => {}); return { kind: "invalid-payload" }
          }
          let unknown: unknown
          try { unknown = await readHttpJson(response.body, authHttpPolicy.responseBytes, deadline.signal) }
          catch (error) {
            if (deadline.signal.aborted) throw error
            return { kind: "invalid-payload" }
          }
          if (response.ok) {
            const parsed = operation.response.safeParse(unknown)
            return parsed.success ? { kind: "success", value: parsed.data } : { kind: "invalid-payload" }
          }
          const problem = authProblemSchema.safeParse(unknown)
          if (!problem.success || problem.data.status !== response.status) {
            // 408/425 may originate at intermediaries; never adopt their payload as authority.
            if (![408, 425].includes(response.status)) return { kind: "invalid-payload" }
            result = { kind: "invalid-payload" }
          } else {
            result = { kind: "http", problem: problem.data }
          }
          wait = parseRetryAfter(response.headers.get("Retry-After"), now())
          if (result.kind === "http" && wait !== undefined) result.retryAfterMs = wait
          retryable = retryStatuses.has(response.status)
        } catch (error) {
          if (signal?.aborted) return { kind: "aborted" }
          if (deadline.timedOut()) { result = { kind: "timeout" }; retryable = true }
          else if (error instanceof SyntaxError || error instanceof RangeError || error instanceof TypeError && error.message.includes("encoded data")) return { kind: "invalid-payload" }
          else { result = { kind: "network" }; retryable = true }
        } finally { deadline.dispose() }
        if (!retryable || operation.method !== "GET" || attempt === 1) return result
        const delay = wait ?? 100 + Math.floor(random() * 401)
        if (delay >= authHttpPolicy.browserBudgetMs - (now() - started)) return result
        const pause = httpDeadline(signal, delay)
        try {
          await new Promise<void>((resolve) => {
            if (pause.signal.aborted) resolve()
            else pause.signal.addEventListener("abort", () => resolve(), { once: true })
          })
        } finally { pause.dispose() }
        if (signal?.aborted) return { kind: "aborted" }
      }
      return result
    },
  }
}
