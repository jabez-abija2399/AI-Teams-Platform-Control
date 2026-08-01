import { describe, it, expect } from 'vitest';
import { CapabilityScoreService } from '../../src/core/workforce/capability/capability-score.service';

describe('Phase 28 Step 2 — Capability Score Service', () => {
  it('1. Calculates high match score for database tasks against DATABASE_ENGINEER role', () => {
    const scores = CapabilityScoreService.calculateScores({
      title: 'Design PostgreSQL Database Schema and Prisma migration',
      description: 'Create relational models and tables',
    });

    const dbScore = scores.find((s) => s.role === 'DATABASE_ENGINEER');
    expect(dbScore).toBeDefined();
    expect(dbScore?.matchScore).toBeGreaterThan(60);
    expect(dbScore?.confidenceScore).toBeGreaterThan(0.5);
  });

  it('2. Calculates high match score for React UI tasks against FRONTEND_ENGINEER or UI_ENGINEER', () => {
    const scores = CapabilityScoreService.calculateScores({
      title: 'Build React UI Component with CSS glassmorphism styling',
      description: 'Responsive frontend layout and design theme',
    });

    const topMatch = scores[0];
    expect(topMatch).toBeDefined();
    expect(['FRONTEND_ENGINEER', 'UI_ENGINEER']).toContain(topMatch?.role);
    expect(topMatch?.matchScore).toBeGreaterThan(50);
  });
});
