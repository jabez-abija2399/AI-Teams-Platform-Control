import { describe, it, expect } from 'vitest';
import { CompanyMemoryService } from '../../src/core/memory/company-memory.service';
import { DecisionIntelligenceEngine } from '../../src/core/memory/decision-intelligence.engine';
import { AgentContextLoader } from '../../src/core/memory/agent-context-loader';
import { ChangeImpactAnalyzer } from '../../src/core/memory/change-impact-analyzer';
import { KnowledgeSearchService } from '../../src/core/memory/knowledge-search.service';

describe('Phase 25 — Shared Company Memory & Decision Intelligence', () => {
  const projectId = 'proj_memory_test';

  it('1. Company Memory Service reads, writes, and manages version history', async () => {
    const initial = await CompanyMemoryService.getMemory(projectId);
    expect(initial.version).toBeGreaterThanOrEqual(1);

    const updated = await CompanyMemoryService.updateMemory(projectId, {
      vision: 'AI Teams Platform — Enterprise Autonomous Engine',
      notes: ['Added Phase 25 Company Memory'],
    });

    expect(updated.data.vision).toBe('AI Teams Platform — Enterprise Autonomous Engine');
    expect(updated.version).toBe(initial.version + 1);
  });

  it('2. Decision Intelligence Engine records decisions with confidence scores', async () => {
    const decision = await DecisionIntelligenceEngine.recordDecision(
      projectId,
      'architecture',
      'Select Next.js 14 App Router',
      'Next.js 14',
      ['Vite React SPA', 'Express + Remix'],
      'Unified SSR and API routes',
      'ARCHITECT',
      0.96
    );

    expect(decision.category).toBe('architecture');
    expect(decision.confidenceScore).toBe(0.96);

    const list = await DecisionIntelligenceEngine.getDecisions(projectId, 'architecture');
    expect(list.length).toBeGreaterThan(0);
  });

  it('3. Agent Context Loader automatically assembles agent-specific execution context', async () => {
    const context = await AgentContextLoader.loadAgentContext(projectId, 'ARCHITECT');

    expect(context.projectId).toBe(projectId);
    expect(context.agentRole).toBe('ARCHITECT');
    expect(context.vision).toBeDefined();
    expect(context.constraints.length).toBeGreaterThan(0);
  });

  it('4. Change Impact Analyzer determines affected components, agents, and tasks', async () => {
    const result = await ChangeImpactAnalyzer.analyzeImpact(projectId, 'Migrate database schema from PostgreSQL to MongoDB');

    expect(result.affectedComponents.length).toBeGreaterThan(0);
    expect(result.affectedAgents).toContain('DATABASE');
    expect(result.recommendedActions.length).toBeGreaterThan(0);
  });

  it('5. Knowledge Search Service queries decisions and memory notes', async () => {
    const searchRes = await KnowledgeSearchService.queryKnowledge(projectId, 'Next.js');

    expect(searchRes.query).toBe('Next.js');
    expect(searchRes.confidence).toBeGreaterThan(0.7);
    expect(searchRes.answer).toBeDefined();
  });
});
