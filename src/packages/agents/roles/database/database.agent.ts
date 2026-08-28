import { BaseAgent } from '@/packages/agents/core/agent.base';
import type { IAgent } from '@/packages/agents/core/agent.interface';
import { generateDatabaseDesignSpec } from './database.service';
import type { ApiResult } from '@/types/common.types';
import type { DatabaseDesignSpec } from './database.types';

export class DatabaseAgent extends BaseAgent implements IAgent {
  constructor(name?: string) {
    super('DATABASE', name ?? 'Database Specialist AI');
  }

  public async generateDDS(
    projectId: string,
    architectureData: unknown,
  ): Promise<ApiResult<DatabaseDesignSpec>> {
    return generateDatabaseDesignSpec(projectId, architectureData);
  }

  protected override buildPrompt(task: string, _context?: Record<string, unknown>): string {
    return `As Database Specialist AI, design database architecture, schemas, and optimization plans for the following task:\n\n${task}`;
  }
}
