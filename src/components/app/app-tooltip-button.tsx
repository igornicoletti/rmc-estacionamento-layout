import type { LucideIcon } from "lucide-react"
import type { ComponentProps } from "react"
import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type AppTooltipButtonProps = Omit<
  ComponentProps<typeof Button>,
  "aria-label" | "children" | "focusableWhenDisabled" | "size"
> & {
  icon: LucideIcon
  label: string
  tooltip?: string
  size?: "icon" | "icon-xs" | "icon-sm" | "icon-lg"
}

export function AppTooltipButton({
  icon: Icon,
  label,
  tooltip = label,
  size = "icon",
  variant = "outline",
  type = "button",
  className,
  ...props
}: AppTooltipButtonProps) {
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
            className={className}
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
