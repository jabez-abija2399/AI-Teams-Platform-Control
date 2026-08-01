import type { ExecutionTimelineEntry, ExecutionState } from './types';

const inMemoryTimeline = new Map<string, ExecutionTimelineEntry[]>();

export class ExecutionTimelineService {
  public static recordEntry(
    projectId: string,
    taskId: string,
    taskTitle: string,
    agentRole: string,
    state: ExecutionState,
    details: string
  ): ExecutionTimelineEntry {
    const entry: ExecutionTimelineEntry = {
      id: `etl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      taskId,
      taskTitle,
      agentRole,
      state,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details,
    };

    const list = inMemoryTimeline.get(projectId) || [];
    list.unshift(entry);
    inMemoryTimeline.set(projectId, list);

    return entry;
  }

  public static getTimeline(projectId: string): ExecutionTimelineEntry[] {
    if (inMemoryTimeline.has(projectId)) {
      return inMemoryTimeline.get(projectId)!;
    }

    const defaultTimeline: ExecutionTimelineEntry[] = [
      {
        id: 'etl_1',
        taskId: 'tsk_1',
        taskTitle: 'Define Architecture Tech Stack & Quality Scoring',
        agentRole: 'ARCHITECT',
        state: 'Completed',
        timestamp: '10:00 AM',
        details: 'Selected Next.js 14 App Router and verified 94% quality score.',
      },
      {
        id: 'etl_2',
        taskId: 'tsk_2',
        taskTitle: 'Create Prisma Models & Migration Push',
        agentRole: 'DATABASE',
        state: 'Running',
        timestamp: '10:15 AM',
        details: 'Executing Prisma schema migration script.',
      },
    ];

    inMemoryTimeline.set(projectId, defaultTimeline);
    return defaultTimeline;
  }
}
