import { appPages } from "@/app/config/app-config"

export const CLIENT_DETAILS_ROUTE_PATH = `${appPages.clients.path}/:clientId`

export function getClientDetailsPath(clientId: string) {
  return `${appPages.clients.path}/${encodeURIComponent(clientId)}`
}
