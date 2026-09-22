import { Spinner } from "@/components/ui/spinner"

export function SessionBootstrapFallback() {
  return (
    <main aria-busy="true" className="grid min-h-svh place-items-center p-4">
      <Spinner aria-label="Inicializando aplicação" />
    </main>
  )
}
