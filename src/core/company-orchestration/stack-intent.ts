/**
 * Canonical stack intent for the whole AI company.
 * All agents should call resolveStackIntent(...) so Discovery → Deploy stay aligned.
 */

import {
  feedbackBlob,
  wantsHtmlCssStack,
  wantsStaticNoBackend,
} from './revision-feedback';

export type DeliveryStack = 'static-html' | 'html-css-server' | 'react-vite' | 'nextjs';

export interface StackIntent {
  /** Plain HTML/CSS (no React/Next). */
  htmlCss: boolean;
  /** No Express/PHP/DB/API — static files only. */
  staticNoBackend: boolean;
  /** Preferred delivery stack for heuristics + codegen. */
  stack: DeliveryStack;
  /** Human-readable constraints to embed in CEO/PM docs. */
  constraints: string[];
  /** Short label for UI / notes. */
  label: string;
}

export function resolveStackIntent(...parts: unknown[]): StackIntent {
  const htmlCss = wantsHtmlCssStack(...parts);
  const staticNoBackend = wantsStaticNoBackend(...parts);

  let stack: DeliveryStack = 'nextjs';
  if (htmlCss && staticNoBackend) stack = 'static-html';
  else if (htmlCss) stack = 'html-css-server';

  const constraints: string[] = [];
  if (stack === 'static-html') {
    constraints.push(
      'Deliver static HTML + CSS only (login.html, signup.html, home.html)',
      'No Next.js, no React, no framework',
      'No backend, no database, no API server',
    );
  } else if (stack === 'html-css-server') {
    constraints.push(
      'UI is plain HTML + CSS (no Next.js / React)',
      'Optional small classic server for forms only if required',
    );
  }

  const label =
    stack === 'static-html'
      ? 'Static HTML/CSS (no backend)'
      : stack === 'html-css-server'
        ? 'HTML/CSS + optional server'
        : 'Next.js full-stack';

  return { htmlCss, staticNoBackend, stack, constraints, label };
}

/** True when file map invents a forbidden stack for static-html intent. */
export function detectStackMismatch(
  intent: StackIntent,
  filePaths: string[],
): { mismatch: boolean; reasons: string[] } {
  if (intent.stack === 'nextjs' || intent.stack === 'react-vite') {
    return { mismatch: false, reasons: [] };
  }

  const paths = filePaths.map((p) => p.replace(/\\/g, '/').toLowerCase());
  const reasons: string[] = [];

  const hasNext =
    paths.some((p) => p.includes('next.config')) ||
    paths.some((p) => p.endsWith('package.json') && paths.some((q) => q.includes('src/app/'))) ||
    paths.some((p) => p.endsWith('.tsx') || p.endsWith('.jsx'));

  const hasHtml = paths.some((p) => p.endsWith('.html'));

  if (intent.htmlCss && hasNext && !hasHtml) {
    reasons.push(
      'Stack mismatch: architecture/user asked for HTML/CSS but codebase is Next/React without HTML pages',
    );
  }

  if (intent.staticNoBackend) {
    const serverish = paths.some(
      (p) =>
        p.includes('prisma/') ||
        p.includes('src/app/api/') ||
        p.endsWith('server.js') ||
        p.endsWith('server.ts') ||
        p.includes('express'),
    );
    if (serverish) {
      reasons.push(
        'Stack mismatch: user asked for no backend but server/API/database files are present',
      );
    }
    if (!hasHtml) {
      reasons.push(
        'Stack mismatch: static HTML/CSS deliverable requires .html files (e.g. login.html)',
      );
    }
  }

  return { mismatch: reasons.length > 0, reasons };
}

/** Prefer these preview entry files for static stacks. */
export function preferredStaticPreviewPaths(): string[] {
  return ['index.html', 'login.html', 'home.html', 'signup.html'];
}

export function summarizeIntentForAgents(intent: StackIntent): string {
  if (intent.constraints.length === 0) return '';
  return `STACK CONSTRAINTS (${intent.label}):\n- ${intent.constraints.join('\n- ')}`;
}

export { feedbackBlob, wantsHtmlCssStack, wantsStaticNoBackend };
