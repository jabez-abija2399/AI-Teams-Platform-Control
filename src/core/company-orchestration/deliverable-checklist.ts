/**
 * Build per-phase deliverable checklist for Mission Control.
 */

import {
  PIPELINE_PHASE_DEFINITIONS,
  type ProjectLifecycleState,
} from '@/core/company-orchestration/types';

export type DeliverableCheckStatus = 'done' | 'active' | 'blocked' | 'pending';

export interface DeliverableCheckItem {
  phase: ProjectLifecycleState;
  department: string;
  artifactType: string;
  status: DeliverableCheckStatus;
  hasArtifact: boolean;
}

const TRACKED_PHASES: ProjectLifecycleState[] = [
  'DISCOVERY_RUNNING',
  'CLARIFICATION_RUNNING',
  'PROPOSAL_RUNNING',
  'STRATEGY_RUNNING',
  'PRODUCT_RUNNING',
  'ANALYSIS_RUNNING',
  'PLANNING_RUNNING',
  'ARCHITECTURE_RUNNING',
  'DESIGN_RUNNING',
  'DEVELOPMENT_RUNNING',
  'TESTING_RUNNING',
  'REVIEW_RUNNING',
  'SECURITY_RUNNING',
  'DEPLOYMENT_RUNNING',
  'MONITORING',
];

export function buildDeliverableChecklist(input: {
  lifecyclePhase: string;
  completedPhases: string[];
  artifactTypes: string[];
  blocked?: boolean;
}): DeliverableCheckItem[] {
  const completed = new Set(input.completedPhases);
  const artifacts = new Set(input.artifactTypes);
  const current = input.lifecyclePhase;

  return TRACKED_PHASES.map((phase) => {
    const def = PIPELINE_PHASE_DEFINITIONS[phase];
    const hasArtifact =
      artifacts.has(def.outputArtifactType) ||
      completed.has(phase) ||
      (current === 'COMPLETED' && true);

    let status: DeliverableCheckStatus = 'pending';
    if (current === 'COMPLETED' || completed.has(phase) || hasArtifact) {
      status = hasArtifact || completed.has(phase) || current === 'COMPLETED' ? 'done' : 'pending';
    }
    if (phase === current && current.endsWith('_RUNNING')) {
      status = input.blocked ? 'blocked' : 'active';
    }
    if (current === 'FAILED' && phase === current) {
      status = 'blocked';
    }
    // When failed, mark the resume phase from completed list — blocked is set via blockedPhase below
    if (input.blocked && !completed.has(phase) && phase === current) {
      status = 'blocked';
    }

    return {
      phase,
      department: def.department,
      artifactType: def.outputArtifactType,
      status,
      hasArtifact: Boolean(hasArtifact && status === 'done'),
    };
  }).map((item) => {
    // Fix: FAILED lifecycle stores resume in generationPhase separately — caller passes blockedPhase as lifecycle when needed
    return item;
  });
}

/** Prefer blockedPhase when pipeline FAILED so checklist highlights the stopped step. */
export function buildDeliverableChecklistForState(input: {
  lifecyclePhase: string;
  blockedPhase?: string | null;
  completedPhases: string[];
  artifactTypes: string[];
}): DeliverableCheckItem[] {
  const blocked =
    input.lifecyclePhase === 'FAILED' || Boolean(input.blockedPhase);
  const focusPhase =
    input.lifecyclePhase === 'FAILED' && input.blockedPhase
      ? input.blockedPhase
      : input.lifecyclePhase;

  const items = buildDeliverableChecklist({
    lifecyclePhase: focusPhase,
    completedPhases: input.completedPhases,
    artifactTypes: input.artifactTypes,
    blocked,
  });

  if (blocked && input.blockedPhase) {
    return items.map((item) =>
      item.phase === input.blockedPhase
        ? { ...item, status: 'blocked' as const }
        : item,
    );
  }
  return items;
}
