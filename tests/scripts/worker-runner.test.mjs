import { test } from "node:test"
import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { checkWorker } from "../../scripts/worker/worker-check.mjs"
import { assertLocalApi, httpsProbe } from "../../scripts/worker/worker-integration.mjs"
import { runProcess } from "../../scripts/validation/validation-process.mjs"

test("Worker checker selects isolated workspace and stops on failure", async () => {
  const prior = process.env.npm_execpath
  process.env.npm_execpath = "synthetic-npm"
  try {
    const calls = []
    await assert.rejects(checkWorker(async (_command,args) => { calls.push(args); throw new Error("synthetic-secret") }), /worker:types:check/)
    assert.equal(calls.length, 1)
    assert.ok(calls[0].includes("--workspace=worker"))
  } finally {
    if (prior === undefined) delete process.env.npm_execpath
    else process.env.npm_execpath = prior
  }
})
test("Worker integration rejects remote URLs and ambiguous probes", () => {
  assert.doesNotThrow(() => assertLocalApi("http://127.0.0.1:55321"))
  for (const url of ["https://project.supabase.co", "http://localhost:54321", "http://127.0.0.1:55321/"]) assert.throws(() => assertLocalApi(url))
  assert.throws(() => httpsProbe("//other.invalid"))
})
test("Worker runtime discovery contains every suite once, never in app Vitest", async () => {
  const expected = (await readdir("worker/tests")).filter((p) => p.endsWith(".test.ts")).map((p) => resolve("worker/tests",p)).sort()
  const result = await runProcess(process.execPath, [resolve("worker/node_modules/vitest/vitest.mjs"), "list", "--filesOnly", "--json"], { cwd: resolve("worker"), capture: true })
  const rows = JSON.parse(result.stdout)
  const discovered = rows.map((row) => resolve(row.file)).sort()
  assert.deepEqual(discovered, expected)
  assert.equal(new Set(discovered).size, expected.length)
  const root = JSON.parse(await readFile("package-lock.json", "utf8"))
  assert.equal(root.packages["node_modules/vitest"].version, "5.0.3")
  assert.equal(root.packages["worker/node_modules/vitest"].version, "4.1.11")
})
