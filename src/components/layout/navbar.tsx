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
    <header className="bg-background flex h-14 items-center justify-between border-b px-4 md:px-6">
      <MobileMenu />
      <div className="flex items-center gap-3">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" />}
          >
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={userImage ?? undefined} alt={userName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
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
