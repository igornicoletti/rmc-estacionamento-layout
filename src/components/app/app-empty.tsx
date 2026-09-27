import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface AppEmptyAvatar {
  alt: string
  className?: string
  fallback: ReactNode
  fallbackClassName?: string
  imageClassName?: string
  render?: (avatar: ReactNode) => ReactNode
  src?: string
}

type AppEmptyMedia =
  | { avatar: AppEmptyAvatar; icon?: never }
  | { avatar?: never; icon: LucideIcon }

interface AppEmptyProps {
  children?: ReactNode
  description?: ReactNode
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  media?: AppEmptyMedia
  title: ReactNode
}

export function AppEmpty({
  children,
  description,
  headingLevel = 2,
  media,
  title,
}: AppEmptyProps) {
  const Icon = media?.icon
  const avatar = media?.avatar
  const avatarContent = avatar ? (
    <Avatar className={avatar.className}>
      {avatar.src ? (
        <AvatarImage
          alt={avatar.alt}
          className={avatar.imageClassName}
          src={avatar.src}
        />
      ) : null}
      <AvatarFallback className={avatar.fallbackClassName}>
        {avatar.fallback}
      </AvatarFallback>
    </Avatar>
  ) : null

  return (
    <Empty>
      <EmptyHeader>
        {media ? (
          <EmptyMedia variant={Icon ? "icon" : "default"}>
            {Icon
              ? <Icon aria-hidden="true" />
              : avatar?.render
                ? avatar.render(avatarContent)
                : avatarContent}
          </EmptyMedia>
        ) : null}

        <EmptyTitle aria-level={headingLevel} role="heading">
          {title}
        </EmptyTitle>

        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>

      {children !== null && children !== undefined && children !== false ? (
        <EmptyContent>{children}</EmptyContent>
      ) : null}
    </Empty>
  )
}
