import type {
  WorkspaceState,
  MissionTimelineItem,
  AIEmployee,
  ProjectPhaseState,
} from './types';
import { ActivityService } from './activity.service';
import { PIPELINE_PHASE_DEFINITIONS, type ProjectLifecycleState } from '@/core/company-orchestration/types';

const workspaceStore = new Map<string, WorkspaceState>();

const PIPELINE_PHASE_TO_TIMELINE: Record<string, { id: string; title: string; description: string; agents: string[] }> = {
  DISCOVERY_RUNNING: { id: 'phase_discovery', title: 'Product Discovery', description: 'Analyzing user idea and defining product scope', agents: ['PRODUCT_DISCOVERY'] },
  CLARIFICATION_RUNNING: { id: 'phase_clarification', title: 'Clarify Requirements', description: 'Guided clarification questions for target audience and features', agents: ['PRODUCT_DISCOVERY'] },
  PROPOSAL_RUNNING: { id: 'phase_proposal', title: 'Product Proposal', description: 'Synthesizing specification into formal Product Proposal', agents: ['CEO', 'PRODUCT_MANAGER'] },
  STRATEGY_RUNNING: { id: 'phase_strategy', title: 'Executive Strategy', description: 'CEO analyzing business strategy and competitive positioning', agents: ['CEO'] },
  PRODUCT_RUNNING: { id: 'phase_product', title: 'Product Management', description: 'Refining requirements and creating PRD', agents: ['PRODUCT_MANAGER'] },
  ANALYSIS_RUNNING: { id: 'phase_analysis', title: 'Business Analysis', description: 'Generating software requirement specification', agents: ['BUSINESS_ANALYST'] },
  DESIGN_RUNNING: { id: 'phase_design', title: 'UX/UI Design', description: 'Creating UI design specification and wireframes', agents: ['UI_UX'] },
  ARCHITECTURE_RUNNING: { id: 'phase_architecture', title: 'System Architecture', description: 'Designing system architecture and technology stack', agents: ['ARCHITECT'] },
  PLANNING_RUNNING: { id: 'phase_planning', title: 'Project Planning', description: 'Creating project plan with task breakdown and scheduling', agents: ['OPERATIONS'] },
  DEVELOPMENT_RUNNING: { id: 'phase_development', title: 'Software Engineering', description: 'Implementing architecture and building features', agents: ['DEVELOPER'] },
  TESTING_RUNNING: { id: 'phase_testing', title: 'Quality Assurance', description: 'Running tests and code quality reviews', agents: ['QA'] },
  REVIEW_RUNNING: { id: 'phase_review', title: 'Review Committee', description: 'Cross-functional codebase review and scoring', agents: ['REVIEWER'] },
  SECURITY_RUNNING: { id: 'phase_security', title: 'Security Engineering', description: 'Security audit and vulnerability assessment', agents: ['SECURITY'] },
  DEPLOYMENT_RUNNING: { id: 'phase_deployment', title: 'DevOps & Deployment', description: 'Infrastructure provisioning and deployment', agents: ['DEVOPS'] },
  MONITORING: { id: 'phase_monitoring', title: 'Operations & Monitoring', description: 'Setting up telemetry, alerts, and health monitoring', agents: ['OPERATIONS'] },
};

