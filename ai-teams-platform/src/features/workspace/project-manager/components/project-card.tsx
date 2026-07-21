'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/utils/format';
import { useToggleFavorite } from '../hooks/use-projects';
import type { ProjectListItem } from '../types/project-manager.types';

export function ProjectCard({ project }: { project: ProjectListItem }) {
  const toggleFavorite = useToggleFavorite();

  return (
    <Card className="relative transition-colors hover:border-foreground/20">
      <Link href={`/dashboard/projects/${project.id}/workspace`}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md text-sm"
              style={{
                backgroundColor: `${project.color}20`,
                color: project.color ?? undefined,
              }}
            >
              {project.icon ?? '\u{1F4C1}'}
            </span>
            <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Updated {formatRelativeTime(project.updatedAt)}
          </p>
        </CardContent>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7"
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite.mutate(project.id);
        }}
      >
        <Star
          className={
            project.favorite
              ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400'
              : 'h-3.5 w-3.5'
          }
        />
      </Button>
    </Card>
  );
}
