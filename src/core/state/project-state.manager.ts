import { prisma } from '@/lib/prisma';
import type {
  ProjectState,
  ProjectLifecycleStatus,
  OrchestrationTask,
  ProjectCheckpoint,
  RequirementsState,
  ArchitectureState,
  DesignState,
  ImplementationState,
  QAState,
} from './project-state.types';

const inMemoryStates = new Map<string, ProjectState>();

export function createInitialProjectState(projectId: string, projectName: string, mission: string): ProjectState {
  const now = new Date().toISOString();
  return {
    projectId,
    projectName,
    mission,
    status: 'INITIALIZING',
    currentStage: 'INITIALIZING',
    version: 1,

    product: {
      problem: '',
      targetUsers: [],
      goals: [],
      nonGoals: [],
      assumptions: [],
      constraints: [],
      openQuestions: [],
    },

    requirements: {
      version: 1,
      productScope: {
        problem: '',
        targetUsers: [],
        goals: [],
        nonGoals: [],
        assumptions: [],
        constraints: [],
        openQuestions: [],
      },
      features: [],
      userStories: [],
      nonFunctionalRequirements: [],
      approvalStatus: 'PENDING',
    },

    architecture: {
      version: 1,
      systemOverview: '',
      targetStack: {},
      techDecisions: [],
      databaseSchema: { entities: [] },
      apiDesign: { endpoints: [] },
      fileStructure: [],
      technicalRisks: [],
      approvalStatus: 'PENDING',
    },

    design: {
      version: 1,
      designSystemName: 'Modern Glassmorphic Dark',
      designTokens: {
        colors: {},
        typography: {},
        spacing: {},
        radii: {},
      },
      userJourneys: [],
      components: [],
    },

    implementation: {
      version: 1,
      files: {},
      completedTodos: [],
      pendingTodos: [],
      fileCount: 0,
      lastChangedFiles: [],
    },

    qa: {
      version: 1,
      passed: false,
      overallScore: 0,
      evidence: {
        typeCheckPassed: false,
        lintPassed: false,
        buildPassed: false,
        testsPassed: false,
        testsRun: 0,
        testsFailed: 0,
        requirementCoveragePercentage: 0,
      },
      defects: [],
      recommendation: 'REWORK_IMPLEMENTATION',
    },

    tasks: [],
    decisions: [],
    checkpoints: [],
    budget: {
      maxTokensAllowed: 500_000,
      totalTokensUsed: 0,
      promptTokens: 0,
      completionTokens: 0,
      maxCostUsd: 10.0,
      totalCostUsd: 0,
      modelInvocations: 0,
    },

    createdAt: now,
    updatedAt: now,
  };
}

export class ProjectStateManager {
  /**
   * Retrieves the current project state, reconstructing from database records if not cached in memory.
   */
  public static async getState(projectId: string): Promise<ProjectState> {
    const cached = inMemoryStates.get(projectId);
    if (cached) return cached;

    try {
      const record = await prisma.companyMemoryRecord.findFirst({
        where: { projectId, key: 'project_state_v2' },
        orderBy: { version: 'desc' },
      });

      if (record?.value) {
        const parsed = (typeof record.value === 'string' ? JSON.parse(record.value) : record.value) as ProjectState;
        if (parsed && parsed.projectId === projectId) {
          inMemoryStates.set(projectId, parsed);
          return parsed;
        }
      }

      // Fallback: check project entity
      const proj = await prisma.project.findUnique({ where: { id: projectId } });
      const initial = createInitialProjectState(
        projectId,
        proj?.name || 'Project',
        proj?.description || 'Autonomous Software Engineering Mission'
      );
      inMemoryStates.set(projectId, initial);
      return initial;
    } catch {
      const fallback = createInitialProjectState(projectId, 'Project', 'Mission');
      inMemoryStates.set(projectId, fallback);
      return fallback;
    }
  }

  /**
   * Updates project state and persists to database.
   */
  public static async updateState(
    projectId: string,
    mutator: (state: ProjectState) => void
  ): Promise<ProjectState> {
    const current = await this.getState(projectId);
    mutator(current);
    current.version += 1;
    current.updatedAt = new Date().toISOString();

    inMemoryStates.set(projectId, current);

    // Asynchronous database persistence
    prisma.companyMemoryRecord.create({
      data: {
        projectId,
        key: 'project_state_v2',
        value: current as unknown as object,
        version: current.version,
      },
    }).catch(() => null);

    return current;
  }

  /**
   * Updates lifecycle status and records timeline checkpoint
   */
  public static async transitionStage(
    projectId: string,
    nextStage: ProjectLifecycleStatus,
    description?: string
  ): Promise<ProjectState> {
    return this.updateState(projectId, (state) => {
      state.currentStage = nextStage;
      state.status = nextStage;
      if (description) {
        this.createCheckpointInternal(state, nextStage, description);
      }
    });
  }

  /**
   * Creates a durable checkpoint for resumability.
   */
  public static async createCheckpoint(
    projectId: string,
    stage: ProjectLifecycleStatus,
    description: string
  ): Promise<ProjectCheckpoint> {
    let checkpoint!: ProjectCheckpoint;
    await this.updateState(projectId, (state) => {
      checkpoint = this.createCheckpointInternal(state, stage, description);
    });
    return checkpoint;
  }

  private static createCheckpointInternal(
    state: ProjectState,
    stage: ProjectLifecycleStatus,
    description: string
  ): ProjectCheckpoint {
    const num = state.checkpoints.length + 1;
    const cp: ProjectCheckpoint = {
      id: `chk_${state.projectId}_${num}_${Date.now()}`,
      checkpointNumber: num,
      stage,
      timestamp: new Date().toISOString(),
      stateSnapshotJson: JSON.stringify({
        status: state.status,
        currentStage: state.currentStage,
        version: state.version,
        fileCount: state.implementation.fileCount,
        todosCompleted: state.implementation.completedTodos.length,
      }),
      description,
    };
    state.checkpoints.push(cp);
    return cp;
  }

  /**
   * Restores a checkpoint if an unrecoverable failure occurs.
   */
  public static async restoreCheckpoint(
    projectId: string,
    checkpointId: string
  ): Promise<ProjectState | null> {
    const state = await this.getState(projectId);
    const cp = state.checkpoints.find((c) => c.id === checkpointId);
    if (!cp) return null;

    return this.updateState(projectId, (s) => {
      s.currentStage = cp.stage;
      s.status = cp.stage;
    });
  }

  /**
   * Records token and cost consumption into the budget tracker.
   */
  public static async recordUsage(
    projectId: string,
    promptTokens: number,
    completionTokens: number,
    costUsd: number
  ): Promise<void> {
    await this.updateState(projectId, (state) => {
      state.budget.promptTokens += promptTokens;
      state.budget.completionTokens += completionTokens;
      state.budget.totalTokensUsed += (promptTokens + completionTokens);
      state.budget.totalCostUsd += costUsd;
      state.budget.modelInvocations += 1;
    });
  }
}
