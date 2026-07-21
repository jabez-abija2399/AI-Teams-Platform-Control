export interface TerminalCommand {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
}

export interface TerminalResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export async function executeTerminalCommand(
  _command: TerminalCommand,
): Promise<TerminalResult> {
  return {
    exitCode: 0,
    stdout: 'Terminal engine not yet implemented',
    stderr: '',
    duration: 0,
  };
}

export class TerminalEngine {
  private history: TerminalResult[] = [];

  async execute(command: TerminalCommand): Promise<TerminalResult> {
    const result = await executeTerminalCommand(command);
    this.history.push(result);
    return result;
  }

  getHistory(): TerminalResult[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}
