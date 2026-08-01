import { describe, it, expect } from 'vitest';
import { CapabilityMatcherService } from '../../src/core/workforce/capability/capability-matcher.service';

describe('Phase 28 Step 2 — Capability Matcher Service', () => {
  it('1. Matches backend route handler tasks to BACKEND_ENGINEER with SOFTWARE_ARCHITECT reviewer', () => {
    const match = CapabilityMatcherService.matchTask({
      title: 'Develop REST API Route Handler and JWT Authentication',
      description: 'Node.js server endpoints and controller logic',
    });

    expect(match.primaryAgent).toBe('BACKEND_ENGINEER');
    expect(match.supportingReviewer).toBe('SOFTWARE_ARCHITECT');
    expect(match.confidenceScore).toBeGreaterThan(0.5);
  });

  it('2. Matches unit test tasks to QA_ENGINEER with SECURITY_ENGINEER reviewer', () => {
    const match = CapabilityMatcherService.matchTask({
      title: 'Run Vitest Suite Execution and E2E automation',
      description: 'Verify bug classification and test coverage',
    });

    expect(match.primaryAgent).toBe('QA_ENGINEER');
    expect(match.supportingReviewer).toBe('SECURITY_ENGINEER');
  });
});
