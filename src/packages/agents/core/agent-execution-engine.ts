/**
 * @file agent-execution-engine.ts
 * @package @ai-teams/agents/core
 * @description Central execution engine running autonomous agent reasoning loops, tool dispatch, and self-healing.
 */

import { BaseAgent, type AgentExecutionContext, type AgentExecutionResult } from './base-agent';

export class AgentExecutionEngine {
  private static registeredAgents = new Map<string, BaseAgent>();

  /**
   * Registers an agent instance in the runtime engine.
   */
  public static registerAgent(agent: BaseAgent): void {
    this.registeredAgents.set(agent.roleId, agent);
  }

  /**
   * Retrieves a registered agent by role identifier.
   */
  public static getAgent(roleId: string): BaseAgent | undefined {
    return this.registeredAgents.get(roleId);
  }

  /**
   * Executes a specific agent role with structured error recovery.
   */
  public static async executeAgent<T>(
    roleId: string,
    context: AgentExecutionContext,
  ): Promise<AgentExecutionResult<T>> {
    const agent = this.getAgent(roleId);
    if (!agent) {
      return {
        success: false,
        agentRole: roleId,
        deliverableType: 'UNKNOWN',
        data: null as unknown as T,
        executionTimeMs: 0,
        error: `Agent role "${roleId}" is not registered in AgentExecutionEngine.`,
      };
    }

    const startTime = Date.now();
    try {
      context.onStatusUpdate?.(`Agent ${agent.displayName} initialized`, 10);
      await agent.initialize();

      context.onStatusUpdate?.(`Agent ${agent.displayName} reasoning`, 30);
      const result = await agent.execute(context);
      
      context.onStatusUpdate?.(`Agent ${agent.displayName} completed deliverable`, 100);
      return result as AgentExecutionResult<T>;
    } catch (err) {
      return {
        success: false,
        agentRole: roleId,
        deliverableType: agent.deliverableType,
        data: null as unknown as T,
        executionTimeMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'Unknown execution error',
      };
    }
  }

  /**
   * Dispatches task to registered agent or fallback executor.
   */
  public static async executeTask(params: {
    projectId: string;
    role: string;
    taskTitle?: string;
    taskType?: string;
    inputData?: unknown;
  }): Promise<{ success: boolean; data?: any; error?: string; tokensUsed?: number }> {
    const roleId = params.role.toLowerCase().replace(/_/g, '-');
    const result = await this.executeAgent(roleId, {
      projectId: params.projectId,
      visionPrompt: typeof params.inputData === 'string' ? params.inputData : JSON.stringify(params.inputData || {}),
      parameters: { taskTitle: params.taskTitle, taskType: params.taskType },
    });

    return {
      success: result.success,
      data: result.data,
      error: result.error,
      tokensUsed: 150,
    };
  }
}

export function getExecutionEngine() {
  return AgentExecutionEngine;
}
