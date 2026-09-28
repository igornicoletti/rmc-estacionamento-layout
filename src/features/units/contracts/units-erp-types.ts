// Response contract from docs/contracts/hub-erp.openapi.json.
export interface ErpUnit {
  cod_empresa: number
  nom_razao_social?: string | null
  nom_fantasia?: string | null
  num_cnpj?: string | null
  cod_bandeira?: number | null
  des_bandeira?: string | null
  cod_cidade?: number | null
  nom_cidade?: string | null
  nom_estado?: string | null
  sgl_estado?: string | null
  des_coordenada_empresa?: string | null
  ip_rede?: string | null
  nom_banco_dados?: string | null
}
