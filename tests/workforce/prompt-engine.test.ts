import { describe, it, expect } from 'vitest';
import { AgentPromptEngine } from '../../src/core/workforce/prompt/agent-prompt.engine';
import { PromptOptimizerService } from '../../src/core/workforce/prompt/prompt-optimizer.service';
import { ContextInjectorService } from '../../src/core/workforce/context/context-injector.service';

describe('Phase 28 Step 3 — Agent Prompt Intelligence Engine', () => {
  const projectId = 'proj_prompt_test';

  it('1. Generates structured system prompt for CEO role', async () => {
    const context = await ContextInjectorService.injectContextForTask(
      'task_ceo_1',
      'Strategic Vision Roadmap',
      'Define strategic goals',
      projectId
    );

    const generated = await AgentPromptEngine.generatePrompt(context, projectId);
    expect(generated.agentRole).toBe('CEO');
    expect(generated.systemPrompt).toContain('Chief Executive Officer');
    expect(generated.systemPrompt).toContain('Strategic Vision Roadmap');
    expect(generated.contextTokens).toBeGreaterThan(0);
  });

  it('2. Generates structured system prompt for Backend Engineer role', async () => {
    const context = await ContextInjectorService.injectContextForTask(
      'task_be_1',
      'REST API Handler & JWT Authentication',
      'Node.js endpoints',
      projectId
    );

    const generated = await AgentPromptEngine.generatePrompt(context, projectId);
    expect(generated.agentRole).toBe('BACKEND_ENGINEER');
    expect(generated.systemPrompt).toContain('Backend Engineer');
    expect(generated.systemPrompt).toContain('REST API Handler');
    expect(generated.systemPrompt).toContain('Security Checks Required');
  });

  it('3. Generates structured system prompt for QA Engineer role', async () => {
    const context = await ContextInjectorService.injectContextForTask(
      'task_qa_1',
      'Vitest Suite Execution and E2E Testing',
      'Automated testing',
      projectId
    );

    const generated = await AgentPromptEngine.generatePrompt(context, projectId);
    expect(generated.agentRole).toBe('QA_ENGINEER');
    expect(generated.systemPrompt).toContain('QA Automation Engineer');
    expect(generated.systemPrompt).toContain('Vitest Suite Coverage');
  });

  it('4. Prompt Optimizer deduplicates lines and compresses token overhead', () => {
    const raw = `
Line 1
Line 2
Line 1
Line 2
Line 3
    `.trim();

    const result = PromptOptimizerService.optimizePrompt(raw);
    expect(result.compressedPrompt).toContain('Line 1');
    expect(result.compressedPrompt).toContain('Line 3');
    expect(result.compressedLength).toBeLessThan(result.originalLength);
  });
});
