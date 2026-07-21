'use client';

import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { ACTIVITY_ITEMS } from '../../constants/workspace.constants';

export function ActivityBar() {
  const { selectedActivity, setActivity, toggleSidebar, layout } = useWorkspaceStore();

  return (
    <div className="flex w-12 flex-col items-center justify-between border-r bg-card py-3">
      <div className="flex flex-col gap-1">
        {ACTIVITY_ITEMS.filter((i) => i.id !== 'settings').map((item) => {
          const Icon = Icons[item.icon as keyof typeof Icons] as Icons.LucideIcon;
          const active = selectedActivity === item.id && !layout.sidebarCollapsed;
          return (
            <button
              key={item.id}
              title={item.label}
              onClick={() => {
                if (selectedActivity === item.id) toggleSidebar();
                else setActivity(item.id);
              }}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-md transition-colors',
                active
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          );
        })}
      </div>
      <button
        title="Settings"
        className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      >
        <Icons.Settings className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}
