import type { CompanyProjectState } from './types';
import { companyEventBus } from './company-event-bus';

export class CompanyStateMachine {
  private static projectStates: Map<string, CompanyProjectState> = new Map();
  private static previousStates: Map<string, CompanyProjectState> = new Map();

  private static validTransitions: Record<CompanyProjectState, CompanyProjectState[]> = {
    CREATED: ['DISCOVERY', 'PAUSED', 'FAILED'],
    DISCOVERY: ['CLARIFICATION', 'PRODUCT_APPROVAL', 'ARCHITECTURE', 'PAUSED', 'FAILED'],
    CLARIFICATION: ['PRODUCT_APPROVAL', 'ARCHITECTURE', 'DISCOVERY', 'PAUSED', 'FAILED'],
    PRODUCT_APPROVAL: ['ARCHITECTURE', 'CLARIFICATION', 'DISCOVERY', 'PAUSED', 'FAILED'],
    ARCHITECTURE: ['PLANNING', 'EXECUTION', 'PRODUCT_APPROVAL', 'PAUSED', 'FAILED'],
    PLANNING: ['EXECUTION', 'ARCHITECTURE', 'PAUSED', 'FAILED'],
    EXECUTION: ['REVIEW', 'DEPLOYMENT', 'ARCHITECTURE', 'PLANNING', 'PAUSED', 'FAILED'],
    REVIEW: ['DEPLOYMENT', 'COMPLETED', 'EXECUTION', 'ARCHITECTURE', 'PAUSED', 'FAILED'],
    DEPLOYMENT: ['COMPLETED', 'REVIEW', 'EXECUTION', 'PAUSED', 'FAILED'],
    COMPLETED: [],
    FAILED: ['DISCOVERY', 'CLARIFICATION', 'PRODUCT_APPROVAL', 'ARCHITECTURE', 'PLANNING', 'EXECUTION', 'REVIEW', 'DEPLOYMENT'],
    PAUSED: ['DISCOVERY', 'CLARIFICATION', 'PRODUCT_APPROVAL', 'ARCHITECTURE', 'PLANNING', 'EXECUTION', 'REVIEW', 'DEPLOYMENT'],
  };

  public static initProject(projectId: string, initialState: CompanyProjectState = 'CREATED'): CompanyProjectState {
    this.projectStates.set(projectId, initialState);
    return initialState;
  }

  public static getState(projectId: string): CompanyProjectState {
    return this.projectStates.get(projectId) || 'CREATED';
  }

  public static getPreviousState(projectId: string): CompanyProjectState {
    return this.previousStates.get(projectId) || 'DISCOVERY';
  }

  public static canTransition(from: CompanyProjectState, to: CompanyProjectState): boolean {
    if (from === to) return true;
    const allowed = this.validTransitions[from];
    return allowed ? allowed.includes(to) : false;
  }

  public static async transition(
    projectId: string,
    toState: CompanyProjectState,
    reason?: string
  ): Promise<CompanyProjectState> {
    const currentState = this.getState(projectId);
    if (currentState === toState) {
      return currentState;
    }

    if (!this.canTransition(currentState, toState)) {
      throw new Error(
        `Invalid company state transition for project ${projectId}: ${currentState} -> ${toState}. Reason: ${reason || 'Transition not permitted by state machine'}`
      );
    }

    if (toState === 'PAUSED' || toState === 'FAILED') {
      if (currentState !== 'PAUSED' && currentState !== 'FAILED') {
        this.previousStates.set(projectId, currentState);
      }
    } else if (currentState !== 'PAUSED' && currentState !== 'FAILED') {
      this.previousStates.set(projectId, currentState);
    }

    this.projectStates.set(projectId, toState);

    if (toState === 'PAUSED') {
      await companyEventBus.publish('EXECUTION_PAUSED', projectId, { from: currentState, reason }, 'CompanyStateMachine');
    } else if (currentState === 'PAUSED') {
      await companyEventBus.publish('EXECUTION_RESUMED', projectId, { to: toState, reason }, 'CompanyStateMachine');
    }

    return toState;
  }

  public static forceState(projectId: string, state: CompanyProjectState): void {
    this.projectStates.set(projectId, state);
  }

  public static clearProject(projectId: string): void {
    this.projectStates.delete(projectId);
    this.previousStates.delete(projectId);
  }

  public static resetAll(): void {
    this.projectStates.clear();
    this.previousStates.clear();
  }
}
