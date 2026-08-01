import { describe, it, expect } from 'vitest';
import { ComponentRegistryService } from '../../src/core/component-intelligence/component-registry';

describe('Phase 29 — Component Intelligence System', () => {
  it('should recommend component reuse when similar component exists in registry', () => {
    const decision = ComponentRegistryService.searchOrCheckReuse('Build a real-time chat timeline feed');
    expect(decision.shouldReuse).toBe(true);
    expect(decision.matchedComponent?.name).toBe('AgentCollaborationTimeline');
    expect(decision.similarityScore).toBeGreaterThan(0.8);
  });

  it('should recommend generating a new component when no similar component exists', () => {
    const decision = ComponentRegistryService.searchOrCheckReuse('Build custom 3D WebGL particle simulator');
    expect(decision.shouldReuse).toBe(false);
  });
});
