import { CopyIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { copyClientValue } from "@/pages/clients/lib/copy-client-value"
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
    return <span className="block max-w-64 truncate">{primaryEmail}</span>
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="block max-w-56 truncate">{primaryEmail}</span>
      <HoverCard>
        <HoverCardTrigger
          closeDelay={200}
          delay={100}
          render={
            <button
              aria-label={`${additionalEmails.length} e-mails adicionais`}
              className="rounded-3xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              type="button"
            />
          }
        >
          <Badge variant="secondary">+{additionalEmails.length}</Badge>
        </HoverCardTrigger>
        <HoverCardContent align="end" className="w-80">
          <div className="flex flex-col gap-2">
            <p className="font-medium">Outros e-mails</p>
            <div className="flex flex-col gap-1">
              {additionalEmails.map((email) => (
                <div
                  className="flex min-w-0 items-center gap-2 rounded-2xl px-2 py-1.5 hover:bg-muted/50"
                  key={email}
                >
                  <span className="min-w-0 flex-1 select-text break-all text-sm">
                    {email}
                  </span>
                  <Button
                    aria-label={`Copiar ${email}`}
                    onClick={() =>
                      void copyClientValue({
                        errorDescription:
                          "Não foi possível copiar o endereço de e-mail.",
                        successTitle: "E-mail copiado",
                        value: email,
                      })
                    }
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                  >
                    <CopyIcon aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
