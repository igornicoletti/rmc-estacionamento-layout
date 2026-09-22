import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { SessionCommands } from "@/app/session/session-commands"
import { useSession } from "@/app/session/session-context"
import { SessionProvider } from "@/app/session/session-provider"
import type { ResolvedSessionSnapshot } from "@/app/session/session-types"

function SessionProbe() {
  const { refresh, snapshot } = useSession()

  return (
    <>
      <output>{snapshot.status}</output>
      <button onClick={() => void refresh().catch(() => undefined)}>
        Atualizar
      </button>
    </>
  )
}

function renderSession(commands: SessionCommands) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionProvider commands={commands}>
        <SessionProbe />
      </SessionProvider>
    </QueryClientProvider>,
  )
}

describe("SessionProvider", () => {
  it("descarta refresh cancelado antes de alterar sessão ou limpar cache", async () => {
    const client = new QueryClient()
    client.setQueryData(["private"], "current-data")
    const current = {
      status: "authenticated",
      session: {
        assurance: "aal1",
        capabilities: [],
        identity: { displayName: "Usuária", id: "current-user" },
      },
    } satisfies ResolvedSessionSnapshot
    let resolveStale!: (value: ResolvedSessionSnapshot) => void
    const stale = new Promise<ResolvedSessionSnapshot>((resolve) => {
      resolveStale = resolve
    })
    const commands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: vi.fn()
        .mockReturnValueOnce(stale)
        .mockResolvedValueOnce(current),
      signOut: vi.fn(),
    }
    const { result } = renderHook(() => useSession(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>
          <SessionProvider commands={commands} initialSnapshot={current}>
            {children}
          </SessionProvider>
        </QueryClientProvider>
      ),
    })
    let first!: Promise<void>

    act(() => {
      first = result.current.refresh()
    })
    await act(async () => {
      await result.current.refresh()
    })
    await act(async () => {
      resolveStale({ status: "anonymous" })
      await first
    })

    expect(result.current.snapshot).toEqual(current)
    expect(client.getQueryData(["private"])).toBe("current-data")
    expect(result.current.isRefreshing).toBe(false)
  })

  it("diferencia sessão anônima de autoridade indisponível", async () => {
    const commands: SessionCommands = {
      getSession: vi.fn().mockRejectedValue(new Error("offline")),
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    }

    renderSession(commands)
    expect(screen.getByText("bootstrapping")).toBeInTheDocument()
    expect(await screen.findByText("unavailable")).toBeInTheDocument()
  })

  it("cancela o bootstrap ao desmontar", () => {
    let observedSignal: AbortSignal | undefined
    const commands: SessionCommands = {
      getSession: (signal) => {
        observedSignal = signal
        return new Promise(() => undefined)
      },
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    }

    const view = renderSession(commands)
    view.unmount()
    expect(observedSignal?.aborted).toBe(true)
  })

  it("cancela refresh em andamento ao desmontar", () => {
    let observedSignal: AbortSignal | undefined
    const commands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: (signal) => {
        observedSignal = signal
        return new Promise(() => undefined)
      },
      signOut: vi.fn(),
    }

    const view = render(
      <QueryClientProvider client={new QueryClient()}>
        <SessionProvider
          commands={commands}
          initialSnapshot={{ status: "anonymous" }}
        >
          <SessionProbe />
        </SessionProvider>
      </QueryClientProvider>,
    )

    screen.getByRole("button", { name: "Atualizar" }).click()
    view.unmount()

    expect(observedSignal?.aborted).toBe(true)
  })

  it("preserva a sessão autenticada quando o refresh falha", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(["private"], "secret")
    const commands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: vi.fn().mockRejectedValue(new Error("offline")),
      signOut: vi.fn(),
    }

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider
          commands={commands}
          initialSnapshot={{
            status: "authenticated",
            session: {
              assurance: "aal1",
              capabilities: [],
              identity: { displayName: "Usuária", id: "user-1" },
            },
          }}
        >
          <SessionProbe />
        </SessionProvider>
      </QueryClientProvider>,
    )

    screen.getByRole("button", { name: "Atualizar" }).click()

    await waitFor(() => expect(commands.refreshSession).toHaveBeenCalledOnce())
    expect(screen.getByText("authenticated")).toBeInTheDocument()
    expect(queryClient.getQueryData(["private"])).toBe("secret")
  })

  it("limpa todo o cache ao encerrar uma autoridade autenticada", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(["private"], "secret")
    queryClient.setQueryData(["shared"], "shared")
    const commands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    }

    function LogoutProbe() {
      const { signOut } = useSession()
      return <button onClick={() => void signOut()}>Sair</button>
    }

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider
          commands={commands}
          initialSnapshot={{
            status: "authenticated",
            session: {
              assurance: "aal1",
              capabilities: [],
              identity: { displayName: "Usuária", id: "user-1" },
            },
          }}
        >
          <LogoutProbe />
        </SessionProvider>
      </QueryClientProvider>,
    )

    act(() => {
      screen.getByRole("button", { name: "Sair" }).click()
    })

    await waitFor(() =>
      expect(queryClient.getQueryData(["private"])).toBeUndefined(),
    )
    expect(queryClient.getQueryData(["shared"])).toBeUndefined()
  })

  it("preserva sessão e cache quando o logout falha", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(["private"], "secret")
    const current = {
      status: "authenticated",
      session: {
        assurance: "aal1",
        capabilities: [],
        identity: { displayName: "Usuária", id: "user-1" },
      },
    } satisfies ResolvedSessionSnapshot
    const commands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      signOut: vi.fn().mockRejectedValue(new Error("offline")),
    }

    function LogoutProbe() {
      const { isSigningOut, signOut, snapshot } = useSession()

      return (
        <>
          <output>{snapshot.status}</output>
          <output>{isSigningOut ? "signing-out" : "idle"}</output>
          <button onClick={() => void signOut().catch(() => undefined)}>
            Sair
          </button>
        </>
      )
    }

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider commands={commands} initialSnapshot={current}>
          <LogoutProbe />
        </SessionProvider>
      </QueryClientProvider>,
    )

    screen.getByRole("button", { name: "Sair" }).click()

    await waitFor(() => expect(commands.signOut).toHaveBeenCalledOnce())
    await waitFor(() => expect(screen.getByText("idle")).toBeInTheDocument())

    expect(screen.getByText("authenticated")).toBeInTheDocument()
    expect(queryClient.getQueryData(["private"])).toBe("secret")
  })

  it("limpa cache reaproveitado quando o bootstrap resolve uma nova autoridade", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(["stale-user"], "secret")
    const commands: SessionCommands = {
      getSession: vi.fn().mockResolvedValue({
        status: "anonymous",
      } satisfies ResolvedSessionSnapshot),
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    }

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider commands={commands}>
          <SessionProbe />
        </SessionProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByText("anonymous")).toBeInTheDocument()
    expect(queryClient.getQueryData(["stale-user"])).toBeUndefined()
  })
})
