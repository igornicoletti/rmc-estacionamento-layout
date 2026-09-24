import { useEffect, useReducer } from "react"

import { AppPageLayout } from "@/app/layouts/app-page-layout"
import { AvatarImageUploadDialog } from "@/components/dialogs/image-upload"
import { SessionExpiredDialog } from "@/components/dialogs/session-expired"
import { SessionTimeoutWarningDialog } from "@/components/dialogs/session-timeout"
import { Button } from "@/components/ui/button"

const PREVIEW_WARNING_SECONDS = 30

type PreviewOverlay = "avatar" | "expired" | "idle" | "warning"

interface PreviewState {
  overlay: PreviewOverlay
  remainingSeconds: number
}

type PreviewAction =
  | { type: "close" }
  | { type: "open-avatar" }
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
    case "open-avatar":
      return {
        ...state,
        overlay: "avatar",
      }
    case "open-warning":
      return {
        overlay: "warning",
        remainingSeconds: PREVIEW_WARNING_SECONDS,
      }
    case "open-expired":
      return {
        ...state,
        overlay: "expired",
      }
    case "close":
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
        <Button
          onClick={() => dispatch({ type: "open-avatar" })}
          type="button"
          variant="outline"
        >
          Visualizar upload de avatar
        </Button>
      </div>

      <SessionTimeoutWarningDialog
        onContinue={() => dispatch({ type: "close" })}
        open={state.overlay === "warning"}
        remainingSeconds={state.remainingSeconds}
      />

      <SessionExpiredDialog
        onSignIn={() => dispatch({ type: "close" })}
        open={state.overlay === "expired"}
      />

      <AvatarImageUploadDialog
        displayName="Usuário de exemplo"
        onFileSelect={() => undefined}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            dispatch({ type: "close" })
          }
        }}
        onRemove={() => undefined}
        open={state.overlay === "avatar"}
      />
    </AppPageLayout>
  )
}
