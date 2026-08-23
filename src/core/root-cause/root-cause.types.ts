/**
 * Root Cause Classification & Diagnosis Types
 */

import type { CoreAgentRole } from '../contracts/agent-contract.types';

export type RootCauseCategory =
  | 'REQUIREMENT'
  | 'ARCHITECTURE'
  | 'DESIGN'
  | 'IMPLEMENTATION'
  | 'INFRASTRUCTURE'
  | 'ENVIRONMENT'
  | 'TEST_FAILURE';

export interface RootCauseDiagnosis {
  category: RootCauseCategory;
  confidence: number;
  explanation: string;
  responsibleRole: CoreAgentRole | 'DEVOPS' | 'SYSTEM';
  recommendedRemediation: string;
  affectedFiles: string[];
  remediationPhase: string;
  invalidationTargetPhases: string[];
}
