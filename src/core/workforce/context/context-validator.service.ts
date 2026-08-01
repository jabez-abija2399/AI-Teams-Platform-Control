import type { AgentExecutionContext } from './context.types';

export class ContextValidatorService {
  /**
   * Validates that an AgentExecutionContext contains all required fields
   */
  public static validate(context: AgentExecutionContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!context.agentId) errors.push('Missing agentId');
    if (!context.role) errors.push('Missing role');
    if (!context.personality) errors.push('Missing personality');
    if (!context.task?.id || !context.task?.title) errors.push('Missing required task fields (id/title)');
    if (!context.project?.vision) errors.push('Missing project vision');
    if (!context.reviewerRequirements) errors.push('Missing reviewer requirements');

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
