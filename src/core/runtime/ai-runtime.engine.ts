import { prisma } from '@/lib/prisma';
import type {
  ExecutionRequest,
  ExecutionResult,
  AgentExecutionStatus,
  ToolExecutionResult,
} from './runtime.types';
import { ModelRouterService } from './model-router.service';
import { ExecutionContextService } from './execution-context.service';
import { TokenTrackerService } from './token-tracker.service';
import { CostTrackerService } from './cost-tracker.service';
import { ToolExecutor } from '../tools/tool-executor';
import { ToolRegistry } from '../tools/tool-registry';
import type { ToolName } from '../tools/tool.types';
import { WorkspaceService } from '../workspace/workspace.service';

const inMemoryExecutions = new Map<string, ExecutionResult>();

export class AIRuntimeEngine {
  private static MAX_TOKENS_PER_EXECUTION = 16_000;
  private static MAX_COST_PER_EXECUTION = 0.50; // USD
  private static EXECUTION_TIMEOUT_MS = 60_000;

  /**
   * Full agent execution lifecycle:
   * queued → preparing → generating → tool_execution → reviewing → completed/failed
   */
  public static async executeTask(request: ExecutionRequest): Promise<ExecutionResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const projectId = request.projectId || 'global';

    // 1. QUEUED → PREPARING
    this.updateStatus(executionId, 'preparing', request);

    // 2. Select model based on role and task
    const modelConfig = ModelRouterService.selectModel(
      request.agentRole,
      request.taskTitle,
    );

    // 3. Enforce token limit
    const estimatedInputTokens = Math.ceil(request.systemPrompt.length / 4);
    if (estimatedInputTokens > this.MAX_TOKENS_PER_EXECUTION) {
      return this.failExecution(executionId, projectId, request, modelConfig.model, 'Token limit exceeded');
    }

    // 4. PREPARING → GENERATING
    this.updateStatus(executionId, 'generating', request);

    // Simulate LLM response (real provider integration plugs in here)
    const simulatedOutputTokens = Math.floor(Math.random() * 500) + 200;
    const responseContent = `[${request.agentRole}] Generated implementation for: ${request.taskTitle}.\n\nSystem prompt tokens: ${estimatedInputTokens}.\nModel: ${modelConfig.model}.`;

    // 5. Calculate cost
    const cost = CostTrackerService.calculateCost(modelConfig, estimatedInputTokens, simulatedOutputTokens);

    // 6. Enforce cost limit
    if (cost > this.MAX_COST_PER_EXECUTION) {
      return this.failExecution(executionId, projectId, request, modelConfig.model, 'Cost limit exceeded');
    }

    // 7. GENERATING → TOOL_EXECUTION
    this.updateStatus(executionId, 'tool_execution', request);

    const toolResults: ToolExecutionResult[] = [];
    if (request.tools && request.tools.length > 0) {
      for (const toolName of request.tools) {
        const toolOutput = await ToolExecutor.execute(
          { toolName: toolName as ToolName, params: { taskId: request.taskId } },
          request.agentRole
        );
        toolResults.push({
          toolName: toolName as ToolName,
          input: { taskId: request.taskId },
          output: toolOutput.result,
          status: toolOutput.status,
          error: toolOutput.error,
        });
      }
    }

    // 8. TOOL_EXECUTION → REVIEWING
    this.updateStatus(executionId, 'reviewing', request);

    // 9. Track tokens and cost
    TokenTrackerService.recordUsage(projectId, estimatedInputTokens, simulatedOutputTokens);
    CostTrackerService.recordCost(projectId, executionId, cost);

    // 10. REVIEWING → COMPLETED
    this.updateStatus(executionId, 'completed', request);

    const result: ExecutionResult = {
      executionId,
      status: 'completed',
      content: responseContent,
      inputTokens: estimatedInputTokens,
      outputTokens: simulatedOutputTokens,
      cost,
      toolResults,
    };

    inMemoryExecutions.set(executionId, result);

    // Non-blocking Prisma persistence
    prisma.agentExecution.create({
      data: {
        id: executionId,
        projectId: request.projectId,
        agentRole: request.agentRole,
        taskId: request.taskId,
        model: modelConfig.model,
        status: 'completed',
        inputTokens: estimatedInputTokens,
        outputTokens: simulatedOutputTokens,
        cost,
        result: JSON.stringify({ content: responseContent, toolResults }),
      },
    }).catch(() => null);

    return result;
  }

  /**
   * Returns a stored execution result
   */
  public static getExecution(executionId: string): ExecutionResult | undefined {
    return inMemoryExecutions.get(executionId);
  }

  private static updateStatus(executionId: string, status: AgentExecutionStatus, request?: ExecutionRequest): void {
    if (request?.projectId) {
      WorkspaceService.updateEmployeeStatus(
        request.projectId,
        request.agentRole,
        status === 'completed' ? 'Completed' : status === 'failed' ? 'Blocked' : status === 'reviewing' ? 'Reviewing' : 'Working',
        request.taskTitle,
        status === 'completed' ? 100 : status === 'generating' || status === 'tool_execution' ? 50 : 20,
        `Execution state transitioned to ${status.toUpperCase()}`
      );
    }
  }

  private static failExecution(
    executionId: string,
    projectId: string,
    request: ExecutionRequest,
    model: string,
    errorMessage: string
  ): ExecutionResult {
    const result: ExecutionResult = {
      executionId,
      status: 'failed',
      content: '',
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      toolResults: [],
    };

    inMemoryExecutions.set(executionId, result);

    prisma.agentExecution.create({
      data: {
        id: executionId,
        projectId: request.projectId,
        agentRole: request.agentRole,
        taskId: request.taskId,
        model,
        status: 'failed',
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        errorMessage,
      },
    }).catch(() => null);

    this.updateStatus(executionId, 'failed', request);

    return result;
  }
}
