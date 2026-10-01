import { pathToFileURL } from "node:url"
import { npmScript, runProcess, runSteps } from "../validation/validation-process.mjs"

export async function checkWorker(execute = runProcess, results = []) {
  const steps = ["types:check", "typecheck", "test", "dry-run"].map((label) => {
    const [command, args] = npmScript(label)
    return { label: `worker:${label}`, command, args: [...args, "--workspace=worker"], options: { timeout: 180_000 } }
  })
  await runSteps(steps, execute, results)
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await checkWorker()
