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
  error:
    "border-error/30 bg-error/10 text-foreground [&>svg]:text-error",
  info:
    "border-info/30 bg-info/10 text-foreground [&>svg]:text-info",
  neutral:
    "border-border bg-muted text-muted-foreground [&>svg]:text-status-neutral",
  success:
    "border-success/30 bg-success/10 text-foreground [&>svg]:text-success",
  warning:
    "border-warning/40 bg-warning/15 text-foreground [&>svg]:text-warning",
}

/**
 * Badge semântico da aplicação.
 *
 * Centraliza os tons da aplicação e a composição opcional de ícone sem expor
 * variant ou className aos consumidores. O conteúdo visível permanece em
 * children; não existe slot estrutural BadgeTitle no componente base.
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
