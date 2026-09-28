import { appRoutes } from "@/app/app-routes"

export function getClientDetailsPath(clientId: string) {
  return appRoutes.clientDetails.path(clientId)
}
