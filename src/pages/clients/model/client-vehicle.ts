export interface ClientVehicle {
  id: string
  clientId: string
  clientName: string
  clientTradeName: string
  clientTaxId: string
  plate: string
  description: string
  driverName: string
  clientActiveWithin120Days: boolean
  sourceHash: string
  sourceUpdatedAt: string | null
  synchronizedAt: string
  createdAt: string
  updatedAt: string
}
