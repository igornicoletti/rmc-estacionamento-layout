// Response contract from docs/contracts/hub-erp.openapi.json.
export interface ErpClientVehicle {
  cod_veiculo?: number | null
  cod_pessoa?: number | null
  nom_pessoa?: string | null
  nom_fantasia?: string | null
  num_cnpj_cpf?: string | null
  num_placa?: string | null
  des_veiculo?: string | null
  nom_motorista?: string | null
}
