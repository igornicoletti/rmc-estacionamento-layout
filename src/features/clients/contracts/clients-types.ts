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
  vehicleCount: number | null
  lastPurchaseAt: string | null
}
