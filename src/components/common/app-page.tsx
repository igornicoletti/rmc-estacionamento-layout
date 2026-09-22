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
    <section className="flex min-w-0 flex-col gap-4">
      <header className="flex flex-col gap-1 border-b pb-4">
        <h1 className="font-heading text-2xl font-semibold">{page.title}</h1>
        <p className="text-sm text-muted-foreground">{page.subtitle}</p>
      </header>
      {page.availability === "reserved" ? (
        <AppEmpty
          headingLevel={2}
          description="Este módulo está reservado para uma próxima etapa do projeto."
          media={{ icon: Clock3Icon }}
          title="Página em preparação"
        />
      ) : null}
    </section>
  )
}
