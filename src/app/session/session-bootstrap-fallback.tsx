export function SessionBootstrapFallback() {
  return (
    <main
      aria-busy="true"
      aria-label="Inicializando aplicação"
      className="grid min-h-svh place-items-center p-4"
    >
      <p className="text-sm text-muted-foreground">Carregando…</p>
    </main>
  )
}
