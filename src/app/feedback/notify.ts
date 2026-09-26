import type { FeedbackDefinition } from "@/app/feedback/feedback-contract"
import { toast } from "@/components/ui/toast"

export function notify(feedback: FeedbackDefinition): void {
  toast.add({
    title: feedback.title,
    description: feedback.description,
    priority: feedback.priority,
    type: feedback.type,
  })
}
