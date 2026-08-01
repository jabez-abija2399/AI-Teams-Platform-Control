import type { ToolInput, ToolOutput, ToolName } from './tool.types';
import { ToolRegistry } from './tool-registry';

export class ToolExecutor {
  /**
   * Executes a tool after permission check.
   * Returns a simulated output — real implementations will call actual file system, DB, etc.
   */
  public static async execute(
    input: ToolInput,
    agentRole: string
  ): Promise<ToolOutput> {
    // 1. Permission check
    if (!ToolRegistry.isToolAllowed(input.toolName, agentRole)) {
      return {
        toolName: input.toolName,
        status: 'denied',
        result: null,
        error: `Role "${agentRole}" does not have permission to use tool "${input.toolName}"`,
      };
    }

    // 2. Execute tool (simulated for now — real implementations plugged in later)
    try {
      const result = await this.simulateToolExecution(input);
      return {
        toolName: input.toolName,
        status: 'success',
        result,
      };
    } catch (err) {
      return {
        toolName: input.toolName,
        status: 'failed',
        result: null,
        error: err instanceof Error ? err.message : 'Unknown tool error',
      };
    }
  }

  /**
   * Simulated tool execution — returns mock results based on tool type
   */
  private static async simulateToolExecution(input: ToolInput): Promise<unknown> {
    switch (input.toolName) {
      case 'FILE_READ':
        return { content: `// Contents of ${input.params.path || 'unknown'}`, lines: 42 };
      case 'FILE_WRITE':
        return { written: true, path: input.params.path || 'unknown', bytes: 1024 };
      case 'CODE_SEARCH':
        return { matches: [{ file: 'src/index.ts', line: 10, content: 'export default' }], total: 1 };
      case 'TERMINAL_EXECUTE':
        return { exitCode: 0, stdout: 'Command executed successfully', stderr: '' };
      case 'DATABASE_QUERY':
        return { rows: [], rowCount: 0 };
      case 'TEST_RUNNER':
        return { passed: 12, failed: 0, total: 12, duration: '2.5s' };
      case 'GIT_OPERATION':
        return { status: 'clean', branch: 'main', ahead: 0 };
      default:
        throw new Error(`Unknown tool: ${input.toolName}`);
    }
  }
}
