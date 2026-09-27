import type { ToastCatalog } from "@/components/toast/toast-contract"

export const clientsNotify = {
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
} as const satisfies ToastCatalog
