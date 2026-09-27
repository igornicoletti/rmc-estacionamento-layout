import type { ToastDefinition } from "@/components/toast/toast-contract"
import { toast } from "@/components/ui/toast"

export function notify(definition: ToastDefinition): void {
  toast.add({
    title: definition.title,
    description: definition.description,
    priority: definition.priority,
    type: definition.type,
  })
}
