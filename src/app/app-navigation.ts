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

import { appPages, type AppPageId } from "@/app/app-config"

function item(routeId: AppPageId, icon: LucideIcon) {
  const page = appPages[routeId]

  return {
    end: true,
    icon,
    label: page.title,
    routeId,
    to: page.path,
  }
}

export const primaryNavigation = [
  item("dashboard", GaugeIcon),
  item("virtual-yard", CircleParkingIcon),
  item("reports", ChartNoAxesColumnIncreasingIcon),
] as const

export const navigationSections = [
  {
    id: "registrations",
    label: "CADASTROS",
    items: [
      item("units", Building2Icon),
      item("clients", TruckIcon),
      item("prices", DollarSignIcon),
      item("rules", ListChecksIcon),
    ],
  },
  {
    id: "management",
    label: "GESTÃO",
    items: [
      item("users", UsersIcon),
      item("notifications", BellIcon),
    ],
  },
  {
    id: "settings",
    label: "CONFIGURAÇÕES",
    items: [
      item("profile", UserRoundIcon),
      item("account-security", ShieldCheckIcon),
      item("permissions", KeyRoundIcon),
      item("audit", HistoryIcon),
    ],
  },
] as const
