/**
 * Artifact First System — Strongly Typed, Versioned Artifact Envelopes with Full Lineage
 */

export type ArtifactType =
  | 'PRODUCT_REQUIREMENTS_DOC'
  | 'ARCHITECTURE_SPECIFICATION'
  | 'UI_DESIGN_SPECIFICATION'
  | 'IMPLEMENTATION_DELIVERABLE'
  | 'QA_VERIFICATION_REPORT'
  | 'SECURITY_AUDIT_REPORT'
  | 'DEPLOYMENT_PACKAGE'
  | 'USER_REVISION_FEEDBACK';

export type ArtifactValidationStatus = 'UNVALIDATED' | 'VALID' | 'INVALID' | 'FLAGGED';

export interface ArtifactQualityScore {
  completeness: number; // 0 - 100
  consistency: number;  // 0 - 100
  requirementCoverage: number; // 0 - 100
  correctness: number;  // 0 - 100
  technicalRisk: number; // 0 - 100 (lower risk = higher score)
  overall: number;      // Weighted composite score (0 - 100)
  verdict: 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED';
  evidenceDetails?: string[];
}

export interface ArtifactMetadata {
  artifactId: string;
  projectId: string;
  type: ArtifactType;
  version: number;
  createdBy: 'PM' | 'ARCHITECT' | 'DESIGNER' | 'DEVELOPER' | 'QA' | 'USER' | 'SYSTEM';
  agentVersion: string;
  modelUsed?: string;
  createdAt: string;
  sourceArtifactIds: string[]; // Parent artifacts that informed this artifact
  validationStatus: ArtifactValidationStatus;
  qualityScore: ArtifactQualityScore;
  contentHash: string; // SHA-256 integrity hash
  summary: string;
}

export interface ArtifactEnvelope<T = unknown> {
  metadata: ArtifactMetadata;
  payload: T;
}
