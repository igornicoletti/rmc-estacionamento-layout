import type { ToastCatalog } from "@/components/toast/toast-contract"

export const sessionNotify = {
  signOutFailed: {
    title: "Não foi possível sair",
    description: "Tente novamente.",
    priority: "high",
    type: "error",
  },
} as const satisfies ToastCatalog
