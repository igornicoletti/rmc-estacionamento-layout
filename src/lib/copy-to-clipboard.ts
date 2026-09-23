import { toast } from "@/components/ui/toast"

interface CopyToClipboardOptions {
  errorDescription: string
  successDescription: string
  successTitle: string
  value: string
}

export async function copyToClipboard({
  errorDescription,
  successDescription,
  successTitle,
  value,
}: CopyToClipboardOptions) {
  try {
    await navigator.clipboard.writeText(value)
    toast.add({
      description: successDescription,
      title: successTitle,
      type: "success",
    })
  } catch {
    toast.add({
      description: errorDescription,
      title: "Falha ao copiar",
      type: "error",
    })
  }
}
