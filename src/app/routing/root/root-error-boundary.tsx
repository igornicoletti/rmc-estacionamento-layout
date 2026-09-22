/* eslint-disable react-refresh/only-export-components -- presentation mapper is tested as boundary policy */
import {
  SearchX,
  ShieldX,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { isRouteErrorResponse, useRouteError } from "react-router"

import { Button } from "@/components/ui/button"

import { AppEmptyState } from "../../fallbacks/app-empty-state"
import { StandaloneLayout } from "../../layouts/standalone-layout"

export interface RootErrorPresentation {
  description: string
  kind: "forbidden" | "not-found" | "unexpected"
  title: string
}

function readRouteStatus(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return error.status
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status
  }

  return null
}

export function getRootErrorPresentation(error: unknown): RootErrorPresentation {
  const status = readRouteStatus(error)

  if (status === 403) {
    return {
      description: "Você não tem permissão para acessar este conteúdo.",
      kind: "forbidden",
      title: "Acesso não permitido",
    }
  }

  if (status === 404) {
    return {
      description: "O conteúdo solicitado não existe ou não está disponível.",
      kind: "not-found",
      title: "Conteúdo não encontrado",
    }
  }

  return {
    description: "Ocorreu um erro inesperado. Tente novamente.",
    kind: "unexpected",
    title: "Não foi possível carregar esta página",
  }
}

const rootErrorIcons = {
  forbidden: ShieldX,
  "not-found": SearchX,
  unexpected: TriangleAlert,
} satisfies Record<RootErrorPresentation["kind"], LucideIcon>

export function RootErrorContent({
  presentation,
}: {
  presentation: RootErrorPresentation
}) {
  const Icon = rootErrorIcons[presentation.kind]
  const action =
    presentation.kind === "unexpected" ? (
      <Button onClick={() => window.location.reload()} type="button">
        Tentar novamente
      </Button>
    ) : undefined

  return (
    <StandaloneLayout>
      <AppEmptyState
        action={action}
        description={presentation.description}
        icon={Icon}
        title={presentation.title}
      />
    </StandaloneLayout>
  )
}

export function RootErrorBoundary() {
  return (
    <RootErrorContent presentation={getRootErrorPresentation(useRouteError())} />
  )
}
