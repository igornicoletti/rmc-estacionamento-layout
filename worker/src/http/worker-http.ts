import { authProblemSchema, authProblemStatuses, type AuthProblemCode } from "../../../src/shared/auth/auth-errors"
import { authPolicy } from "../../../src/shared/auth/auth-policy"
import { authHttpPolicy } from "../../../src/shared/auth/auth-http-contracts"
import { readHttpJson } from "../../../src/lib/http/http-stream"

export class WorkerProblem extends Error {
  readonly code: AuthProblemCode
  constructor(code: AuthProblemCode) { super(code); this.code = code }
}
const titles: Record<number, string> = {
  400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
  409: "Conflict", 413: "Content Too Large", 415: "Unsupported Media Type",
  429: "Too Many Requests", 500: "Internal Server Error", 502: "Bad Gateway",
  503: "Service Unavailable", 504: "Gateway Timeout",
}
export function secureResponse(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers)
  headers.set("Cache-Control", "no-store")
  headers.set("X-Content-Type-Options", "nosniff")
  headers.set("X-Request-ID", requestId)
  headers.set("Referrer-Policy", "no-referrer")
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'")
  return new Response(response.body, { status: response.status, headers })
}
export function problemResponse(error: unknown, requestId: string): Response {
  const code = error instanceof WorkerProblem ? error.code : "AUTH_UNEXPECTED_ERROR"
  const status = authProblemStatuses[code]
  const body = authProblemSchema.parse({ type: "about:blank", title: titles[status], status, code, requestId })
  return secureResponse(Response.json(body, { status, headers: {
    "Content-Type": "application/problem+json",
    ...(status === 429 ? { "Retry-After": "60" } : {}),
  } }), requestId)
}
export function jsonResponse(value: unknown, requestId: string, cookie?: string): Response {
  const text = JSON.stringify(value)
  if (new TextEncoder().encode(text).length > authHttpPolicy.responseBytes) throw new WorkerProblem("AUTH_UNEXPECTED_ERROR")
  return secureResponse(new Response(text, { headers: {
    "Content-Type": "application/json", ...(cookie ? { "Set-Cookie": cookie } : {}),
  } }), requestId)
}
export function validatePath(request: Request): string {
  const url = new URL(request.url)
  if (new TextEncoder().encode(url.pathname + url.search).length > authPolicy.internalUrlBytes
    || /[%\\]|\/\//.test(url.pathname) || url.search || url.hash) throw new WorkerProblem("AUTH_INVALID_REQUEST")
  return url.pathname
}
export function protectOrigin(request: Request, origin: string, mutation: boolean): void {
  const supplied = request.headers.get("Origin")
  const site = request.headers.get("Sec-Fetch-Site")
  if ((supplied !== null && supplied !== origin) || (mutation && supplied !== origin)
    || (site !== null && !["same-origin", "none"].includes(site))) throw new WorkerProblem("AUTH_ORIGIN_DENIED")
}
export async function requestJson(request: Request, signal: AbortSignal): Promise<unknown> {
  const length = request.headers.get("Content-Length")
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > authPolicy.authBodyBytes)) {
    void request.body?.cancel().catch(() => undefined)
    throw new WorkerProblem(/^\d+$/.test(length) ? "AUTH_BODY_TOO_LARGE" : "AUTH_INVALID_REQUEST")
  }
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json"
    || request.headers.has("Content-Encoding")) {
    void request.body?.cancel().catch(() => undefined)
    throw new WorkerProblem("AUTH_UNSUPPORTED_MEDIA_TYPE")
  }
  try { return await readHttpJson(request.body, authPolicy.authBodyBytes, signal) }
  catch (error) {
    if (signal.aborted) throw error
    throw new WorkerProblem(error instanceof RangeError ? "AUTH_BODY_TOO_LARGE" : "AUTH_INVALID_REQUEST")
  }
}
