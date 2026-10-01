import { test } from "node:test"
import assert from "node:assert/strict"
import { runProcess, runSteps } from "../../scripts/validation/validation-process.mjs"
import { assertEmptyDiff, databaseGate, container } from "../../scripts/auth-db/auth-db-gate.mjs"

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
  await assert.rejects(databaseGate(async () => {
    await assert.rejects(databaseGate(), /locked/)
    throw new Error("synthetic stop before startup")
  }), /synthetic stop/)
  // The next invocation must reach Docker rather than fail on a leaked lock.
  await assert.rejects(databaseGate(async () => { throw new Error("lock released") }), /lock released/)
})

test("database gate refuses a preexisting stack without stopping or resetting it", async () => {
  const calls = []
  await assert.rejects(databaseGate(async (_command, args) => {
    calls.push(args)
    return { stdout: args[0] === "ps" ? `${container}\n` : "", stderr: "", exitCode: 0 }
  }), /already running/)
  assert.equal(calls.length, 2)
})

test("database gate cleans up owned startup on failure", async () => {
  const prior = process.env.npm_execpath
  process.env.npm_execpath = "synthetic-npm-cli"
  const calls = []
  try {
    await assert.rejects(databaseGate(async (_command, args) => {
      calls.push(args)
      if (args.includes("db:reset")) throw new Error("synthetic failure")
      return { stdout: "", stderr: "", exitCode: 0 }
    }), /db:reset/)
    assert.ok(calls.at(-1).includes("db:stop"))
  } finally {
    if (prior === undefined) delete process.env.npm_execpath
    else process.env.npm_execpath = prior
  }
})
