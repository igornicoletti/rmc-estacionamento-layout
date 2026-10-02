import { readHttpBytes, httpDeadline } from "../../../src/lib/http/http-stream"

export type PasswordScreenResult = "CLEAR" | "BLOCKED" | "UNAVAILABLE"

// Exact full-value checks. This comparison never changes the value sent to Auth.
const expected = new Set([
  "redemontecarlo", "redemontecarlo2026", "rmcestacionamento",
  "estacionamentormc", "senhapadraormc",
])

export async function screenNewPassword(password: string, parent: AbortSignal,
  transport: typeof fetch = fetch): Promise<PasswordScreenResult> {
  if (expected.has(password.normalize("NFC").toLocaleLowerCase("pt-BR"))) return "BLOCKED"
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password)))
  const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase()
  const prefix = hex.slice(0, 5)
  const suffix = hex.slice(5)
  const deadline = httpDeadline(parent, 3000)
  try {
    deadline.signal.throwIfAborted()
    const response = await transport(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: "GET", redirect: "manual", signal: deadline.signal,
      headers: { "Add-Padding": "true", Accept: "text/plain" },
    })
    if (response.status !== 200 || response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "text/plain") {
      void response.body?.cancel().catch(() => {})
      return "UNAVAILABLE"
    }
    const body = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      await readHttpBytes(response.body, 64 * 1024, deadline.signal))
    const lines = body.trimEnd().split(/\r?\n/)
    if (lines.length < 1 || lines.length > 1100) return "UNAVAILABLE"
    let blocked = false
    for (const line of lines) {
      const match = /^([0-9A-F]{35}):([0-9]+)$/.exec(line)
      if (!match) return "UNAVAILABLE"
      if (match[1] === suffix && Number(match[2]) > 0) blocked = true
    }
    return blocked ? "BLOCKED" : "CLEAR"
  } catch { return "UNAVAILABLE" }
  finally { deadline.dispose() }
}
