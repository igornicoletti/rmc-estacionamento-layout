import { TriangleAlertIcon } from "lucide-react"
import { Component, type ErrorInfo, type ReactNode } from "react"

import { appCopy } from "@/app/config/app-copy"
import { AppRootLayout } from "@/app/layouts/app-root-layout"
import { AppEmpty } from "@/components/common/app-empty"
import { Button } from "@/components/ui/button"

interface AppErrorBoundaryProps {
  children: ReactNode
  onError?: (error: unknown, info: ErrorInfo) => void
  onReload?: () => void
}

interface AppErrorBoundaryState {
  failed: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  private readonly reload = () => {
    if (this.props.onReload) {
      this.props.onReload()
      return
    }

    window.location.reload()
  }

  render() {
    if (!this.state.failed) {
      return this.props.children
    }

    const feedback = appCopy.feedback.applicationFailure

    return (
      <AppRootLayout>
        <AppEmpty
          description={feedback.description}
          media={{ icon: TriangleAlertIcon }}
          title={feedback.title}
        >
          <Button onClick={this.reload} type="button">
            {feedback.action}
          </Button>
        </AppEmpty>
      </AppRootLayout>
    )
  }
}
