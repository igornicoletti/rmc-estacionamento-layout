import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  formatOptionalText,
  splitEmails,
} from "@/pages/clients/model/client-presentation"

interface ClientEmailCellProps {
  value: string
}

export function ClientEmailCell({ value }: ClientEmailCellProps) {
  const emails = splitEmails(value)

  if (emails.length === 0) {
    return formatOptionalText("")
  }

  const [primaryEmail, ...additionalEmails] = emails

  if (additionalEmails.length === 0) {
    return primaryEmail
  }

  return (
    <div className="flex items-center gap-2">
      <span>{primaryEmail}</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              aria-label={`${additionalEmails.length} e-mails adicionais`}
              className="rounded-3xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              type="button"
            >
              <Badge variant="secondary">+{additionalEmails.length}</Badge>
            </button>
          }
        />
        <TooltipContent>
          <div className="flex flex-col gap-1">
            {additionalEmails.map((email) => (
              <span key={email}>{email}</span>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
