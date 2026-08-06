/**
 * Step 1 verification — stack defaults + HTML/CSS heuristic (no DB).
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROJECT_STACK,
  STACK_CATALOG,
  STACK_OPTIONS,
  detectStackFromFiles,
  constraintsForStack,
} from '@/core/project-stack/stack-catalog';
import { buildHeuristicImplementation } from '@/ai/agents/roles/developer/developer.service';
import { buildStaticHtmlCssFiles } from '@/ai/agents/roles/developer/static-html-scaffold';

describe('Step 1 — stack + HTML/CSS delivery', () => {
  it('defaults to recommended HTML/CSS for non-tech users', () => {
    expect(DEFAULT_PROJECT_STACK).toBe('static-html');
    expect(STACK_CATALOG['static-html'].recommended).toBe(true);
    expect(STACK_CATALOG['static-html'].isDefault).toBe(true);
    expect(STACK_OPTIONS[0]?.id).toBe('static-html');
  });

  it('detects static HTML from file paths', () => {
    const detected = detectStackFromFiles([
      'login.html',
      'signup.html',
      'home.html',
      'css/styles.css',
    ]);
    expect(detected.stack).toBe('static-html');
    expect(detected.confidence).toBe('high');
  });

  it('buildStaticHtmlCssFiles emits login/signup/home without frameworks', () => {
    const files = buildStaticHtmlCssFiles('Demo App', 'test hint');
    expect(files['login.html']).toBeTruthy();
    expect(files['signup.html']).toBeTruthy();
    expect(files['home.html']).toBeTruthy();
    expect(files['css/styles.css']).toBeTruthy();
    const blob = Object.values(files).join('\n');
    expect(blob).not.toMatch(/next\.config|from ['"]react['"]/);
  });

  it('heuristic with htmlCss stack produces static files only', () => {
    const out = buildHeuristicImplementation(
      { title: 'Hotel Login', overview: { title: 'Static login pages' } },
      undefined,
      { htmlCss: true, staticNoBackend: true },
    );
    expect(out.report.completed).toBe(true);
    expect(out.changes.some((c) => c.file === 'login.html')).toBe(true);
    expect(out.changes.some((c) => c.file.endsWith('.tsx'))).toBe(false);
    expect(out.report.notes.toLowerCase()).toMatch(/static|html/);
  });

  it('constraints for static-html forbid Next/React/backend', () => {
    const c = constraintsForStack('static-html').join('\n').toLowerCase();
    expect(c).toMatch(/no next/);
    expect(c).toMatch(/no react|no framework/);
    expect(c).toMatch(/no backend/);
  });
});
