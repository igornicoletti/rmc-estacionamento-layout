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

function isSameAuthority(
  current: SessionSnapshot,
  next: ResolvedSessionSnapshot,
) {
  if (current.status === "anonymous" && next.status === "anonymous") {
    return true
  }

  return (
    current.status === "authenticated" &&
    next.status === "authenticated" &&
    current.session.identity.id === next.session.identity.id
  )
}

export function SessionProvider({
  children,
  commands = anonymousSessionCommands,
  initialSnapshot,
}: SessionProviderProps) {
  const queryClient = useQueryClient()
  const [snapshot, setSnapshotState] = useState<SessionSnapshot>(
    initialSnapshot ?? bootstrappingSession,
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const snapshotRef = useRef(snapshot)
  const authorityEpochRef = useRef(0)
  const activeControllerRef = useRef<AbortController | null>(null)

  const setSnapshot = useCallback((next: SessionSnapshot) => {
    snapshotRef.current = next
    setSnapshotState(next)
  }, [])

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

  const clearAuthorityCache = useCallback(async () => {
    await queryClient.cancelQueries()
    queryClient.clear()
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

      if (!isSameAuthority(snapshotRef.current, next)) {
        await clearAuthorityCache()
      }

      if (!controller.signal.aborted && epoch === authorityEpochRef.current) {
        setSnapshot(next)
      }
    },
    [clearAuthorityCache, setSnapshot],
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
      .then((next) => commitSnapshot(next, controller, epoch))
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
    commitSnapshot,
    finishAuthorityOperation,
    initialSnapshot,
    setSnapshot,
  ])

  const refresh = useCallback(async () => {
    const controller = beginAuthorityOperation()
    const epoch = ++authorityEpochRef.current
    setIsSigningOut(false)
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
    setIsSigningOut(true)

    try {
      await commands.signOut(controller.signal)

      if (!controller.signal.aborted && epoch === authorityEpochRef.current) {
        await clearAuthorityCache()
      }

      if (!controller.signal.aborted && epoch === authorityEpochRef.current) {
        setSnapshot(anonymousSession)
      }
    } finally {
      finishAuthorityOperation(controller)

      if (!controller.signal.aborted && epoch === authorityEpochRef.current) {
        setIsSigningOut(false)
      }
    }
  }, [
    beginAuthorityOperation,
    clearAuthorityCache,
    commands,
    finishAuthorityOperation,
    setSnapshot,
  ])

  const value = useMemo<SessionContextValue>(
    () => ({
      isRefreshing,
      isSigningOut,
      refresh,
      signOut,
      snapshot,
    }),
    [isRefreshing, isSigningOut, refresh, signOut, snapshot],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}
