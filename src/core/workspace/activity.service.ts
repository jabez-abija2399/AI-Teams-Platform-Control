import type { ActivityFeedItem } from './types';

const projectActivities = new Map<string, ActivityFeedItem[]>();

export class ActivityService {
  /**
   * Records a new humanized company update event
   */
  public static recordActivity(
    projectId: string,
    agentRole: string,
    agentName: string,
    message: string,
    category: 'update' | 'decision' | 'milestone' | 'approval' = 'update',
    details?: Record<string, unknown>
  ): ActivityFeedItem {
    const item: ActivityFeedItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agentRole,
      agentName,
      message,
      category,
      details,
    };

    const existing = projectActivities.get(projectId) || [];
    existing.unshift(item); // Most recent first

    if (existing.length > 200) {
      existing.pop();
    }

    projectActivities.set(projectId, existing);
    return item;
  }

  /**
   * Retrieves activity feed for a project
   */
  public static getActivityFeed(projectId: string, limit = 50): ActivityFeedItem[] {
    const list = projectActivities.get(projectId) || [];
    return list.slice(0, limit);
  }

  /**
   * Generates default initial company activities for a new workspace
   */
  public static seedDefaultActivities(projectId: string, projectName: string): ActivityFeedItem[] {
    if (projectActivities.has(projectId)) {
      return projectActivities.get(projectId)!;
    }

    const initial: ActivityFeedItem[] = [
      {
        id: `act_init_1`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentRole: 'CEO',
        agentName: 'Chief Executive AI',
        message: `Initialized company workspace for project "${projectName}".`,
        category: 'milestone',
      },
      {
        id: `act_init_2`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentRole: 'PRODUCT_DISCOVERY',
        agentName: 'Product Discovery Agent',
        message: 'Understanding product vision and target user experience.',
        category: 'update',
      },
    ];

    projectActivities.set(projectId, initial);
    return initial;
  }
}
