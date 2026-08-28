'use client';

// Import Lucide icons for user menu and settings.
import { LogOut, Settings, Bell, User } from 'lucide-react';
// Import Next.js routing Link.
import Link from 'next/link';
// Import NextAuth signOut function.
import { signOut } from 'next-auth/react';
// Import UI primitives for avatars and dropdown menus.
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

/**
 * Ultra-Modern Cyber Void Global Header Navbar.
 * Features frosted glass background, notification center, and user account dropdown.
 */
export function Navbar({ userName, userImage }: NavbarProps) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-surface-glass/60 px-4 backdrop-blur-xl md:px-8 z-10">
      {/* Mobile Menu trigger */}
      <div className="flex items-center gap-2">
        <MobileMenu />
        <p className="hidden text-xs font-bold uppercase tracking-widest font-mono text-white/50 sm:block md:hidden">
          Navigation
        </p>
      </div>

      {/* Right Controls: Notifications & User Profile */}
      <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
        <NotificationBell />

        {/* User Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all p-0.5 hover:ring-2 hover:ring-white/20" />
            }
          >
            <Avatar className="h-8 w-8 cursor-pointer ring-1 ring-white/20 shadow-md">
              <AvatarImage src={userImage ?? undefined} alt={userName} />
              <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary border border-primary/30">
                {initials || <User className="w-3.5 h-3.5" />}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" sideOffset={8} className="w-56 bg-[#0B0B14]/95 border border-white/10 backdrop-blur-2xl text-white shadow-2xl rounded-2xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-white tracking-tight">
                {userName}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem render={<Link href={ROUTES.settings} />} className="hover:bg-white/10 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer transition-colors">
              <Settings className="mr-2 h-4 w-4 text-primary" />
              Platform Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="hover:bg-danger/20 text-danger rounded-xl px-3 py-2 text-xs font-medium cursor-pointer transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
