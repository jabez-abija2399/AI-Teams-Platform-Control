'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  status: string;
  assignedRole: string;
  priority: string;
}

interface TaskBoardProps {
  projectId: string;
}

export function TaskBoard({ projectId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch(`/api/projects/${projectId}/tasks`);
        if (res.ok) {
          const data = (await res.json()) as { tasks: Task[] };
          setTasks(data.tasks);
        }
      } catch {
        // ignore
      }
    }
    void fetchTasks();
  }, [projectId]);

  const statusColor: Record<string, string> = {
    TODO: 'bg-muted text-muted-foreground',
    IN_PROGRESS: 'bg-primary/15 text-primary border border-primary/30',
    DONE: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    BLOCKED: 'bg-destructive/15 text-destructive border border-destructive/30',
  };

  return (
    <Card className="rounded-2xl border border-border/80 glass-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-foreground">Project Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-xs">No tasks yet.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-xl border border-border/70 glass-card p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-xs">
                <div>
                  <p className="text-xs font-bold text-foreground">{task.title}</p>
                  <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                    {task.assignedRole ?? 'Unassigned'}
                  </p>
                </div>
                <Badge variant="secondary" className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusColor[task.status] ?? '')}>
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
