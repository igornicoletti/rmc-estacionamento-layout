import type { ComponentProps } from "react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"

export type AppBadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error"

interface AppBadgeProps extends Omit<ComponentProps<typeof Badge>, "variant"> {
  tone?: AppBadgeTone
}

const toneClassName: Record<AppBadgeTone, string> = {
  error: "border-transparent bg-destructive/10 text-destructive",
  info: "border-transparent bg-info/10 text-info",
  neutral: "border-transparent bg-muted text-muted-foreground",
  success: "border-transparent bg-success/10 text-success",
  warning: "border-transparent bg-warning/10 text-warning",
}

/**
 * Badge semântico da aplicação.
 *
 * Mantém a escolha de variante e tokens de status centralizada sem conhecer
 * estados ou regras de negócio dos escopos consumidores.
 */
export function AppBadge({
  className,
  tone = "neutral",
  ...props
}: AppBadgeProps) {
  return (
    <Badge
      className={cn(toneClassName[tone], className)}
      variant="outline"
      {...props}
    />
  )
}
