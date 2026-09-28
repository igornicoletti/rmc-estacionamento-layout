import type { ComponentProps } from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, useLocation } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { headerContent } from "@/components/header/header-content"
import {
  HeaderNotifications,
  type HeaderNotificationItem,
} from "@/components/header/header-notifications"

const content = headerContent.notifications
const notification: HeaderNotificationItem = {
  dateTime: "2026-09-27T12:00:00Z",
  id: "notification-1",
  message: "Detalhes de teste",
  title: "Evento de teste",
  timeLabel: "Agora",
  to: "/notification-test",
}

function Location() {
  return <output aria-label="location">{useLocation().pathname}</output>
}

function renderNotifications(
  props: Partial<ComponentProps<typeof HeaderNotifications>> = {},
) {
  const onMarkAllAsRead = vi.fn()
  const onNotificationRead = vi.fn()
  const result = render(
    <MemoryRouter>
      <HeaderNotifications
        onMarkAllAsRead={onMarkAllAsRead}
        onNotificationRead={onNotificationRead}
        unreadNotifications={[notification]}
        viewAllTo="/notifications-test"
        {...props}
      />
      <Location />
    </MemoryRouter>,
  )
  return { ...result, onMarkAllAsRead, onNotificationRead }
}

async function openNotifications(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", {
    name: new RegExp(`^${content.trigger}`),
  }))
  return screen.findByRole("dialog", { name: content.title })
}

describe("HeaderNotifications", () => {
  it("abre e fecha o painel por teclado", async () => {
    const user = userEvent.setup()
    renderNotifications()
    await openNotifications(user)
    await user.keyboard("{Escape}")
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("anuncia carregamento sem disponibilizar ações ou navegação", async () => {
    const user = userEvent.setup()
    renderNotifications({ status: "loading" })
    const panel = await openNotifications(user)
    expect(within(panel).getByRole("status")).toHaveAttribute("aria-busy", "true")
    expect(within(panel).queryByRole("button")).not.toBeInTheDocument()
    expect(within(panel).queryByRole("link")).not.toBeInTheDocument()
  })

  it.each([
    { status: "unavailable" as const, unreadNotifications: [notification] },
    { status: "ready" as const, unreadNotifications: [] },
  ])("não oferece ações no estado $status sem dados disponíveis", async (props) => {
    const user = userEvent.setup()
    renderNotifications(props)
    const panel = await openNotifications(user)
    expect(within(panel).getByRole("heading", {
      level: 3,
      name: props.status === "unavailable"
        ? content.unavailableTitle
        : content.emptyTitle,
    })).toBeInTheDocument()
    expect(within(panel).queryByRole("button")).not.toBeInTheDocument()
    expect(within(panel).queryByRole("link")).not.toBeInTheDocument()
  })

  it("marca uma notificação como lida e navega para seu destino", async () => {
    const user = userEvent.setup()
    const { onNotificationRead } = renderNotifications()
    const panel = await openNotifications(user)
    await user.click(within(panel).getByRole("link", { name: new RegExp(notification.title) }))
    expect(onNotificationRead).toHaveBeenCalledExactlyOnceWith(notification.id)
    await waitFor(() => {
      expect(screen.getByLabelText("location")).toHaveTextContent(notification.to as string)
    })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("encaminha a marcação de todas como lidas", async () => {
    const user = userEvent.setup()
    const { onMarkAllAsRead } = renderNotifications()
    const panel = await openNotifications(user)
    await user.click(within(panel).getByRole("button", { name: content.markAllRead }))
    expect(onMarkAllAsRead).toHaveBeenCalledOnce()
  })

  it("impede ações duplicadas durante a marcação pendente", async () => {
    const user = userEvent.setup()
    const { onMarkAllAsRead, onNotificationRead } = renderNotifications({
      isMarkingAllAsRead: true,
      readingNotificationId: notification.id,
    })
    const panel = await openNotifications(user)
    const markAll = within(panel).getByRole("button", { name: content.markAllRead })
    expect(markAll).toBeDisabled()
    await user.click(markAll)
    await user.click(within(panel).getByRole("link", { name: new RegExp(notification.title) }))
    expect(onMarkAllAsRead).not.toHaveBeenCalled()
    expect(onNotificationRead).not.toHaveBeenCalled()
    expect(screen.getByLabelText("location")).toHaveTextContent(/^\/$/)
  })

  it("navega para ver todas e fecha o painel", async () => {
    const user = userEvent.setup()
    renderNotifications()
    const panel = await openNotifications(user)
    await user.click(within(panel).getByRole("link", { name: content.viewAll }))
    await waitFor(() => {
      expect(screen.getByLabelText("location")).toHaveTextContent("/notifications-test")
    })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
