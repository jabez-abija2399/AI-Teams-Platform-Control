export interface TimelineEvent {
  id: string;
  timestamp: string;
  category: 'milestone' | 'decision' | 'memory_update' | 'approval';
  title: string;
  description: string;
  agentRole: string;
}

const inMemoryTimelines = new Map<string, TimelineEvent[]>();

export class MemoryTimelineService {
  /**
   * Records an event in the memory timeline
   */
  public static recordEvent(
    projectId: string,
    category: TimelineEvent['category'],
    title: string,
    description: string,
    agentRole: string
  ): TimelineEvent {
    const event: TimelineEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category,
      title,
      description,
      agentRole,
    };

    const list = inMemoryTimelines.get(projectId) || [];
    list.unshift(event);
    inMemoryTimelines.set(projectId, list);

    return event;
  }

  /**
   * Gets timeline events for a project
   */
  public static getTimeline(projectId: string): TimelineEvent[] {
    if (inMemoryTimelines.has(projectId)) {
      return inMemoryTimelines.get(projectId)!;
    }

    const defaultTimeline: TimelineEvent[] = [
      {
        id: 'evt_1',
        timestamp: '10:00 AM',
        category: 'milestone',
        title: 'Project Kickoff & Vision Discovery',
        description: 'CEO and Product Discovery Agent analyzed natural language user prompt.',
        agentRole: 'CEO',
      },
      {
        id: 'evt_2',
        timestamp: '10:04 AM',
        category: 'decision',
        title: 'Fullstack Next.js Architecture Confirmed',
        description: 'Software Architect AI selected Next.js 14 App Router with PostgreSQL DB.',
        agentRole: 'ARCHITECT',
      },
      {
        id: 'evt_3',
        timestamp: '10:06 AM',
        category: 'approval',
        title: 'System Architecture Proposal Approved',
        description: 'User approved architecture proposal with quality score 92%.',
        agentRole: 'USER',
      },
    ];

    inMemoryTimelines.set(projectId, defaultTimeline);
    return defaultTimeline;
  }
}
