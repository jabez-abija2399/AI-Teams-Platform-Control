import { describe, it, expect } from 'vitest';
import { createAgent, getAvailableRoles } from '../../src/packages/agents/manager/agent.registry';
import { ProviderNotFoundError } from '../../src/ai/errors/AIError';
import type { AgentRole } from '../../src/packages/agents/core/agent.types';

describe('Agent Registry', () => {
  const allRoles: AgentRole[] = [
    'CEO',
    'ARCHITECT',
    'DEVELOPER',
    'QA',
    'PRODUCT_MANAGER',
    'REVIEWER',
    'UI_UX',
    'DEVOPS',
    'DOCUMENTATION',
    'SECURITY',
    'OPERATIONS',
    'FRONTEND',
    'BACKEND',
    'DATABASE',
    'ARCHITECTURE_REVIEWER',
    'CODE_REVIEWER',
    'QUALITY_REVIEWER',
    'PRODUCT_DISCOVERY',
    'BUSINESS_ANALYST',
    'UX_RESEARCHER',
    'UI_DESIGNER',
  ];

  it('should list all available roles in getAvailableRoles', () => {
    const roles = getAvailableRoles();
    for (const role of allRoles) {
      expect(roles).toContain(role);
    }
  });

  it('should instantiate every registered specialist role without error', () => {
    for (const role of allRoles) {
      const agent = createAgent(role, `Test ${role}`);
      expect(agent).toBeDefined();
      expect(agent.role).toBe(role);
      expect(agent.name).toBe(`Test ${role}`);
    }
  });

  it('should throw ProviderNotFoundError when creating an unregistered role', () => {
    expect(() => createAgent('INVALID_ROLE' as AgentRole)).toThrow(ProviderNotFoundError);
  });
});
