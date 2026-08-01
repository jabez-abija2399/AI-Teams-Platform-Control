import { describe, it, expect } from 'vitest';
import { SpecificationEngine } from '../../src/core/specification/specification-engine';

describe('Phase 20 — Production Specification Engine', () => {
  it('should transform vague user idea into structured SRS specification', async () => {
    const rawIdea = 'Build an AI-powered e-commerce store with Stripe payment processing';
    const spec = await SpecificationEngine.generateSpecification('proj-spec-1', rawIdea);

    expect(spec.id).toBeDefined();
    expect(spec.executiveSummary).toContain('E-Commerce Platform');
    expect(spec.functionalRequirements.length).toBeGreaterThan(0);
    expect(spec.userStories.length).toBeGreaterThan(0);
    expect(spec.databaseRequirements.length).toBeGreaterThan(0);
    expect(spec.apiRequirements.length).toBeGreaterThan(0);
    expect(spec.knownRisks.length).toBeGreaterThan(0);
    expect(spec.openQuestions.length).toBeGreaterThan(0);
    expect(spec.isApproved).toBe(false);
  });

  it('should support human approval workflow', async () => {
    const rawIdea = 'SaaS Dashboard';
    const spec = await SpecificationEngine.generateSpecification('proj-spec-2', rawIdea);
    const approvedSpec = SpecificationEngine.approveSpecification(spec);

    expect(approvedSpec.isApproved).toBe(true);
    expect(approvedSpec.approvedAt).toBeDefined();
  });
});
