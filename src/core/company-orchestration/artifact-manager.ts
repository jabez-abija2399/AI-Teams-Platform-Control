import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';

export interface ArtifactData {
  type: string;
  id?: string;
  content: unknown;
  producerRole: string;
  consumerRoles?: string[];
  summary?: string;
  metadata?: Record<string, unknown>;
}

export class ArtifactManager {
  /**
   * Stores an artifact produced by an agent in the centralized ArtifactLifecycleRecord table.
   * Also ensures it is recorded as a Document for workspace visibility if applicable.
   */
  public static async storeArtifact(
    projectId: string,
    data: ArtifactData,
  ): Promise<ApiResult<{ id: string; version: number }>> {
    try {
      if (!data.content) {
        return {
          success: false,
          error: { message: `Cannot store empty artifact of type ${data.type}`, code: 'INVALID_ARTIFACT' },
        };
      }

      // Check for existing versions to increment
      const existingCount = await prisma.artifactLifecycleRecord.count({
        where: { projectId, artifactType: data.type },
      });
      const version = existingCount + 1;

      // Save document representation if no explicit ID provided
      let artifactId = data.id;
      if (!artifactId) {
        const doc = await prisma.document.create({
          data: {
            projectId,
            type: data.type,
            title: `${data.type} (v${version})`,
            content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content, null, 2),
            author: data.producerRole,
          },
        });
        artifactId = doc.id;
      }

      const record = await prisma.artifactLifecycleRecord.create({
        data: {
          projectId,
          artifactType: data.type,
          artifactId: artifactId,
          producerRole: data.producerRole,
          consumerRoles: (data.consumerRoles ?? []) as any,
          status: 'VALIDATED',
          version,
          contentSummary: data.summary ?? `Generated ${data.type} v${version} by ${data.producerRole}`,
          metadata: (data.metadata ?? { content: data.content }) as any,
        },
      });

      return {
        success: true,
        data: { id: record.id, version: record.version },
      };
    } catch (err: any) {
      console.error('[ArtifactManager] storeArtifact error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to store artifact', code: 'ARTIFACT_STORE_FAILED' },
      };
    }
  }

  /**
   * Retrieves the latest validated artifact of a specific type for consumption by the next agent.
   */
  public static async getLatestArtifact(
    projectId: string,
    artifactType: string,
    consumerRole?: string,
  ): Promise<ApiResult<any>> {
    try {
      const record = await prisma.artifactLifecycleRecord.findFirst({
        where: { projectId, artifactType, status: 'VALIDATED' },
        orderBy: { version: 'desc' },
      });

      if (!record) {
        // Try fallback to Document table for backwards compatibility
        const doc = await prisma.document.findFirst({
          where: { projectId, type: artifactType },
          orderBy: { createdAt: 'desc' },
        });
        if (!doc) {
          return {
            success: false,
            error: { message: `No valid artifact found for type: ${artifactType}`, code: 'ARTIFACT_NOT_FOUND' },
          };
        }
        let parsed: any = doc.content;
        try {
          parsed = JSON.parse(doc.content);
        } catch {
          // keep string
        }
        return { success: true, data: parsed };
      }

      if (consumerRole) {
        // Record consumption in consumerRoles array
        const currentConsumers = Array.isArray(record.consumerRoles) ? (record.consumerRoles as string[]) : [];
        if (!currentConsumers.includes(consumerRole)) {
          await prisma.artifactLifecycleRecord.update({
            where: { id: record.id },
            data: {
              consumerRoles: [...currentConsumers, consumerRole] as any,
              status: 'CONSUMED',
            },
          }).catch(() => {});
        }
      }

      const meta = record.metadata as Record<string, any> | null;
      if (meta && meta.content !== undefined) {
        return { success: true, data: meta.content };
      }

      // Load from Document table by artifactId
      if (record.artifactId) {
        const doc = await prisma.document.findUnique({ where: { id: record.artifactId } });
        if (doc) {
          let parsed: any = doc.content;
          try {
            parsed = JSON.parse(doc.content);
          } catch {}
          return { success: true, data: parsed };
        }
      }

      return {
        success: false,
        error: { message: `Artifact metadata missing content for ${artifactType}`, code: 'ARTIFACT_CONTENT_MISSING' },
      };
    } catch (err: any) {
      console.error('[ArtifactManager] getLatestArtifact error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to retrieve artifact', code: 'ARTIFACT_GET_FAILED' },
      };
    }
  }

  /**
   * Retrieves the full timeline and lineage of all artifacts produced in a project.
   */
  public static async getArtifactTimeline(projectId: string): Promise<ApiResult<any[]>> {
    try {
      const records = await prisma.artifactLifecycleRecord.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      });
      return { success: true, data: records };
    } catch (err: any) {
      return { success: false, error: { message: err?.message || 'Failed to get timeline', code: 'TIMELINE_FAILED' } };
    }
  }
}
