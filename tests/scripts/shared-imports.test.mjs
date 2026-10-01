import { test } from "node:test"
import assert from "node:assert/strict"
import { ESLint } from "eslint"

test("effective ESLint config denies runtime/UI/SDK/I-O imports in shared contracts", async () => {
  const eslint = new ESLint()
  for (const target of ["react", "react/jsx-runtime", "react-router", "@supabase/supabase-js", "node:fs", "@/lib/query/query-client", "@tests/support/render", "../../lib/query/query-client", "../../components/app/app-tooltip-button"]) {
    const [result] = await eslint.lintText(`import "${target}"\n`, { filePath: "src/shared/auth/auth-contracts.ts" })
    assert.ok(result.messages.some((message) => message.ruleId === "no-restricted-imports"), target)
  }
})

test("browser imports cannot reach Worker or server SDK", async () => {
  const eslint = new ESLint()
  for (const filePath of ["src/lib/http/http-client.ts", "src/app/app-providers.tsx", "src/components/toast/toast-notify.ts", "src/shared/auth/auth-contracts.ts"])
  for (const target of ["@supabase/supabase-js", "../../../worker/src/worker-entry"]) {
    const [result] = await eslint.lintText(`import "${target}"\n`, { filePath })
    assert.ok(result.messages.some((message) => message.ruleId === "no-restricted-imports"), target)
  }
})
