import { useRef } from "react"
import { CopyIcon } from "lucide-react"

import { notify } from "@/components/toast/toast-notify"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppIconButton } from "@/components/app/app-icon-button"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { copyToClipboard } from "@/lib/copy-to-clipboard"
import { clientsNotify } from "@/features/clients/notifications/clients-notify"
import {
  formatOptionalText,
  splitEmails,
} from "@/features/clients/presentation/clients-format"

interface ClientsEmailCellProps {
  value: string
}

async function copyEmail(email: string): Promise<void> {
  try {
    await copyToClipboard(email)
  } catch {
    notify(clientsNotify.emailCopyFailed)
    return
  }

  notify(clientsNotify.emailCopied({ email }))
}

export function ClientsEmailCell({ value }: ClientsEmailCellProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const emails = splitEmails(value)

  if (emails.length === 0) {
    return formatOptionalText("")
  }

  const [primaryEmail, ...additionalEmails] = emails

  if (additionalEmails.length === 0) {
    return <span className="block max-w-64 truncate">{primaryEmail}</span>
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="block max-w-56 truncate">{primaryEmail}</span>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              aria-label={`${additionalEmails.length} e-mails adicionais`}
              size="xs"
              variant="ghost"
              type="button"
            />
          }
        >
          <Badge variant="secondary">+{additionalEmails.length}</Badge>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80"
          ref={popoverRef}
          initialFocus={popoverRef}
        >
          <div className="flex flex-col gap-2">
            <PopoverTitle>Outros e-mails</PopoverTitle>
            <div className="flex flex-col gap-1">
              {additionalEmails.map((email) => (
                <div
                  className="flex min-w-0 items-center gap-2 rounded-2xl px-2 py-1.5 hover:bg-muted/50"
                  key={email}
                >
                  <span className="min-w-0 flex-1 select-text break-all text-sm">
                    {email}
                  </span>
                  <AppIconButton
                    icon={CopyIcon}
                    label={`Copiar ${email}`}
                    onClick={() => void copyEmail(email)}
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                  />
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
