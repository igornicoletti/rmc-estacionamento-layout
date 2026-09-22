import { TriangleAlertIcon } from "lucide-react"
import { Component, type ErrorInfo, type ReactNode } from "react"

import { appCopy } from "@/app/app-copy"
import { StandaloneLayout } from "@/app/layouts/standalone-layout"
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
      <StandaloneLayout>
        <AppEmpty
          description={feedback.description}
          media={{ icon: TriangleAlertIcon }}
          primaryAction={
            <Button onClick={this.reload} type="button">
              {feedback.action}
            </Button>
          }
          title={feedback.title}
        />
      </StandaloneLayout>
    )
  }
}
