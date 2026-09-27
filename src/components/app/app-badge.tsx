import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export type AppBadgeTone = "primary" | "info" | "success" | "warning" | "error";

type AppBadgeIconPosition = "start" | "end";

interface AppBadgeProps {
  children: ReactNode;
  icon?: LucideIcon;
  iconPosition?: AppBadgeIconPosition;
  tone?: AppBadgeTone;
}

const toneClassName: Record<AppBadgeTone, string> = {
  primary: "border-primary/5 bg-primary/10 text-primary [&>svg]:text-primary",
  error: "border-error/5 bg-error/10 text-error [&>svg]:text-error",
  info: "border-info/10 bg-info/10 text-info [&>svg]:text-info",
  success: "border-success/5 bg-success/10 text-success [&>svg]:text-success",
  warning: "border-warning/5 bg-warning/10 text-warning [&>svg]:text-warning",
};

export function AppBadge({
  children,
  icon: Icon,
  iconPosition = "start",
  tone = "primary",
}: AppBadgeProps) {
  const icon = Icon ? (
    <Icon
      aria-hidden="true"
      data-icon={iconPosition === "start" ? "inline-start" : "inline-end"}
    />
  ) : null;

  return (
    <Badge className={toneClassName[tone]} variant="outline">
      {iconPosition === "start" ? icon : null}
      {children}
      {iconPosition === "end" ? icon : null}
    </Badge>
  );
}
