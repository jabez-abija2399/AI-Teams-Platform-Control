import type { CompanyRole } from '../types';

export interface TaskRequirement {
  title: string;
  description: string;
  domainKeywords?: string[];
}

export interface AgentCapabilityDefinition {
  role: CompanyRole;
  domain: string;
  keywords: string[];
  skills: string[];
  baseConfidence: number;
}

export interface CapabilityScore {
  role: CompanyRole;
  matchScore: number; // 0 to 100
  confidenceScore: number; // 0.0 to 1.0
  reason: string;
}

export interface CapabilityMatchResult {
  primaryAgent: CompanyRole;
  supportingReviewer: CompanyRole;
  matchScore: number;
  confidenceScore: number;
  allScores: CapabilityScore[];
}
