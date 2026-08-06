import { describe, expect, it } from 'vitest';
import {
  assembleStaticHtmlPreview,
  runStaticSmokeCheck,
} from '@/features/workspace/preview/services/preview-builder.service';
import { detectStackFromFiles } from '@/core/project-stack/stack-catalog';

describe('Stack detection (honest)', () => {
  it('detects static HTML from .html files without Next', () => {
    const d = detectStackFromFiles(['index.html', 'login.html', 'css/styles.css']);
    expect(d.stack).toBe('static-html');
    expect(d.confidence).toMatch(/high|medium/);
  });

  it('detects Next.js from next.config + package.json', () => {
    const d = detectStackFromFiles(
      ['next.config.ts', 'src/app/page.tsx', 'package.json'],
      JSON.stringify({ dependencies: { next: '15.0.0', react: '19.0.0' } }),
    );
    expect(d.stack).toBe('nextjs');
    expect(d.confidence).toBe('high');
  });

  it('detects Vite React SPA', () => {
    const d = detectStackFromFiles(
      ['vite.config.ts', 'src/App.tsx', 'package.json'],
      JSON.stringify({
        dependencies: { react: '18.0.0', 'react-dom': '18.0.0' },
        devDependencies: { vite: '5.0.0' },
      }),
    );
    expect(d.stack).toBe('react');
    expect(d.confidence).toBe('high');
  });

  it('detects React without Next', () => {
    const d = detectStackFromFiles(
      ['src/App.tsx', 'package.json'],
      JSON.stringify({ dependencies: { react: '18.0.0', 'react-dom': '18.0.0' } }),
    );
    expect(d.stack).toBe('react');
  });

  it('returns unknown for mixed HTML + TSX', () => {
    const d = detectStackFromFiles(['login.html', 'src/app/page.tsx']);
    expect(d.stack).toBe('unknown');
    expect(d.confidence).toBe('low');
  });
});

describe('Static HTML assembly still works when stack is HTML', () => {
  it('inlines CSS', () => {
    const files = {
      'login.html': `<!DOCTYPE html><html><head><link rel="stylesheet" href="css/styles.css" /></head><body></body></html>`,
      'css/styles.css': 'body{color:#245f73}',
    };
    const html = assembleStaticHtmlPreview(files['login.html']!, files, 'login.html');
    expect(html).toContain('color:#245f73');
  });

  it('smoke check for HTML package', () => {
    const smoke = runStaticSmokeCheck({
      'index.html': '<!DOCTYPE html><html><body></body></html>',
      'login.html': '<!DOCTYPE html><html><body></body></html>',
      'css/styles.css': 'body{}',
    });
    expect(smoke.ok).toBe(true);
  });
});
