import type { ComponentProps, ReactNode } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toast,
  useToastManager,
} from "@/components/ui/toast"

export const appToastManager = toast

function AppToastIcon({ type }: { type: string | undefined }) {
  let icon: ReactNode = null

  if (type === "success") {
    icon = <CircleCheckIcon className="text-success" aria-hidden="true" />
  }

  if (type === "info") {
    icon = <InfoIcon className="text-info" aria-hidden="true" />
  }

  if (type === "warning") {
    icon = <TriangleAlertIcon className="text-warning" aria-hidden="true" />
  }

  if (type === "error") {
    icon = <OctagonXIcon className="text-error" aria-hidden="true" />
  }

  if (type === "loading") {
    icon = <Loader2Icon className="animate-spin" aria-hidden="true" />
  }

  if (!icon) {
    return null
  }

  return (
    <span
      data-slot="app-toast-icon"
      className="shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
    >
      {icon}
    </span>
  )
}

function AppToastList() {
  const { toasts } = useToastManager()

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <AppToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose aria-label="Fechar notificação" />
      </ToastContent>
    </Toast>
  ))
}

type AppToasterProps = ComponentProps<typeof ToastProvider>

export function AppToaster({
  children,
  toastManager = appToastManager,
  ...props
}: AppToasterProps) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <AppToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}