const ROLE_TO_EMPLOYEE: Record<string, { id: string; name: string; avatar: string }> = {
  PRODUCT_DISCOVERY: { id: 'emp_pd', name: 'Product Discovery AI', avatar: '🔍' },
  CEO: { id: 'emp_ceo', name: 'Chief Executive AI', avatar: '💼' },
  PRODUCT_MANAGER: { id: 'emp_pm', name: 'Product Manager AI', avatar: '📊' },
  BUSINESS_ANALYST: { id: 'emp_ba', name: 'Business Analyst AI', avatar: '📋' },
  UI_UX: { id: 'emp_ui', name: 'UX/UI Designer AI', avatar: '🎨' },
  ARCHITECT: { id: 'emp_arch', name: 'Principal Architect AI', avatar: '🏛️' },
  OPERATIONS: { id: 'emp_ops', name: 'Operations AI', avatar: '⚙️' },
  DEVELOPER: { id: 'emp_dev', name: 'Lead Developer AI', avatar: '⚡' },
  QA: { id: 'emp_qa', name: 'QA Specialist AI', avatar: '🛡️' },
  REVIEWER: { id: 'emp_rev', name: 'Review Committee AI', avatar: '📝' },
  SECURITY: { id: 'emp_sec', name: 'Security Engineer AI', avatar: '🔒' },
  DEVOPS: { id: 'emp_dops', name: 'DevOps Engineer AI', avatar: '🚀' },
};

function mapLifecycleToPhaseState(lifecycle: ProjectLifecycleState): ProjectPhaseState {
  const mapping: Record<string, ProjectPhaseState> = {
    CREATED: 'Discovery',
    DISCOVERY_RUNNING: 'Discovery',
    CLARIFICATION_RUNNING: 'Discovery',
    PROPOSAL_RUNNING: 'Approval',
    STRATEGY_RUNNING: 'Planning',
    PRODUCT_RUNNING: 'Planning',
    ANALYSIS_RUNNING: 'Planning',
    DESIGN_RUNNING: 'Architecture',
    ARCHITECTURE_RUNNING: 'Architecture',
    PLANNING_RUNNING: 'Planning',
    DEVELOPMENT_RUNNING: 'Development',
    TESTING_RUNNING: 'Testing',
    REVIEW_RUNNING: 'Testing',
    SECURITY_RUNNING: 'Testing',
    DEPLOYMENT_RUNNING: 'Deployment',
    MONITORING: 'Deployment',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    PAUSED: 'Paused',
  };
  return mapping[lifecycle] || 'Planning';
}

export class WorkspaceService {
  /**
   * Initializes or fetches the Mission Control Workspace state for a project
   */
  public static getWorkspaceState(projectId: string, projectName = 'AI Platform App'): WorkspaceState {
    if (workspaceStore.has(projectId)) {
      return workspaceStore.get(projectId)!;
    }

    const timeline: MissionTimelineItem[] = Object.entries(PIPELINE_PHASE_TO_TIMELINE).map(([phase, def]) => ({
      id: def.id,
      title: def.title,
      description: def.description,
      status: 'pending' as const,
      assignedAgents: def.agents,
      dependencies: [],
      history: [] as string[],
    }));

    const defaultEmployees: AIEmployee[] = Object.entries(ROLE_TO_EMPLOYEE).map(([role, info]) => ({
      id: info.id,
      role,
      name: info.name,
      avatar: info.avatar,
      status: 'Idle' as const,
      currentTask: 'Waiting for assignment...',
      progress: 0,
      lastMessage: 'Standing by.',
      health: 'healthy' as const,
    }));

    const initialFeed = ActivityService.seedDefaultActivities(projectId, projectName);

    const initialState: WorkspaceState = {
      projectId,
      projectName,
      currentPhase: 'Discovery',
      overallProgress: 0,
      estimatedTimeRemaining: 'Calculating...',
      mode: 'creator',
      isPaused: false,
      timeline,
      employees: defaultEmployees,
      activityFeed: initialFeed,
    };

    workspaceStore.set(projectId, initialState);
    return initialState;
  }

