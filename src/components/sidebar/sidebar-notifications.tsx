import type { LucideIcon } from "lucide-react"
import {
  BellIcon,
  BellOffIcon,
  CheckCheckIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import type { To } from "react-router"

import { AppEmpty } from "@/components/common/app-empty"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useSidebar } from "@/components/ui/sidebar"

export interface SidebarNotificationItem {
  dateTime: string
  description: string
  icon: LucideIcon
  id: string
  timeLabel: string
  title: string
  to: To
}

export type SidebarNotificationsStatus = "ready" | "unavailable"

interface SidebarNotificationsProps {
  unreadNotifications: readonly SidebarNotificationItem[]
  onMarkAllAsRead: () => void
  onNotificationRead: (notificationId: string) => void
  status?: SidebarNotificationsStatus
  viewAllTo?: To
}

const notificationPreviewLimit = 5

function formatBadgeCount(count: number) {
  return count > 99 ? "+99" : count
}

function getTriggerLabel(count: number, status: SidebarNotificationsStatus) {
  if (status === "unavailable") {
    return "Abrir notificações. Notificações indisponíveis."
  }

  if (count === 0) {
    return "Abrir notificações"
  }

  if (count === 1) {
    return "Abrir notificações, 1 não lida"
  }

  return `Abrir notificações, ${count} não lidas`
}

const viewAllNotificationsLabel = "Ver todas as notificações"

export function SidebarNotifications({
  unreadNotifications,
  onMarkAllAsRead,
  onNotificationRead,
  status = "ready",
  viewAllTo,
}: SidebarNotificationsProps) {
  const { isMobile } = useSidebar()
  const [open, setOpen] = useState(false)
  const unreadCount = status === "ready" ? unreadNotifications.length : 0
  const previewNotifications = unreadNotifications.slice(
    0,
    notificationPreviewLimit,
  )

  const handleNotificationClick = (notificationId: string) => {
    onNotificationRead(notificationId)
    setOpen(false)
  }

  const handleMarkAllAsRead = () => {
    setOpen(false)
    onMarkAllAsRead()
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            aria-label={getTriggerLabel(unreadCount, status)}
            className="relative"
            size="icon"
            variant="ghost"
          />
        }
      >
        <BellIcon aria-hidden="true" />

        {status === "ready" && unreadCount > 0 ? (
          <Badge
            aria-hidden="true"
            className="absolute -top-1 -right-1 h-4 min-w-4 bg-destructive px-1 py-0 text-[0.625rem] leading-none text-destructive-foreground tabular-nums"
          >
            {formatBadgeCount(unreadCount)}
          </Badge>
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align={isMobile ? "center" : "end"}
        className={
          isMobile
            ? "w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)]"
            : "w-96 max-w-[calc(100vw-2rem)]"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PopoverHeader>
            <PopoverTitle>Notificações</PopoverTitle>
          </PopoverHeader>

          {status === "ready" && unreadCount > 0 ? (
            <Button onClick={handleMarkAllAsRead} size="xs" variant="ghost">
              <CheckCheckIcon aria-hidden="true" data-icon="inline-start" />
              Marcar todas como lidas
            </Button>
          ) : null}
        </div>

        {status === "unavailable" ? (
          <AppEmpty
            description="Não foi possível acessar as notificações."
            headingLevel={3}
            media={{ icon: TriangleAlertIcon }}
            title="Notificações indisponíveis"
          />
        ) : unreadCount > 0 ? (
          <>
            <ItemGroup className="max-h-80 overflow-y-auto">
              {previewNotifications.map((notification) => {
                const Icon = notification.icon

                return (
                  <Item
                    className="flex-nowrap"
                    key={notification.id}
                    render={
                      <Link
                        onClick={() => handleNotificationClick(notification.id)}
                        to={notification.to}
                      />
                    }
                    size="xs"
                    variant="muted"
                  >
                    <ItemMedia className="text-muted-foreground" variant="icon">
                      <Icon aria-hidden="true" />
                    </ItemMedia>

                    <ItemContent className="min-w-0">
                      <ItemTitle className="w-full truncate">
                        {notification.title}
                      </ItemTitle>
                      <ItemDescription className="line-clamp-none truncate">
                        {notification.description}
                      </ItemDescription>
                    </ItemContent>

                    <time
                      className="shrink-0 self-start whitespace-nowrap text-right text-xs text-muted-foreground"
                      dateTime={notification.dateTime}
                    >
                      {notification.timeLabel}
                    </time>
                  </Item>
                )
              })}
            </ItemGroup>

            {viewAllTo ? (
              <Link
                className={buttonVariants({ size: "sm", variant: "default" })}
                onClick={() => setOpen(false)}
                to={viewAllTo}
              >
                {viewAllNotificationsLabel}
              </Link>
            ) : null}
          </>
        ) : (
          <AppEmpty
            description="Você não tem notificações não lidas."
            headingLevel={3}
            media={{ icon: BellOffIcon }}
            primaryAction={viewAllTo ? (
              <Button render={<Link to={viewAllTo} />} onClick={() => setOpen(false)}>
                {viewAllNotificationsLabel}
              </Button>
            ) : undefined}
            title="Sem novas notificações"
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
