import { describe, it, expect } from 'vitest';
import { AgentContractRegistry, CORE_AGENT_CONTRACTS } from '../../src/core/contracts/agent-registry';

describe('AgentContractRegistry & 5 Core Agent Boundaries', () => {
  it('should enforce strict contract boundaries for PM Agent', () => {
    const contract = AgentContractRegistry.getContract('PM');
    expect(contract.questionAnswered).toBe('WHAT are we building?');
    expect(AgentContractRegistry.isToolAuthorized('PM', 'FILE_READ')).toBe(true);
    expect(AgentContractRegistry.isToolAuthorized('PM', 'FILE_WRITE')).toBe(false);
    expect(AgentContractRegistry.isActionForbidden('PM', 'Write production code')).toBe(true);
  });

  it('should enforce strict contract boundaries for Architect Agent', () => {
    const contract = AgentContractRegistry.getContract('ARCHITECT');
    expect(contract.questionAnswered).toBe('HOW should the system technically work?');
    expect(AgentContractRegistry.isToolAuthorized('ARCHITECT', 'CODE_SEARCH')).toBe(true);
    expect(AgentContractRegistry.isToolAuthorized('ARCHITECT', 'TERMINAL_EXECUTE')).toBe(false);
    expect(AgentContractRegistry.isActionForbidden('ARCHITECT', 'Write production application code')).toBe(true);
  });

  it('should enforce strict contract boundaries for Designer Agent', () => {
    const contract = AgentContractRegistry.getContract('DESIGNER');
    expect(contract.questionAnswered).toBe('HOW should the user experience the product?');
    expect(AgentContractRegistry.isActionForbidden('DESIGNER', 'Write backend logic')).toBe(true);
  });

  it('should authorize implementation tools for Developer Agent', () => {
    const contract = AgentContractRegistry.getContract('DEVELOPER');
    expect(contract.questionAnswered).toBe('HOW do we implement the approved product?');
    expect(AgentContractRegistry.isToolAuthorized('DEVELOPER', 'FILE_WRITE')).toBe(true);
    expect(AgentContractRegistry.isToolAuthorized('DEVELOPER', 'TYPE_CHECK')).toBe(true);
    expect(AgentContractRegistry.isToolAuthorized('DEVELOPER', 'TEST_RUNNER')).toBe(true);
    expect(AgentContractRegistry.isActionForbidden('DEVELOPER', 'Rewrite entire project from scratch')).toBe(true);
  });

  it('should authorize verification tools for QA Agent', () => {
    const contract = AgentContractRegistry.getContract('QA');
    expect(contract.questionAnswered).toBe('DID we build the correct thing correctly?');
    expect(AgentContractRegistry.isToolAuthorized('QA', 'TYPE_CHECK')).toBe(true);
    expect(AgentContractRegistry.isToolAuthorized('QA', 'TEST_RUNNER')).toBe(true);
    expect(AgentContractRegistry.isToolAuthorized('QA', 'FILE_WRITE')).toBe(false);
  });
});
