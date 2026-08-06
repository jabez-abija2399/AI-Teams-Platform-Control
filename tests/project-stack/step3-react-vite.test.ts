/**
 * Step 3 verification — React/Vite scaffold (no DB).
 */
import { describe, expect, it } from 'vitest';
import { buildHeuristicImplementation } from '@/ai/agents/roles/developer/developer.service';
import { buildReactViteFiles } from '@/ai/agents/roles/developer/react-vite-scaffold';

describe('Step 3 — React/Vite delivery', () => {
  it('buildReactViteFiles emits Vite app without Next.js', () => {
    const files = buildReactViteFiles('Team Board', 'react stack');
    expect(files['vite.config.ts']).toMatch(/@vitejs\/plugin-react/);
    expect(files['src/App.tsx']).toMatch(/export default function App/);
    expect(files['package.json']).toMatch(/"vite"/);
    expect(files['package.json']).not.toMatch(/"next"/);
    expect(Object.keys(files).some((p) => p.includes('next.config'))).toBe(false);
  });

  it('heuristic with react-vite stack does not invent Next App Router', () => {
    const out = buildHeuristicImplementation(
      { title: 'Team Tasks', overview: { title: 'React task board' } },
      undefined,
      { stack: 'react-vite', label: 'React (Vite SPA)', htmlCss: false },
    );
    const paths = out.changes.map((c) => c.file);
    expect(paths).toContain('vite.config.ts');
    expect(paths).toContain('src/App.tsx');
    expect(paths.some((p) => p.includes('src/app/'))).toBe(false);
    expect(out.report.notes.toLowerCase()).toMatch(/vite|react/);
  });
});
