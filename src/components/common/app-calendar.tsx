import type { ComponentProps } from "react"

import { Calendar } from "@/components/ui/calendar"

type AppCalendarProps = ComponentProps<typeof Calendar>

/**
 * Calendar compartilhado da aplicação.
 *
 * Mantém o Calendar oficial intacto e normaliza o fuso horário para o ambiente
 * do usuário quando o consumidor não fornece um timeZone explícito.
 */
export function AppCalendar({
  timeZone,
  ...props
}: AppCalendarProps) {
  const resolvedTimeZone =
    timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone

  return <Calendar timeZone={resolvedTimeZone} {...props} />
}
