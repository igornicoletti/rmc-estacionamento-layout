import { mkdir, open, readFile, unlink } from "node:fs/promises"
import { nodeCli, npmScript, runProcess, runSteps } from "../validation/validation-process.mjs"

export const projectId = "rmc-estacionamento-layout"
export const container = `supabase_db_${projectId}`

export function assertEmptyDiff(output) {
  if (output.trim() === "") return
  // CLI 2.119 emits a JSON envelope even for an empty diff. Validate the envelope,
  // not just the exit code or the human-readable message.
  let result
  try { result = JSON.parse(output) } catch { throw new Error("Database schema drift detected") }
  if (result?.diff !== "" || result.file !== null || result.engine !== "pg-delta" ||
    !Array.isArray(result.files) || result.files.length !== 0 ||
    !Array.isArray(result.dropStatements) || result.dropStatements.length !== 0 ||
    JSON.stringify(result.schemas) !== JSON.stringify(["rmc_auth_private", "rmc_auth_api"]) ||
    Object.keys(result).some((key) => !["diff", "file", "files", "schemas", "engine", "dropStatements", "message"].includes(key))) {
    throw new Error("Database schema drift or unexpected CLI response detected")
  }
}

export async function databaseGate(execute = runProcess, results = [], afterReady, directory = new URL("../../supabase/.temp/", import.meta.url)) {
  const lock = new URL("validation-gate.lock", directory)
  await mkdir(directory, { recursive: true })
  const handle = await open(lock, "wx").catch(() => { throw new Error("Database gate locked; verify no gate is running before removing a stale local lock") })
  try {
    await handle.writeFile(String(process.pid))
    await ownedDatabaseGate(execute, results, afterReady)
  } finally {
    await handle.close()
    await unlink(lock)
  }
}

async function ownedDatabaseGate(execute, results, afterReady) {
  const config = await readFile(new URL("../../supabase/config.toml", import.meta.url), "utf8")
  if (!config.includes(`project_id = "${projectId}"`)) throw new Error("Unexpected local project")
  await execute("docker", ["info"], { capture: true })
  const existing = await execute("docker", ["ps", "--format", "{{.Names}}"], { capture: true })
  // Refuse to reset/stop a stack someone else is using; no remote URL accepted.
  if (existing.stdout.split(/\r?\n/).includes(container)) throw new Error("Local database already running; stop it explicitly before this destructive local gate")
  const step = (label) => {
    const [command, args] = npmScript(label)
    return { label, command, args, options: { timeout: 600_000 } }
  }
  let started = false
  try {
    started = true // Cleanup even if startup created only part of the stack.
    await runSteps([step("db:start"), step("db:reset"), step("db:reset"), step("db:test"),
      step("db:test:concurrency"), step("db:test:concurrency"),
      { label: "F03 DB concurrency 1", command: process.execPath, args: ["scripts/auth-db/auth-db-context-concurrency.mjs"] },
      { label: "F03 DB concurrency 2", command: process.execPath, args: ["scripts/auth-db/auth-db-context-concurrency.mjs"] },
      step("db:lint"), step("db:advisors")], execute, results)
    const server = await execute("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-AtX", "-c", "show server_version"], { capture: true })
    if (!/^17\.\d+(?:\s.*)?$/.test(server.stdout.trim())) throw new Error("Unexpected PostgreSQL major")
    results.push({ label: "PostgreSQL runtime", version: server.stdout.trim(), exitCode: 0 })
    const [command, prefix] = nodeCli("supabase/dist/supabase.js")
    await runSteps([{
      label: "db:diff (empty)", command,
      args: [...prefix, "db", "diff", "--local", "--schema", "rmc_auth_private,rmc_auth_api", "--use-pg-delta", "--strict-coverage"],
      options: { capture: true, timeout: 600_000 },
    }], async (...args) => { const result = await execute(...args); assertEmptyDiff(result.stdout); return result }, results)
    const clean = await execute("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-AtX", "-v", "ON_ERROR_STOP=1", "-c",
      "select (select count(*) from rmc_auth_private.identities)+(select count(*) from rmc_auth_private.units_state)+(select count(*) from rmc_auth_private.command_ledger)+(select count(*) from rmc_auth_private.journey_transactions)+(select count(*) from rmc_auth_private.csrf_material)"], { capture: true })
    if (clean.stdout.trim() !== "0") throw new Error("Synthetic fixture cleanup incomplete")
    if (afterReady) await afterReady(execute, results)
  } finally {
    if (started) await runSteps([step("db:stop")], execute, results)
  }
}
