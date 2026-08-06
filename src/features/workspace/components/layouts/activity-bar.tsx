'use client';

import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { ACTIVITY_ITEMS } from '../../constants/workspace.constants';

const PRIMARY_ACTIVITIES = new Set([
  'explorer',
  'preview',
  'search',
  'git',
  'deployment',
  'ai-employees',
]);

export function ActivityBar() {
  const { selectedActivity, setActivity, toggleSidebar, layout, setPreviewSplit, setBottomPanel } =
    useWorkspaceStore();

  const primary = ACTIVITY_ITEMS.filter(
    (i) => i.id !== 'settings' && PRIMARY_ACTIVITIES.has(i.id),
  );
  const secondary = ACTIVITY_ITEMS.filter(
    (i) => i.id !== 'settings' && !PRIMARY_ACTIVITIES.has(i.id),
  );

  const activate = (id: (typeof ACTIVITY_ITEMS)[number]['id']) => {
    if (id === 'preview') {
      setPreviewSplit(true);
      setBottomPanel('preview');
      // Keep Explorer in the sidebar — Preview lives in the side pane (Cursor-style).
      if (selectedActivity === 'explorer' && layout.previewSplit) {
        setPreviewSplit(false);
      } else {
        setActivity('explorer');
      }
      return;
    }
    if (selectedActivity === id) toggleSidebar();
    else setActivity(id);
  };

  return (
    <aside className="z-10 flex w-12 shrink-0 flex-col items-center justify-between border-r border-border/80 bg-[#1a3339] py-2 select-none">
      <div className="flex w-full flex-col items-center gap-0.5">
        {primary.map((item) => {
          const Icon = (Icons[item.icon as keyof typeof Icons] as Icons.LucideIcon) || Icons.Folder;
          const active =
            item.id === 'preview'
              ? layout.previewSplit
              : selectedActivity === item.id && !layout.sidebarCollapsed;
          return (
            <div key={item.id} className="relative flex w-full items-center justify-center">
              {active && (
                <div className="absolute left-0 h-6 w-[3px] rounded-r-full bg-[#f2f0ef]" />
              )}
              <button
                type="button"
                title={item.label}
                onClick={() => activate(item.id)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                  active
                    ? 'bg-white/12 text-[#f2f0ef]'
                    : 'text-white/45 hover:bg-white/8 hover:text-white/90',
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            </div>
          );
        })}

        <div className="my-2 h-px w-6 bg-white/10" />

        {secondary.map((item) => {
          const Icon = (Icons[item.icon as keyof typeof Icons] as Icons.LucideIcon) || Icons.Folder;
          const active = selectedActivity === item.id && !layout.sidebarCollapsed;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => activate(item.id)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                active
                  ? 'bg-white/12 text-[#f2f0ef]'
                  : 'text-white/35 hover:bg-white/8 hover:text-white/80',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        title="Settings"
        onClick={() => setActivity('settings')}
        className={cn(
          'mb-1 flex h-9 w-9 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/8 hover:text-white/85',
          selectedActivity === 'settings' && 'bg-white/12 text-[#f2f0ef]',
        )}
      >
        <Icons.Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
    </aside>
  );
}
