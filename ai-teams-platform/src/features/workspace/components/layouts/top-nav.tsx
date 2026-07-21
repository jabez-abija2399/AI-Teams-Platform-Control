'use client';

import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function TopNav({ projectName, userName }: { projectName: string; userName: string }) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b bg-card px-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{projectName}</span>
      </div>
      <button className="flex w-64 items-center gap-2 rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:border-foreground/20">
        <Search className="h-3.5 w-3.5" />
        <span>Search or jump to...</span>
        <kbd className="ml-auto rounded border bg-muted px-1 text-[10px]">Ctrl+K</kbd>
      </button>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Bell className="h-3.5 w-3.5" />
        </Button>
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
