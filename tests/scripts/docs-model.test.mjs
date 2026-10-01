import { test } from "node:test"
import assert from "node:assert/strict"
import { resolve } from "node:path"
import { readdir } from "node:fs/promises"
import { parseMarkdown, localLinkTarget } from "../../scripts/docs/docs-model.mjs"
import { nodeCli, runProcess } from "../../scripts/validation/validation-process.mjs"

test("Markdown parser resolves references, ids, repeated headings and code inventories", () => {
  const model = parseMarkdown('# Title\n\n## Test\n\n## Test\n\n<a id="stable"></a>\n\n[ref][target]\n\n[target]: other.md#stable\n\n`tests/example.test.ts`')
  assert.deepEqual([...model.anchors], ["title", "test", "test-1", "stable"])
  assert.deepEqual(model.links, ["other.md#stable"])
  assert.deepEqual(model.codes, ["tests/example.test.ts"])
})

test("local links cannot escape the repository and external links are not fetched", () => {
  const root = resolve(".")
  assert.equal(localLinkTarget(root, root, "https://example.invalid"), null)
  assert.throws(() => localLinkTarget(root, root, "../outside.md"), /escapes/)
  assert.equal(localLinkTarget(root, root, "docs/a.md#intro").anchor, "intro")
})

test("Vitest discovers every unit/integration suite exactly once in node or dom", async () => {
  async function files(directory) {
    const entries = await readdir(directory, { withFileTypes: true })
    return (await Promise.all(entries.map((entry) => entry.isDirectory()
      ? files(`${directory}/${entry.name}`) : [resolve(directory, entry.name)]))).flat()
  }
  const expected = [...await files("tests/unit"), ...await files("tests/integration")]
    .filter((path) => /\.(test|spec)\.(ts|tsx)$/.test(path)).sort()
  const [command, prefix] = nodeCli("vitest/vitest.mjs")
  const result = await runProcess(command, [...prefix, "list", "--filesOnly", "--json"], { capture: true })
  const rows = JSON.parse(result.stdout)
  const discovered = rows.map((row) => resolve(row.file)).sort()
  assert.deepEqual(discovered, expected)
  assert.equal(new Set(discovered).size, discovered.length)
  assert.ok(rows.every((row) => ["node", "dom"].includes(row.projectName)))
})
