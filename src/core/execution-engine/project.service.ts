import { prisma } from '@/lib/prisma';
import { withDb } from './db.probe';
import type { ProjectEntity, ProjectExecutionStatus } from './types';
import type { AgentRole } from '@/packages/agents/core/agent.types';

const projectStore = new Map<string, ProjectEntity>();

export class ProjectExecutionService {
  async createProject(params: {
    id?: string;
    owner: string;
    name: string;
    description: string;
    workflowId?: string;
    assignedAgents?: AgentRole[];
  }): Promise<ProjectEntity> {
    const id = params.id ?? `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();
    const workflowId = params.workflowId ?? 'SIMPLE_WEBSITE';
    const assignedAgents = params.assignedAgents ?? ['CEO', 'FRONTEND', 'QA'];

    const entity: ProjectEntity = {
      id,
      owner: params.owner,
      name: params.name,
      description: params.description,
      status: 'CREATED',
      currentWorkflow: workflowId,
      assignedAgents,
      createdAt: now,
      updatedAt: now,
    };

    projectStore.set(id, entity);

    await withDb(() =>
      prisma.project.create({
        data: {
          id,
          name: params.name,
          description: params.description,
          status: 'PLANNING',
          ownerId: params.owner,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );

    return entity;
  }

  async getProject(projectId: string): Promise<ProjectEntity | undefined> {
    const inMem = projectStore.get(projectId);
    if (inMem) return inMem;

    const dbProj = await withDb(() =>
      prisma.project.findUnique({ where: { id: projectId } }),
    );

    if (!dbProj) return undefined;

    const statusMap: Record<string, ProjectExecutionStatus> = {
      PLANNING: 'PLANNING',
      IN_PROGRESS: 'DEVELOPMENT',
      REVIEW: 'REVIEW',
      COMPLETED: 'COMPLETED',
      ARCHIVED: 'ARCHIVED',
    };

    const entity: ProjectEntity = {
      id: dbProj.id,
      owner: dbProj.ownerId,
      name: dbProj.name,
      description: dbProj.description ?? '',
      status: statusMap[dbProj.status] ?? 'CREATED',
      currentWorkflow: 'SIMPLE_WEBSITE',
      assignedAgents: ['CEO', 'FRONTEND', 'QA'],
      createdAt: dbProj.createdAt,
      updatedAt: dbProj.updatedAt,
    };

    projectStore.set(entity.id, entity);
    return entity;
  }

  async updateProjectStatus(
    projectId: string,
    status: ProjectExecutionStatus,
  ): Promise<ProjectEntity | undefined> {
    const entity = await this.getProject(projectId);
    if (!entity) return undefined;

    entity.status = status;
    entity.updatedAt = new Date();
    projectStore.set(projectId, entity);

    const dbStatusMap: Record<ProjectExecutionStatus, 'PLANNING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED'> = {
      CREATED: 'PLANNING',
      PLANNING: 'PLANNING',
      ARCHITECTURE: 'IN_PROGRESS',
      DEVELOPMENT: 'IN_PROGRESS',
      TESTING: 'IN_PROGRESS',
      REVIEW: 'REVIEW',
      APPROVAL_REQUIRED: 'REVIEW',
      WAITING_FOR_APPROVAL: 'PLANNING',
      WAITING_FOR_ARCHITECTURE_APPROVAL: 'PLANNING',
      ARCHITECTURE_APPROVED: 'IN_PROGRESS',
      ARCHITECTURE_REJECTED: 'REVIEW',
      DEPLOYMENT: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      FAILED: 'REVIEW',
      IN_PROGRESS: 'IN_PROGRESS',
      ARCHIVED: 'ARCHIVED',
    };

    await withDb(() =>
      prisma.project.update({
        where: { id: projectId },
        data: {
          status: dbStatusMap[status] ?? 'IN_PROGRESS',
          updatedAt: entity.updatedAt,
        },
      }),
    );

    return entity;
  }

  async updateAssignedAgents(projectId: string, agents: AgentRole[]): Promise<ProjectEntity | undefined> {
    const entity = await this.getProject(projectId);
    if (!entity) return undefined;

    entity.assignedAgents = agents;
    entity.updatedAt = new Date();
    projectStore.set(projectId, entity);
    return entity;
  }

  async listProjects(ownerId?: string): Promise<ProjectEntity[]> {
    return Array.from(projectStore.values()).filter(
      (p) => !ownerId || p.owner === ownerId,
    );
  }
}

let instance: ProjectExecutionService | null = null;
export function getProjectExecutionService(): ProjectExecutionService {
  if (!instance) {
    instance = new ProjectExecutionService();
  }
  return instance;
}
