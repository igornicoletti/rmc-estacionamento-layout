import type { ToastCatalog } from "@/components/toast/toast-contract"

export const dataTableNotify = {
  exportFailed: {
    title: "Falha ao exportar",
    description: "Não foi possível gerar o arquivo CSV. Tente novamente.",
    type: "error",
  },
  refreshFailed: {
    title: "Falha ao atualizar",
    description:
      "Não foi possível atualizar os dados. As informações exibidas podem estar desatualizadas.",
    type: "error",
  },
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
