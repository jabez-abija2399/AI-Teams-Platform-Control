import type { ExecutionContext } from './execution-context';

export interface PipelineNode {
  /**
   * The name of the node (e.g., 'PlanningNode', 'ArchitectureNode').
   * Used for logging and error tracking.
   */
  name: string;

  /**
   * Executes the node's specific business logic.
   * 
   * @param context The shared execution context containing outputs from previous nodes.
   * @returns A promise that resolves to the mutated or fresh ExecutionContext.
   */
  execute(context: ExecutionContext): Promise<ExecutionContext>;
}
