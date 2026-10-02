import { mkdir, readFile, writeFile } from "node:fs/promises"
import { databaseGate } from "../auth-db/auth-db-gate.mjs"
import { npmScript, runProcess, runSteps, validationReportDirectory } from "./validation-process.mjs"
import { checkWorker } from "../worker/worker-check.mjs"
import { workerIntegration } from "../worker/worker-integration.mjs"
import { provisioningIntegration } from "../../worker/scripts/worker-provisioning-integration.mjs"
import { deliveryIntegration } from "../../worker/scripts/worker-delivery-integration.mjs"

const profile = process.argv[2]
const profiles = {
  quick: ["lint", "typecheck", "docs:check", "test:scripts", "test"],
  app: ["unused:check", "audit:security", "lint", "typecheck", "docs:check", "test:scripts", "test:coverage", "build:assets", "test:e2e:built"],
}
if (!["quick", "app", "db", "full", "bff"].includes(profile)) throw new Error("Unknown validation profile")
const results = []
const startedAt = new Date().toISOString()
const abort = new AbortController()
const cancel = () => abort.abort()
process.once("SIGINT", cancel)
process.once("SIGTERM", cancel)
const execute = (command, args, options) => runProcess(command, args, {
  ...options, signal: args.includes("db:stop") ? undefined : abort.signal,
})
let exitCode = 0
try {
  await runSteps([{ label: "git diff --check", command: "git", args: ["diff", "--check"] },
    { label: "git diff --cached --check", command: "git", args: ["diff", "--cached", "--check"] }], execute, results)
  if (!["db", "bff"].includes(profile)) {
    await runSteps(profiles[profile === "full" ? "app" : profile].map((label) => {
      const [command, args] = npmScript(label)
      return { label, command, args, options: { timeout: 1_200_000 } }
    }), execute, results)
  }
  if (["full", "bff"].includes(profile)) {
    if (profile === "bff") await runSteps([{ label: "build:assets", command: npmScript("build:assets")[0], args: npmScript("build:assets")[1] }], execute, results)
    await checkWorker(execute, results)
    await databaseGate(execute, results, async (run, report) => {
      await workerIntegration(run, report, abort.signal)
      if (profile === "full") {
        await provisioningIntegration(report, abort.signal)
        await deliveryIntegration(report, abort.signal)
        await runSteps([{ label: "F05 local delivery drained", command: process.execPath,
          args: ["scripts/auth-db/auth-delivery-status.mjs", "--assert-drained"], options: { capture: true } }], run, report)
      }
    })
  } else if (profile === "db") await databaseGate(execute, results)
} catch (error) {
  console.error(error.message)
  exitCode = 1
} finally {
  const head = await runProcess("git", ["rev-parse", "HEAD"], { capture: true })
  const changes = await runProcess("git", ["status", "--porcelain"], { capture: true })
  const pkg = JSON.parse(await readFile("package.json", "utf8"))
  const lock = JSON.parse(await readFile("package-lock.json", "utf8"))
  await mkdir(validationReportDirectory, { recursive: true })
  await writeFile(`${validationReportDirectory}/${profile}.json`, JSON.stringify({
    schemaVersion: 1, profile, environment: "LOCAL", sha: head.stdout.trim(),
    dirty: changes.stdout.trim() !== "", startedAt, finishedAt: new Date().toISOString(), exitCode,
    versions: { node: process.version, npm: process.env.npm_config_user_agent?.match(/npm\/([^ ]+)/)?.[1] ?? "unknown",
      dependencies: Object.fromEntries(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
        .map((name) => [name, lock.packages[`node_modules/${name}`]?.version])) }, results,
  }, null, 2))
  process.exitCode = exitCode
  process.removeListener("SIGINT", cancel)
  process.removeListener("SIGTERM", cancel)
}
