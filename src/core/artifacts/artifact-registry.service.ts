import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import type {
  ArtifactEnvelope,
  ArtifactMetadata,
  ArtifactType,
  ArtifactQualityScore,
  ArtifactValidationStatus,
} from './artifact.types';

const inMemoryArtifacts = new Map<string, ArtifactEnvelope<any>[]>();

export class ArtifactRegistryService {
  /**
   * Computes a SHA-256 integrity hash for the payload.
   */
  public static computeHash(payload: unknown): string {
    const json = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return createHash('sha256').update(json).digest('hex').substring(0, 16);
  }

  /**
   * Calculates an objective quality score from verification evidence.
   */
  public static calculateQualityScore(params: {
    completeness: number;
    consistency: number;
    requirementCoverage: number;
    correctness: number;
    technicalRisk: number;
    evidenceDetails?: string[];
  }): ArtifactQualityScore {
    const { completeness, consistency, requirementCoverage, correctness, technicalRisk, evidenceDetails } = params;
    
    // Weighted overall score:
    // Completeness: 25%, Consistency: 20%, Coverage: 25%, Correctness: 20%, Low Risk: 10%
    const overall = Math.round(
      completeness * 0.25 +
      consistency * 0.20 +
      requirementCoverage * 0.25 +
      correctness * 0.20 +
      (100 - technicalRisk) * 0.10
    );

    let verdict: ArtifactQualityScore['verdict'] = 'APPROVED';
    if (overall < 60 || correctness < 50 || requirementCoverage < 50) {
      verdict = 'REJECTED';
    } else if (overall < 80) {
      verdict = 'NEEDS_REVISION';
    }

    return {
      completeness,
      consistency,
      requirementCoverage,
      correctness,
      technicalRisk,
      overall,
      verdict,
      evidenceDetails: evidenceDetails || [],
    };
  }

  /**
   * Stores a new versioned artifact envelope with parent lineage.
   */
  public static async registerArtifact<T = unknown>(params: {
    projectId: string;
    type: ArtifactType;
    createdBy: ArtifactMetadata['createdBy'];
    payload: T;
    sourceArtifactIds?: string[];
    summary?: string;
    modelUsed?: string;
    agentVersion?: string;
    qualityScore?: Partial<ArtifactQualityScore>;
    validationStatus?: ArtifactValidationStatus;
  }): Promise<ArtifactEnvelope<T>> {
    return this.storeArtifact(params);
  }

  public static async storeArtifact<T = unknown>(params: {
    projectId: string;
    type: ArtifactType;
    createdBy: ArtifactMetadata['createdBy'];
    payload: T;
    sourceArtifactIds?: string[];
    summary?: string;
    modelUsed?: string;
    agentVersion?: string;
    qualityScore?: Partial<ArtifactQualityScore>;
    validationStatus?: ArtifactValidationStatus;
  }): Promise<ArtifactEnvelope<T>> {
    const {
      projectId,
      type,
      createdBy,
      payload,
      sourceArtifactIds = [],
      summary = `Artifact ${type}`,
      modelUsed,
      agentVersion = '2.0.0',
      validationStatus = 'UNVALIDATED',
    } = params;

    const existing = inMemoryArtifacts.get(projectId) || [];
    const typeArtifacts = existing.filter((a) => a.metadata.type === type);
    const version = typeArtifacts.length + 1;
    const artifactId = `art_${projectId}_${type.toLowerCase()}_v${version}_${Date.now()}`;
    const contentHash = this.computeHash(payload);

    const quality: ArtifactQualityScore = params.qualityScore
      ? {
          completeness: params.qualityScore.completeness ?? 90,
          consistency: params.qualityScore.consistency ?? 90,
          requirementCoverage: params.qualityScore.requirementCoverage ?? 90,
          correctness: params.qualityScore.correctness ?? 90,
          technicalRisk: params.qualityScore.technicalRisk ?? 10,
          overall: params.qualityScore.overall ?? 90,
          verdict: params.qualityScore.verdict ?? 'APPROVED',
          evidenceDetails: params.qualityScore.evidenceDetails ?? [],
        }
      : this.calculateQualityScore({
          completeness: 90,
          consistency: 90,
          requirementCoverage: 90,
          correctness: 90,
          technicalRisk: 10,
        });

    const envelope: ArtifactEnvelope<T> = {
      metadata: {
        artifactId,
        projectId,
        type,
        version,
        createdBy,
        agentVersion,
        modelUsed,
        createdAt: new Date().toISOString(),
        sourceArtifactIds,
        validationStatus,
        qualityScore: quality,
        contentHash,
        summary,
      },
      payload,
    };

    existing.unshift(envelope);
    inMemoryArtifacts.set(projectId, existing);

    // Persist to Prisma Document & Lifecycle records
    prisma.artifactLifecycleRecord.create({
      data: {
        projectId,
        artifactType: type,
        artifactId,
        producerRole: createdBy,
        consumerRoles: [],
        version,
        status: quality.verdict === 'APPROVED' ? 'APPROVED' : 'PENDING_REVIEW',
        contentSummary: summary,
        metadata: envelope.metadata as any,
      },
    }).catch(() => null);

    prisma.document.create({
      data: {
        projectId,
        type,
        title: `${type} (v${version})`,
        content: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
        version,
        author: `${createdBy} AI`,
      },
    }).catch(() => null);

    if (version > 1 || type === 'USER_REVISION_FEEDBACK') {
      void this.invalidateDownstreamArtifacts(projectId, type);
    }

    return envelope;
  }

