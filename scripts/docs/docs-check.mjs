import { readdir, readFile, stat } from "node:fs/promises"
import { createHash } from "node:crypto"
import { resolve, dirname } from "node:path"
import { parse } from "yaml"
import { parseMarkdown, localLinkTarget } from "./docs-model.mjs"
import { npmScript, runProcess } from "../validation/validation-process.mjs"

const root = process.cwd()
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? files(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]))).flat()
}
const documentPaths = ["README.md", ".github/pull_request_template.md", ...(await files("docs")).filter((path) => path.endsWith(".md"))]
const documents = new Map()
for (const path of documentPaths) documents.set(resolve(path), parseMarkdown(await readFile(path, "utf8")))
for (const [path, document] of documents) {
  for (const url of document.links) {
    const target = localLinkTarget(root, dirname(path), url)
    if (!target) continue
    // Empty pathname is a same-document fragment.
    if (url.startsWith("#")) target.path = path
    await stat(target.path).catch(() => { throw new Error(`Missing link target in ${path}: ${url}`) })
    if (target.anchor && documents.has(target.path) && !documents.get(target.path).anchors.has(target.anchor)) {
      throw new Error(`Missing anchor in ${path}: ${url}`)
    }
  }
  const historical = path.includes("/evidence/F") || path.includes("\\evidence\\F") || path.endsWith("contract-v1.0.md") || path.endsWith("audit-v2.0.md") || path.endsWith("F02-critical-audit.md")
  if (!historical) {
    const source = await readFile(path, "utf8")
    if (path.includes(`${resolve("docs")}`) && !source.includes("Sumário")) throw new Error(`Missing navigable summary: ${path}`)
    for (const code of document.codes) {
      if (/^(src|tests|scripts|supabase|worker)\/[\w./-]+$/.test(code)) {
        await stat(resolve(code)).catch(() => { throw new Error(`Missing declared path in ${path}: ${code}`) })
      }
    }
  }
}
const suites = [...await files("tests"), ...await files("supabase/tests/database"), ...await files("worker/tests")]
  .filter((path) => /\.(test|spec)\.(ts|tsx|mjs|sql)$/.test(path)).sort()
const catalog = documents.get(resolve("docs/project/validation.md")).codes
  .filter((value) => /^(tests|supabase\/tests|worker\/tests)\/.*\.(test|spec)\.(ts|tsx|mjs|sql)$/.test(value)).sort()
if (JSON.stringify(catalog) !== JSON.stringify(suites)) throw new Error("Test catalog is incomplete, duplicated or stale")
const contractHash = createHash("sha256").update(await readFile("docs/auth/contract-v1.0.md")).digest("hex").toUpperCase()
if (contractHash !== "74D7ABC89647F2AD668C933C89821EE1D08C451A08C80E194909AFB05AFDA148") throw new Error("Normative contract integrity failure")
const baseline = await readFile("docs/auth/contract-v1.0.md", "utf8")
const requirements = [...baseline.matchAll(/^\*\*([A-Z][A-Z0-9-]*-\d{2}):\*\*/gm)].map((match) => match[1])
if (requirements.length !== 160 || new Set(requirements).size !== 160) throw new Error("Historical requirement inventory drift")
const revision = await readFile("docs/auth/contract-v1.1.md", "utf8")
const contracts = await readFile("src/shared/auth/auth-contracts.ts", "utf8")
if (!contracts.includes('AUTH_CONTRACT_VERSION = "1.1"') || !revision.includes('contractVersion: "1.1"')
  || !revision.includes(contractHash)) throw new Error("Active contract version or provenance drift")
for (const [path, expected] of Object.entries({
  "docs/auth/audit-v2.0.md": "C1204398809DC124314A07434A82DA532E237B359B8AA79A273303D0B4D3EA39",
  "docs/auth/evidence/F02-api-schema.sql": "B390239361D8FEE724581470FD48D3D60181DE04904621F4D837219044C05562",
  "docs/auth/evidence/F02-private-schema.sql": "CBAD363B81B9E453F959AF528F53E4F1F9A7DB3BD027919CEAD52E0ACDE6FB44",
})) {
  if (createHash("sha256").update(await readFile(path)).digest("hex").toUpperCase() !== expected) throw new Error(`Historical snapshot integrity failure: ${path}`)
}
const workflow = parse(await readFile(".github/workflows/validate.yml", "utf8"))
if (workflow.permissions?.contents !== "read") throw new Error("Unexpected workflow permissions")
for (const job of Object.values(workflow.jobs)) {
  for (const step of job.steps) if (step.uses && !/@[a-f0-9]{40}$/.test(step.uses)) throw new Error("Action must be pinned by full SHA")
}
for (const [job, command] of Object.entries({ validate: "npm run check:app", "auth-db": "npm run check:bff" })) {
  if (!workflow.jobs[job].steps.some((step) => step.run === command)) throw new Error("Workflow diverges from local gates")
}
const [command, prefix] = npmScript("docs:lint")
await runProcess(command, prefix)
console.log(`Documentation: ${documents.size} Markdown files, ${suites.length} suites; links/catalog/integrity/workflow passed`)
