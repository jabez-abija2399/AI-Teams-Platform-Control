import type { ExecutionState, ProjectLifecycleState, ExecutionHealth, CompanyEvent, ExecutionError } from './integration.types';
import { companyEventBus } from './event-bus';

export class ExecutionStateService {
  private static states: Map<string, ExecutionState> = new Map();

  private static eventSubscribed = false;

  private static ensureEventSubscription(): void {
    if (!this.eventSubscribed) {
      companyEventBus.subscribe('*', (evt) => {
        if (evt.projectId && this.states.has(evt.projectId)) {
          this.recordEvent(evt.projectId, evt);
        }
      });
      this.eventSubscribed = true;
    }
  }

  public static initState(projectId: string, initialPhase: ProjectLifecycleState = 'CREATED'): ExecutionState {
    this.ensureEventSubscription();
    const state: ExecutionState = {
      projectId,
      currentPhase: initialPhase,
      activeAgents: [],
      queuedTasks: [],
      completedTasks: [],
      blockedTasks: [],
      executionHealth: 'HEALTHY',
      updatedAt: Date.now(),
    };
    this.states.set(projectId, state);
    return state;
  }

  public static getState(projectId: string): ExecutionState {
    this.ensureEventSubscription();
    let state = this.states.get(projectId);
    if (!state) {
      state = this.initState(projectId);
    }
    return state;
  }

  public static updatePhase(projectId: string, phase: ProjectLifecycleState): ExecutionState {
    const state = this.getState(projectId);
    if (phase === 'PAUSED' && state.currentPhase !== 'PAUSED') {
      state.previousPhase = state.currentPhase;
    }
    state.currentPhase = phase;
    state.updatedAt = Date.now();
    this.states.set(projectId, state);
    return state;
  }

  public static updateHealth(projectId: string, health: ExecutionHealth, error?: ExecutionError): ExecutionState {
    const state = this.getState(projectId);
    state.executionHealth = health;
    if (error) {
      state.error = error;
    } else if (health === 'HEALTHY') {
      delete state.error;
    }
    state.updatedAt = Date.now();
    this.states.set(projectId, state);
    return state;
  }

  public static setMilestoneAndTask(projectId: string, milestone?: string, task?: string): ExecutionState {
    const state = this.getState(projectId);
    state.currentMilestone = milestone;
    state.currentTask = task;
    state.updatedAt = Date.now();
    this.states.set(projectId, state);
    return state;
  }

  public static addActiveAgent(projectId: string, agentRole: string): ExecutionState {
    const state = this.getState(projectId);
    if (!state.activeAgents.includes(agentRole)) {
      state.activeAgents.push(agentRole);
    }
    state.updatedAt = Date.now();
    this.states.set(projectId, state);
    return state;
  }

  public static removeActiveAgent(projectId: string, agentRole: string): ExecutionState {
    const state = this.getState(projectId);
    state.activeAgents = state.activeAgents.filter((r) => r !== agentRole);
    state.updatedAt = Date.now();
    this.states.set(projectId, state);
    return state;
  }

  public static queueTask(projectId: string, taskId: string): ExecutionState {
    const state = this.getState(projectId);
    if (!state.queuedTasks.includes(taskId)) {
      state.queuedTasks.push(taskId);
    }
    state.updatedAt = Date.now();
    this.states.set(projectId, state);
    return state;
  }

  public static startTask(projectId: string, taskId: string, agentRole?: string): ExecutionState {
    const state = this.getState(projectId);
    state.queuedTasks = state.queuedTasks.filter((id) => id !== taskId);
    state.currentTask = taskId;
    if (agentRole && !state.activeAgents.includes(agentRole)) {
      state.activeAgents.push(agentRole);
    }
    state.updatedAt = Date.now();
    this.states.set(projectId, state);
    return state;
  }

  public static completeTask(projectId: string, taskId: string, agentRole?: string): ExecutionState {
    const state = this.getState(projectId);
    state.queuedTasks = state.queuedTasks.filter((id) => id !== taskId);
    if (!state.completedTasks.includes(taskId)) {
      state.completedTasks.push(taskId);
    }
    if (state.currentTask === taskId) {
      state.currentTask = undefined;
    }
    if (agentRole) {
      state.activeAgents = state.activeAgents.filter((r) => r !== agentRole);
    }
    state.updatedAt = Date.now();
    this.states.set(projectId, state);
    return state;
  }

  public static blockTask(projectId: string, taskId: string, reason?: string): ExecutionState {
    const state = this.getState(projectId);
    state.queuedTasks = state.queuedTasks.filter((id) => id !== taskId);
    if (!state.blockedTasks.includes(taskId)) {
      state.blockedTasks.push(taskId);
    }
    state.executionHealth = 'DEGRADED';
    if (reason) {
      state.error = {
        message: reason,
        code: 'TASK_BLOCKED',
        timestamp: Date.now(),
        recoverable: true,
      };
    }
    state.updatedAt = Date.now();
    this.states.set(projectId, state);
    return state;
  }

  public static recordEvent(projectId: string, event: CompanyEvent): ExecutionState {
    const state = this.getState(projectId);
    state.lastEvent = event;
    state.updatedAt = Date.now();
    this.states.set(projectId, state);
    return state;
  }

  public static getMissionControlData(projectId: string) {
    const state = this.getState(projectId);
    const history = companyEventBus.getHistory(projectId, undefined, 20);
    return {
      ...state,
      recentEvents: history,
      isPaused: state.executionHealth === 'PAUSED' || state.currentPhase === 'PAUSED',
    };
  }

  public static clearState(projectId: string): void {
    this.states.delete(projectId);
  }

  public static resetAll(): void {
    this.states.clear();
  }
}
