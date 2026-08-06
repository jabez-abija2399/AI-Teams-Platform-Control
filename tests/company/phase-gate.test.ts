import { describe, expect, it } from 'vitest';
import {
  isBlockingProviderError,
  resolveAgentFailure,
  validatePhaseDeliverable,
} from '@/core/company-orchestration/phase-gate';

describe('phase-gate', () => {
  it('treats credit exhaustion as blocking', () => {
    expect(isBlockingProviderError('Error 402 insufficient credit balance')).toBe(true);
    expect(isBlockingProviderError('out of credits')).toBe(true);
    expect(isBlockingProviderError('temporary network blip')).toBe(false);
  });

  it('does not allow empty development deliverables', () => {
    const gate = validatePhaseDeliverable('DEVELOPMENT_RUNNING', {
      summary: 'ok',
      files: [],
    });
    expect(gate.ok).toBe(false);
  });

  it('stops on credits instead of using fallback', () => {
    const result = resolveAgentFailure({
      phase: 'STRATEGY_RUNNING',
      errorMessage: '402 Payment Required — insufficient credits',
      fallback: () => ({ fake: true }),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.toLowerCase()).toMatch(/credit/);
    }
  });

  it('does not pass Development on explorerSynced alone', () => {
    const gate = validatePhaseDeliverable('DEVELOPMENT_RUNNING', {
      summary: 'ok',
      explorerSynced: true,
      files: [],
    });
    expect(gate.ok).toBe(false);
  });

  it('passes Development when files are listed', () => {
    const gate = validatePhaseDeliverable('DEVELOPMENT_RUNNING', {
      summary: 'Implemented landing page with real files for the user project',
      files: ['index.html', 'styles.css'],
      changes: [
        { file: 'index.html', code: '<html></html>' },
        { file: 'styles.css', code: 'body{}' },
      ],
    });
    expect(gate.ok).toBe(true);
  });

  it('allows heuristic fallback for non-blocking errors', () => {
    const result = resolveAgentFailure({
      phase: 'STRATEGY_RUNNING',
      errorMessage: 'model overloaded briefly',
      fallback: () => ({ vision: 'Ship the product', goals: ['MVP'] }),
    });
    expect(result.success).toBe(true);
  });

  it('strict mode blocks heuristics even for soft errors', () => {
    const result = resolveAgentFailure({
      phase: 'STRATEGY_RUNNING',
      errorMessage: 'model overloaded briefly',
      strictMode: true,
      fallback: () => ({ fake: true }),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.toLowerCase()).toMatch(/strict/);
    }
  });
});
