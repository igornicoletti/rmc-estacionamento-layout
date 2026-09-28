import { useQuery } from "@tanstack/react-query"
import { ArrowLeftIcon, UserRoundXIcon } from "lucide-react"
import { Link, useParams } from "react-router"

import { appRoutes } from "@/app/app-routes"
import { LayoutPage } from "@/components/layout/layout-page"
import { AppEmpty } from "@/components/app/app-empty"
import { buttonVariants } from "@/components/ui/button"
import { clientsContent } from "@/features/clients/clients-content"
import { VehiclesDataTable } from "@/features/clients/vehicles/vehicles-data-table"
import {
  clientsQueryKeys,
  loadDemoClients,
} from "@/features/clients/clients-query"
import { formatErpName } from "@/features/clients/clients-format"


function BackToClients() {
  return (
    <Link className={buttonVariants({ variant: "outline" })} to={appRoutes.clients.path}>
      <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
      {clientsContent.details.back}
    </Link>
  )
}

export function ClientDetailsPage() {
  const { clientId } = useParams<"clientId">()
  const clientsQuery = useQuery({
    queryKey: clientsQueryKeys.clients,
    queryFn: loadDemoClients,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const client = clientsQuery.data?.find((item) => item.id === clientId)

  if (clientsQuery.isPending) {
    return (
      <LayoutPage
        actions={<BackToClients />}
        page={{
          title: clientsContent.details.fallbackTitle,
          subtitle: clientsContent.details.loadingSubtitle,
        }}
      />
    )
  }

  if (clientsQuery.isError || !clientId || !client) {
    return (
      <LayoutPage
        actions={<BackToClients />}
        page={{
          title: clientsContent.details.fallbackTitle,
          subtitle: clientsContent.details.unavailableSubtitle,
        }}
      >
        <AppEmpty
          description={clientsContent.details.notFoundDescription}
          headingLevel={2}
          media={{ icon: UserRoundXIcon }}
          title={clientsContent.details.notFoundTitle}
        />
      </LayoutPage>
    )
  }

  return (
    <LayoutPage
      actions={<BackToClients />}
      page={{
        title: formatErpName(client.name),
        subtitle: client.taxId,
      }}
    >
      <VehiclesDataTable clientId={client.id} />
    </LayoutPage>
  )
}
