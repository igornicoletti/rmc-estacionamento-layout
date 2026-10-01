import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

export function runProcess(command, args, {
  capture = false, timeout = 120_000, signal, cwd = process.cwd(), allowedExitCodes = [0], maxOutputBytes = 8 * 1024 * 1024,
} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd, windowsHide: true, shell: false, detached: process.platform !== "win32",
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    })
    let stdout = ""
    let stderr = ""
    let timedOut = false
    let cancelled = signal?.aborted ?? false
    let outputBytes = 0
    let overflow = false
    const terminate = () => {
      if (!child.pid) return
      if (process.platform === "win32") {
        const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true })
        killer.on("error", () => child.kill())
      } else {
        try { process.kill(-child.pid, "SIGKILL") } catch { child.kill() }
      }
    }
    const onAbort = () => { cancelled = true; terminate() }
    signal?.addEventListener("abort", onAbort, { once: true })
    if (cancelled) terminate()
    const timer = setTimeout(() => { timedOut = true; terminate() }, timeout)
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener("abort", onAbort) }
    // Captured output never appears in thrown errors: CLI status/start may contain keys.
    if (capture) {
      const append = (chunk, isError) => {
        outputBytes += chunk.length
        if (outputBytes > maxOutputBytes) { overflow = true; terminate(); return }
        if (isError) stderr += chunk
        else stdout += chunk
      }
      child.stdout.on("data", (chunk) => append(chunk, false))
      child.stderr.on("data", (chunk) => append(chunk, true))
    }
    child.once("error", () => {
      cleanup()
      reject(new Error("Subprocess unavailable or cancelled"))
    })
    child.once("close", (code, terminationSignal) => {
      cleanup()
      if (timedOut || cancelled || overflow || terminationSignal || !allowedExitCodes.includes(code)) {
        reject(new Error(timedOut ? "Subprocess deadline exceeded" : overflow ? "Subprocess output limit exceeded" : "Subprocess failed"))
      } else resolve({ stdout, stderr, exitCode: code })
    })
  })
}

export function nodeCli(relativePath) {
  return [process.execPath, [fileURLToPath(new URL(`../../node_modules/${relativePath}`, import.meta.url))]]
}

export function npmScript(script) {
  if (!process.env.npm_execpath) throw new Error("Run this gate through npm run")
  return [process.execPath, [process.env.npm_execpath, "run", script]]
}

export async function runSteps(steps, execute = runProcess, results = []) {
  for (const { label, command, args, options } of steps) {
    const startedAt = new Date().toISOString()
    console.log(`Validation: ${label}`)
    try {
      await execute(command, args, options)
      results.push({ label, startedAt, finishedAt: new Date().toISOString(), exitCode: 0 })
    } catch {
      results.push({ label, startedAt, finishedAt: new Date().toISOString(), exitCode: 1 })
      throw new Error(`Validation failed: ${label}`)
    }
  }
  return results
}
