import type { ComponentProps } from "react"

import { Calendar } from "@/components/ui/calendar"

type AppCalendarProps = ComponentProps<typeof Calendar>

/**
 * Calendar compartilhado da aplicação.
 *
 * A aplicação é uma SPA cliente, portanto o fuso local pode ser resolvido
 * diretamente no navegador. Um timeZone explícito sempre tem precedência.
 */
export function AppCalendar({ timeZone, ...props }: AppCalendarProps) {
  const localTimeZone =
    timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone

  return <Calendar timeZone={localTimeZone} {...props} />
}
