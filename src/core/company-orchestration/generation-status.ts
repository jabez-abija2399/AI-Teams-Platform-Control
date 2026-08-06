/**
 * User-facing generation status for Mission Control.
 * Classifies provider failures (credits, rate limits, timeouts) into clear copy.
 */

export type GenerationTone = 'working' | 'waiting' | 'success' | 'warning' | 'error';

export type GenerationKind =
  | 'idle'
  | 'running'
  | 'regenerating'
  | 'approval'
  | 'stuck'
  | 'failed'
  | 'credits'
  | 'rate_limited'
  | 'completed';

export interface ClassifiedAiError {
  kind: GenerationKind;
  code: string;
  title: string;
  message: string;
  actionLabel?: string;
}

export interface LiveGenerationState {
  kind: GenerationKind;
  tone: GenerationTone;
  title: string;
  message: string;
  detail?: string;
  progressLabel?: string;
  heartbeatAt?: string | null;
  stuckSeconds?: number;
  actionLabel?: string;
  canRetry: boolean;
}

const STUCK_AFTER_MS = 75_000;

export function classifyAiError(raw: string): ClassifiedAiError {
  const lower = (raw || '').toLowerCase();

  if (
    /402|payment|billing|insufficient.?credit|credit.?balance|out of credits|quota.*exceed|usage.?limit|spend.?limit/.test(
      lower,
    )
  ) {
    return {
      kind: 'credits',
      code: 'CREDITS_EXHAUSTED',
      title: 'AI credits unavailable',
      message:
        'The AI provider reports that credits or billing are exhausted. Add credits or update billing, then retry generation.',
      actionLabel: 'Retry generation',
    };
  }

  if (/429|rate.?limit|too many request|temporarily rate/.test(lower)) {
    return {
      kind: 'rate_limited',
      code: 'RATE_LIMITED',
      title: 'AI service is busy',
      message: 'The model provider is rate-limiting requests. Wait a moment, then retry.',
      actionLabel: 'Retry generation',
    };
  }

  if (/401|unauthorized|invalid.*key|api.?key|403|forbidden|access.?denied/.test(lower)) {
    return {
      kind: 'failed',
      code: 'AUTH_ERROR',
      title: 'AI provider configuration issue',
      message:
        'We could not authenticate with the AI provider. Check your API keys in environment settings, then retry.',
      actionLabel: 'Retry generation',
    };
  }

  if (/timeout|etimedout|timed.?out|budget exceeded/.test(lower)) {
    return {
      kind: 'failed',
      code: 'TIMEOUT',
      title: 'Generation timed out',
      message:
        'This step took too long and was stopped. You can retry — the team will continue from the current phase.',
      actionLabel: 'Retry generation',
    };
  }

  if (/network|fetch.*fail|econnrefused|econnreset|service.?unavailable|502|503/.test(lower)) {
    return {
      kind: 'failed',
      code: 'NETWORK_ERROR',
      title: 'Connection interrupted',
      message: 'We lost contact with the AI service. Check your connection and retry.',
      actionLabel: 'Retry generation',
    };
  }

  return {
    kind: 'failed',
    code: 'AI_ERROR',
    title: 'Generation stopped',
    message:
      raw?.trim()?.slice(0, 220) ||
      'Something went wrong while the AI company was working. You can retry this step.',
    actionLabel: 'Retry generation',
  };
}

