import { useQuery } from "@tanstack/react-query"
import { UserRoundXIcon } from "lucide-react"
import { useParams } from "react-router"

import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { AppEmpty } from "@/components/common/app-empty"
import { PageHistorySyncActions } from "@/components/common/page-history-sync-actions"
import { clientsCopy } from "@/pages/clients/clients.copy"
import { LazyClientVehiclesDataTable } from "@/pages/clients/components/lazy-client-vehicles-data-table"
import {
  clientPreviewQueryKeys,
  loadPreviewClients,
} from "@/pages/clients/data/client-preview-data"
import { formatErpName } from "@/pages/clients/model/client-presentation"

const clientPageBase = {
  availability: "available" as const,
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
      <AppPageLayout
        actions={<PageHistorySyncActions backTo={appPages.clients.path} />}
        page={{
          ...clientPageBase,
          title: clientsCopy.details.fallbackTitle,
          subtitle: clientsCopy.details.loadingSubtitle,
        }}
      />
    )
  }

  if (clientsQuery.isError || !clientId || !client) {
    return (
      <AppPageLayout
        actions={<PageHistorySyncActions backTo={appPages.clients.path} />}
        page={{
          ...clientPageBase,
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
      </AppPageLayout>
    )
  }

  return (
    <AppPageLayout
      actions={<PageHistorySyncActions backTo={appPages.clients.path} />}
      page={{
        ...clientPageBase,
        title: formatErpName(client.name),
        subtitle: client.taxId,
      }}
    >
      <LazyClientVehiclesDataTable clientId={client.id} />
    </AppPageLayout>
  )
}
