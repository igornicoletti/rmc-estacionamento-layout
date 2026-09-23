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
  initialSnapshot?: ResolvedSessionSnapshot
}

type AuthorityOperationKind = "bootstrap" | "refresh" | "sign-out"

interface AuthorityOperation {
  controller: AbortController
  kind: AuthorityOperationKind
}

function hasSameCapabilities(
  current: readonly string[],
  next: readonly string[],
) {
  const currentSet = new Set(current)
  const nextSet = new Set(next)

  return (
    currentSet.size === nextSet.size &&
    [...currentSet].every((capability) => nextSet.has(capability))
  )
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
    current.session.identity.id === next.session.identity.id &&
    current.session.assurance === next.session.assurance &&
    hasSameCapabilities(
      current.session.capabilities,
      next.session.capabilities,
    )
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
  const activeOperationRef = useRef<AuthorityOperation | null>(null)

  const setSnapshot = useCallback((next: SessionSnapshot) => {
    snapshotRef.current = next
    setSnapshotState(next)
  }, [])

  const isCurrentOperation = useCallback((operation: AuthorityOperation) => {
    return (
      activeOperationRef.current === operation &&
      !operation.controller.signal.aborted
    )
  }, [])

  const beginAuthorityOperation = useCallback(
    (kind: AuthorityOperationKind): AuthorityOperation | null => {
      const activeOperation = activeOperationRef.current

      if (kind === "refresh" && activeOperation?.kind === "sign-out") {
        return null
      }

      activeOperation?.controller.abort()

      const operation = {
        controller: new AbortController(),
        kind,
      } satisfies AuthorityOperation

      activeOperationRef.current = operation
      return operation
    },
    [],
  )

  const finishAuthorityOperation = useCallback(
    (operation: AuthorityOperation) => {
      if (activeOperationRef.current === operation) {
        activeOperationRef.current = null
      }
    },
    [],
  )

  const clearIdentityScopedCache = useCallback(
    async (operation: AuthorityOperation) => {
      const identityScopedQuery = {
        predicate: (query: { meta?: Record<string, unknown> }) =>
          query.meta?.identityScoped === true,
      }

      await queryClient.cancelQueries(identityScopedQuery)

      if (!isCurrentOperation(operation)) {
        return false
      }

      queryClient.removeQueries(identityScopedQuery)
      return true
    },
    [isCurrentOperation, queryClient],
  )

  const commitSnapshot = useCallback(
    async (
      next: ResolvedSessionSnapshot,
      operation: AuthorityOperation,
    ) => {
      if (!isCurrentOperation(operation)) {
        return
      }

      if (!isSameAuthority(snapshotRef.current, next)) {
        const cleared = await clearIdentityScopedCache(operation)

        if (!cleared) {
          return
        }
      }

      if (isCurrentOperation(operation)) {
        setSnapshot(next)
      }
    },
    [clearIdentityScopedCache, isCurrentOperation, setSnapshot],
  )

  useEffect(
    () => () => {
      activeOperationRef.current?.controller.abort()
      activeOperationRef.current = null
    },
    [],
  )

  useEffect(() => {
    if (initialSnapshot) {
      return
    }

    const operation = beginAuthorityOperation("bootstrap")

    if (!operation) {
      return
    }

    void commands
      .getSession(operation.controller.signal)
      .then((next) => commitSnapshot(next, operation))
      .catch(() => {
        if (isCurrentOperation(operation)) {
          setSnapshot({ status: "unavailable" })
        }
      })
      .finally(() => {
        finishAuthorityOperation(operation)
      })

    return () => {
      operation.controller.abort()
      finishAuthorityOperation(operation)
    }
  }, [
    beginAuthorityOperation,
    commands,
    commitSnapshot,
    finishAuthorityOperation,
    initialSnapshot,
    isCurrentOperation,
    setSnapshot,
  ])

  const refresh = useCallback(async () => {
    const operation = beginAuthorityOperation("refresh")

    if (!operation) {
      return
    }

    setIsRefreshing(true)

    try {
      const next = await commands.refreshSession(operation.controller.signal)
      await commitSnapshot(next, operation)
    } finally {
      const shouldFinalize = isCurrentOperation(operation)
      finishAuthorityOperation(operation)

      if (shouldFinalize) {
        setIsRefreshing(false)
      }
    }
  }, [
    beginAuthorityOperation,
    commands,
    commitSnapshot,
    finishAuthorityOperation,
    isCurrentOperation,
  ])

  const signOut = useCallback(async () => {
    const operation = beginAuthorityOperation("sign-out")

    if (!operation) {
      return
    }

    setIsRefreshing(false)
    setIsSigningOut(true)

    try {
      await commands.signOut(operation.controller.signal)

      if (!isCurrentOperation(operation)) {
        return
      }

      const cleared = await clearIdentityScopedCache(operation)

      if (cleared && isCurrentOperation(operation)) {
        setSnapshot(anonymousSession)
      }
    } finally {
      const shouldFinalize = isCurrentOperation(operation)
      finishAuthorityOperation(operation)

      if (shouldFinalize) {
        setIsSigningOut(false)
      }
    }
  }, [
    beginAuthorityOperation,
    clearIdentityScopedCache,
    commands,
    finishAuthorityOperation,
    isCurrentOperation,
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
