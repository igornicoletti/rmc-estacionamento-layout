import type { FeedbackCatalog } from "@/app/feedback/feedback-contract"

export const SESSION_FEEDBACK = {
  signOutFailed: {
    title: "Não foi possível sair",
    description: "Tente novamente.",
    type: "error",
  },
} as const satisfies FeedbackCatalog
