import type { ProjectLifecycleState } from './integration.types';
import { companyEventBus } from './event-bus';

import { VALID_TRANSITIONS, canTransition } from './integration.types';

export class LifecycleManager {

  public static validateTransition(from: ProjectLifecycleState, to: ProjectLifecycleState): void {
    if (!canTransition(from, to)) {
      throw new Error(`Invalid lifecycle transition from "${from}" to "${to}".`);
    }
  }

  public static async transition(
    projectId: string,
    from: ProjectLifecycleState,
    to: ProjectLifecycleState,
    reason?: string,
  ): Promise<ProjectLifecycleState> {
    this.validateTransition(from, to);

    // Publish event based on target state
    if (to === 'PAUSED') {
      await companyEventBus.publish('EXECUTION_PAUSED', projectId, { from, reason }, 'LifecycleManager');
    } else if (to === 'FAILED') {
      await companyEventBus.publish('EXECUTION_FAILED', projectId, { from, reason }, 'LifecycleManager');
    } else if (from === 'PAUSED') {
      await companyEventBus.publish('EXECUTION_RESUMED', projectId, { to, reason }, 'LifecycleManager');
    } else if (to === 'COMPLETED') {
      await companyEventBus.publish('PROJECT_COMPLETED', projectId, { from }, 'LifecycleManager');
    }

    return to;
  }

  public static getNextStage(current: ProjectLifecycleState): ProjectLifecycleState | null {
    switch (current) {
      case 'CREATED': return 'DISCOVERY';
      case 'DISCOVERY': return 'PLANNING';
      case 'PLANNING': return 'ARCHITECTURE';
      case 'ARCHITECTURE': return 'EXECUTION';
      case 'EXECUTION': return 'REVIEW';
      case 'REVIEW': return 'DEPLOYMENT_READY';
      case 'DEPLOYMENT_READY': return 'COMPLETED';
      default: return null;
    }
  }
}
