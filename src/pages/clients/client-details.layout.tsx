import { useQuery } from "@tanstack/react-query"
import { ArrowLeftIcon, UserRoundXIcon } from "lucide-react"
import { Link, useParams } from "react-router"

import { appRoutes } from "@/app/app-routes"
import { LayoutPage } from "@/components/layout/layout-page"
import { AppEmpty } from "@/components/app/app-empty"
import { buttonVariants } from "@/components/ui/button"
import { clientsCopy } from "@/pages/clients/clients.copy"
import { LazyClientVehiclesDataTable } from "@/pages/clients/components/lazy-client-vehicles-data-table"
import {
  clientPreviewQueryKeys,
  loadPreviewClients,
} from "@/pages/clients/data/client-preview-data"
import { formatErpName } from "@/pages/clients/model/client-presentation"

function BackToClients() {
  return (
    <Link className={buttonVariants({ variant: "outline" })} to={appRoutes.clients.path}>
      <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
      {clientsCopy.details.back}
    </Link>
  )
}

export function ClientDetailsPage() {
  const { clientId } = useParams<"clientId">()
  const clientsQuery = useQuery({
    queryKey: clientPreviewQueryKeys.clients,
    queryFn: loadPreviewClients,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const client = clientsQuery.data?.find((item) => item.id === clientId)

  if (clientsQuery.isPending) {
    return (
      <LayoutPage
        actions={<BackToClients />}
        page={{
          title: clientsCopy.details.fallbackTitle,
          subtitle: clientsCopy.details.loadingSubtitle,
        }}
      />
    )
  }

  if (clientsQuery.isError || !clientId || !client) {
    return (
      <LayoutPage
        actions={<BackToClients />}
        page={{
          title: clientsCopy.details.fallbackTitle,
          subtitle: clientsCopy.details.unavailableSubtitle,
        }}
      >
        <AppEmpty
          description={clientsCopy.details.notFoundDescription}
          headingLevel={2}
          media={{ icon: UserRoundXIcon }}
          title={clientsCopy.details.notFoundTitle}
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
      <LazyClientVehiclesDataTable clientId={client.id} />
    </LayoutPage>
  )
}
