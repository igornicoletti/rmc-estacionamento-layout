export interface Client {
  id: string
  name: string
  tradeName: string
  taxId: string
  email: string
  phone: string
  city: string
  state: string
  stateCode: string
  registeredAt: string | null
  personActiveStatus: string
  financialBlockStatus: string
  vehicleCount: number
  lastPurchaseAt: string | null
  activeWithin120Days: boolean
  sourceHash: string
  sourceUpdatedAt: string | null
  synchronizedAt: string
  createdAt: string
  updatedAt: string
}
