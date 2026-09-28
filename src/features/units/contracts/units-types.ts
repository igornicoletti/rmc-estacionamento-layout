export interface Unit {
  id: string
  legalName: string
  tradeName: string
  cnpj: string
  brandCode: number | null
  brand: string
  cityCode: number | null
  city: string
  state: string
  stateCode: string
  coordinates: string | null
}
