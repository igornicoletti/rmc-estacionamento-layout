import { useQuery } from "@tanstack/react-query"
import { UserRoundXIcon } from "lucide-react"
import { useParams } from "react-router"

import { appPages } from "@/app/config/app-config"
import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { AppEmpty } from "@/components/common/app-empty"
import { PageHistorySyncActions } from "@/components/common/page-history-sync-actions"
import { LazyClientVehiclesDataTable } from "@/pages/clients/components/lazy-client-vehicles-data-table"
import {
  clientMockQueryKeys,
  loadMockClients,
} from "@/pages/clients/data/client-mock-data"

const clientPageBase = {
  availability: "available" as const,
}

export function ClientDetailsPage() {
  const { clientId } = useParams<"clientId">()
  const clientsQuery = useQuery({
    queryKey: clientMockQueryKeys.clients,
    queryFn: loadMockClients,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const client = clientsQuery.data?.find((item) => item.id === clientId)

  if (clientsQuery.isPending) {
    return (
      <AppPageLayout
        actions={<PageHistorySyncActions backTo={appPages.clients.path} />}
        page={{
          ...clientPageBase,
          title: "Cliente",
          subtitle: "Carregando dados do cliente.",
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
          title: "Cliente",
          subtitle: "Cliente não disponível.",
        }}
      >
        <AppEmpty
          description="O cliente não está disponível no conjunto local de dados."
          headingLevel={2}
          media={{ icon: UserRoundXIcon }}
          title="Cliente não encontrado"
        />
      </AppPageLayout>
    )
  }

  return (
    <AppPageLayout
      actions={<PageHistorySyncActions backTo={appPages.clients.path} />}
      page={{
        ...clientPageBase,
        title: client.name,
        subtitle: client.taxId,
      }}
    >
      <LazyClientVehiclesDataTable clientId={client.id} />
    </AppPageLayout>
  )
}
