'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRelativeTime } from '@/utils/format';
import { useRecentProjects } from '../hooks/use-recent-projects';

interface RecentProject {
  id: string;
  name: string;
  lastOpenedAt: string | null;
  updatedAt: string;
}

export function RecentProjects() {
  const { data: recents } = useRecentProjects();
  const projects = (recents ?? []) as RecentProject[];

  if (projects.length === 0) {
    return <EmptyState icon={Clock} title="No recent projects" />;
  }

  return (
    <ul className="space-y-1">
      {projects.map((p) => (
        <li key={p.id}>
          <Link
            href={`/dashboard/projects/${p.id}/workspace`}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary/50"
          >
            <span>{p.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(p.lastOpenedAt ?? p.updatedAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
