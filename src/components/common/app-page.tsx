import { Clock3Icon } from "lucide-react"

import { AppEmpty } from "@/components/common/app-empty"

interface AppPageProps {
  page: {
    title: string
    subtitle: string
    availability: "available" | "reserved"
  }
}

export function AppPage({ page }: AppPageProps) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{page.title}</h1>
        <p className="text-sm text-muted-foreground">{page.subtitle}</p>
      </div>

      {page.availability === "reserved" ? (
        <AppEmpty
          description="Este módulo está reservado para uma próxima etapa do projeto."
          headingLevel={2}
          media={{ icon: Clock3Icon }}
          title="Página em preparação"
        />
      ) : null}
    </div>
  )
}
