import type { ComponentProps, ReactNode } from "react"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

interface AppItemProps {
  actions?: ReactNode
  children?: ReactNode
  description?: ReactNode
  footer?: ReactNode
  header?: ReactNode
  media?: ReactNode
  mediaVariant?: ComponentProps<typeof ItemMedia>["variant"]
  size?: ComponentProps<typeof Item>["size"]
  title: ReactNode
  variant?: ComponentProps<typeof Item>["variant"]
}

/**
 * Composição compartilhada para itens com mídia, conteúdo, ações e rodapé.
 *
 * O conteúdo específico permanece nos slots e em children; o wrapper expõe
 * apenas size e variant da primitiva, sem propagar className ou render.
 */
export function AppItem({
  actions,
  children,
  description,
  footer,
  header,
  media,
  mediaVariant = "default",
  size = "default",
  title,
  variant = "default",
}: AppItemProps) {
  return (
    <Item size={size} variant={variant}>
      {header ? <ItemHeader>{header}</ItemHeader> : null}
      {media ? <ItemMedia variant={mediaVariant}>{media}</ItemMedia> : null}

      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        {description ? <ItemDescription>{description}</ItemDescription> : null}
        {children}
      </ItemContent>

      {actions ? <ItemActions>{actions}</ItemActions> : null}
      {footer ? <ItemFooter>{footer}</ItemFooter> : null}
    </Item>
  )
}
