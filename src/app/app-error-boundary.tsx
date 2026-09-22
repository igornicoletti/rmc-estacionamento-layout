import { TriangleAlert } from "lucide-react"
import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react"

import { Button } from "@/components/ui/button"
import { StandaloneLayout } from "@/components/common/standalone-layout"
import { AppEmpty } from "@/components/common/app-empty"

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
        <StandaloneLayout>
          <AppEmpty
            primaryAction={
              <Button onClick={this.reload} type="button">
                Recarregar
              </Button>
            }
            description="Recarregue a página para tentar novamente."
            media={{ icon: TriangleAlert }}
            title="Não foi possível iniciar a aplicação"
          />
        </StandaloneLayout>
      )
    }

    return this.props.children
  }
}
