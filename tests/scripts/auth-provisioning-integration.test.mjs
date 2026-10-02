import test from "node:test"
import assert from "node:assert/strict"
import { validateFixtureCommand } from "../../worker/scripts/worker-provisioning-integration.mjs"

test("F04 fixture admits only exact command/owner UUIDs and closed operations", () => {
  const input = { commandId: "04000000-0000-4000-8000-000000000001", owner: "04000000-0000-4000-8000-000000000002",
    operation: "START", loseResponse: false }
  assert.doesNotThrow(() => validateFixtureCommand(input))
  for (const bad of [null, { ...input, secret: "forbidden" }, { ...input, owner: "external" },
    { ...input, operation: "DELETE" }, { ...input, loseResponse: "true" }]) {
    assert.throws(() => validateFixtureCommand(bad))
  }
})
