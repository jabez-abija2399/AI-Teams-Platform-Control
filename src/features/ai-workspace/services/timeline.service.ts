export interface TimelineEvent {
  id: string;
  type: string;
  message: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const events: TimelineEvent[] = [];

export async function recordTimelineEvent(
  event: Omit<TimelineEvent, 'id' | 'createdAt'>,
): Promise<TimelineEvent> {
  const entry: TimelineEvent = {
    ...event,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
  events.push(entry);
  return entry;
}

export async function getTimelineEvents(filter?: {
  agentId?: string;
  type?: string;
  since?: Date;
  limit?: number;
}): Promise<TimelineEvent[]> {
  let result = events;
  if (filter?.agentId) {
    result = result.filter((e) => e.agentId === filter.agentId);
  }
  if (filter?.type) {
    result = result.filter((e) => e.type === filter.type);
  }
  if (filter?.since) {
    result = result.filter((e) => e.createdAt >= filter.since!);
  }
  if (filter?.limit) {
    result = result.slice(-filter.limit);
  }
  return result;
}
