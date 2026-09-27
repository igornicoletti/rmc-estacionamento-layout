import {
  BellIcon,
  Building2Icon,
  ChartNoAxesColumnIncreasingIcon,
  CircleParkingIcon,
  DollarSignIcon,
  GaugeIcon,
  HistoryIcon,
  KeyRoundIcon,
  ListChecksIcon,
  ShieldCheckIcon,
  TruckIcon,
  UserRoundIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import { appPages, type AppPageId } from "@/app/config/app-config"
import type {
  SidebarNavigationItem,
  SidebarNavigationSection,
} from "@/components/sidebar/sidebar-navigation"

function navigationItem(
  pageId: AppPageId,
  icon: LucideIcon,
  end = true,
): SidebarNavigationItem {
  const page = appPages[pageId]

  return {
    end,
    icon,
    id: pageId,
    label: page.title,
    to: page.path,
  }
}

export const primaryNavigation = [
  navigationItem("dashboard", GaugeIcon),
  navigationItem("virtual-yard", CircleParkingIcon),
  navigationItem("reports", ChartNoAxesColumnIncreasingIcon),
] as const satisfies readonly SidebarNavigationItem[]

export const navigationSections = [
  {
    id: "registrations",
    label: "CADASTROS",
    items: [
      navigationItem("units", Building2Icon),
      navigationItem("clients", TruckIcon, false),
      navigationItem("prices", DollarSignIcon),
      navigationItem("rules", ListChecksIcon),
    ],
  },
  {
    id: "management",
    label: "GESTÃO",
    items: [
      navigationItem("users", UsersIcon),
      navigationItem("notifications", BellIcon),
    ],
  },
  {
    id: "settings",
    label: "CONFIGURAÇÕES",
    items: [
      navigationItem("profile", UserRoundIcon),
      navigationItem("account-security", ShieldCheckIcon),
      navigationItem("permissions", KeyRoundIcon),
      navigationItem("audit", HistoryIcon),
    ],
  },
] as const satisfies readonly SidebarNavigationSection[]
