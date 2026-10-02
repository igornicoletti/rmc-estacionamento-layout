import { DeliveryCrypto } from "./worker-delivery-crypto"
import { createDeliveryStore } from "./worker-delivery-store"
import { LocalHttpSmsGateway } from "./worker-sms-gateway"
import { WorkerCrypto } from "../auth/worker-crypto"

export function deliveryRuntime(env: Env) {
  if (env.BFF_DELIVERY_ENABLED !== "true") return null
  if (env.ENVIRONMENT !== "LOCAL_PRODUCTION_LIKE" || env.AUTH_STAGE !== "disabled"
    || env.SUPABASE_URL !== "http://127.0.0.1:55321") throw new Error("Delivery environment not admitted")
  const existing = new WorkerCrypto(env.AUTH_KEYRING).ring
  // Validate and collect every context purpose/version before admitting delivery keys.
  const keys: string[] = []
  const visit = (value: unknown) => {
    if (typeof value === "string") keys.push(value)
    else if (value && typeof value === "object") Object.values(value).forEach(visit)
  }
  visit(existing)
  return { enabled: true, store: createDeliveryStore(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY),
    crypto: new DeliveryCrypto(JSON.parse(env.DELIVERY_KEYRING) as unknown, keys),
    gateway: new LocalHttpSmsGateway(env.SMS_GATEWAY_URL, env.SMS_GATEWAY_TOKEN) }
}
