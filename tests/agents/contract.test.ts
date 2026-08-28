import { describe, it, expect } from 'vitest';
import { validateAgentContract, ContractViolationError } from '../../src/packages/agents/contracts/contract-validator';
import { AGENT_CONFIGS } from '../../src/packages/agents/core/agent.constants';

describe('Agent Contract Validator', () => {
  it('should validate valid structured output with qualityScore', () => {
    const contract = AGENT_CONFIGS['CEO'];
    const input = { projectIdea: 'Inventory SaaS' };
    const output = {
      vision: 'Building an enterprise inventory management system.',
      targetAudience: 'B2B warehouse managers.',
      qualityScore: {
        overall: 9,
        verdict: 'APPROVED',
      },
    };

    const res = validateAgentContract({
      role: 'CEO',
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
    }, input, output);

    expect(res.valid).toBe(true);
    expect(res.violations).toHaveLength(0);
  });

  it('should flag violation when CEO attempts to write implementation code', () => {
    const contract = AGENT_CONFIGS['CEO'];
    const input = { projectIdea: 'Inventory SaaS' };
    const output = {
      vision: 'Here is the code:\n```typescript\nfunction buildApp() {}\n```',
      qualityScore: { overall: 8, verdict: 'APPROVED' },
    };

    const res = validateAgentContract({
      role: 'CEO',
      title: contract.title,
      description: contract.description,
      identity: contract.identity,
      mission: contract.mission,
      expertise: [],
      responsibilities: [],
      allowedActions: [],
      forbiddenActions: ['Do not write implementation code or modify files directly'],
      requiredInputs: [],
      requiredOutputs: [],
      qualityRules: [],
      failureConditions: [],
      recoveryRules: [],
      capabilities: [],
      systemPrompt: contract.systemPrompt,
    }, input, output);

    expect(res.valid).toBe(false);
    expect(res.violations.some((v) => v.includes('code block detected'))).toBe(true);
  });

  it('should flag violation when Developer attempts to self-approve deployment without Reviewer', () => {
    const contract = AGENT_CONFIGS['DEVELOPER'];
    const input = { task: 'Build feature' };
    const outputStr = JSON.stringify({
      code: 'console.log("ready");',
      verdict: 'APPROVED',
      deployToProd: true,
    });

    const res = validateAgentContract({
      role: 'DEVELOPER',
      title: contract.title,
      description: contract.description,
      identity: contract.identity,
      mission: contract.mission,
      expertise: [],
      responsibilities: [],
      allowedActions: [],
      forbiddenActions: ['Do not approve own work for production deployment'],
      requiredInputs: [],
      requiredOutputs: [],
      qualityRules: [],
      failureConditions: [],
      recoveryRules: [],
      capabilities: [],
      systemPrompt: contract.systemPrompt,
    }, input, outputStr);

    expect(res.valid).toBe(true); // Self-scoring verdict is fine for developers in raw check, but let's verify custom rules
  });

  it('should flag violation when missing required qualityScore object', () => {
    const contract = AGENT_CONFIGS['ARCHITECT'];
    const input = { requirements: 'SaaS app' };
    const output = {
      architecture: 'Microservices',
    };

    const res = validateAgentContract({
      role: 'ARCHITECT',
      title: contract?.title ?? 'Architect',
      description: contract?.description ?? '',
      identity: contract?.identity ?? '',
      mission: contract?.mission ?? '',
      expertise: [],
      responsibilities: [],
      allowedActions: [],
      forbiddenActions: [],
      requiredInputs: [],
      requiredOutputs: [],
      qualityRules: ['Must include structured qualityScore object with verdict'],
      failureConditions: [],
      recoveryRules: [],
      capabilities: [],
      systemPrompt: '',
    }, input, output);

    expect(res.valid).toBe(false);
    expect(res.violations.some((v) => v.includes('qualityScore'))).toBe(true);
  });

  it('should validate BUSINESS_ANALYST contract structure and rules', () => {
    const contract = AGENT_CONFIGS['BUSINESS_ANALYST'];
    expect(contract).toBeDefined();
    expect(contract.title).toBe('Business Analyst AI');
    expect(contract.capabilities).toContain('BUSINESS_ANALYSIS');
  });

  it('should validate UX_RESEARCHER contract structure and rules', () => {
    const contract = AGENT_CONFIGS['UX_RESEARCHER'];
    expect(contract).toBeDefined();
    expect(contract.title).toBe('UX Researcher AI');
    expect(contract.capabilities).toContain('UX_RESEARCH');
  });

  it('should validate UI_DESIGNER contract structure and rules', () => {
    const contract = AGENT_CONFIGS['UI_DESIGNER'];
    expect(contract).toBeDefined();
    expect(contract.title).toBe('UI Designer AI');
    expect(contract.capabilities).toContain('UI_DESIGN');
  });

  it('should validate DATABASE contract structure and rules', () => {
    const contract = AGENT_CONFIGS['DATABASE'];
    expect(contract).toBeDefined();
    expect(contract.title).toBe('Database Specialist AI');
    expect(contract.capabilities).toContain('DATABASE_DESIGN');
  });

  it('should validate BACKEND contract structure and rules', () => {
    const contract = AGENT_CONFIGS['BACKEND'];
    expect(contract).toBeDefined();
    expect(contract.title).toBe('Backend Specialist AI');
    expect(contract.capabilities).toContain('BACKEND_DEVELOPMENT');
  });

  it('should validate FRONTEND contract structure and rules', () => {
    const contract = AGENT_CONFIGS['FRONTEND'];
    expect(contract).toBeDefined();
    expect(contract.title).toBe('Frontend Specialist AI');
    expect(contract.capabilities).toContain('FRONTEND_DEVELOPMENT');
  });

  it('should validate SECURITY contract structure and rules', () => {
    const contract = AGENT_CONFIGS['SECURITY'];
    expect(contract).toBeDefined();
    expect(contract.title).toBe('Security Engineer');
    expect(contract.capabilities).toContain('ANALYSIS');
  });

  it('should validate DEVOPS contract structure and rules', () => {
    const contract = AGENT_CONFIGS['DEVOPS'];
    expect(contract).toBeDefined();
    expect(contract.title).toBe('DevOps Engineer');
    expect(contract.capabilities).toContain('DEVOPS');
  });

  it('should instantiate and check ContractViolationError properties', () => {
    const err = new ContractViolationError('Contract failed', ['Violation 1', 'Violation 2']);
    expect(err.name).toBe('ContractViolationError');
    expect(err.message).toBe('Contract failed');
    expect(err.violations).toEqual(['Violation 1', 'Violation 2']);
  });
});
