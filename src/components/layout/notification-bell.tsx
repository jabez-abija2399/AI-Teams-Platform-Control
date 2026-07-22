'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications?unreadOnly=false');
        if (res.ok) {
          const data = (await res.json()) as { data: Notification[] };
          setNotifications(data.data);
        }
      } catch {
        // ignore
      }
    }
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => setOpen(!open)}>
        <div className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-medium">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-muted-foreground text-xs">{unreadCount} unread</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-muted-foreground p-4 text-center text-xs">No notifications yet</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    'flex w-full flex-col gap-0.5 border-b px-3 py-2 text-left text-xs hover:bg-muted/50',
                    !n.read && 'bg-muted/30',
                  )}
                >
                  <span className={cn(!n.read && 'font-medium')}>{n.message}</span>
                  <span className="text-muted-foreground text-[10px]">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