  /**
   * Updates workspace state from a pipeline lifecycle phase transition
   */
  public static updateFromPipelinePhase(
    projectId: string,
    lifecyclePhase: ProjectLifecycleState,
    message?: string,
  ): WorkspaceState {
    const state = this.getWorkspaceState(projectId);
    const def = PIPELINE_PHASE_DEFINITIONS[lifecyclePhase];
    if (!def) return state;

    state.currentPhase = mapLifecycleToPhaseState(lifecyclePhase);
    state.overallProgress = def.progressPercentage;

    const phaseDef = PIPELINE_PHASE_TO_TIMELINE[lifecyclePhase];
    if (phaseDef) {
      state.timeline = state.timeline.map((item) => {
        if (item.id === phaseDef.id) {
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            ...item,
            status: 'in_progress' as const,
            startedAt: item.startedAt || now,
            history: [...item.history, message || `Started ${def.department}`],
          };
        }
        return item;
      });
    }

    state.employees = state.employees.map((emp) => {
      const def = PIPELINE_PHASE_DEFINITIONS[lifecyclePhase];
      if (def && emp.role === def.agentRole) {
        return {
          ...emp,
          status: 'Working' as const,
          currentTask: `Executing ${def.department}`,
          progress: def.progressPercentage,
          lastMessage: message || `Working on ${def.department}`,
          startedAt: emp.startedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return emp;
    });

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    state.activityFeed = [
      {
        id: `act_pipe_${Date.now()}`,
        timestamp: now,
        agentRole: def.agentRole,
        agentName: `${def.department} Agent`,
        message: message || `Pipeline advanced to ${def.department}`,
        category: 'update' as const,
        details: { phase: lifecyclePhase },
      },
      ...state.activityFeed,
    ].slice(0, 200);

    workspaceStore.set(projectId, state);
    return state;
  }

  /**
   * Marks a pipeline phase as completed in the timeline
   */
  public static completePipelinePhase(
    projectId: string,
    lifecyclePhase: ProjectLifecycleState,
    message?: string,
  ): WorkspaceState {
    const state = this.getWorkspaceState(projectId);
    const def = PIPELINE_PHASE_DEFINITIONS[lifecyclePhase];
    if (!def) return state;

    const phaseDef = PIPELINE_PHASE_TO_TIMELINE[lifecyclePhase];
    if (phaseDef) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      state.timeline = state.timeline.map((item) => {
        if (item.id === phaseDef.id) {
          return {
            ...item,
            status: 'completed' as const,
            completedAt: item.completedAt || now,
            duration: item.startedAt
              ? `${Math.max(1, Math.round((Date.now() / 1000) % 60))}s`
              : undefined,
            history: [...item.history, message || `Completed ${def.department}`],
          };
        }
        return item;
      });
    }

    state.employees = state.employees.map((emp) => {
      if (def && emp.role === def.agentRole) {
        return {
          ...emp,
          status: 'Completed' as const,
          currentTask: `${def.department} completed`,
          progress: 100,
          lastMessage: message || `${def.department} work finished`,
        };
      }
      return emp;
    });

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    state.activityFeed = [
      {
        id: `act_complete_${Date.now()}`,
        timestamp: now,
        agentRole: def.agentRole,
        agentName: `${def.department} Agent`,
        message: message || `${def.department} completed successfully`,
        category: 'milestone' as const,
        details: { phase: lifecyclePhase, artifact: def.outputArtifactType },
      },
      ...state.activityFeed,
    ].slice(0, 200);

    workspaceStore.set(projectId, state);
    return state;
  }

  /**
   * Marks a phase as waiting for approval
   */
  public static markApprovalRequired(
    projectId: string,
    approvalType: string,
    phase: ProjectLifecycleState,
  ): WorkspaceState {
    const state = this.getWorkspaceState(projectId);
    const def = PIPELINE_PHASE_DEFINITIONS[phase];

    state.currentPhase = 'Approval';
    state.employees = state.employees.map((emp) => {
      if (def && emp.role === def.agentRole) {
        return {
          ...emp,
          status: 'Waiting User' as const,
          currentTask: `Awaiting ${approvalType}`,
          lastMessage: `Waiting for human approval: ${approvalType}`,
        };
      }
      return emp;
    });

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    state.activityFeed = [
      {
        id: `act_approval_${Date.now()}`,
        timestamp: now,
        agentRole: 'SYSTEM',
        agentName: 'Approval Manager',
        message: `Waiting for human approval: ${approvalType}`,
        category: 'approval' as const,
        details: { approvalType, phase },
      },
      ...state.activityFeed,
    ].slice(0, 200);

    workspaceStore.set(projectId, state);
    return state;
  }

