import { Clock3Icon } from "lucide-react"

import { appCopy } from "@/app/app-copy"
import { AppEmpty } from "@/components/common/app-empty"

interface AppPageLayoutProps {
  page: {
    title: string
    subtitle: string
    availability: "available" | "reserved"
  }
}

export function AppPageLayout({ page }: AppPageLayoutProps) {
  const reservedCopy = appCopy.feedback.reservedPage

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{page.title}</h1>
        <p className="text-sm text-muted-foreground">{page.subtitle}</p>
      </div>

      {page.availability === "reserved" ? (
        <AppEmpty
          description={reservedCopy.description}
          headingLevel={2}
          media={{ icon: Clock3Icon }}
          title={reservedCopy.title}
        />
      ) : null}
    </div>
  )
}
