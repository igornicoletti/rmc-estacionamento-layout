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
  title: ReactNode
}

/**
 * Empty state padronizado da aplicação.
 *
 * Header e media são estruturais. Todo conteúdo complementar pertence a
 * children e é renderizado em EmptyContent, sem impor tipo ou quantidade de
 * ações ao consumidor.
 */
export function AppEmpty({
  children,
  description,
  headingLevel = 1,
  media,
  title,
}: AppEmptyProps) {
  const Icon = media?.icon

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

      {children !== undefined ? (
        <EmptyContent>{children}</EmptyContent>
      ) : null}
    </Empty>
  )
}
