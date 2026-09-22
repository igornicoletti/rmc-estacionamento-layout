import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react"

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
    if (this.state.failed) {
      return (
        <main className="grid min-h-svh place-items-center p-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold">
              Não foi possível iniciar a aplicação
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Recarregue a página para tentar novamente.
            </p>
            <button
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={this.reload}
              type="button"
            >
              Recarregar
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
