import type { IAgent } from './agent.interface';
import type { AgentRole, AgentStatus, AgentCapability, AgentExecutionResult } from './agent.types';
import { AGENT_CONFIGS } from './agent.constants';
import { getAIService } from '../../services/ai.service';
import { buildContext } from '../memory/context-builder';

export abstract class BaseAgent implements IAgent {
  readonly id: string;
  readonly role: AgentRole;
  name: string;
  status: AgentStatus = 'IDLE';
  capabilities: AgentCapability[];
  currentTaskId: string | null = null;

  private systemPrompt: string;

  constructor(role: AgentRole, name: string) {
    this.id = crypto.randomUUID();
    this.role = role;
    this.name = name;

    const config = AGENT_CONFIGS[role];
    this.capabilities = config.capabilities;
    this.systemPrompt = config.systemPrompt;
  }

  async execute(task: string, context?: Record<string, unknown>): Promise<AgentExecutionResult> {
    if (this.status === 'PAUSED') {
      return {
        success: false,
        output: 'Agent is paused. Resume before executing tasks.',
      };
    }

    this.status = 'WORKING';

    try {
      const ai = getAIService();
      const projectId = context?.projectId as string | undefined;

      let memoryNote = '';
      if (projectId) {
        const ctx = await buildContext(this.id, projectId, task);
        memoryNote = ctx.memoryContext;
      }

      const enrichedTask = memoryNote ? `${memoryNote}\n\n${task}` : task;

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: this.buildPrompt(enrichedTask, context) },
      ];

      const response = await ai.generate({ messages }, undefined, {
        agentId: this.id,
        projectId,
      });

      const result = this.parseResponse(response.content);

      this.status = 'IDLE';

      return result;
    } catch (error) {
      this.status = 'ERROR';
      return {
        success: false,
        output: `Agent error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  protected buildPrompt(task: string, context?: Record<string, unknown>): string {
    let prompt = task;
    if (context) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');
      prompt = `Context:\n${contextStr}\n\nTask:\n${task}`;
    }
    return prompt;
  }

  protected parseResponse(content: string): AgentExecutionResult {
    try {
      const parsed = JSON.parse(content) as {
        output?: string;
        artifacts?: string[];
        memoryUpdates?: string[];
        nextAgentHint?: AgentRole;
      };
      return {
        success: true,
        output: parsed.output ?? content,
        artifacts: parsed.artifacts,
        memoryUpdates: parsed.memoryUpdates,
        nextAgentHint: parsed.nextAgentHint,
      };
    } catch {
      return {
        success: true,
        output: content,
      };
    }
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  getStatusDetails() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      status: this.status,
      capabilities: this.capabilities,
      currentTaskId: this.currentTaskId,
    };
  }

  pause(): void {
    if (this.status === 'WORKING') {
      this.status = 'PAUSED';
    }
  }

  resume(): void {
    if (this.status === 'PAUSED') {
      this.status = 'IDLE';
    }
  }

  reset(): void {
    this.status = 'IDLE';
    this.currentTaskId = null;
  }
}
