import { prisma } from '@/lib/prisma';
import { ArtifactManager, type ArtifactData } from './artifact-manager';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { companyEventBus } from '@/core/integration/event-bus';
import { recordTimelineEvent } from '@/features/ai-workspace/services/timeline.service';
import type { ApiResult } from '@/types/common.types';
import type { ProjectLifecycleState } from './types';

export interface HandoffRequest {
  projectId: string;
  fromAgentRole: string;
  toAgentRole: string;
  fromPhase: ProjectLifecycleState;
  toPhase: ProjectLifecycleState;
  artifact: ArtifactData;
  notes?: string;
}

export class HandoffManager {
  /**
   * Executes an automatic handoff from a completing agent department to the next department in the pipeline.
   * 1. Validates & stores output artifact
   * 2. Updates organizational AI memory
   * 3. Records AgentHandoffRecord in database
   * 4. Notifies Mission Control via event bus and timeline
   */
  public static async executeHandoff(req: HandoffRequest): Promise<ApiResult<{ handoffId: string; artifactId: string }>> {
    try {
      // 1 & 2: Validate and store output artifact
      const storeRes = await ArtifactManager.storeArtifact(req.projectId, {
        ...req.artifact,
        producerRole: req.fromAgentRole,
        consumerRoles: [req.toAgentRole],
      });

      if (!storeRes.success) {
        return { success: false, error: storeRes.error };
      }

      const artifactId = storeRes.data.id;

      // 3: Record handoff in database
      const handoffRecord = await prisma.agentHandoffRecord.create({
        data: {
          projectId: req.projectId,
          fromAgentRole: req.fromAgentRole,
          toAgentRole: req.toAgentRole,
          artifactType: req.artifact.type,
          artifactId: artifactId,
          status: 'SUCCESS',
          notes: req.notes ?? `Handed off ${req.artifact.type} from ${req.fromAgentRole} to ${req.toAgentRole}`,
          metadata: {
            fromPhase: req.fromPhase,
            toPhase: req.toPhase,
            version: storeRes.data.version,
          } as any,
        },
      });

      // 4: Update company memory
      try {
        const memory = getMemoryManager();
        await memory.remember({
          agentId: req.fromAgentRole,
          content: `Project ${req.projectId}: Successfully produced artifact ${req.artifact.type} (v${storeRes.data.version}) during ${req.fromPhase} phase for consumption by ${req.toAgentRole}.`,
          type: 'PROJECT',
          metadata: { projectId: req.projectId, artifactId, handoffId: handoffRecord.id },
        });
      } catch (memErr) {
        console.warn('[HandoffManager] Memory update warning:', memErr);
      }

      // 5: Notify Mission Control
      await companyEventBus.publish(
        'HANDOFF_COMPLETED',
        req.projectId,
        {
          handoffId: handoffRecord.id,
          fromRole: req.fromAgentRole,
          toRole: req.toAgentRole,
          artifactType: req.artifact.type,
          artifactId,
        },
        'HandoffManager',
      );

      await recordTimelineEvent({
        type: 'workflow.handoff',
        message: `🤝 Handoff completed: ${req.fromAgentRole} delivered ${req.artifact.type} to ${req.toAgentRole}`,
        metadata: {
          projectId: req.projectId,
          fromRole: req.fromAgentRole,
          toRole: req.toAgentRole,
          artifactType: req.artifact.type,
          handoffId: handoffRecord.id,
        },
      });

      return {
        success: true,
        data: { handoffId: handoffRecord.id, artifactId },
      };
    } catch (err: any) {
      console.error('[HandoffManager] executeHandoff error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Handoff execution failed', code: 'HANDOFF_FAILED' },
      };
    }
  }

  /**
   * Retrieves all handoff records for a project.
   */
  public static async getHandoffHistory(projectId: string): Promise<ApiResult<any[]>> {
    try {
      const records = await prisma.agentHandoffRecord.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      });
      return { success: true, data: records };
    } catch (err: any) {
      return { success: false, error: { message: err?.message || 'Failed to fetch handoffs', code: 'HANDOFF_GET_FAILED' } };
    }
  }
}
