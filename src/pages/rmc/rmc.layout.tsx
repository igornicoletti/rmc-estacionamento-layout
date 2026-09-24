import { useEffect, useReducer } from "react"

import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { SessionExpiredDialog } from "@/components/overlays/session/session-expired-dialog"
import { SessionTimeoutWarningDialog } from "@/components/overlays/session/session-timeout-warning-dialog"
import { Button } from "@/components/ui/button"

const PREVIEW_WARNING_SECONDS = 30

type PreviewOverlay = "expired" | "idle" | "warning"

interface PreviewState {
  overlay: PreviewOverlay
  remainingSeconds: number
}

type PreviewAction =
  | { type: "continue" }
  | { type: "expire" }
  | { type: "open-expired" }
  | { type: "open-warning" }
  | { type: "tick" }

const initialState: PreviewState = {
  overlay: "idle",
  remainingSeconds: PREVIEW_WARNING_SECONDS,
}

function previewReducer(
  state: PreviewState,
  action: PreviewAction,
): PreviewState {
  switch (action.type) {
    case "open-warning":
      return {
        overlay: "warning",
        remainingSeconds: PREVIEW_WARNING_SECONDS,
      }
    case "open-expired":
    case "expire":
      return {
        ...state,
        overlay: "expired",
      }
    case "continue":
      return {
        ...state,
        overlay: "idle",
      }
    case "tick":
      if (state.overlay !== "warning") {
        return state
      }

      if (state.remainingSeconds <= 1) {
        return {
          overlay: "expired",
          remainingSeconds: 0,
        }
      }

      return {
        ...state,
        remainingSeconds: state.remainingSeconds - 1,
      }
  }
}

const previewPage = {
  availability: "available",
  subtitle:
    "Rota interna para validar visualmente overlays e estados de interface.",
  title: "RMC",
} as const

export function RmcPreviewPage() {
  const [state, dispatch] = useReducer(previewReducer, initialState)

  useEffect(() => {
    if (state.overlay !== "warning") {
      return
    }

    const intervalId = window.setInterval(() => {
      dispatch({ type: "tick" })
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [state.overlay])

  return (
    <AppPageLayout page={previewPage}>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => dispatch({ type: "open-warning" })} type="button">
          Visualizar aviso de inatividade
        </Button>
        <Button
          onClick={() => dispatch({ type: "open-expired" })}
          type="button"
          variant="outline"
        >
          Visualizar sessão encerrada
        </Button>
      </div>

      <SessionTimeoutWarningDialog
        onContinue={() => dispatch({ type: "continue" })}
        onSignOut={() => dispatch({ type: "expire" })}
        open={state.overlay === "warning"}
        remainingSeconds={state.remainingSeconds}
      />

      <SessionExpiredDialog
        onSignIn={() => dispatch({ type: "continue" })}
        open={state.overlay === "expired"}
      />
    </AppPageLayout>
  )
}
