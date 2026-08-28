import { describe, it, expect } from 'vitest';
import { loadKnowledgeForAgent } from '../../src/packages/agents/core/knowledge-loader';

describe('Knowledge Loader', () => {
  it('should load CEO strategy and product vision knowledge', () => {
    const knowledge = loadKnowledgeForAgent('CEO');
    expect(knowledge).toContain('Executive Strategy');
  });

  it('should load ARCHITECT system design knowledge', () => {
    const knowledge = loadKnowledgeForAgent('ARCHITECT');
    expect(knowledge).toContain('System Architecture');
  });

  it('should load engineering guidelines for DEVELOPER, FRONTEND, and BACKEND', () => {
    const devKnowledge = loadKnowledgeForAgent('DEVELOPER');
    const feKnowledge = loadKnowledgeForAgent('FRONTEND');
    const beKnowledge = loadKnowledgeForAgent('BACKEND');

    expect(devKnowledge).toContain('Software Development');
    expect(feKnowledge).toContain('Frontend Engineering');
    expect(beKnowledge).toContain('Backend Engineering');
  });

  it('should return default guidelines for unrecognized or unconfigured role', () => {
    const knowledge = loadKnowledgeForAgent('UNKNOWN_ROLE' as any);
    expect(knowledge).toContain('General AI Guidelines');
  });
});
