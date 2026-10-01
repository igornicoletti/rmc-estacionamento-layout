import { test } from "node:test"
import assert from "node:assert/strict"
import { assertLocalProvider, hasOwnedUser, providerPocClient } from "../../worker/scripts/worker-provider-poc.mjs"

test("F04 provider PoC admits only exact local project and private ownership", () => {
  assert.doesNotThrow(() => assertLocalProvider("http://127.0.0.1:55321"))
  for (const url of ["https://remote.supabase.co", "http://localhost:55321", "http://127.0.0.1:55321/"]) assert.throws(() => assertLocalProvider(url))
  const reservation = { provider_subject: "synthetic", command_id: "command", identity_id: "identity", ownership_binding: "binding", identity_generation: 1 }
  const proof = { purpose: "PROVISION_IDENTITY", contractVersion: "1.1", commandId: "command", identityId: "identity", ownershipBinding: "binding", identityGeneration: 1 }
  const user = { id: "synthetic", email: "u-synthetic@auth.rmc.invalid", app_metadata: { rmc_provisioning: proof } }
  assert.equal(hasOwnedUser(user, reservation), true)
  assert.equal(hasOwnedUser({ ...user, id: "foreign" }, reservation), false)
  assert.equal(hasOwnedUser({ ...user, app_metadata: {}, user_metadata: { rmc_provisioning: proof } }, reservation), false)
  assert.equal(hasOwnedUser({ ...user, phone_confirmed_at: "confirmed" }, reservation), false)
  assert.equal(hasOwnedUser({ ...user, app_metadata: { rmc_provisioning: { ...proof, extra: true } } }, reservation), false)
})

test("F04 provider PoC transport forbids arbitrary UUID, redirects and large responses", async () => {
  const id = "01000000-0000-4000-8000-000000000001"
  let calls = 0
  const client = providerPocClient("http://127.0.0.1:55321", "synthetic-key", [id], async (_input, init) => {
    calls++
    assert.equal(init.redirect, "error")
    assert.ok(init.signal)
    return Response.json({ pad: "x".repeat(65536) })
  })
  assert.ok((await client.auth.admin.getUserById(id)).error)
  assert.ok((await client.auth.admin.getUserById("01000000-0000-4000-8000-000000000002")).error)
  assert.equal(calls, 1)
})
