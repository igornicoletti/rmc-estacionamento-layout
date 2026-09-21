import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_VARIANTS,
} from "../users.constants"
import type { DemoUser } from "../users.schema"

interface UserDetailsSheetProps {
  user: DemoUser | null
  onOpenChange: (open: boolean) => void
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
})

export function UserDetailsSheet({ user, onOpenChange }: UserDetailsSheetProps) {
  return (
    <Sheet open={user !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{user?.name ?? "Detalhes do usuário"}</SheetTitle>
          <SheetDescription>
            Informações completas do usuário selecionado.
          </SheetDescription>
        </SheetHeader>
        {user ? (
          <dl className="grid gap-5 px-6">
            <div className="grid gap-1">
              <dt className="text-sm text-muted-foreground">Identificador</dt>
              <dd className="text-sm">{user.id}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-sm text-muted-foreground">E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-sm text-muted-foreground">Perfil</dt>
              <dd>{USER_ROLE_LABELS[user.role]}</dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={USER_STATUS_VARIANTS[user.status]}>
                  {USER_STATUS_LABELS[user.status]}
                </Badge>
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-sm text-muted-foreground">Último acesso</dt>
              <dd>
                {user.lastAccessAt
                  ? dateFormatter.format(new Date(user.lastAccessAt))
                  : "Ainda não acessou"}
              </dd>
            </div>
          </dl>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