  /**
   * Retrieves the latest artifact of a given type for a project.
   */
  public static async getLatestArtifact<T = unknown>(
    projectId: string,
    type: ArtifactType
  ): Promise<ArtifactEnvelope<T> | null> {
    const list = inMemoryArtifacts.get(projectId) || [];
    const match = list.find((a) => a.metadata.type === type);
    if (match) return match as ArtifactEnvelope<T>;

    // Fallback query Prisma
    try {
      const record = await prisma.document.findFirst({
        where: { projectId, type },
        orderBy: { version: 'desc' },
      });
      if (record) {
        let payload: any = record.content;
        try {
          payload = JSON.parse(record.content);
        } catch {}
        return {
          metadata: {
            artifactId: record.id,
            projectId,
            type,
            version: record.version,
            createdBy: 'SYSTEM',
            agentVersion: '2.0.0',
            createdAt: record.createdAt.toISOString(),
            sourceArtifactIds: [],
            validationStatus: 'VALID',
            qualityScore: { completeness: 90, consistency: 90, requirementCoverage: 90, correctness: 90, technicalRisk: 10, overall: 90, verdict: 'APPROVED' },
            contentHash: this.computeHash(payload),
            summary: record.title,
          },
          payload,
        };
      }
    } catch {}

    return null;
  }

  /**
   * Builds a lineage trace starting from an artifact back to all ancestor source artifacts.
   */
  public static async getLineageTrace(projectId: string, targetArtifactId: string): Promise<ArtifactMetadata[]> {
    const list = inMemoryArtifacts.get(projectId) || [];
    const target = list.find((a) => a.metadata.artifactId === targetArtifactId);
    if (!target) return [];

    const trace: ArtifactMetadata[] = [target.metadata];
    const visited = new Set<string>([targetArtifactId]);
    const queue = [...target.metadata.sourceArtifactIds];

    while (queue.length > 0) {
      const parentId = queue.shift()!;
      if (visited.has(parentId)) continue;
      visited.add(parentId);

      const parent = list.find((a) => a.metadata.artifactId === parentId);
      if (parent) {
        trace.push(parent.metadata);
        queue.push(...parent.metadata.sourceArtifactIds);
      }
    }

    return trace;
  }

  /** Dependency graph of artifacts for automated stale invalidation */
  public static readonly ARTIFACT_DEPENDENCY_GRAPH: Record<ArtifactType, ArtifactType[]> = {
    PRODUCT_REQUIREMENTS_DOC: [
      'ARCHITECTURE_SPECIFICATION',
      'UI_DESIGN_SPECIFICATION',
      'IMPLEMENTATION_DELIVERABLE',
      'QA_VERIFICATION_REPORT',
      'DEPLOYMENT_PACKAGE',
    ],
    ARCHITECTURE_SPECIFICATION: [
      'IMPLEMENTATION_DELIVERABLE',
      'QA_VERIFICATION_REPORT',
      'DEPLOYMENT_PACKAGE',
    ],
    UI_DESIGN_SPECIFICATION: [
      'IMPLEMENTATION_DELIVERABLE',
      'QA_VERIFICATION_REPORT',
    ],
    IMPLEMENTATION_DELIVERABLE: [
      'QA_VERIFICATION_REPORT',
      'DEPLOYMENT_PACKAGE',
    ],
    QA_VERIFICATION_REPORT: ['DEPLOYMENT_PACKAGE'],
    SECURITY_AUDIT_REPORT: ['DEPLOYMENT_PACKAGE'],
    DEPLOYMENT_PACKAGE: [],
    USER_REVISION_FEEDBACK: [
      'PRODUCT_REQUIREMENTS_DOC',
      'ARCHITECTURE_SPECIFICATION',
      'UI_DESIGN_SPECIFICATION',
      'IMPLEMENTATION_DELIVERABLE',
      'QA_VERIFICATION_REPORT',
    ],
  };

  /**
   * Automatically marks all downstream dependent artifacts as STALE when an upstream artifact changes.
   */
  public static async invalidateDownstreamArtifacts(
    projectId: string,
    upstreamType: ArtifactType
  ): Promise<ArtifactType[]> {
    const downstream = this.ARTIFACT_DEPENDENCY_GRAPH[upstreamType] || [];
    if (downstream.length === 0) return [];

    const list = inMemoryArtifacts.get(projectId) || [];
    for (const art of list) {
      if (downstream.includes(art.metadata.type)) {
        art.metadata.validationStatus = 'STALE';
      }
    }

    // Persist stale status to DB
    try {
      await prisma.artifactLifecycleRecord.updateMany({
        where: {
          projectId,
          artifactType: { in: downstream },
        },
        data: {
          status: 'STALE',
        },
      });
    } catch {}

    return downstream;
  }
}
