import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ListTodo } from 'lucide-react';
import type { Project, Task } from '../../../../prisma/generated/prisma/client';

interface ProjectDetailsProps {
  project: Project & { tasks: Task[] };
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <Badge>{project.status.replace('_', ' ')}</Badge>
      </div>
      {project.description && (
        <p className="text-muted-foreground text-sm">{project.description}</p>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium">Tasks</h2>
        {project.tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks yet"
            description="Tasks will appear here once AI teams are working on this project."
          />
        ) : (
          <ul className="space-y-2">
            {project.tasks.map((t) => (
              <li key={t.id} className="rounded-md border p-3 text-sm">
                {t.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
