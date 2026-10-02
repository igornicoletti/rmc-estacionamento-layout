import type { ComponentProps } from "react"
import { ptBR } from "react-day-picker/locale"

import { Calendar } from "@/components/ui/calendar"

type AppCalendarProps = ComponentProps<typeof Calendar>

export function AppCalendar({ locale = ptBR, timeZone, ...props }: AppCalendarProps) {
  const localTimeZone =
    timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone

  return <Calendar locale={locale} timeZone={localTimeZone} {...props} />
}
