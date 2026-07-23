import { execSync } from 'child_process';
import type { ITool, ToolResult } from './tool.interface';

const WORKSPACE_ROOT = process.cwd();
const MAX_OUTPUT = 10000;

export const runCommandTool: ITool<{ command: string; cwd?: string }, { stdout: string; stderr: string; exitCode: number }> = {
  name: 'run_command',
  description: 'Runs a shell command in the project workspace. Returns stdout, stderr, and exit code.',
  async execute({ command, cwd }): Promise<ToolResult<{ stdout: string; stderr: string; exitCode: number }>> {
    try {
      const result = execSync(command, {
        cwd: cwd ? `${WORKSPACE_ROOT}/${cwd}` : WORKSPACE_ROOT,
        encoding: 'utf-8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return {
        success: true,
        data: {
          stdout: result.slice(0, MAX_OUTPUT),
          stderr: '',
          exitCode: 0,
        },
      };
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string; status?: number };
      return {
        success: true,
        data: {
          stdout: (execErr.stdout ?? '').slice(0, MAX_OUTPUT),
          stderr: (execErr.stderr ?? '').slice(0, MAX_OUTPUT),
          exitCode: execErr.status ?? 1,
        },
      };
    }
  },
};
