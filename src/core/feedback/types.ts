export type EscalationAgentRole = 'DEVELOPER' | 'DESIGNER' | 'ARCHITECT' | 'CEO';

export type EscalationTargetArtifact = 'PRODUCT_SPEC' | 'ARCHITECTURE' | 'DESIGN_SPEC';

export type EscalationIssueType = 'TECHNICAL_BLOCKER' | 'DESIGN_CONFLICT' | 'IMPOSSIBLE_REQUIREMENT';

export interface FeedbackEscalationInput {
  projectId: string;
  fromAgentRole: EscalationAgentRole;
  toAgentRole: EscalationAgentRole;
  issueType: EscalationIssueType;
  description: string;
  targetArtifactType: EscalationTargetArtifact;
}

export interface FeedbackEscalationResult {
  id: string;
  projectId: string;
  fromAgentRole: EscalationAgentRole;
  toAgentRole: EscalationAgentRole;
  issueType: EscalationIssueType;
  description: string;
  targetArtifactType: EscalationTargetArtifact;
  targetVersion: number;
  resolutionStatus: 'OPEN' | 'RESOLVED' | 'REJECTED';
  createdAt: Date;
}
