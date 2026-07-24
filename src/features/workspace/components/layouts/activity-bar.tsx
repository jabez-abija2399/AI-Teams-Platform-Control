'use client';

import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { ACTIVITY_ITEMS } from '../../constants/workspace.constants';

export function ActivityBar() {
  const { selectedActivity, setActivity, toggleSidebar, layout } = useWorkspaceStore();

  return (
    <div className="flex w-12 flex-col items-center justify-between border-r bg-card py-3 z-10 select-none">
      <div className="flex flex-col gap-1 w-full items-center">
        {ACTIVITY_ITEMS.filter((i) => i.id !== 'settings').map((item) => {
          const Icon = (Icons[item.icon as keyof typeof Icons] as Icons.LucideIcon) || Icons.Folder;
          const active = selectedActivity === item.id && !layout.sidebarCollapsed;
          return (
            <div key={item.id} className="relative w-full flex items-center justify-center">
              {active && (
                <div className="absolute left-0 w-1 h-5 bg-sky-500 rounded-r-full" />
              )}
              <button
                title={item.label}
                onClick={() => {
                  if (selectedActivity === item.id) toggleSidebar();
                  else setActivity(item.id);
                }}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                  active
                    ? 'bg-secondary text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          title="Settings"
          onClick={() => setActivity('settings')}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors',
            selectedActivity === 'settings' && 'bg-secondary text-foreground'
          )}
        >
          <Icons.Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
