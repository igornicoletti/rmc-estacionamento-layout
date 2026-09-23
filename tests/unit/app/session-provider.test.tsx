import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import type { SessionCommands } from "@/app/session/session-commands"
import { useSession } from "@/app/session/session-context"
import { SessionProvider } from "@/app/session/session-provider"
import type { ResolvedSessionSnapshot } from "@/app/session/session-types"

interface SessionHarnessOptions {
  commands: SessionCommands
  initialSnapshot?: ResolvedSessionSnapshot
  queryClient?: QueryClient
}

function renderSessionHook({
  commands,
  initialSnapshot,
  queryClient = new QueryClient(),
}: SessionHarnessOptions) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider commands={commands} initialSnapshot={initialSnapshot}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  )

  return {
    queryClient,
    ...renderHook(() => useSession(), { wrapper }),
  }
}

function createAuthenticatedSession(
  capabilities: readonly string[] = [],
): ResolvedSessionSnapshot {
  return {
    status: "authenticated",
    session: {
      assurance: "aal1",
      capabilities,
      identity: { displayName: "Usuária", id: "user-1" },
    },
  }
}

describe("SessionProvider", () => {
  it("descarta refresh cancelado antes de alterar sessão ou limpar cache", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(["private"], "current-data")
    const current = createAuthenticatedSession()
    let resolveStale!: (value: ResolvedSessionSnapshot) => void
    const stale = new Promise<ResolvedSessionSnapshot>((resolve) => {
      resolveStale = resolve
    })
    const commands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: vi
        .fn()
        .mockReturnValueOnce(stale)
        .mockResolvedValueOnce(current),
      signOut: vi.fn(),
    }
    const { result } = renderSessionHook({
      commands,
      initialSnapshot: current,
      queryClient,
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
    expect(queryClient.getQueryData(["private"])).toBe("current-data")
    expect(result.current.isRefreshing).toBe(false)
  })

  it("impede operação obsoleta de limpar cache criado por operação mais recente", async () => {
    const queryClient = new QueryClient()
    const current = createAuthenticatedSession()
    let resolveStale!: (value: ResolvedSessionSnapshot) => void
    let releaseCancellation!: () => void
    const stale = new Promise<ResolvedSessionSnapshot>((resolve) => {
      resolveStale = resolve
    })
    const cancellationGate = new Promise<void>((resolve) => {
      releaseCancellation = resolve
    })
    const cancelQueries = vi
      .spyOn(queryClient, "cancelQueries")
      .mockReturnValueOnce(cancellationGate)
    const clear = vi.spyOn(queryClient, "clear")
    const commands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: vi
        .fn()
        .mockReturnValueOnce(stale)
        .mockResolvedValueOnce(current),
      signOut: vi.fn(),
    }
    const { result } = renderSessionHook({
      commands,
      initialSnapshot: current,
      queryClient,
    })
    let first!: Promise<void>

    act(() => {
      first = result.current.refresh()
    })
    await act(async () => {
      resolveStale({ status: "anonymous" })
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(cancelQueries).toHaveBeenCalledOnce()
    })

    queryClient.setQueryData(["fresh"], "fresh-data")

    await act(async () => {
      await result.current.refresh()
    })
    await act(async () => {
      releaseCancellation()
      await first
    })

    expect(clear).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(["fresh"])).toBe("fresh-data")
  })

  it("limpa cache quando a autoridade do mesmo usuário muda", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryDefaults(["private"], { meta: { identityScoped: true } })
    queryClient.setQueryData(["private"], "old-authority-data")
    const current = createAuthenticatedSession(["yard:read"])
    const next = createAuthenticatedSession(["yard:read", "yard:manage"])
    const commands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(next),
      signOut: vi.fn(),
    }
    const { result } = renderSessionHook({
      commands,
      initialSnapshot: current,
      queryClient,
    })

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.snapshot).toEqual(next)
    expect(queryClient.getQueryData(["private"])).toBeUndefined()
  })

  it("não permite que refresh interrompa logout em andamento", async () => {
    const current = createAuthenticatedSession()
    let releaseSignOut!: () => void
    let signOutSignal: AbortSignal | undefined
    const signOutGate = new Promise<void>((resolve) => {
      releaseSignOut = resolve
    })
    const commands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(current),
      signOut: vi.fn((signal: AbortSignal) => {
        signOutSignal = signal
        return signOutGate
      }),
    }
    const { result } = renderSessionHook({
      commands,
      initialSnapshot: current,
    })
    let signOut!: Promise<void>

    act(() => {
      signOut = result.current.signOut()
    })
    await waitFor(() => {
      expect(commands.signOut).toHaveBeenCalledOnce()
    })

    await act(async () => {
      await result.current.refresh()
    })

    expect(commands.refreshSession).not.toHaveBeenCalled()
    expect(signOutSignal?.aborted).toBe(false)

    await act(async () => {
      releaseSignOut()
      await signOut
    })

    expect(result.current.snapshot.status).toBe("anonymous")
  })

  it("diferencia bootstrap de autoridade indisponível", async () => {
    const commands: SessionCommands = {
      getSession: vi.fn().mockRejectedValue(new Error("offline")),
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    }
    const { result } = renderSessionHook({ commands })

    expect(result.current.snapshot.status).toBe("bootstrapping")

    await waitFor(() => {
      expect(result.current.snapshot.status).toBe("unavailable")
    })
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
    const { unmount } = renderSessionHook({ commands })

    unmount()

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
    const { result, unmount } = renderSessionHook({
      commands,
      initialSnapshot: { status: "anonymous" },
    })

    act(() => {
      void result.current.refresh()
    })
    unmount()

    expect(observedSignal?.aborted).toBe(true)
  })

  it("preserva sessão e cache quando o refresh falha", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(["private"], "secret")
    const current = createAuthenticatedSession()
    const commands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: vi.fn().mockRejectedValue(new Error("offline")),
      signOut: vi.fn(),
    }
    const { result } = renderSessionHook({
      commands,
      initialSnapshot: current,
      queryClient,
    })

    await act(async () => {
      await expect(result.current.refresh()).rejects.toThrow()
    })

    expect(result.current.snapshot).toEqual(current)
    expect(queryClient.getQueryData(["private"])).toBe("secret")
  })

  it("remove apenas cache vinculado à identidade ao encerrar a sessão", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryDefaults(["private"], { meta: { identityScoped: true } })
    queryClient.setQueryData(["private"], "secret")
    queryClient.setQueryData(["shared"], "shared")
    const commands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    }
    const { result } = renderSessionHook({
      commands,
      initialSnapshot: createAuthenticatedSession(),
      queryClient,
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(queryClient.getQueryData(["private"])).toBeUndefined()
    expect(queryClient.getQueryData(["shared"])).toBe("shared")
    expect(result.current.snapshot.status).toBe("anonymous")
  })

  it("preserva sessão e cache quando o logout falha", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(["private"], "secret")
    const current = createAuthenticatedSession()
    const commands: SessionCommands = {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      signOut: vi.fn().mockRejectedValue(new Error("offline")),
    }
    const { result } = renderSessionHook({
      commands,
      initialSnapshot: current,
      queryClient,
    })

    await act(async () => {
      await expect(result.current.signOut()).rejects.toThrow()
    })

    expect(result.current.isSigningOut).toBe(false)
    expect(result.current.snapshot).toEqual(current)
    expect(queryClient.getQueryData(["private"])).toBe("secret")
  })

  it("limpa cache reaproveitado quando bootstrap resolve nova autoridade", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryDefaults(["stale-user"], { meta: { identityScoped: true } })
    queryClient.setQueryData(["stale-user"], "secret")
    const commands: SessionCommands = {
      getSession: vi.fn().mockResolvedValue({
        status: "anonymous",
      } satisfies ResolvedSessionSnapshot),
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    }
    const { result } = renderSessionHook({ commands, queryClient })

    await waitFor(() => {
      expect(result.current.snapshot.status).toBe("anonymous")
    })
    expect(queryClient.getQueryData(["stale-user"])).toBeUndefined()
  })
})