export function buildLiveGenerationState(input: {
  lifecyclePhase: string;
  phaseStatus: 'running' | 'completed' | 'approval' | 'waiting';
  department?: string;
  nextAction?: string | null;
  heartbeatAt?: string | null;
  lastError?: { message?: string; code?: string; at?: string } | null;
  regenerating?: boolean;
  now?: number;
}): LiveGenerationState {
  const now = input.now ?? Date.now();
  const heartbeatMs = input.heartbeatAt ? Date.parse(input.heartbeatAt) : NaN;
  const age = Number.isFinite(heartbeatMs) ? now - heartbeatMs : null;

  if (input.phaseStatus === 'completed' || input.lifecyclePhase === 'COMPLETED') {
    return {
      kind: 'completed',
      tone: 'success',
      title: 'Pipeline complete',
      message: 'Your AI company finished delivery. Review the final deliverables anytime.',
      canRetry: false,
    };
  }

  if (input.lifecyclePhase === 'FAILED' || input.lastError) {
    const classified = classifyAiError(input.lastError?.message || input.nextAction || '');
    return {
      kind: classified.kind === 'credits' || classified.kind === 'rate_limited' ? classified.kind : 'failed',
      tone: classified.kind === 'credits' || classified.kind === 'rate_limited' ? 'warning' : 'error',
      title: classified.title,
      message: classified.message,
      detail: input.lastError?.code ? `Reference: ${input.lastError.code}` : undefined,
      actionLabel: classified.actionLabel,
      canRetry: true,
      heartbeatAt: input.heartbeatAt,
    };
  }

  if (input.phaseStatus === 'approval') {
    return {
      kind: 'approval',
      tone: 'waiting',
      title: 'Your review is needed',
      message:
        input.nextAction ||
        'An AI employee finished a document. Review it, approve to continue, or request changes.',
      canRetry: false,
      heartbeatAt: input.heartbeatAt,
    };
  }

  if (input.phaseStatus === 'waiting') {
    return {
      kind: 'idle',
      tone: 'waiting',
      title: 'Ready to start',
      message: 'Start the pipeline when you are ready. Progress will appear here in real time.',
      canRetry: false,
    };
  }

  if (input.phaseStatus === 'running') {
    if (age != null && age > STUCK_AFTER_MS) {
      return {
        kind: 'stuck',
        tone: 'warning',
        title: 'Generation appears stalled',
        message:
          'No progress signal for a while. The step may have stopped. Retry to resume from this phase.',
        detail: input.department ? `Last active: ${input.department}` : undefined,
        stuckSeconds: Math.round(age / 1000),
        actionLabel: 'Resume generation',
        canRetry: true,
        heartbeatAt: input.heartbeatAt,
        progressLabel: input.department,
      };
    }

    const regenerating = Boolean(input.regenerating);
    const dept = input.department || 'Your AI company';
    return {
      kind: regenerating ? 'regenerating' : 'running',
      tone: 'working',
      title: regenerating ? 'Regenerating with your feedback' : `${dept} is writing`,
      message:
        input.nextAction ||
        (regenerating
          ? `Rewriting the deliverable to match your comments — ${dept} is applying the changes now.`
          : `${dept} is composing the next deliverable and will pause for your review when it is ready.`),
      progressLabel: input.department,
      heartbeatAt: input.heartbeatAt,
      canRetry: false,
    };
  }

  return {
    kind: 'idle',
    tone: 'waiting',
    title: 'Standing by',
    message: 'Mission Control is idle.',
    canRetry: false,
  };
}

export async function pulseGenerationHeartbeat(
  projectId: string,
  update: {
    message: string;
    phase?: string;
    department?: string;
    clearError?: boolean;
    error?: { message: string; code?: string };
  },
): Promise<void> {
  const { prisma } = await import('@/lib/prisma');
  const { publishGenerationStatus } = await import('./generation-stream-bus');
  const { findWorkflowScalars, updateWorkflowScalars } = await import('./workflow-state-access');
  publishGenerationStatus(projectId, update.message);

  try {
    const wf = await findWorkflowScalars(projectId);
    if (!wf) return;

    const meta = { ...((wf.metadata as Record<string, unknown>) || {}) };
    meta.generationHeartbeatAt = new Date().toISOString();
    meta.generationMessage = update.message;
    if (update.phase) meta.generationPhase = update.phase;
    if (update.department) meta.generationDepartment = update.department;
    if (update.clearError) delete meta.lastGenerationError;
    if (update.error) {
      meta.lastGenerationError = {
        message: update.error.message,
        code: update.error.code || classifyAiError(update.error.message).code,
        at: new Date().toISOString(),
      };
    }

    await updateWorkflowScalars(projectId, {
      metadata: meta,
      nextAction: update.message,
    });
  } catch (err: any) {
    // Never fail the pipeline because of a heartbeat / mapper glitch
    console.warn('[generation-status] pulseGenerationHeartbeat failed:', err?.message);
  }
}
