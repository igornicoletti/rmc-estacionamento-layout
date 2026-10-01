import { runProcess } from "./validation-process.mjs"

if (!process.env.npm_execpath) throw new Error("Run through npm run deps:status")
const { stdout } = await runProcess(process.execPath, [process.env.npm_execpath, "outdated", "--json"], {
  capture: true, allowedExitCodes: [0, 1],
})
const outdated = JSON.parse(stdout || "{}")
if (outdated.error || Object.values(outdated).some((value) => ![value.current, value.wanted, value.latest].every((item) => typeof item === "string"))) {
  throw new Error("Dependency status unavailable; registry/toolchain response was not a package report")
}
console.log("Dependency status (informational; compatible does not mean validated):")
for (const [name, value] of Object.entries(outdated)) {
  console.log(`${name}: ${value.current} -> wanted ${value.wanted}; latest ${value.latest}`)
}
if (Object.keys(outdated).length === 0) console.log("No outdated direct dependency reported")
