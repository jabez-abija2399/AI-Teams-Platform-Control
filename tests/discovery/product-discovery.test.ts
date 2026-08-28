import { describe, it, expect } from 'vitest';
import { ProductDiscoveryAgent } from '../../src/packages/agents/roles/product-discovery/product-discovery.agent';

describe('Phase 20 — Product Discovery Agent', () => {
  it('should transform vague user prompt "I want a todo app" into structured ProductSpecification', async () => {
    const agent = new ProductDiscoveryAgent();
    const spec = await agent.discoverProductSpecification('I want a todo app');

    expect(spec.productName).toBe('TaskBoard');
    expect(spec.vision).toContain('todo app');
    expect(spec.problemStatement).toContain('I want a todo app');
    expect(spec.targetAudience).toBeDefined();
    expect(spec.platform).toBe('Web application');
    expect(spec.complexity).toBe('MVP');
    expect(spec.mvpFeatures.length).toBeGreaterThan(0);
    expect(spec.mvpFeatures.some(f => f.name === 'Create tasks')).toBe(true);
    expect(spec.futureFeatures.length).toBeGreaterThan(0);
  });

  it('should handle e-commerce ideas and generate targeted product specs', async () => {
    const agent = new ProductDiscoveryAgent();
    const spec = await agent.discoverProductSpecification('Build an e-commerce clothing store');

    expect(spec.productName).toBe('Storefront');
    expect(spec.mvpFeatures.some(f => f.name.includes('Cart and checkout'))).toBe(true);
  });

  it('should execute successfully within the agent framework', async () => {
    const agent = new ProductDiscoveryAgent();
    const res = await agent.execute('I want a dashboard for SaaS analytics');

    expect(res.success).toBe(true);
    expect(res.output).toContain('Want');
  });
});
