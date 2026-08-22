/**
 * Bounded Retry Manager with Failure Evidence
 * 
 * Records retry attempts with failure reason, objective evidence, and change instructions.
 * Enforces MAX_RETRIES = 3 and prevents infinite retry loops.
 */

export interface RetryAttemptRecord {
  attemptNumber: number;
  maxAttempts: number;
  failureReason: string;
  evidence: string;
  targetRole: string;
  changeInstructions: string;
  timestamp: string;
}

const retryHistory = new Map<string, RetryAttemptRecord[]>();

export class RetryManager {
  private static readonly MAX_RETRIES = 3;

  /**
   * Evaluates whether a retry is permitted and returns retry context.
   */
  public static evaluateRetry(params: {
    projectId: string;
    stageOrTaskId: string;
    targetRole: string;
    failureReason: string;
    evidence: string;
    changeInstructions: string;
  }): {
    allowed: boolean;
    attemptNumber: number;
    maxAttempts: number;
    feedbackPrompt: string;
    isTerminalFailure: boolean;
  } {
    const key = `${params.projectId}_${params.stageOrTaskId}`;
    const attempts = retryHistory.get(key) || [];
    const currentAttempt = attempts.length + 1;

    const record: RetryAttemptRecord = {
      attemptNumber: currentAttempt,
      maxAttempts: this.MAX_RETRIES,
      failureReason: params.failureReason,
      evidence: params.evidence,
      targetRole: params.targetRole,
      changeInstructions: params.changeInstructions,
      timestamp: new Date().toISOString(),
    };

    attempts.push(record);
    retryHistory.set(key, attempts);

    const allowed = currentAttempt <= this.MAX_RETRIES;

    const priorAttemptsSummary = attempts
      .map(
        (a) =>
          `Attempt ${a.attemptNumber}/${this.MAX_RETRIES} failed: ${a.failureReason}\nEvidence: ${a.evidence}`
      )
      .join('\n---\n');

    const feedbackPrompt = `
# RETRY CONTEXT (Attempt ${currentAttempt}/${this.MAX_RETRIES})
Previous attempt failed due to the following reasons:
${priorAttemptsSummary}

# REQUIRED CHANGE INSTRUCTIONS:
${params.changeInstructions}

Apply these targeted fixes to resolve the previous defects without repeating the same errors.
`.trim();

    return {
      allowed,
      attemptNumber: currentAttempt,
      maxAttempts: this.MAX_RETRIES,
      feedbackPrompt,
      isTerminalFailure: !allowed,
    };
  }

  /**
   * Resets retry history for a stage upon successful completion.
   */
  public static resetHistory(projectId: string, stageOrTaskId: string): void {
    const key = `${projectId}_${stageOrTaskId}`;
    retryHistory.delete(key);
  }

  /**
   * Gets attempt count for a task.
   */
  public static getAttemptCount(projectId: string, stageOrTaskId: string): number {
    const key = `${projectId}_${stageOrTaskId}`;
    return (retryHistory.get(key) || []).length;
  }
}
