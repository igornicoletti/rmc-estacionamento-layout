export interface Unit {
  id: string
  legalName: string
  tradeName: string
  cnpj: string
  brandCode: number
  brand: string
  cityCode: number
  city: string
  state: string
  stateCode: string
  coordinates: string | null
  synchronizedAt: string
  createdAt: string
  updatedAt: string
}
