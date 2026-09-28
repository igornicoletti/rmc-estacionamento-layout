import type { LucideIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { useId, useState } from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type AppIconButtonProps = Omit<
  ComponentProps<typeof Button>,
  "aria-label" | "children" | "size" | "focusableWhenDisabled"
> & {
  icon: LucideIcon
  label: string
  tooltip?: string
  size?: "icon" | "icon-xs" | "icon-sm" | "icon-lg"
}

// One focus target, including disabled actions, so their explanation remains accessible.
export function AppIconButton({
  icon: Icon,
  label,
  tooltip = label,
  size = "icon",
  variant = "outline",
  type = "button",
  className,
  ...props
}: AppIconButtonProps) {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        render={
          <Button
            {...props}
            aria-describedby={
              [props["aria-describedby"], open ? tooltipId : undefined]
                .filter(Boolean)
                .join(" ") || undefined
            }
            aria-label={label}
            className={cn("data-disabled:opacity-50", className)}
            focusableWhenDisabled
            size={size}
            type={type}
            variant={variant}
          />
        }
      >
        <Icon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent id={tooltipId} role="tooltip">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
