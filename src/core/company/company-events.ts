import type { CompanyEvent, CompanyEventType, CompanyProjectState } from './types';

export class CompanyEvents {
  public static createEvent<T = Record<string, any>>(
    type: CompanyEventType,
    projectId: string,
    payload: T = {} as T,
    source: string = 'CompanyOrchestrator'
  ): CompanyEvent<T> {
    return {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      projectId,
      timestamp: Date.now(),
      payload,
      source,
    };
  }

  public static getNextExpectedState(eventType: CompanyEventType): CompanyProjectState | undefined {
    switch (eventType) {
      case 'PROJECT_CREATED':
        return 'DISCOVERY';
      case 'DISCOVERY_COMPLETED':
        return 'CLARIFICATION';
      case 'CLARIFICATION_COMPLETED':
        return 'PRODUCT_APPROVAL';
      case 'PRODUCT_APPROVED':
        return 'ARCHITECTURE';
      case 'ARCHITECTURE_APPROVED':
        return 'PLANNING';
      case 'PLAN_READY':
        return 'EXECUTION';
      case 'TASK_COMPLETED':
        // Note: Execution completion -> REVIEW is determined by orchestrator when all tasks finish
        return undefined;
      case 'REVIEW_COMPLETED':
        return 'DEPLOYMENT';
      case 'DEPLOYMENT_COMPLETED':
        return 'COMPLETED';
      case 'TASK_FAILED':
        return 'FAILED';
      case 'EXECUTION_PAUSED':
        return 'PAUSED';
      default:
        return undefined;
    }
  }

  public static isLifecycleEvent(type: CompanyEventType): boolean {
    const lifecycleEvents: CompanyEventType[] = [
      'PROJECT_CREATED',
      'DISCOVERY_COMPLETED',
      'CLARIFICATION_COMPLETED',
      'PRODUCT_APPROVED',
      'ARCHITECTURE_APPROVED',
      'PLAN_READY',
      'REVIEW_COMPLETED',
      'DEPLOYMENT_COMPLETED',
      'PROJECT_FINISHED',
      'EXECUTION_PAUSED',
      'EXECUTION_RESUMED',
    ];
    return lifecycleEvents.includes(type);
  }
}
