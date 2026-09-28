import {
  BellIcon,
  BellOffIcon,
  CheckCheckIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useRef, useState, type MouseEvent } from "react"
import { Link, type To } from "react-router"

import { AppEmpty } from "@/components/app/app-empty"
import { headerContent } from "@/components/header/header-content"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Item,
  ItemActions,
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
import { useIsMobile } from "@/hooks/use-mobile"

export interface HeaderNotificationItem {
  dateTime: string
  id: string
  message: string
  title: string
  timeLabel: string
  to: To
}

export type HeaderNotificationsStatus = "loading" | "ready" | "unavailable"

interface HeaderNotificationsProps {
  isMarkingAllAsRead?: boolean
  onMarkAllAsRead: () => void
  onNotificationRead: (notificationId: string) => void
  readingNotificationId?: string
  status?: HeaderNotificationsStatus
  unreadNotifications: readonly HeaderNotificationItem[]
  viewAllTo?: To
}

function getNotificationsTriggerLabel(
  count: number,
  status: HeaderNotificationsStatus,
) {
  const content = headerContent.notifications

  if (status === "loading") {
    return content.triggerLoading
  }

  if (status === "unavailable") {
    return content.triggerUnavailable
  }

  if (count === 0) {
    return content.trigger
  }

  return count === 1
    ? `${content.trigger}, 1 não lida`
    : `${content.trigger}, ${count} não lidas`
}

const notificationPreviewLimit = 5

function formatBadgeCount(count: number) {
  return count > 99 ? "+99" : count
}

export function HeaderNotifications({
  isMarkingAllAsRead = false,
  onMarkAllAsRead,
  onNotificationRead,
  readingNotificationId,
  status = "ready",
  unreadNotifications,
  viewAllTo,
}: HeaderNotificationsProps) {
  const [open, setOpen] = useState(false)
  const [mobileAlignOffset, setMobileAlignOffset] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isMobile = useIsMobile()
  const content = headerContent.notifications
  const unreadCount = status === "ready" ? unreadNotifications.length : 0
  const previewNotifications = unreadNotifications.slice(
    0,
    notificationPreviewLimit,
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && isMobile && triggerRef.current) {
      const triggerBounds = triggerRef.current.getBoundingClientRect()
      const triggerCenter = triggerBounds.left + triggerBounds.width / 2
      setMobileAlignOffset(window.innerWidth / 2 - triggerCenter)
    } else if (!nextOpen) {
      setMobileAlignOffset(0)
    }

    setOpen(nextOpen)
  }

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

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <PopoverTrigger
        render={
          <Button
            ref={triggerRef}
            aria-label={getNotificationsTriggerLabel(unreadCount, status)}
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
        align={isMobile ? "center" : "end"}
        alignOffset={isMobile ? mobileAlignOffset : 0}
        className="w-[calc(100vw-2rem)] sm:w-96"
      >
        <PopoverHeader className="flex-row items-center justify-between">
          <PopoverTitle>{content.title}</PopoverTitle>

          {status === "ready" && unreadCount > 0 ? (
            <Button
              aria-busy={isMarkingAllAsRead}
              disabled={isMarkingAllAsRead}
              onClick={onMarkAllAsRead}
              size="xs"
              variant="ghost"
            >
              {isMarkingAllAsRead ? (
                <Spinner aria-hidden="true" data-icon="inline-start" />
              ) : (
                <CheckCheckIcon aria-hidden="true" data-icon="inline-start" />
              )}
              {content.markAllRead}
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
            <span className="sr-only">{content.loading}</span>
          </div>
        ) : status === "unavailable" ? (
          <AppEmpty
            description={content.unavailableDescription}
            headingLevel={3}
            media={{ icon: TriangleAlertIcon }}
            title={content.unavailableTitle}
          />
        ) : unreadCount > 0 ? (
          <>
            <ItemGroup className="max-h-80 overflow-y-auto">
              {previewNotifications.map((notification) => {
                const isReading = readingNotificationId === notification.id

                return (
                  <Item
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
                    <ItemMedia variant="icon">
                      <BellIcon aria-hidden="true" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{notification.title}</ItemTitle>
                      <ItemDescription className="text-xs">
                        {notification.message}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <time
                        className="text-xs text-muted-foreground"
                        dateTime={notification.dateTime}
                      >
                        {notification.timeLabel}
                      </time>
                    </ItemActions>
                  </Item>
                )
              })}
            </ItemGroup>

            {viewAllTo ? (
              <Link
                className={buttonVariants({ variant: "link" })}
                onClick={() => setOpen(false)}
                to={viewAllTo}
              >
                {content.viewAll}
              </Link>
            ) : null}
          </>
        ) : (
          <AppEmpty
            description={content.emptyDescription}
            headingLevel={3}
            media={{ icon: BellOffIcon }}
            title={content.emptyTitle}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
