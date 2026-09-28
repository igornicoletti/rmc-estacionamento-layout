import { Component, type ErrorInfo, type ReactNode } from "react"

import { FallbackApplicationError } from "@/components/fallback/fallback-application-error"

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

    return <FallbackApplicationError onReload={this.reload} />
  }
}
