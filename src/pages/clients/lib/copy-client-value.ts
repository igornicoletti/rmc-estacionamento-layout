import { toast } from "@/components/ui/toast"

interface CopyClientValueOptions {
  errorDescription: string
  successTitle: string
  value: string
}

export async function copyClientValue({
  errorDescription,
  successTitle,
  value,
}: CopyClientValueOptions) {
  try {
    await navigator.clipboard.writeText(value)
    toast.add({ description: value, title: successTitle, type: "success" })
  } catch {
    toast.add({
      description: errorDescription,
      title: "Falha ao copiar",
      type: "error",
    })
  }
}
