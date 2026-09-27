import type { ToastCatalog } from "@/components/toast/toast-contract"

export const dataTableNotify = {
  rowCopied: {
    title: "Dados copiados",
    description: "Os dados do registro foram copiados.",
    type: "success",
  },
  rowCopyFailed: {
    title: "Falha ao copiar",
    description: "Não foi possível copiar os dados do registro.",
    type: "error",
  },
} as const satisfies ToastCatalog
