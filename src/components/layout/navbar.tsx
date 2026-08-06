'use client';

import { LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { NotificationBell } from '@/components/layout/notification-bell';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/config/constants';

interface NavbarProps {
  userName: string;
  userImage?: string | null;
}

export function Navbar({ userName, userImage }: NavbarProps) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-card/50 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2">
        <MobileMenu />
        <p className="hidden text-sm text-muted-foreground sm:block md:hidden">Menu</p>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            }
          >
            <Avatar className="h-8 w-8 cursor-pointer ring-1 ring-border">
              <AvatarImage src={userImage ?? undefined} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href={ROUTES.settings} />}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
