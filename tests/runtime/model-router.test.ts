import { describe, it, expect } from 'vitest';
import { ModelRouterService } from '../../src/core/runtime/model-router.service';

describe('Phase 29 — Model Router Service', () => {
  it('1. Selects powerful model for CEO (high complexity)', () => {
    const config = ModelRouterService.selectModel('CEO', 'Strategic roadmap planning');
    expect(config.provider).toBe('ANTHROPIC');
    expect(config.model).toContain('claude');
  });

  it('2. Selects efficient model for UI_ENGINEER (low complexity)', () => {
    const config = ModelRouterService.selectModel('UI_ENGINEER', 'Style dashboard cards');
    expect(['gpt-4o-mini', 'claude-3-5-haiku-20241022']).toContain(config.model);
  });

  it('3. Routes security-related tasks to reasoning model', () => {
    const config = ModelRouterService.selectModel('BACKEND_ENGINEER', 'Security audit authentication');
    expect(config.model).toContain('claude');
  });

  it('4. Respects preferred provider override', () => {
    const config = ModelRouterService.selectModel('FRONTEND_ENGINEER', 'Build component', 'OPENAI');
    expect(config.provider).toBe('OPENAI');
  });
});
