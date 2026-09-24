import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"

export type AppBadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error"

type AppBadgeIconPosition = "start" | "end"

interface AppBadgeProps {
  children: ReactNode
  icon?: LucideIcon
  iconPosition?: AppBadgeIconPosition
  tone?: AppBadgeTone
}

const toneClassName: Record<AppBadgeTone, string> = {
  error: "border-transparent bg-error/10 text-error",
  info: "border-transparent bg-info/10 text-info",
  neutral: "border-transparent bg-status-neutral/10 text-status-neutral",
  success: "border-transparent bg-success/10 text-success",
  warning: "border-transparent bg-warning/10 text-warning",
}

/**
 * Badge semântico da aplicação.
 *
 * Centraliza os tons da aplicação e a composição opcional de ícone sem expor
 * variant ou className aos consumidores.
 */
export function AppBadge({
  children,
  icon: Icon,
  iconPosition = "start",
  tone = "neutral",
}: AppBadgeProps) {
  const icon = Icon ? (
    <Icon
      aria-hidden="true"
      data-icon={iconPosition === "start" ? "inline-start" : "inline-end"}
    />
  ) : null

  return (
    <Badge className={toneClassName[tone]} variant="outline">
      {iconPosition === "start" ? icon : null}
      {children}
      {iconPosition === "end" ? icon : null}
    </Badge>
  )
}
