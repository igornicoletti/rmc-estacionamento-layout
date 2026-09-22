/* eslint-disable react-refresh/only-export-components -- presentation mapper is tested as boundary policy */
import { isRouteErrorResponse, useRouteError } from "react-router"

import { StandaloneLayout } from "../../layouts/standalone-layout"

export interface RootErrorPresentation {
  description: string
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
      title: "Acesso não permitido",
    }
  }

  if (status === 404) {
    return {
      description: "O conteúdo solicitado não existe ou não está disponível.",
      title: "Conteúdo não encontrado",
    }
  }

  return {
    description: "Ocorreu um erro inesperado. Tente novamente.",
    title: "Não foi possível carregar esta página",
  }
}

export function RootErrorContent({
  presentation,
}: {
  presentation: RootErrorPresentation
}) {
  return (
    <StandaloneLayout>
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">{presentation.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {presentation.description}
        </p>
        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => window.location.reload()}
          type="button"
        >
          Tentar novamente
        </button>
      </div>
    </StandaloneLayout>
  )
}

export function RootErrorBoundary() {
  return (
    <RootErrorContent presentation={getRootErrorPresentation(useRouteError())} />
  )
}
