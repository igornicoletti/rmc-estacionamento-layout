import {
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  SunMoonIcon,
  UserRoundIcon,
} from "lucide-react"
import { Link } from "react-router"

import { isTheme } from "@/components/theme/theme-context"
import { useTheme } from "@/components/theme/use-theme"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { To } from "react-router"
import { getUserInitials } from "@/lib/user-initials"

export interface SidebarUserMenuProps {
  avatarSrc?: string
  name: string
  email?: string
  profileTo: To
  isSigningOut?: boolean
  onLogout: () => void
}

export function SidebarUserMenu({
  avatarSrc,
  name,
  email,
  onLogout,
  profileTo,
  isSigningOut = false,
}: SidebarUserMenuProps) {
  const { theme, setTheme } = useTheme()
  const normalizedEmail = email?.trim()

  const handleThemeChange = (value: string) => {
    if (isTheme(value)) {
      setTheme(value)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Abrir menu do usuário"
            className="hover:bg-transparent! aria-expanded:bg-transparent!"
            variant="ghost"
          />
        }
      >
        <Avatar>
          {avatarSrc ? (
            <AvatarImage alt={`Foto de perfil de ${name}`} src={avatarSrc} />
          ) : null}
          <AvatarFallback>{getUserInitials(name)}</AvatarFallback>
        </Avatar>

        <span className="hidden min-w-0 text-center leading-tight md:block">
          <span className="block max-w-48 truncate">{name}</span>

          {normalizedEmail ? (
            <span className="block max-w-48 truncate text-xs font-normal text-muted-foreground">
              {normalizedEmail}
            </span>
          ) : null}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="md:hidden">
            <span className="block max-w-48 truncate text-sm text-foreground">
              {name}
            </span>
            {normalizedEmail ? (
              <span className="block max-w-48 truncate text-xs">
                {normalizedEmail}
              </span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="md:hidden" />

        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to={profileTo} />}>
            <UserRoundIcon aria-hidden="true" />
            Meu perfil
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoonIcon aria-hidden="true" />
            Aparência
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              onValueChange={handleThemeChange}
              value={theme}
            >
              <DropdownMenuRadioItem value="light">
                <SunIcon aria-hidden="true" />
                Claro
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem value="dark">
                <MoonIcon aria-hidden="true" />
                Escuro
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem value="system">
                <MonitorIcon aria-hidden="true" />
                Sistema
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem disabled={isSigningOut} onClick={onLogout} variant="destructive">
            <LogOutIcon aria-hidden="true" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
