import { test } from "node:test"
import assert from "node:assert/strict"
import { runProcess, runSteps, validationReportDirectory } from "../../scripts/validation/validation-process.mjs"
import { relative, resolve } from "node:path"
import { assertEmptyDiff, databaseGate, container } from "../../scripts/auth-db/auth-db-gate.mjs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { pathToFileURL } from "node:url"
import { join } from "node:path"

async function isolatedGate(run) {
  const directory = await mkdtemp(join(tmpdir(), "rmc-gate-test-"))
  try { return await run((execute, results, afterReady) => databaseGate(execute, results, afterReady, pathToFileURL(directory + "/"))) }
  finally { await rm(directory, { recursive: true, force: true }) }
}

test("validation reports are outside directories reset by Playwright", () => {
  for (const directory of ["test-results", "playwright-report"]) {
    assert.ok(relative(resolve(directory), resolve(validationReportDirectory)).startsWith(".."))
    assert.ok(relative(resolve(validationReportDirectory), resolve(directory)).startsWith(".."))
  }
})

test("process runner captures success and never exposes captured failure payload", async () => {
  const result = await runProcess(process.execPath, ["-e", "console.log('synthetic-output')"], { capture: true })
  assert.equal(result.stdout.trim(), "synthetic-output")
  await assert.rejects(runProcess(process.execPath, ["-e", "console.error('synthetic-secret');process.exit(2)"], { capture: true }),
    (error) => !error.message.includes("synthetic-secret") && error.message === "Subprocess failed")
})

test("process runner rejects timeout, cancellation and unavailable command", async () => {
  await assert.rejects(runProcess(process.execPath, ["-e", "setInterval(()=>{},1000)"], { capture: true, timeout: 500 }), /deadline/)
  const signal = AbortSignal.abort()
  await assert.rejects(runProcess(process.execPath, ["-e", "setInterval(()=>{},1000)"], { capture: true, signal }))
  await assert.rejects(runProcess("nonexistent-rmc-validation-command", [], { capture: true }), /unavailable/)
  await assert.rejects(runProcess(process.execPath, ["-e", "console.log('x'.repeat(2048))"], { capture: true, maxOutputBytes: 1024 }), /output limit/)
})

test("step runner stops after failure and records real outcomes", async () => {
  const results = []
  let called = 0
  await assert.rejects(runSteps([{ label: "first" }, { label: "second" }], async () => { called++; throw new Error("private") }, results), /first/)
  assert.equal(called, 1)
  assert.equal(results[0].exitCode, 1)
  assert.ok(results[0].finishedAt)
})

test("schema diff rejects nonempty SQL even with successful CLI exit", () => {
  assert.doesNotThrow(() => assertEmptyDiff("\n"))
  assert.throws(() => assertEmptyDiff("alter table synthetic;"), /drift/)
  const empty = { diff: "", file: null, files: [], schemas: ["rmc_auth_private", "rmc_auth_api"], engine: "pg-delta", dropStatements: [], message: "Diff complete." }
  assert.doesNotThrow(() => assertEmptyDiff(JSON.stringify(empty)))
  for (const changed of [{ diff: "alter table synthetic;" }, { dropStatements: ["drop table synthetic;"] }, { files: ["unexpected.sql"] }, { error: "unknown" }, { schemas: ["public"] }]) {
    assert.throws(() => assertEmptyDiff(JSON.stringify({ ...empty, ...changed })), /drift/)
  }
})

test("database gate excludes concurrent invocations and releases its lock", async () => {
  await isolatedGate(async (gate) => {
  await assert.rejects(gate(async () => {
    await assert.rejects(gate(), /locked/)
    throw new Error("synthetic stop before startup")
  }), /synthetic stop/)
  // The next invocation must reach Docker rather than fail on a leaked lock.
  await assert.rejects(gate(async () => { throw new Error("lock released") }), /lock released/)
  })
})

test("database gate refuses a preexisting stack without stopping or resetting it", async () => {
  const calls = []
  await isolatedGate(async (gate) => { await assert.rejects(gate(async (_command, args) => {
    calls.push(args)
    return { stdout: args[0] === "ps" ? `${container}\n` : "", stderr: "", exitCode: 0 }
  }), /already running/) })
  assert.equal(calls.length, 2)
})

test("database gate cleans up owned startup on failure", async () => {
  const prior = process.env.npm_execpath
  process.env.npm_execpath = "synthetic-npm-cli"
  const calls = []
  try {
    await isolatedGate(async (gate) => { await assert.rejects(gate(async (_command, args) => {
      calls.push(args)
      if (args.includes("db:reset")) throw new Error("synthetic failure")
      return { stdout: "", stderr: "", exitCode: 0 }
    }), /db:reset/) })
    assert.ok(calls.at(-1).includes("db:stop"))
    assert.ok(calls.some((args) => args.includes("db:bootstrap")))
    assert.ok(!calls.some((args) => args.includes("db:start")), "API must not start before a successful rebuild")
  } finally {
    if (prior === undefined) delete process.env.npm_execpath
    else process.env.npm_execpath = prior
  }
})

test("database gate cleans up its stack when the shared integration callback fails", async () => {
  const prior = process.env.npm_execpath
  process.env.npm_execpath = "synthetic-npm-cli"
  const calls = []
  try {
    await isolatedGate(async (gate) => { await assert.rejects(gate(async (_command, args) => {
      calls.push(args)
      const sql = args.at(-1)
      return { stdout: sql === "show server_version" ? "17.6" : typeof sql === "string" && sql.startsWith("select (select count(*)") ? "0" : "", stderr: "", exitCode: 0 }
    }, [], async () => { throw new Error("integration failure") }), /integration failure/) })
    assert.ok(calls.at(-1).includes("db:stop"))
    const scripts = calls.flatMap((args) => args.includes("run") ? [args.at(-1)] : [])
    assert.deepEqual(scripts.slice(0, 5), ["db:bootstrap", "db:reset", "db:reset", "db:stop", "db:start"])
  } finally {
    if (prior === undefined) delete process.env.npm_execpath
    else process.env.npm_execpath = prior
  }
})
