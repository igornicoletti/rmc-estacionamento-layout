import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { SessionCommands } from "@/app/session/session-commands"
import { SessionProvider } from "@/app/session/session-provider"
import { useSession } from "@/app/session/use-session"

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
    queryClient.setQueryDefaults(["private"], { meta: { identityScoped: true } })
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

  it("remove somente cache marcado como dependente de identidade", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryDefaults(["private"], { meta: { identityScoped: true } })
    queryClient.setQueryData(["private"], "secret")
    queryClient.setQueryData(["public"], "shared")
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
    await waitFor(() => expect(queryClient.getQueryData(["private"])).toBeUndefined())
    expect(queryClient.getQueryData(["public"])).toBe("shared")
  })
})
