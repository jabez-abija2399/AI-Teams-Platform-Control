/**
 * @file qa-engineer.types.ts
 * @package @ai-teams/agents/roles/qa-engineer
 * @description Types for the QA & Test Engineer Agent.
 */

import type { QAVerificationReport, ImplementationDeliverable } from '../../contracts/deliverable-schemas';

export interface QaEngineerExecutionInput {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
  deliverable?: ImplementationDeliverable;
}

export type QaEngineerDeliverable = QAVerificationReport;
