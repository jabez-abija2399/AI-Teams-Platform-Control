import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type {
  ADRItem,
  DESItem,
  RequirementTraceItem,
  RequirementTraceabilityMatrix,
} from './types';

export class TraceabilityService {
  /**
   * Registers or updates a requirement traceability link.
   */
  public static async registerRequirement(data: {
    projectId: string;
    requirementId: string;
    title: string;
    ceoSpecVersion?: number;
    architectAdrId?: string;
    designerDesId?: string;
    sourceFiles?: string[];
    testCases?: string[];
    verificationStatus?: 'UNVERIFIED' | 'VERIFIED' | 'FAILED';
  }): Promise<ApiResult<RequirementTraceItem>> {
    try {
      const existing = await prisma.requirementTraceabilityRecord.findFirst({
        where: { projectId: data.projectId, requirementId: data.requirementId },
      });

      let record;
      if (existing) {
        record = await prisma.requirementTraceabilityRecord.update({
          where: { id: existing.id },
          data: {
            title: data.title,
            ceoSpecVersion: data.ceoSpecVersion ?? existing.ceoSpecVersion,
            architectAdrId: data.architectAdrId ?? existing.architectAdrId,
            designerDesId: data.designerDesId ?? existing.designerDesId,
            sourceFiles: (data.sourceFiles ?? existing.sourceFiles) as any,
            testCases: (data.testCases ?? existing.testCases) as any,
            verificationStatus: data.verificationStatus ?? existing.verificationStatus,
          },
        });
      } else {
        record = await prisma.requirementTraceabilityRecord.create({
          data: {
            projectId: data.projectId,
            requirementId: data.requirementId,
            title: data.title,
            ceoSpecVersion: data.ceoSpecVersion ?? 1,
            architectAdrId: data.architectAdrId,
            designerDesId: data.designerDesId,
            sourceFiles: (data.sourceFiles ?? []) as any,
            testCases: (data.testCases ?? []) as any,
            verificationStatus: data.verificationStatus ?? 'UNVERIFIED',
          },
        });
      }

      return {
        success: true,
        data: {
          id: record.id,
          projectId: record.projectId,
          requirementId: record.requirementId,
          title: record.title,
          ceoSpecVersion: record.ceoSpecVersion,
          architectAdrId: record.architectAdrId ?? undefined,
          designerDesId: record.designerDesId ?? undefined,
          sourceFiles: (record.sourceFiles as string[]) || [],
          testCases: (record.testCases as string[]) || [],
          verificationStatus: record.verificationStatus as any,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
      };
    } catch (err: any) {
      console.error('[TraceabilityService] registerRequirement error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to register requirement', code: 'TRACE_REGISTER_FAILED' },
      };
    }
  }

  /**
   * Records an Architecture Decision Record (ADR).
   */
  public static async recordADR(data: {
    projectId: string;
    title: string;
    decision: string;
    reason: string;
    alternatives?: string;
    status?: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  }): Promise<ApiResult<ADRItem>> {
    try {
      const count = await prisma.architectureDecisionRecord.count({
        where: { projectId: data.projectId },
      });
      const adrNum = `ADR-${String(count + 1).padStart(3, '0')}`;

      const record = await prisma.architectureDecisionRecord.create({
        data: {
          projectId: data.projectId,
          adrNumber: adrNum,
          title: data.title,
          ownerRole: 'ARCHITECT',
          decision: data.decision,
          reason: data.reason,
          alternatives: data.alternatives,
          status: data.status ?? 'APPROVED',
        },
      });

      return {
        success: true,
        data: {
          id: record.id,
          projectId: record.projectId,
          adrNumber: record.adrNumber,
          title: record.title,
          ownerRole: record.ownerRole,
          decision: record.decision,
          reason: record.reason,
          alternatives: record.alternatives ?? undefined,
          status: record.status as any,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
      };
    } catch (err: any) {
      console.error('[TraceabilityService] recordADR error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to record ADR', code: 'ADR_RECORD_FAILED' },
      };
    }
  }

  /**
   * Records a Design Decision Record (DES).
   */
  public static async recordDES(data: {
    projectId: string;
    title: string;
    decision: string;
    reason: string;
    alternatives?: string;
    status?: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  }): Promise<ApiResult<DESItem>> {
    try {
      const count = await prisma.designDecisionRecord.count({
        where: { projectId: data.projectId },
      });
      const desNum = `DES-${String(count + 1).padStart(3, '0')}`;

      const record = await prisma.designDecisionRecord.create({
        data: {
          projectId: data.projectId,
          desNumber: desNum,
          title: data.title,
          ownerRole: 'DESIGNER',
          decision: data.decision,
          reason: data.reason,
          alternatives: data.alternatives,
          status: data.status ?? 'APPROVED',
        },
      });

      return {
        success: true,
        data: {
          id: record.id,
          projectId: record.projectId,
          desNumber: record.desNumber,
          title: record.title,
          ownerRole: record.ownerRole,
          decision: record.decision,
          reason: record.reason,
          alternatives: record.alternatives ?? undefined,
          status: record.status as any,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
      };
    } catch (err: any) {
      console.error('[TraceabilityService] recordDES error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to record DES', code: 'DES_RECORD_FAILED' },
      };
    }
  }

  /**
   * Fetches the complete Requirement Traceability Matrix for a project.
   */
  public static async getMatrix(projectId: string): Promise<ApiResult<RequirementTraceabilityMatrix>> {
    try {
      const requirements = await prisma.requirementTraceabilityRecord.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      });

      const adrs = await prisma.architectureDecisionRecord.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      });

      const dess = await prisma.designDecisionRecord.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      });

      const formattedReqs: RequirementTraceItem[] = requirements.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        requirementId: r.requirementId,
        title: r.title,
        ceoSpecVersion: r.ceoSpecVersion,
        architectAdrId: r.architectAdrId ?? undefined,
        designerDesId: r.designerDesId ?? undefined,
        sourceFiles: (r.sourceFiles as string[]) || [],
        testCases: (r.testCases as string[]) || [],
        verificationStatus: r.verificationStatus as any,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));

      const formattedAdrs: ADRItem[] = adrs.map((a) => ({
        id: a.id,
        projectId: a.projectId,
        adrNumber: a.adrNumber,
        title: a.title,
        ownerRole: a.ownerRole,
        decision: a.decision,
        reason: a.reason,
        alternatives: a.alternatives ?? undefined,
        status: a.status as any,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }));

      const formattedDess: DESItem[] = dess.map((d) => ({
        id: d.id,
        projectId: d.projectId,
        desNumber: d.desNumber,
        title: d.title,
        ownerRole: d.ownerRole,
        decision: d.decision,
        reason: d.reason,
        alternatives: d.alternatives ?? undefined,
        status: d.status as any,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));

      const totalRequirements = formattedReqs.length;
      const verifiedCount = formattedReqs.filter((r) => r.verificationStatus === 'VERIFIED').length;
      const coveragePercentage = totalRequirements > 0 ? Math.round((verifiedCount / totalRequirements) * 100) : 0;

      return {
        success: true,
        data: {
          projectId,
          requirements: formattedReqs,
          adrs: formattedAdrs,
          dess: formattedDess,
          totalRequirements,
          verifiedCount,
          coveragePercentage,
        },
      };
    } catch (err: any) {
      console.error('[TraceabilityService] getMatrix error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to fetch traceability matrix', code: 'MATRIX_FETCH_FAILED' },
      };
    }
  }
}
