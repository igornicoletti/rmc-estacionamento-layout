import { copyFile, mkdir, readFile } from "node:fs/promises"
import { resolve } from "node:path"

const [clientsSource, vehiclesSource] = process.argv.slice(2)

if (!clientsSource || !vehiclesSource) {
  throw new Error(
    "Uso: node scripts/install-client-mock-data.mjs <clientes.json> <veiculos.json>",
  )
}

async function readJson(path) {
  const content = await readFile(resolve(path), "utf8")
  return { content, value: JSON.parse(content) }
}

function readIntegerId(record, key) {
  const value = record?.[key]

  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return String(value)
  }

  if (typeof value === "string" && /^\d+$/u.test(value.trim())) {
    return value.trim()
  }

  throw new TypeError(`Registro inválido: ${key} deve ser um inteiro.`)
}

const clientsFile = await readJson(clientsSource)
const vehiclesFile = await readJson(vehiclesSource)

if (!Array.isArray(clientsFile.value) || clientsFile.value.length !== 20) {
  throw new Error("O arquivo de clientes deve conter exatamente 20 registros.")
}

if (!Array.isArray(vehiclesFile.value) || vehiclesFile.value.length !== 1366) {
  throw new Error("O arquivo de veículos deve conter exatamente 1366 registros.")
}

const clientIds = new Set(
  clientsFile.value.map((client) => readIntegerId(client, "cod_pessoa")),
)

if (clientIds.size !== clientsFile.value.length) {
  throw new Error("O arquivo de clientes contém cod_pessoa duplicado.")
}

const vehicleIds = new Set()
const vehicleClientIds = new Set()

for (const vehicle of vehiclesFile.value) {
  const vehicleId = readIntegerId(vehicle, "cod_veiculo")
  const clientId = readIntegerId(vehicle, "cod_pessoa")

  if (vehicleIds.has(vehicleId)) {
    throw new Error(`cod_veiculo duplicado no mock: ${vehicleId}`)
  }

  if (!clientIds.has(clientId)) {
    throw new Error(
      `Veículo ${vehicleId} referencia cod_pessoa ausente do mock: ${clientId}`,
    )
  }

  vehicleIds.add(vehicleId)
  vehicleClientIds.add(clientId)
}

for (const clientId of clientIds) {
  if (!vehicleClientIds.has(clientId)) {
    throw new Error(`Cliente sem veículo no mock: ${clientId}`)
  }
}

const destinationDirectory = resolve("public/mock-data")
await mkdir(destinationDirectory, { recursive: true })

await Promise.all([
  copyFile(resolve(clientsSource), resolve(destinationDirectory, "erp-clients.json")),
  copyFile(
    resolve(vehiclesSource),
    resolve(destinationDirectory, "erp-client-vehicles.json"),
  ),
])

const drivers = vehiclesFile.value.filter(
  (vehicle) =>
    typeof vehicle?.nom_motorista === "string" &&
    vehicle.nom_motorista.trim() !== "",
).length

console.log(
  `Mock local instalado: ${clientIds.size} clientes, ${vehicleIds.size} veículos, ${drivers} veículos com motorista preenchido.`,
)
