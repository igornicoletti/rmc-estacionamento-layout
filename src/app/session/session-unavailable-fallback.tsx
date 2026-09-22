interface SessionUnavailableFallbackProps {
  onRetry: () => void
}

export function SessionUnavailableFallback({
  onRetry,
}: SessionUnavailableFallbackProps) {
  return (
    <main className="grid min-h-svh place-items-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Sessão indisponível</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não foi possível confirmar sua sessão. Tente novamente.
        </p>
        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={onRetry}
          type="button"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  )
}