  /**
   * Marks the pipeline as completed
   */
  public static markPipelineCompleted(projectId: string): WorkspaceState {
    const state = this.getWorkspaceState(projectId);
    state.currentPhase = 'Completed';
    state.overallProgress = 100;
    state.estimatedTimeRemaining = 'Done';

    state.timeline = state.timeline.map((item) => ({
      ...item,
      status: item.status === 'in_progress' ? ('completed' as const) : item.status,
    }));

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    state.activityFeed = [
      {
        id: `act_completed_${Date.now()}`,
        timestamp: now,
        agentRole: 'SYSTEM',
        agentName: 'Company Pipeline',
        message: 'All departments completed successfully! Project delivered.',
        category: 'milestone' as const,
      },
      ...state.activityFeed,
    ].slice(0, 200);

    workspaceStore.set(projectId, state);
    return state;
  }

  /**
   * Marks the pipeline as failed
   */
  public static markPipelineFailed(projectId: string, error: string): WorkspaceState {
    const state = this.getWorkspaceState(projectId);
    state.currentPhase = 'Failed';

    state.timeline = state.timeline.map((item) => ({
      ...item,
      status: item.status === 'in_progress' ? ('failed' as const) : item.status,
    }));

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    state.activityFeed = [
      {
        id: `act_failed_${Date.now()}`,
        timestamp: now,
        agentRole: 'SYSTEM',
        agentName: 'Pipeline Monitor',
        message: `Pipeline failed: ${error}`,
        category: 'decision' as const,
        details: { error },
      },
      ...state.activityFeed,
    ].slice(0, 200);

    workspaceStore.set(projectId, state);
    return state;
  }

  /**
   * Toggles between Creator Mode and Developer Mode
   */
  public static toggleMode(projectId: string): 'creator' | 'developer' {
    const state = this.getWorkspaceState(projectId);
    state.mode = state.mode === 'creator' ? 'developer' : 'creator';
    workspaceStore.set(projectId, state);

    ActivityService.recordActivity(
      projectId,
      'SYSTEM',
      'Mission Control Workspace',
      `Switched mode to ${state.mode.toUpperCase()} Mode.`,
      'update'
    );

    return state.mode;
  }

  /**
   * Pauses or resumes project workspace execution
   */
  public static togglePause(projectId: string): boolean {
    const state = this.getWorkspaceState(projectId);
    state.isPaused = !state.isPaused;
    workspaceStore.set(projectId, state);

    ActivityService.recordActivity(
      projectId,
      'SYSTEM',
      'Mission Control Workspace',
      state.isPaused ? 'Workspace execution paused by user.' : 'Workspace execution resumed.',
      'update'
    );

    return state.isPaused;
  }

  /**
   * Updates an employee status in real-time
   */
  public static updateEmployeeStatus(
    projectId: string,
    role: string,
    status: AIEmployee['status'],
    task: string,
    progress: number,
    message?: string
  ): WorkspaceState {
    const state = this.getWorkspaceState(projectId);
    const emp = state.employees.find(
      (e) => e.role.toUpperCase().includes(role.toUpperCase()) || e.id.toLowerCase().includes(role.toLowerCase())
    );

    if (emp) {
      emp.status = status;
      emp.currentTask = task;
      emp.progress = progress;
      if (message) emp.lastMessage = message;

      if (message) {
        ActivityService.recordActivity(projectId, emp.role, emp.name, message, 'update');
      }
    }

    workspaceStore.set(projectId, state);
    return state;
  }
}
