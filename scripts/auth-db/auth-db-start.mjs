import { nodeCli, runProcess } from "../validation/validation-process.mjs"

const [command, args] = nodeCli("supabase/dist/supabase.js")
const databaseOnly = process.argv.slice(2).length === 1 && process.argv[2] === "--database-only"
if (process.argv.length > 2 && !databaseOnly) throw new Error("Unknown local startup option")
try {
  await runProcess("docker", ["info"], { capture: true })
  // Neither startup/status connection details nor captured failure output is logged.
  await runProcess(command, [...args, ...(databaseOnly ? ["db", "start"] : ["start", "--exclude",
    "studio,postgres-meta,edge-runtime,logflare,vector,storage-api,imgproxy,realtime,mailpit"])],
  { capture: true, timeout: 300_000 })
  console.log(databaseOnly ? "Local PostgreSQL bootstrap ready; API not started" : "Local Auth database started; startup key output suppressed")
} catch {
  console.error("Local Auth startup failed. Check Docker availability, local ports and pinned CLI; connection details were suppressed.")
  process.exitCode = 1
}
