import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UsersTable } from "@/features/users"
import { mockUsersRepository } from "@/mocks/users/users-repository.mock"

export default function App() {
  return (
    <main className="min-h-svh bg-muted/30 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-medium">RMC Estacionamento</h1>
          <p className="text-muted-foreground">
            Consulta e gerenciamento dos usuários do sistema.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle><h2>Usuários</h2></CardTitle>
            <CardDescription>
              Consulte usuários por busca, status ou perfil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable repository={mockUsersRepository} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
