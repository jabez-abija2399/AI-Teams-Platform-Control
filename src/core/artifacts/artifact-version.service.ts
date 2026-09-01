import { prisma } from '@/lib/prisma';
import { ArtifactManager, type ArtifactData } from '@/core/company-orchestration/artifact-manager';
import type { ApiResult } from '@/types/common.types';

export const DOMAIN_ARTIFACT_OWNERS: Record<string, string> = {
  PRODUCT_SPEC: 'CEO',
  ARCHITECTURE: 'ARCHITECT',
  DESIGN_SPEC: 'DESIGNER',
  IMPLEMENTATION: 'DEVELOPER',
};

export interface DomainArtifactVersion {
  id: string;
  projectId: string;
  artifactType: string;
  producerRole: string;
  version: number;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SUPERSEDED' | 'REJECTED' | 'VALIDATED';
  contentSummary: string;
  content: unknown;
  createdAt: Date;
}

export class ArtifactVersionService {
  /**
   * Validates that the producerRole owns the artifactType domain and creates a new versioned artifact.
   */
  public static async saveDomainArtifact(
    projectId: string,
    artifactType: 'PRODUCT_SPEC' | 'ARCHITECTURE' | 'DESIGN_SPEC' | 'IMPLEMENTATION' | string,
    producerRole: string,
    content: unknown,
    summary?: string,
  ): Promise<ApiResult<{ id: string; version: number }>> {
    try {
      const expectedOwner = DOMAIN_ARTIFACT_OWNERS[artifactType];
      if (expectedOwner && expectedOwner !== producerRole) {
        return {
          success: false,
          error: {
            message: `Role ${producerRole} cannot author ${artifactType}. Owner domain is ${expectedOwner}.`,
            code: 'UNAUTHORIZED_ARTIFACT_OWNERSHIP',
          },
        };
      }

      const artifactData: ArtifactData = {
        type: artifactType,
        content,
        producerRole,
        summary: summary || `Domain artifact ${artifactType} authored by ${producerRole}`,
      };

      return await ArtifactManager.storeArtifact(projectId, artifactData);
    } catch (err: any) {
      console.error('[ArtifactVersionService] saveDomainArtifact error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to save domain artifact', code: 'SAVE_ARTIFACT_FAILED' },
      };
    }
  }

  /**
   * Retrieves full version history of artifacts for a given type or all types.
   */
  public static async getVersionHistory(
    projectId: string,
    artifactType?: string,
  ): Promise<ApiResult<DomainArtifactVersion[]>> {
    try {
      const whereClause: any = { projectId };
      if (artifactType) whereClause.artifactType = artifactType;

      const records = await prisma.artifactLifecycleRecord.findMany({
        where: whereClause,
        orderBy: [{ artifactType: 'asc' }, { version: 'desc' }],
      });

      const versions: DomainArtifactVersion[] = records.map((r) => {
        const meta = (r.metadata as Record<string, any>) || {};
        return {
          id: r.id,
          projectId: r.projectId,
          artifactType: r.artifactType,
          producerRole: r.producerRole,
          version: r.version,
          status: r.status as any,
          contentSummary: r.contentSummary || '',
          content: meta.content !== undefined ? meta.content : null,
          createdAt: r.createdAt,
        };
      });

      return { success: true, data: versions };
    } catch (err: any) {
      console.error('[ArtifactVersionService] getVersionHistory error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to get artifact history', code: 'GET_HISTORY_FAILED' },
      };
    }
  }
}
