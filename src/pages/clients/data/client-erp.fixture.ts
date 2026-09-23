const FIXTURE_TIMESTAMP = "2026-09-01T12:00:00.000Z"
const CITIES = [
  ["SAO JOSE DO RIO PRETO", "SP"],
  ["RIBEIRAO PRETO", "SP"],
  ["UBERLANDIA", "MG"],
  ["CURITIBA", "PR"],
] as const

export const clientErpFixture: unknown = Array.from({ length: 24 }, (_, index) => {
  const clientId = String(1001 + index)
  const [city, stateCode] = CITIES[index % CITIES.length]

  return {
    cod_pessoa: clientId,
    nom_pessoa: `CLIENTE DEMONSTRACAO ${String(index + 1).padStart(2, "0")} LTDA`,
    nom_fantasia: `CLIENTE ${String(index + 1).padStart(2, "0")}`,
    num_cnpj_cpf: `99000000${String(index + 1).padStart(4, "0")}00`,
    des_email_1: index === 0
      ? "cliente1@example.invalid;financeiro@example.invalid;frota@example.invalid"
      : `cliente${index + 1}@example.invalid`,
    num_telefone_1: `1799000${String(index + 1).padStart(4, "0")}`,
    nom_cidade: city,
    sgl_estado: stateCode,
    dta_cadastro: `2026-${String((index % 8) + 1).padStart(2, "0")}-15`,
    ind_pessoa_ativa: index % 5 === 0 ? "N" : "S",
    bloqueio_financeiro: index % 7 === 0 ? "S" : "N",
    qtd_veiculos: 2,
    dta_ultima_compra: index % 6 === 0 ? null : "2026-08-20",
    is_active_120d: index % 5 !== 0,
    synced_at: FIXTURE_TIMESTAMP,
    created_at: FIXTURE_TIMESTAMP,
    updated_at: FIXTURE_TIMESTAMP,
  }
})

export const clientVehicleErpFixture: unknown = Array.from(
  { length: 48 },
  (_, index) => {
    const clientIndex = Math.floor(index / 2)
    const clientId = String(1001 + clientIndex)
    const vehicleNumber = index + 1

    return {
      cod_veiculo: 5001 + index,
      cod_pessoa: clientId,
      nom_pessoa: `CLIENTE DEMONSTRACAO ${String(clientIndex + 1).padStart(2, "0")} LTDA`,
      nom_fantasia: `CLIENTE ${String(clientIndex + 1).padStart(2, "0")}`,
      num_cnpj_cpf: `99000000${String(clientIndex + 1).padStart(4, "0")}00`,
      num_placa: `DEM${String(vehicleNumber).padStart(4, "0")}`,
      des_veiculo: vehicleNumber % 2 === 0 ? "UTILITARIO" : "AUTOMOVEL",
      nom_motorista: clientIndex === 0 || vehicleNumber % 3 === 0 ? "" : `MOTORISTA ${vehicleNumber}`,
      client_is_active_120d: clientIndex % 5 !== 0,
      synced_at: FIXTURE_TIMESTAMP,
      created_at: FIXTURE_TIMESTAMP,
      updated_at: FIXTURE_TIMESTAMP,
    }
  },
)
