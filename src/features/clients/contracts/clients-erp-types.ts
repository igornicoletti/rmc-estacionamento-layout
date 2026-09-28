// Response contract from docs/contracts/hub-erp.openapi.json.
export interface ErpClient {
  cod_pessoa?: number | null
  nom_pessoa?: string | null
  nom_fantasia?: string | null
  num_cnpj_cpf?: string | null
  des_email_1?: string | null
  num_telefone_1?: string | null
  nom_cidade?: string | null
  sgl_estado?: string | null
  dta_cadastro?: string | null
  ind_pessoa_ativa?: string | null
  bloqueio_financeiro?: string | null
  qtd_veiculos?: number | null
  dta_ultima_compra?: string | null
}
