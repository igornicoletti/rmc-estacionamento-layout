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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 sm:p-6 lg:p-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-medium">{page.title}</h1>
        <p className="text-muted-foreground">{page.subtitle}</p>
      </header>
      {page.availability === "reserved" ? (
        <AppEmpty
          description="Este módulo está reservado para uma próxima etapa do projeto."
          media={{ icon: Clock3Icon }}
          title="Página em preparação"
        />
      ) : null}
    </main>
  )
}
