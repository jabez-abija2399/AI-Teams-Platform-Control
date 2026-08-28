/**
 * @file base-agent.ts
 * @package @ai-teams/agents/core
 * @description Abstract BaseAgent class that all specialized AI employees inherit from.
 * Defines standard lifecycle hooks, streaming capabilities, and contract execution.
 */

import { z } from 'zod';
import type { AgentContract } from '../contracts/agent-contract.interface';

export interface AgentExecutionContext {
  projectId: string;
  projectName?: string;
  visionPrompt: string;
  stepId?: string;
  parameters?: Record<string, unknown>;
  signal?: AbortSignal;
  onTokenStream?: (token: string) => void;
  onStatusUpdate?: (status: string, progress?: number) => void;
}

export interface AgentExecutionResult<TDeliverable = unknown> {
  success: boolean;
  agentRole: string;
  deliverableType: string;
  data: TDeliverable;
  rawOutput?: string;
  executionTimeMs: number;
  error?: string;
}

export abstract class BaseAgent<TDeliverable = unknown> {
  public abstract readonly roleId: string;
  public abstract readonly displayName: string;
  public abstract readonly department: string;
  public abstract readonly deliverableType: string;
  public abstract readonly contract: AgentContract;

  private _customName?: string;
  private _customRole?: string;

  constructor(customName?: string) {
    this._customName = customName;
  }

  public get role(): string {
    if (this._customRole) return this._customRole;
    const r = this.roleId.toUpperCase().replace(/-/g, '_');
    if (r === 'PRODUCT_MANAGER') return 'PRODUCT_MANAGER';
    if (r === 'QA_ENGINEER') return 'QA';
    if (r === 'SECURITY_AUDITOR') return 'SECURITY';
    if (r === 'DEVOPS_ENGINEER') return 'DEVOPS';
    if (r === 'UI_DESIGNER') return 'UI_DESIGNER';
    return r;
  }

  public set role(val: string) {
    this._customRole = val;
  }

  public get name(): string {
    return this._customName || this.displayName;
  }

  public set name(val: string) {
    this._customName = val;
  }

  /**
   * Primary entry point for executing the agent's responsibilities.
   */
  public abstract execute(context: AgentExecutionContext): Promise<AgentExecutionResult<TDeliverable>>;

  /**
   * Initializes the agent with runtime configuration and memory.
   */
  public async initialize(): Promise<void> {
    // Default hook: subclasses can override for knowledge base priming
  }

  /**
   * Validates raw LLM output against the agent's deliverable schema.
   */
  protected validateDeliverable(schema: z.ZodType<TDeliverable>, rawData: unknown): TDeliverable {
    return schema.parse(rawData);
  }

  /**
   * Helper to format standardized log messages.
   */
  protected log(message: string, meta?: Record<string, unknown>): void {
    console.log(`[Agent:${this.roleId}] ${message}`, meta ? JSON.stringify(meta) : '');
  }
}
