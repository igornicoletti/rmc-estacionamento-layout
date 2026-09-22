import { Clock3Icon } from "lucide-react"
import type { ReactNode } from "react"

import { appCopy } from "@/app/config/app-copy"
import { AppEmpty } from "@/components/common/app-empty"
import { Separator } from "@/components/ui/separator"

interface AppPageLayoutProps {
  children?: ReactNode
  page: {
    title: string
    subtitle: string
    availability: "available" | "reserved"
  }
}

export function AppPageLayout({ children, page }: AppPageLayoutProps) {
  const reservedCopy = appCopy.feedback.reservedPage

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{page.title}</h1>
        <p className="text-sm text-muted-foreground">{page.subtitle}</p>
      </div>

      <Separator />

      {children ?? (page.availability === "reserved" ? (
        <AppEmpty
          description={reservedCopy.description}
          headingLevel={2}
          media={{ icon: Clock3Icon }}
          title={reservedCopy.title}
        />
      ) : null)}
    </div>
  )
}
