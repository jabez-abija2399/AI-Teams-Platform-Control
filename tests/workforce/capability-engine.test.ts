import { describe, it, expect } from 'vitest';
import { AgentCapabilityEngine } from '../../src/core/workforce/capability/agent-capability.engine';

describe('Phase 28 Step 2 — Agent Capability Engine', () => {
  const projectId = 'proj_capability_test';

  it('1. Evaluates task capabilities against workspace profiles and returns primary and supporting agents', async () => {
    const res = await AgentCapabilityEngine.evaluateTaskCapability(
      {
        title: 'Evaluate Software System Architecture and Quality Scoring',
        description: 'Enforce modular boundaries and fullstack tech stack design',
      },
      projectId
    );

    expect(res.primaryAgent).toBe('SOFTWARE_ARCHITECT');
    expect(res.supportingReviewer).toBe('CEO');
    expect(res.matchScore).toBeGreaterThan(50);
    expect(res.confidenceScore).toBeGreaterThan(0.6);
  });
});
