import { afterEach, describe, expect, it, vi } from "vitest"
import { createContextStore } from "../src/auth/worker-context-store"

afterEach(() => vi.unstubAllGlobals())
describe("F03 upstream adapter", () => {
  it("rejects any non-local URL in this phase", () => {
    for (const url of ["https://remote.supabase.co", "http://127.0.0.1:55321/other", "http://user:password@127.0.0.1:55321"])
      expect(() => createContextStore(url, "synthetic-test-only")).toThrow("AUTH_CONFIGURATION_ERROR")
  })
  it("uses request-scoped RPC headers, deny redirects, signal and bounded protocol", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(null))
    vi.stubGlobal("fetch", fetcher)
    const store = createContextStore("http://127.0.0.1:55321", "synthetic-test-only")
    expect(await store.read("11".repeat(32), new AbortController().signal)).toBeNull()
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/rest/v1/rpc/read_preauth_context"), expect.objectContaining({ redirect: "manual" }))
    expect(fetcher.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get("Cookie")).toBeNull()
  })
  it("invalid MIME, oversized success/error, invalid DTO and network fail explicitly", async () => {
    for (const response of [new Response(null, { status: 302, headers: { Location: "https://other.invalid" } }), new Response("HTML"), new Response("x".repeat(65537), { headers: { "Content-Type": "application/json" } }),
      new Response("x".repeat(65537), { status: 500, headers: { "Content-Type": "application/json" } }),
      new Response("invalid JSON", { headers: { "Content-Type": "application/json" } }), Response.json({ invalid: true })]) {
      vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(response))
      await expect(createContextStore("http://127.0.0.1:55321", "synthetic-test-only").read("11".repeat(32), new AbortController().signal)).rejects.toMatchObject({ code: "AUTH_PROVIDER_FAILURE" })
    }
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(new Error("synthetic-secret")))
    await expect(createContextStore("http://127.0.0.1:55321", "synthetic-test-only").read("11".repeat(32), new AbortController().signal)).rejects.toMatchObject({ code: "AUTH_DEPENDENCY_UNAVAILABLE" })
  })
  it("upstream deadline includes stalled response streaming and cleans its timer", async () => {
    vi.useFakeTimers()
    let cancelled = false
    try {
      vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response(new ReadableStream({ cancel() { cancelled = true } }), { headers: { "Content-Type": "application/json" } })))
      const pending = createContextStore("http://127.0.0.1:55321", "synthetic-test-only").read("11".repeat(32), new AbortController().signal)
      const assertion = expect(pending).rejects.toMatchObject({ code: "AUTH_DEPENDENCY_TIMEOUT" })
      await vi.advanceTimersByTimeAsync(5000)
      await assertion
      expect(cancelled).toBe(true)
      expect(vi.getTimerCount()).toBe(0)
    } finally { vi.useRealTimers() }
  })
})
