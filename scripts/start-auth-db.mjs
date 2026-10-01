import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Supabase start prints local keys. Do not put that output in terminal or CI logs.
const cli = fileURLToPath(new URL("../node_modules/supabase/dist/supabase.js", import.meta.url));
const child = spawn(process.execPath, [cli, "start", "--exclude",
  "studio,postgres-meta,edge-runtime,logflare,vector,storage-api,imgproxy,realtime,mailpit"],
{ stdio: "ignore", windowsHide: true, timeout: 300_000 });
child.on("error", () => {
  console.error("Local Auth database startup failed; verify Docker and the pinned Supabase CLI.");
  process.exitCode = 1;
});
child.on("close", (code) => {
  if (code === 0) console.log("Local Auth database started; startup key output suppressed.");
  else {
    console.error("Local Auth database startup did not finish successfully.");
    process.exitCode = 1;
  }
});
