import type { ComponentProps } from "react"

import { Calendar } from "@/components/ui/calendar"

type AppCalendarProps = ComponentProps<typeof Calendar>

export function AppCalendar({ timeZone, ...props }: AppCalendarProps) {
  const localTimeZone =
    timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone

  return <Calendar timeZone={localTimeZone} {...props} />
}
