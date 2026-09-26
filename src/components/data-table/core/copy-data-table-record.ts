import { notify } from "@/app/feedback/notify"
import { DATA_TABLE_FEEDBACK } from "@/components/data-table/data-table-feedback"
import { copyToClipboard } from "@/lib/copy-to-clipboard"

export async function copyDataTableRecord(value: string): Promise<void> {
  try {
    await copyToClipboard(value)
    notify(DATA_TABLE_FEEDBACK.rowCopied)
  } catch {
    notify(DATA_TABLE_FEEDBACK.rowCopyFailed)
  }
}
