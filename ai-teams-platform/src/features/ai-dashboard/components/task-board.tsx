'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    TODO: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    DONE: 'bg-green-100 text-green-800',
    BLOCKED: 'bg-red-100 text-red-800',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tasks yet.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {task.assignedRole ?? 'Unassigned'}
                  </p>
                </div>
                <Badge variant="secondary" className={statusColor[task.status] ?? ''}>
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
