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

interface AppItemProps extends Omit<ComponentProps<typeof Item>, "children"> {
  actions?: ReactNode
  children?: ReactNode
  description?: ReactNode
  footer?: ReactNode
  header?: ReactNode
  media?: ReactNode
  mediaVariant?: ComponentProps<typeof ItemMedia>["variant"]
  title: ReactNode
}

/**
 * Composição compartilhada para itens com mídia, conteúdo, ações e rodapé.
 *
 * O conteúdo específico permanece nos slots e em children; o wrapper cuida
 * apenas da hierarquia visual comum.
 */
export function AppItem({
  actions,
  children,
  description,
  footer,
  header,
  media,
  mediaVariant = "default",
  title,
  ...props
}: AppItemProps) {
  return (
    <Item {...props}>
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
