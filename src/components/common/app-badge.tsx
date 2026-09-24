import type { ReactNode } from "react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"

export type AppBadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error"

interface AppBadgeProps {
  children: ReactNode
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
 * Traduz estados visuais compartilhados para o Badge padrão sem expor variant
 * ou className para os consumidores.
 */
export function AppBadge({
  children,
  tone = "neutral",
}: AppBadgeProps) {
  return (
    <Badge className={cn(toneClassName[tone])} variant="outline">
      {children}
    </Badge>
  )
}
