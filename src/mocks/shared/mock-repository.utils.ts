export function waitForMockLatency(
  signal?: AbortSignal,
  latencyMs = 80,
) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Request aborted", "AbortError"))
      return
    }

    const handleAbort = () => {
      globalThis.clearTimeout(timeout)
      reject(new DOMException("Request aborted", "AbortError"))
    }
    const timeout = globalThis.setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort)
      resolve()
    }, latencyMs)

    signal?.addEventListener("abort", handleAbort, { once: true })
  })
}

export function normalizeSearch(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
}

export function compareText(left: string, right: string) {
  return left.localeCompare(right, "pt-BR", { sensitivity: "base" })
}
