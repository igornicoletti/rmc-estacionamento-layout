import { useSyncExternalStore, type ComponentProps } from "react"

import { Calendar } from "@/components/ui/calendar"

type AppCalendarProps = ComponentProps<typeof Calendar>

function subscribeToTimeZone() {
  return () => undefined
}

function getClientTimeZone(): string | undefined {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function getServerTimeZone(): string | undefined {
  return undefined
}

/**
 * Calendar compartilhado da aplicação.
 *
 * Mantém o Calendar oficial intacto e fornece o fuso local como padrão sem
 * produzir diferença entre a renderização do servidor e a hidratação.
 * Um timeZone explícito sempre tem precedência.
 */
export function AppCalendar({
  timeZone,
  ...props
}: AppCalendarProps) {
  const localTimeZone = useSyncExternalStore(
    subscribeToTimeZone,
    getClientTimeZone,
    getServerTimeZone,
  )

  return <Calendar timeZone={timeZone ?? localTimeZone} {...props} />
}
