import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

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

interface AppEmptyProps {
  children?: ReactNode
  description?: ReactNode
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  media?: AppEmptyMedia
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  title: ReactNode
}

/**
 * Empty state padronizado da aplicação.
 *
 * Header e media são estruturais; conteúdo adicional e ações pertencem ao
 * EmptyContent, preservando a composição oficial do shadcn/ui.
 */
export function AppEmpty({
  children,
  description,
  headingLevel = 1,
  media,
  primaryAction,
  secondaryAction,
  title,
}: AppEmptyProps) {
  const Icon = media?.icon
  const hasActions =
    primaryAction !== undefined || secondaryAction !== undefined
  const hasContent = children !== undefined || hasActions

  return (
    <Empty>
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

      {hasContent ? (
        <EmptyContent>
          {children}
          {hasActions ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {primaryAction}
              {secondaryAction}
            </div>
          ) : null}
        </EmptyContent>
      ) : null}
    </Empty>
  )
}
