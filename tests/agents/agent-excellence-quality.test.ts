import { describe, expect, it } from 'vitest';
import {
  composeWorldClassSystemPrompt,
  getWorldClassCharter,
} from '@/ai/agents/excellence/world-class-charter';
import { scoreAgentDeliverable } from '@/ai/agents/excellence/output-quality';
import { buildHeuristicArchitecture } from '@/ai/agents/roles/architect/architect.service';
import { buildHeuristicImplementation } from '@/ai/agents/roles/developer/developer.service';
import { buildStaticHtmlCssFiles } from '@/ai/agents/roles/developer/static-html-scaffold';

const FIXTURE =
  "i don't need next js or other framwork i need you to build only using html and css login and signup page static page no bakcned";

describe('Agent excellence — better-than-hire quality', () => {
  it('composes world-class charter into system prompts for every core role', () => {
    for (const role of [
      'CEO',
      'PRODUCT_MANAGER',
      'ARCHITECT',
      'DEVELOPER',
      'QA',
      'SECURITY',
      'DEVOPS',
      'UI_DESIGNER',
    ]) {
      const charter = getWorldClassCharter(role);
      expect(charter).toMatch(/World-Class Employee Standard/);
      expect(charter).toMatch(/better than a strong human hire/i);
      const composed = composeWorldClassSystemPrompt(role, 'ROLE PROMPT HERE');
      expect(composed).toContain('ROLE PROMPT HERE');
      expect(composed.indexOf('World-Class')).toBeLessThan(composed.indexOf('ROLE PROMPT HERE'));
    }
  });

  it('approves senior-quality static HTML deliverables', () => {
    const score = scoreAgentDeliverable({
      role: 'DEVELOPER',
      payload: {
        files: ['login.html', 'signup.html', 'home.html', 'css/styles.css'],
        notes: 'Static HTML/CSS package with accessible forms and Yacht Club tokens',
      },
      constraints: FIXTURE,
      mustInclude: ['login.html', 'signup.html'],
      mustExclude: ['next.config'],
    });
    expect(score.overall).toBeGreaterThanOrEqual(8);
    expect(score.verdict).toBe('APPROVED');
  });

  it('rejects invented Next.js for HTML-only requests', () => {
    const score = scoreAgentDeliverable({
      role: 'DEVELOPER',
      payload: {
        files: ['next.config.ts', 'src/app/page.tsx'],
        notes: 'improve user experience with scalable architecture best practices',
      },
      constraints: FIXTURE,
      mustInclude: ['login.html'],
      mustExclude: ['next.config'],
    });
    expect(score.verdict).not.toBe('APPROVED');
    expect(score.fidelity).toBeLessThan(8);
  });

  it('Developer heuristic attaches excellence qualityScore ≥ 8 for static path', () => {
    const arch = buildHeuristicArchitecture({ title: 'Login App' }, FIXTURE);
    const impl = buildHeuristicImplementation(arch, FIXTURE);
    expect(impl.qualityScore).toBeDefined();
    expect(impl.qualityScore!.overall).toBeGreaterThanOrEqual(8);
    expect(impl.qualityScore!.verdict).toBe('APPROVED');
  });

  it('static scaffold meets senior frontend a11y bar', () => {
    const files = buildStaticHtmlCssFiles('Login App', FIXTURE);
    expect(files['login.html']).toMatch(/skip-link/);
    expect(files['login.html']).toMatch(/autocomplete="username"/);
    expect(files['css/styles.css']).toMatch(/focus-visible/);
    expect(files['signup.html']).toMatch(/minlength="8"/);
  });
});
