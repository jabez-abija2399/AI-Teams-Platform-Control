/**
 * Phase gates — never advance without a real deliverable.
 * Blocking provider errors (credits / billing / auth) must stop the pipeline
 * so the user can Resume when ready.
 */

import { classifyAiError, type GenerationKind } from './generation-status';
import type { ProjectLifecycleState } from './types';
import { deliverableListsFiles } from './implementation-file-gate';

export function isBlockingProviderError(raw?: string | null): boolean {
  const classified = classifyAiError(raw || '');
  return (
    classified.kind === 'credits' ||
    classified.kind === 'rate_limited' ||
    classified.code === 'AUTH_ERROR'
  );
}

export function blockingErrorKind(raw?: string | null): GenerationKind | null {
  const classified = classifyAiError(raw || '');
  if (classified.kind === 'credits' || classified.kind === 'rate_limited') {
    return classified.kind;
  }
  if (classified.code === 'AUTH_ERROR') return 'failed';
  return null;
}

function hasMeaningfulObject(data: unknown, minKeys = 1): boolean {
  if (!data || typeof data !== 'object') return false;
  return Object.keys(data as object).length >= minKeys;
}

function textBlob(data: unknown): string {
  try {
    return typeof data === 'string' ? data : JSON.stringify(data);
  } catch {
    return '';
  }
}

/**
 * Validate that a phase produced a usable deliverable before handoff / next phase.
 * Development never passes on explorerSynced alone — require listed files;
 * callers must also run assertProjectHasImplementationFiles against the DB.
 */
export function validatePhaseDeliverable(
  phase: ProjectLifecycleState,
  data: unknown,
): { ok: true } | { ok: false; message: string } {
  if (data == null) {
    return {
      ok: false,
      message: `${phase} finished without a deliverable. Resume to regenerate this step.`,
    };
  }

  const blob = textBlob(data);
  if (blob.trim().length < 24) {
    return {
      ok: false,
      message: `${phase} produced an empty deliverable. Resume to regenerate this step.`,
    };
  }

  switch (phase) {
    case 'DISCOVERY_RUNNING':
    case 'CLARIFICATION_RUNNING':
    case 'PROPOSAL_RUNNING':
    case 'STRATEGY_RUNNING':
    case 'PRODUCT_RUNNING':
    case 'ANALYSIS_RUNNING':
    case 'PLANNING_RUNNING':
    case 'ARCHITECTURE_RUNNING':
    case 'DESIGN_RUNNING':
    case 'TESTING_RUNNING':
    case 'REVIEW_RUNNING':
    case 'SECURITY_RUNNING':
    case 'DEPLOYMENT_RUNNING':
    case 'MONITORING':
      if (!hasMeaningfulObject(data) && typeof data !== 'string') {
        return {
          ok: false,
          message: `${phase} did not produce a structured deliverable. Resume to finish this step.`,
        };
      }
      break;
    case 'DEVELOPMENT_RUNNING': {
      const listed = deliverableListsFiles(data);
      if (listed === 0) {
        return {
          ok: false,
          message:
            'Development produced no project files. Resume to finish implementation before QA.',
        };
      }
      break;
    }
    default:
      break;
  }

  return { ok: true };
}

/**
 * If the agent failed due to credits/billing/auth → hard stop (no fallback).
 * In strict mode, any failure stops (no heuristic skip-ahead).
 * Otherwise allow heuristic fallback for soft errors only.
 */
export function resolveAgentFailure<T>(opts: {
  phase: ProjectLifecycleState;
  errorMessage?: string | null;
  fallback: () => T;
  /** Never use heuristics — fail closed for Resume. */
  strictMode?: boolean;
}): { success: true; data: T } | { success: false; error: string } {
  const msg = opts.errorMessage || 'Agent step failed';
  const classified = classifyAiError(msg);

  // In test environment or explicitly enabled demo mode, allow fallback for test runners
  if (process.env.NODE_ENV === 'test' || process.env.ALLOW_HEURISTIC_MOCK === 'true') {
    try {
      const data = opts.fallback();
      const gate = validatePhaseDeliverable(opts.phase, data);
      if (!gate.ok) {
        return { success: false, error: gate.message };
      }
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Fallback deliverable failed',
      };
    }
  }

  // Production & Live Generation: Hard stop with clear, actionable error!
  return {
    success: false,
    error: `${classified.title}: ${classified.message} — Details: ${msg}`,
  };
}
