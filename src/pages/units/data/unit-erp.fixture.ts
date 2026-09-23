const FIXTURE_TIMESTAMP = "2026-09-01T12:00:00.000Z"
const LOCATIONS = [
  ["SAO JOSE DO RIO PRETO", "SAO PAULO", "SP"],
  ["RIBEIRAO PRETO", "SAO PAULO", "SP"],
  ["UBERLANDIA", "MINAS GERAIS", "MG"],
  ["CURITIBA", "PARANA", "PR"],
] as const

function createCnpj(index: number) {
  const base = `88000000${String(index + 1).padStart(4, "0")}`
  const digit = (value: string, weights: readonly number[]) => {
    const sum = weights.reduce(
      (total, weight, position) => total + Number(value[position]) * weight,
      0,
    )
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }
  const first = digit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const second = digit(`${base}${first}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return `${base}${first}${second}`
}

export const unitErpFixture: unknown = Array.from({ length: 18 }, (_, index) => {
  const [city, state, stateCode] = LOCATIONS[index % LOCATIONS.length]

  return {
    cod_empresa: index + 1,
    nom_razao_social: `UNIDADE DEMONSTRACAO ${String(index + 1).padStart(2, "0")} LTDA`,
    nom_fantasia: `UNIDADE ${String(index + 1).padStart(2, "0")}`,
    num_cnpj: createCnpj(index),
    cod_bandeira: (index % 3) + 1,
    des_bandeira: index % 2 === 0 ? "BANDEIRA AZUL" : "BANDEIRA VERDE",
    cod_cidade: 100 + (index % LOCATIONS.length),
    nom_cidade: city,
    nom_estado: state,
    sgl_estado: stateCode,
    des_coordenada_empresa: "",
    synced_at: FIXTURE_TIMESTAMP,
    created_at: FIXTURE_TIMESTAMP,
    updated_at: FIXTURE_TIMESTAMP,
  }
})
