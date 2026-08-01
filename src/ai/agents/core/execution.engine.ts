import { AGENT_CONFIGS } from './agent.constants';
import type { AgentRole } from './agent.types';
import type { AgentModelConfig } from '../roles/ceo/ceo.config';
import { loadKnowledgeForAgent } from './knowledge-loader';
import { getMemoryManager } from '../memory/memory.manager';
import { getArtifactManager } from '../artifacts/artifact.manager';
import { validateAgentContract, ContractViolationError } from './contract.validator';
import { aiCall } from './ai-call';
import { logAIEvent } from '../../monitoring/ai.logger';
import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import { executeAuthorizedTool } from '../tools/tool.registry';

export interface AgentExecutionRequest {
  projectId: string;
  role: AgentRole;
  taskTitle: string;
  taskType: string;
  inputData: unknown;
  agentId?: string;
}

export interface AgentExecutionResponse<T = unknown> {
  artifactId: string;
  output: T;
  qualityScore: {
    overall: number;
    verdict: string;
    [key: string]: unknown;
  };
  contractValid: boolean;
  violations: string[];
}

export class AgentExecutionEngine {
  async executeTask<T = Record<string, unknown>>(req: AgentExecutionRequest): Promise<ApiResult<AgentExecutionResponse<T>>> {
    const { projectId, role, taskTitle, taskType, inputData } = req;

    // Step 1: Receive Task
    let agentId = req.agentId;
    if (!agentId) {
      const existing = await prisma.agent.findFirst({ where: { role } });
      if (existing) {
        agentId = existing.id;
      } else {
        const created = await prisma.agent.create({
          data: { name: `${role} AI`, role, status: 'WORKING', capabilities: AGENT_CONFIGS[role]?.capabilities ?? [] },
        });
        agentId = created.id;
      }
    } else {
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } }).catch(() => {});
    }

    await logAIEvent('EXECUTION_STARTED', { projectId, role, taskTitle }, agentId);

    try {
      // Step 2: Load Agent Definition
      const contract = AGENT_CONFIGS[role];
      if (!contract) {
        throw new Error(`No agent definition/contract found for role: ${role}`);
      }

      // Step 3: Load Required Knowledge
      const knowledge = loadKnowledgeForAgent(role);

      // Step 4: Load Project Context & Memory Layers (Short-Term, Long-Term, Learning Memory)
      const memory = getMemoryManager();
      const priorMemories = await memory.recall(agentId, taskTitle, 5);
      const priorLessons = await memory.getRelevantLessons(agentId, taskTitle, 3);

      const memoryContext = priorMemories.length
        ? `\n# Relevant Project Memory:\n${priorMemories.map((m) => `- [${m.type}] ${m.content}`).join('\n')}`
        : '';
      const lessonsContext = priorLessons.length
        ? `\n# Learning Memory (Past Mistakes & Lessons):\n${priorLessons.map((l) => `- ${l.content}`).join('\n')}`
        : '';

      const artifactManager = getArtifactManager();
      const recentArtifacts = await artifactManager.listProjectArtifacts(projectId);
      const artifactContext = recentArtifacts.slice(0, 3).map((a) => `- [${a.type}] ${a.title} (v${a.version}, ${a.status})`).join('\n');
      const projectContext = `\n# Project Context:\nRecent Artifacts:\n${artifactContext || 'None'}${memoryContext}${lessonsContext}`;

      // Steps 5-7: Analyze, Generate Solution, and Retry Loop (Max 3 attempts)
      let rawOutput: unknown = null;
      let outputObj: Record<string, unknown> = {};
      let qualityScore: { overall?: number; verdict?: string; [key: string]: unknown } | undefined = undefined;
      let contractValidation: { valid: boolean; violations: string[]; role: string } = { valid: false, violations: [], role };
      let attempt = 1;
      const maxRetries = 3;
      let feedbackContext = '';

      for (; attempt <= maxRetries; attempt++) {
        const systemPrompt = `${contract.systemPrompt}\n\n# Contract Obligations:\n- Mission: ${contract.mission}\n- Required Outputs: ${contract.outputs.join(', ')}\n- Forbidden Actions: ${contract.restrictions.join(', ')}${knowledge}`;
        const userPrompt = `Task: ${taskTitle}\n\nInput Data:\n${typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2)}${projectContext}${feedbackContext}\n\nAnalyze the requirements carefully, adhere strictly to your contract restrictions, work through your thinking checklist, and produce your complete structured JSON response including 'qualityScore'.`;

        const modelConfig: AgentModelConfig = {
          temperature: 0.2,
          maxTokens: 4096,
          models: [
            { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
            { provider: 'openai', model: 'gpt-4o' },
          ],
        };

        rawOutput = await aiCall<unknown>(
          userPrompt,
          systemPrompt,
          role,
          modelConfig,
          projectId,
          agentId,
        );

        outputObj = (typeof rawOutput === 'object' && rawOutput !== null ? rawOutput : { content: rawOutput }) as Record<string, unknown>;
        qualityScore = outputObj.qualityScore as { overall?: number; verdict?: string; [key: string]: unknown } | undefined;

        const contractDef = {
          role,
          title: contract.title,
          description: contract.description,
          identity: contract.identity,
          mission: contract.mission,
          expertise: contract.expertise ?? [],
          responsibilities: [],
          allowedActions: contract.tools ?? [],
          forbiddenActions: contract.restrictions ?? [],
          requiredInputs: contract.inputs ?? [],
          requiredOutputs: contract.outputs ?? [],
          qualityRules: contract.qualityCriteria ?? [],
          failureConditions: contract.failureConditions ?? [],
          recoveryRules: contract.recoveryRules ?? [],
          capabilities: contract.capabilities ?? [],
          systemPrompt: contract.systemPrompt,
        };

        contractValidation = validateAgentContract(contractDef, inputData, rawOutput);

        const hasScore = qualityScore && typeof qualityScore.overall === 'number' && typeof qualityScore.verdict === 'string';
        const isApproved = hasScore && qualityScore?.verdict === 'APPROVED';
        const isValid = hasScore && contractValidation.valid && isApproved;

        if (isValid || attempt === maxRetries) {
          break;
        }

        // Generate failure reason and feedback for retry
        const failureReason = !hasScore
          ? 'Missing mandatory valid qualityScore object (overall number and verdict string required).'
          : !contractValidation.valid
            ? `Contract violations found: ${contractValidation.violations.join('; ')}`
            : `Quality review verdict was ${qualityScore?.verdict}.`;

        await logAIEvent('EXECUTION_RETRY', { attempt, role, failureReason }, agentId);
        await memory.storeLesson(agentId, `Task "${taskTitle}" attempt ${attempt} failed: ${failureReason}`, 'Always strictly check output schemas and contract rules before submitting.');
        
        feedbackContext = `\n\n# ATTENTION: ATTEMPT ${attempt} FAILED\nReason: ${failureReason}\nYou MUST correct these issues on attempt ${attempt + 1}.`;
      }

      if (!qualityScore || typeof qualityScore.overall !== 'number' || typeof qualityScore.verdict !== 'string') {
        throw new ContractViolationError(`Agent "${role}" failed to provide a mandatory valid qualityScore object after ${attempt} attempts.`);
      }

      if (!contractValidation.valid) {
        throw new ContractViolationError(`Agent "${role}" violated contract rules after ${attempt} attempts: ${contractValidation.violations.join('; ')}`, contractValidation.violations);
      }

      // Step 7.5: Execute requested tools
      const toolResults: Array<{ tool: string; result: unknown; error?: string }> = [];
      if (Array.isArray(outputObj.tool_calls)) {
        for (const tc of outputObj.tool_calls) {
          if (typeof tc === 'object' && tc !== null && typeof tc.name === 'string') {
            try {
              const res = await executeAuthorizedTool(role, tc.name, tc.input ?? {}, { projectId });
              toolResults.push({ tool: tc.name, result: res });
              await logAIEvent('TOOL_EXECUTED', { tool: tc.name, success: true }, agentId);
            } catch (err) {
              toolResults.push({ tool: tc.name, result: null, error: err instanceof Error ? err.message : String(err) });
              await logAIEvent('TOOL_FAILED', { tool: tc.name, error: err instanceof Error ? err.message : String(err) }, agentId);
            }
          }
        }
      }

      // Append tool results to output for context
      if (toolResults.length > 0) {
        outputObj._toolResults = toolResults;
        rawOutput = outputObj;
      }

      // Step 8: Create Artifact
      const artifact = await artifactManager.createArtifact({
        projectId,
        title: taskTitle,
        type: taskType,
        owner: `${role} AI`,
        content: rawOutput,
        status: qualityScore.verdict === 'APPROVED' ? 'APPROVED' : 'REVIEW',
      });

      // Step 10: Store Memory (Short-Term / Long-Term)
      await memory.storeShortTerm(agentId, `Executed task "${taskTitle}" (${taskType}): verdict=${qualityScore.verdict} (score=${qualityScore.overall}, attempts=${attempt})`, {
        projectId,
        artifactId: artifact.id,
        contractValid: contractValidation.valid,
        attempts: attempt,
      });

      await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } }).catch(() => {});
      await logAIEvent('EXECUTION_COMPLETED', { projectId, role, artifactId: artifact.id, score: qualityScore.overall, attempts: attempt }, agentId);

      return {
        success: true,
        data: {
          artifactId: artifact.id,
          output: rawOutput as T,
          qualityScore: {
            overall: qualityScore.overall,
            verdict: qualityScore.verdict,
            ...qualityScore,
          },
          contractValid: contractValidation.valid,
          violations: contractValidation.violations,
        },
      };
    } catch (err) {
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } }).catch(() => {});
      await logAIEvent('EXECUTION_FAILED', { projectId, role, error: String(err) }, agentId);
      return {
        success: false,
        error: { message: err instanceof Error ? err.message : 'Execution failed', code: 'EXECUTION_ERROR' },
      };
    }
  }
}

let executionEngineInstance: AgentExecutionEngine | null = null;

export function getExecutionEngine(): AgentExecutionEngine {
  if (!executionEngineInstance) {
    executionEngineInstance = new AgentExecutionEngine();
  }
  return executionEngineInstance;
}
