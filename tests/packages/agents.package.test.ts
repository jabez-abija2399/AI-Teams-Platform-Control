/**
 * @file agents.package.test.ts
 * @description Test suite verifying the @ai-teams/agents package, role instantiation, contracts, and execution.
 */

import { describe, it, expect } from 'vitest';
import {
  CeoAgent,
  ProductManagerAgent,
  ArchitectAgent,
  UIDesignerAgent,
  DeveloperAgent,
  QaEngineerAgent,
  SecurityAuditorAgent,
  DevopsEngineerAgent,
  ContractValidator,
  BusinessStrategySchema,
  ProductRequirementsDocSchema,
  ArchitectureSpecSchema,
  UIDesignSpecSchema,
  ImplementationDeliverableSchema,
  QAVerificationReportSchema,
  WorkingMemory,
  DecisionLog,
  ContextCompressor,
  PermissionGate,
  ModelRouter,
} from '@/packages/agents';

describe('@ai-teams/agents Package Architecture', () => {
  it('instantiates all 8 AI Employee Role Agents correctly', () => {
    const ceo = new CeoAgent();
    const pm = new ProductManagerAgent();
    const architect = new ArchitectAgent();
    const uiDesigner = new UIDesignerAgent();
    const developer = new DeveloperAgent();
    const qa = new QaEngineerAgent();
    const security = new SecurityAuditorAgent();
    const devops = new DevopsEngineerAgent();

    expect(ceo.roleId).toBe('ceo');
    expect(pm.roleId).toBe('product-manager');
    expect(architect.roleId).toBe('architect');
    expect(uiDesigner.roleId).toBe('ui-designer');
    expect(developer.roleId).toBe('developer');
    expect(qa.roleId).toBe('qa-engineer');
    expect(security.roleId).toBe('security-auditor');
    expect(devops.roleId).toBe('devops-engineer');
  });

  it('validates deliverable contracts using ContractValidator', () => {
    const sampleStrategy = {
      problemStatement: 'Manual invoice entry takes too much time.',
      targetAudience: ['Accountants', 'Freelancers'],
      uniqueValueProposition: '1-click AI receipt parsing with zero mistakes.',
      corePillars: ['Speed', 'Accuracy', 'Integration'],
      mvpScope: ['Receipt OCR', 'Export CSV'],
    };

    const result = ContractValidator.validate(BusinessStrategySchema, sampleStrategy);
    expect(result.success).toBe(true);
  });

  it('handles working memory and decision logs', () => {
    const memory = new WorkingMemory();
    memory.set('key1', 'value1');
    expect(memory.get('key1')).toBe('value1');

    const adr = DecisionLog.recordDecision({
      projectId: 'proj-123',
      agentRole: 'architect',
      title: 'Use Tailwind CSS',
      rationale: 'Fast atomic styling',
      decision: 'Tailwind adopted',
      consequences: ['Zero CSS bundle bloat'],
    });

    expect(adr.id).toBeDefined();
    expect(DecisionLog.getDecisions('proj-123')).toHaveLength(1);
  });

  it('compresses context and checks permission gates', () => {
    const compressed = ContextCompressor.compressText('line 1\nline 2\nline 3', 100);
    expect(compressed).toContain('line 1');

    expect(PermissionGate.isAuthorized('developer', 'file_writer')).toBe(true);
    expect(PermissionGate.isAuthorized('ceo', 'file_writer')).toBe(false);
  });

  it('routes models based on task requirements', () => {
    const strategyModel = ModelRouter.selectModel({ taskType: 'STRATEGY' });
    expect(strategyModel.modelName).toBe('gemini-2.5-pro');

    const devModel = ModelRouter.selectModel({ taskType: 'CODE_GENERATION' });
    expect(devModel.modelName).toBe('gemini-2.5-flash');
  });
});
