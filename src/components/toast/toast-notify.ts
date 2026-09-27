import { appToastManager } from "@/components/common/app-toast"
import type { ToastDefinition } from "@/components/toast/toast-contract"

export function notify(definition: ToastDefinition): void {
  appToastManager.add({
    title: definition.title,
    description: definition.description,
    priority: definition.priority,
    type: definition.type,
  })
}
