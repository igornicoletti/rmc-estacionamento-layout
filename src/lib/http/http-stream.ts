/** Isomorphic bounded byte reader; never consumes an unbounded text/json body. */
export async function readHttpBytes(body: ReadableStream<Uint8Array> | null, limit: number, signal: AbortSignal): Promise<Uint8Array> {
  signal.throwIfAborted()
  if (!body) return new Uint8Array()
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  const abort = () => { void reader.cancel().catch(() => undefined) }
  signal.addEventListener("abort", abort, { once: true })
  try {
    while (true) {
      signal.throwIfAborted()
      const { value, done } = await reader.read()
      signal.throwIfAborted()
      if (done) break
      size += value.byteLength
      if (size > limit) throw new RangeError("HTTP byte limit")
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    return bytes
  } finally {
    signal.removeEventListener("abort", abort)
    // Initiate cancellation without allowing an untrusted source's cancel hook
    // to hold the request beyond its deadline.
    void reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

export async function readHttpJson(body: ReadableStream<Uint8Array> | null, limit: number, signal: AbortSignal): Promise<unknown> {
  return JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(await readHttpBytes(body, limit, signal))) as unknown
}

export function httpDeadline(parent: AbortSignal | undefined, milliseconds: number) {
  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort(parent?.reason)
  parent?.addEventListener("abort", abort, { once: true })
  if (parent?.aborted) abort()
  const timer = setTimeout(() => { timedOut = true; controller.abort(new DOMException("Timeout", "TimeoutError")) }, milliseconds)
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    dispose: () => { clearTimeout(timer); parent?.removeEventListener("abort", abort) },
  }
}
