import { CompanyMemoryService } from '@/core/memory/company-memory.service';

export interface RetryRecord {
  taskId: string;
  attempt: number;
  maxAttempts: number;
  failureReason: string;
  remediationAction: string;
}

const retryTracker = new Map<string, number>();

export class RetryEngine {
  private static MAX_RETRIES = 3;

  /**
   * Evaluates if a failed task can be retried and handles remediation
   */
  public static async handleFailure(
    projectId: string,
    taskId: string,
    errorReason: string
  ): Promise<{ shouldRetry: boolean; attempt: number; remediationAction: string }> {
    const currentAttempts = (retryTracker.get(taskId) || 0) + 1;
    retryTracker.set(taskId, currentAttempts);

    let remediationAction = 'Standard re-dispatch with refreshed memory context';
    if (errorReason.toLowerCase().includes('timeout') || errorReason.toLowerCase().includes('rate limit')) {
      remediationAction = 'Exponential backoff delay applied prior to re-dispatch';
    } else if (errorReason.toLowerCase().includes('type error') || errorReason.toLowerCase().includes('syntax')) {
      remediationAction = 'Inject strict TypeScript compilation constraints into prompt';
    }

    const shouldRetry = currentAttempts <= this.MAX_RETRIES;

    // Log retry event into Company Memory
    await CompanyMemoryService.updateMemory(projectId, {
      notes: [
        `[Retry Engine] Task ${taskId} failed (Attempt ${currentAttempts}/${this.MAX_RETRIES}): ${errorReason}. Action: ${remediationAction}`,
      ],
    });

    return {
      shouldRetry,
      attempt: currentAttempts,
      remediationAction,
    };
  }
}
