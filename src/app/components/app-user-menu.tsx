import {
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  SunMoonIcon,
  UserRoundIcon,
} from "lucide-react"
import { Link, type To } from "react-router"

import { appCopy } from "@/app/app-copy"
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
import { getUserInitials } from "@/lib/user-initials"

export interface AppUserMenuProps {
  avatarSrc?: string
  email?: string
  isSigningOut?: boolean
  name: string
  onLogout: () => void
  profileTo: To
}

export function AppUserMenu({
  avatarSrc,
  email,
  isSigningOut = false,
  name,
  onLogout,
  profileTo,
}: AppUserMenuProps) {
  const { theme, setTheme } = useTheme()
  const normalizedEmail = email?.trim()
  const copy = appCopy.toolbar.userMenu

  const handleThemeChange = (value: string) => {
    if (isTheme(value)) {
      setTheme(value)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button aria-label={copy.trigger} variant="ghost" />}
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
            {copy.profile}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoonIcon aria-hidden="true" />
            {copy.appearance}
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              onValueChange={handleThemeChange}
              value={theme}
            >
              <DropdownMenuRadioItem value="light">
                <SunIcon aria-hidden="true" />
                {copy.themeLight}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <MoonIcon aria-hidden="true" />
                {copy.themeDark}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <MonitorIcon aria-hidden="true" />
                {copy.themeSystem}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={isSigningOut}
            onClick={onLogout}
            variant="destructive"
          >
            <LogOutIcon aria-hidden="true" />
            {isSigningOut ? copy.signingOut : copy.signOut}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
