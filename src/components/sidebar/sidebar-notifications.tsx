import {
  BellIcon,
  BellOffIcon,
  CheckCheckIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react"
import { useState, type MouseEvent } from "react"
import { Link, type To } from "react-router"

import { AppEmpty } from "@/components/common/app-empty"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Spinner } from "@/components/ui/spinner"

export interface SidebarNotificationItem {
  dateTime: string
  description: string
  icon: LucideIcon
  id: string
  timeLabel: string
  title: string
  to: To
}

export type SidebarNotificationsStatus = "loading" | "ready" | "unavailable"

interface SidebarNotificationsProps {
  isMarkingAllAsRead?: boolean
  onMarkAllAsRead: () => void
  onNotificationRead: (notificationId: string) => void
  readingNotificationId?: string
  status?: SidebarNotificationsStatus
  unreadNotifications: readonly SidebarNotificationItem[]
  viewAllTo?: To
}

const notificationPreviewLimit = 5
const viewAllNotificationsLabel = "Ver todas as notificações"

function formatBadgeCount(count: number) {
  return count > 99 ? "+99" : count
}

function getTriggerLabel(count: number, status: SidebarNotificationsStatus) {
  if (status === "loading") {
    return "Abrir notificações. Carregando notificações."
  }

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

export function SidebarNotifications({
  isMarkingAllAsRead = false,
  onMarkAllAsRead,
  onNotificationRead,
  readingNotificationId,
  status = "ready",
  unreadNotifications,
  viewAllTo,
}: SidebarNotificationsProps) {
  const [open, setOpen] = useState(false)
  const unreadCount = status === "ready" ? unreadNotifications.length : 0
  const previewNotifications = unreadNotifications.slice(
    0,
    notificationPreviewLimit,
  )

  const handleNotificationClick = (
    event: MouseEvent<HTMLAnchorElement>,
    notificationId: string,
  ) => {
    if (readingNotificationId === notificationId) {
      event.preventDefault()
      return
    }

    onNotificationRead(notificationId)
    setOpen(false)
  }

  const handleMarkAllAsRead = () => {
    if (!isMarkingAllAsRead) {
      onMarkAllAsRead()
    }
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
            className="absolute -top-1 -right-1 h-4 min-w-4 bg-destructive px-1 py-0 text-[0.625rem] text-destructive-foreground"
          >
            {formatBadgeCount(unreadCount)}
          </Badge>
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-96 max-w-[calc(100vw-2rem)]"
      >
        <PopoverHeader className="flex-row items-center justify-between">
          <PopoverTitle>Notificações</PopoverTitle>

          {status === "ready" && unreadCount > 0 ? (
            <Button
              aria-busy={isMarkingAllAsRead}
              disabled={isMarkingAllAsRead}
              onClick={handleMarkAllAsRead}
              size="xs"
              variant="ghost"
            >
              {isMarkingAllAsRead ? (
                <Spinner aria-hidden="true" data-icon="inline-start" />
              ) : (
                <CheckCheckIcon aria-hidden="true" data-icon="inline-start" />
              )}
              Marcar todas como lidas
            </Button>
          ) : null}
        </PopoverHeader>

        {status === "loading" ? (
          <div
            aria-busy="true"
            className="flex min-h-32 items-center justify-center"
            role="status"
          >
            <Spinner aria-hidden="true" />
            <span className="sr-only">Carregando notificações</span>
          </div>
        ) : status === "unavailable" ? (
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
                const isReading = readingNotificationId === notification.id

                return (
                  <Item
                    className="flex-nowrap"
                    key={notification.id}
                    render={
                      <Link
                        aria-disabled={isReading || undefined}
                        onClick={(event) =>
                          handleNotificationClick(event, notification.id)
                        }
                        to={notification.to}
                      />
                    }
                    size="xs"
                  >
                    <ItemMedia className="text-muted-foreground" variant="icon">
                      <Icon aria-hidden="true" />
                    </ItemMedia>

                    <ItemContent className="min-w-0">
                      <ItemTitle>{notification.title}</ItemTitle>
                      <ItemDescription className="line-clamp-1">
                        {notification.description}
                      </ItemDescription>
                    </ItemContent>

                    <time
                      className="shrink-0 text-xs text-muted-foreground"
                      dateTime={notification.dateTime}
                    >
                      {notification.timeLabel}
                    </time>
                  </Item>
                )
              })}
            </ItemGroup>

            {viewAllTo ? (
              <Button
                className="w-full"
                onClick={() => setOpen(false)}
                render={<Link to={viewAllTo} />}
              >
                {viewAllNotificationsLabel}
              </Button>
            ) : null}
          </>
        ) : (
          <AppEmpty
            description="Você não tem notificações não lidas."
            headingLevel={3}
            media={{ icon: BellOffIcon }}
            primaryAction={
              viewAllTo ? (
                <Button
                  onClick={() => setOpen(false)}
                  render={<Link to={viewAllTo} />}
                >
                  {viewAllNotificationsLabel}
                </Button>
              ) : undefined
            }
            title="Sem novas notificações"
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
