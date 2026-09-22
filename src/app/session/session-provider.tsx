import { useQueryClient } from "@tanstack/react-query"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  anonymousSessionCommands,
  type SessionCommands,
} from "@/app/session/session-commands"
import {
  SessionContext,
  type SessionContextValue,
} from "@/app/session/session-context"
import {
  anonymousSession,
  bootstrappingSession,
  type ResolvedSessionSnapshot,
  type SessionSnapshot,
} from "@/app/session/session-types"

interface SessionProviderProps {
  children: ReactNode
  commands?: SessionCommands
  initialSnapshot?: SessionSnapshot
}

function isIdentityScoped(meta: Record<string, unknown> | undefined) {
  return meta?.identityScoped === true
}

export function SessionProvider({
  children,
  commands = anonymousSessionCommands,
  initialSnapshot,
}: SessionProviderProps) {
  const queryClient = useQueryClient()
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(
    initialSnapshot ?? bootstrappingSession,
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const authorityEpochRef = useRef(0)
  const activeControllerRef = useRef<AbortController | null>(null)

  const beginAuthorityOperation = useCallback(() => {
    activeControllerRef.current?.abort()

    const controller = new AbortController()
    activeControllerRef.current = controller
    return controller
  }, [])

  const finishAuthorityOperation = useCallback(
    (controller: AbortController) => {
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null
      }
    },
    [],
  )

  const clearIdentityScopedCache = useCallback(async () => {
    const filters = {
      predicate: (query: { meta?: Record<string, unknown> }) =>
        isIdentityScoped(query.meta),
    }

    await queryClient.cancelQueries(filters)
    queryClient.removeQueries(filters)
  }, [queryClient])

  const commitSnapshot = useCallback(
    async (
      next: ResolvedSessionSnapshot,
      controller: AbortController,
      epoch: number,
    ) => {
      if (controller.signal.aborted || epoch !== authorityEpochRef.current) {
        return
      }

      const previousIdentity =
        snapshot.status === "authenticated" ? snapshot.session.identity.id : null
      const nextIdentity =
        next.status === "authenticated" ? next.session.identity.id : null

      if (previousIdentity && previousIdentity !== nextIdentity) {
        await clearIdentityScopedCache()
      }

      if (!controller.signal.aborted && epoch === authorityEpochRef.current) {
        setSnapshot(next)
      }
    },
    [clearIdentityScopedCache, snapshot],
  )

  useEffect(
    () => () => {
      authorityEpochRef.current += 1
      activeControllerRef.current?.abort()
      activeControllerRef.current = null
    },
    [],
  )

  useEffect(() => {
    if (initialSnapshot) {
      return
    }

    const controller = beginAuthorityOperation()
    const epoch = ++authorityEpochRef.current

    void commands
      .getSession(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted && epoch === authorityEpochRef.current) {
          setSnapshot(next)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted && epoch === authorityEpochRef.current) {
          setSnapshot({ status: "unavailable" })
        }
      })
      .finally(() => {
        finishAuthorityOperation(controller)
      })

    return () => {
      controller.abort()
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null
      }
      authorityEpochRef.current += 1
    }
  }, [
    beginAuthorityOperation,
    commands,
    finishAuthorityOperation,
    initialSnapshot,
  ])

  const refresh = useCallback(async () => {
    const controller = beginAuthorityOperation()
    const epoch = ++authorityEpochRef.current
    setIsRefreshing(true)

    try {
      const next = await commands.refreshSession(controller.signal)
      await commitSnapshot(next, controller, epoch)
    } finally {
      finishAuthorityOperation(controller)
      if (!controller.signal.aborted && epoch === authorityEpochRef.current) {
        setIsRefreshing(false)
      }
    }
  }, [
    beginAuthorityOperation,
    commands,
    commitSnapshot,
    finishAuthorityOperation,
  ])

  const signOut = useCallback(async () => {
    const controller = beginAuthorityOperation()
    const epoch = ++authorityEpochRef.current
    setIsRefreshing(false)

    try {
      await commands.signOut(controller.signal)

      if (!controller.signal.aborted && epoch === authorityEpochRef.current) {
        await clearIdentityScopedCache()
      }

      if (!controller.signal.aborted && epoch === authorityEpochRef.current) {
        setSnapshot(anonymousSession)
      }
    } finally {
      finishAuthorityOperation(controller)
    }
  }, [
    beginAuthorityOperation,
    clearIdentityScopedCache,
    commands,
    finishAuthorityOperation,
  ])

  const value = useMemo<SessionContextValue>(
    () => ({ isRefreshing, refresh, signOut, snapshot }),
    [isRefreshing, refresh, signOut, snapshot],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}
