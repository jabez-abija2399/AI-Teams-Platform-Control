import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListTodo, ArrowRight, Code2, Sparkles } from 'lucide-react';
import { ROUTES } from '@/config/constants';
import type { Project, Task } from '../../../../prisma/generated/prisma/client';

interface ProjectDetailsProps {
  project: Project & { tasks?: Task[] };
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const tasks = project.tasks || [];
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {project.name}
            </h1>
            <Badge variant="secondary" className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          {project.description && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground max-w-2xl">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`${ROUTES.projects}/${project.id}/workspace`}>
            <Button className="gap-2 shadow-md">
              <Sparkles className="h-4 w-4" />
              Mission Control
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 glass-card p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Project Tasks</h2>
        {tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks yet"
            description="Tasks will appear here once AI teams are working on this project."
          />
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-xl border border-border/70 glass-card p-3 text-xs font-semibold text-foreground transition-all duration-200 hover:border-primary/30">
                <span>{t.title}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
