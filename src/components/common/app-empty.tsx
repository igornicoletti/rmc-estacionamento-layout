import type { LucideIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type AppEmptyMedia =
  | { avatar: ReactNode; icon?: never }
  | { avatar?: never; icon: LucideIcon }

interface AppEmptyProps extends Omit<ComponentProps<typeof Empty>, "title"> {
  description?: ReactNode
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  media?: AppEmptyMedia
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  title: ReactNode
}

export function AppEmpty({
  description,
  headingLevel = 1,
  media,
  primaryAction,
  secondaryAction,
  title,
  ...props
}: AppEmptyProps) {
  const Icon = media?.icon
  const hasActions = primaryAction !== undefined || secondaryAction !== undefined

  return (
    <Empty {...props}>
      <EmptyHeader>
        {media ? (
          <EmptyMedia variant={Icon ? "icon" : "default"}>
            {Icon ? <Icon aria-hidden="true" /> : media.avatar}
          </EmptyMedia>
        ) : null}
        <EmptyTitle aria-level={headingLevel} role="heading">
          {title}
        </EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {hasActions ? (
        <EmptyContent>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {primaryAction}
            {secondaryAction}
          </div>
        </EmptyContent>
      ) : null}
    </Empty>
  )
}
