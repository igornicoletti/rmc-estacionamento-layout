import { readdir, stat } from "node:fs/promises"
import { resolve } from "node:path"

const assetsDirectory = resolve("dist/assets")
const maximumChunkBytes = 400_000
const assetNames = await readdir(assetsDirectory)
const javascriptChunks = assetNames.filter((name) => name.endsWith(".js"))

if (javascriptChunks.length === 0) {
  throw new Error("Nenhum chunk JavaScript foi encontrado em dist/assets.")
}

const chunks = await Promise.all(
  javascriptChunks.map(async (name) => ({
    name,
    size: (await stat(resolve(assetsDirectory, name))).size,
  })),
)
const largestChunk = chunks.reduce((largest, chunk) =>
  chunk.size > largest.size ? chunk : largest,
)

if (largestChunk.size > maximumChunkBytes) {
  throw new Error(
    `O chunk ${largestChunk.name} possui ${largestChunk.size} bytes e excede o limite temporário de ${maximumChunkBytes} bytes.`,
  )
}
