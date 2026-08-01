import { getArtifactManager } from '@/ai/agents/artifacts/artifact.manager';
import type { ExecutionArtifactEntity } from './types';
import type { AgentRole } from '@/ai/agents/core/agent.types';

const artifactStore = new Map<string, ExecutionArtifactEntity>();

export class ArtifactManagementSystem {
  private baseManager = getArtifactManager();

  async storeArtifact(params: {
    id?: string;
    ownerAgent: AgentRole;
    projectId: string;
    type: string;
    title: string;
    content: unknown;
    status?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  }): Promise<ExecutionArtifactEntity> {
    const id = params.id ?? `art_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    // Check for previous version in store
    const existingForType = Array.from(artifactStore.values())
      .filter((a) => a.projectId === params.projectId && a.type === params.type)
      .sort((a, b) => b.version - a.version);

    const nextVersion = existingForType.length > 0 ? (existingForType[0]?.version ?? 0) + 1 : 1;

    const entity: ExecutionArtifactEntity = {
      id,
      ownerAgent: params.ownerAgent,
      projectId: params.projectId,
      type: params.type,
      title: params.title,
      content: params.content,
      version: nextVersion,
      createdDate: now,
      status: params.status ?? 'APPROVED',
    };

    artifactStore.set(id, entity);

    try {
      await this.baseManager.createArtifact({
        projectId: params.projectId,
        title: params.title,
        type: params.type,
        owner: params.ownerAgent,
        content: params.content,
        status: params.status ?? 'APPROVED',
      });
    } catch {
      // Fallback when DB/Prisma is disconnected in unit tests
    }

    return entity;
  }

  async getArtifact(id: string): Promise<ExecutionArtifactEntity | undefined> {
    return artifactStore.get(id);
  }

  async getLatestProjectArtifact(projectId: string, type: string): Promise<ExecutionArtifactEntity | undefined> {
    const matching = Array.from(artifactStore.values())
      .filter((a) => a.projectId === projectId && a.type === type)
      .sort((a, b) => b.version - a.version);

    if (matching.length > 0) return matching[0];

    try {
      const dbArt = await this.baseManager.getLatestArtifact(projectId, type);
      if (!dbArt) return undefined;

      const entity: ExecutionArtifactEntity = {
        id: dbArt.id,
        ownerAgent: (dbArt.owner as AgentRole) ?? 'DEVELOPER',
        projectId: dbArt.projectId,
        type: dbArt.type,
        title: dbArt.title,
        content: dbArt.content,
        version: dbArt.version,
        createdDate: dbArt.createdAt,
        status: (dbArt.status as 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED') ?? 'APPROVED',
      };
      artifactStore.set(entity.id, entity);
      return entity;
    } catch {
      return undefined;
    }
  }

  async listProjectArtifacts(projectId: string): Promise<ExecutionArtifactEntity[]> {
    const inMem = Array.from(artifactStore.values()).filter((a) => a.projectId === projectId);
    if (inMem.length > 0) return inMem;

    try {
      const dbArts = await this.baseManager.listProjectArtifacts(projectId);
      return dbArts.map((dbArt) => {
        const entity: ExecutionArtifactEntity = {
          id: dbArt.id,
          ownerAgent: (dbArt.owner as AgentRole) ?? 'DEVELOPER',
          projectId: dbArt.projectId,
          type: dbArt.type,
          title: dbArt.title,
          content: dbArt.content,
          version: dbArt.version,
          createdDate: dbArt.createdAt,
          status: (dbArt.status as 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED') ?? 'APPROVED',
        };
        artifactStore.set(entity.id, entity);
        return entity;
      });
    } catch {
      return [];
    }
  }

  async clearProjectArtifacts(projectId: string): Promise<void> {
    for (const [id, art] of artifactStore.entries()) {
      if (art.projectId === projectId) {
        artifactStore.delete(id);
      }
    }
  }
}

let instance: ArtifactManagementSystem | null = null;
export function getArtifactManagementSystem(): ArtifactManagementSystem {
  if (!instance) {
    instance = new ArtifactManagementSystem();
  }
  return instance;
}
