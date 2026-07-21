'use client';

import { ChevronsUpDown, Check } from 'lucide-react';
import { useState } from 'react';
import { useProjects } from '../hooks/use-projects';
import type { ProjectListItem } from '../types/project-manager.types';

export function ProjectSwitcher({
  currentProjectId,
  onSelect,
}: {
  currentProjectId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: projects } = useProjects();
  const list = (projects ?? []) as ProjectListItem[];
  const current = list.find((p) => p.id === currentProjectId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium hover:bg-secondary"
      >
        {current?.name ?? 'Select project'}
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border bg-popover p-1 shadow-md">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onSelect(p.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs hover:bg-secondary"
            >
              {p.name}
              {p.id === currentProjectId && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
