import type { FeedbackCatalog } from "@/app/feedback/feedback-contract"

export const CLIENTS_FEEDBACK = {
  emailCopied: ({ email }: { email: string }) => ({
    title: "E-mail copiado",
    description: email,
    type: "success",
  }),
  emailCopyFailed: {
    title: "Falha ao copiar",
    description: "Não foi possível copiar o endereço de e-mail.",
    type: "error",
  },
} as const satisfies FeedbackCatalog
