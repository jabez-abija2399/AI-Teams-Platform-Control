import { prisma } from '@/lib/prisma';
import { generateNextJsBaseFiles } from '@/lib/templates/nextjs-template';

export interface PreviewResult {
  type: 'HTML' | 'UNSUPPORTED';
  html?: string;
  reason?: string;
  files?: Record<string, string>;
}

/**
 * Builds a self-contained HTML preview page that uses Babel Standalone with the
 * react + typescript presets. This correctly handles TSX files with TypeScript
 * syntax (interfaces, type annotations, generics, enums, etc.) without any
 * regex-based stripping that would leave broken syntax.
 *
 * Key fixes vs the old approach:
 *  - `data-presets="react,typescript"` on the Babel script → full TS/TSX support
 *  - React loaded before Lucide so `window.React` is available for its UMD build
 *  - All Lucide icons spread into scope via `Object.assign(window, LucideReact)`
 */
export function buildBabelPreviewHtml(cleanedSource: string, css?: string, filePath?: string): string {
  const filePathJson = JSON.stringify(filePath ?? 'component.tsx');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com" crossorigin="anonymous" onerror="var el=document.getElementById('root');if(el&&!el.dataset.err)el.innerHTML='<div class=&quot;preview-error&quot;>Failed to load: Tailwind CSS CDN</div>'"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin="anonymous" onerror="var el=document.getElementById('root');if(el&&!el.dataset.err)el.innerHTML='<div class=&quot;preview-error&quot;>Failed to load: React CDN</div>'"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin="anonymous" onerror="var el=document.getElementById('root');if(el&&!el.dataset.err)el.innerHTML='<div class=&quot;preview-error&quot;>Failed to load: ReactDOM CDN</div>'"></script>
  <script>window.React = React; window.ReactDOM = ReactDOM;</script>
  <script src="https://unpkg.com/lucide-react@0.378.0/dist/umd/lucide-react.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin="anonymous" onerror="var el=document.getElementById('root');if(el&&!el.dataset.err)el.innerHTML='<div class=&quot;preview-error&quot;>Failed to load: Babel Standalone CDN</div>'"></script>
  <style>
    body { background-color: #ffffff; color: #0f172a; font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; min-height: 100vh; }
    ${css ?? ''}
    .preview-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center; color: #64748b; font-family: system-ui, sans-serif; }
    .preview-loading .spinner { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .preview-loading .label { font-size: 13px; color: #94a3b8; }
    .preview-error { padding: 1.5rem; margin: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; color: #991b1b; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="root">
    <div class="preview-loading">
      <div class="spinner"></div>
      <div class="label">Loading preview...</div>
    </div>
  </div>
  <script type="text/babel" data-presets="react,typescript">
    try {
      if (window.LucideReact) Object.assign(window, window.LucideReact);

    ${cleanedSource}

    const TargetComponent =
      typeof __defaultExport__ !== 'undefined' ? __defaultExport__ :
      typeof TodoApp !== 'undefined' ? TodoApp :
      typeof Home !== 'undefined' ? Home :
      typeof App !== 'undefined' ? App :
      typeof Page !== 'undefined' ? Page : null;

    if (TargetComponent) {
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(TargetComponent));
    } else {
      document.getElementById('root').innerHTML =
        '<div style="padding:2rem;color:#475569;font-family:sans-serif">' +
        '<h3 style="font-weight:700;font-size:16px">Component Ready</h3>' +
        '<p style="font-size:13px">No default export found in ' + ${filePathJson} + '.</p>' +
        '</div>';
    }
  } catch (err) {
    document.getElementById('root').innerHTML = '<div class="preview-error">Render error: ' + (err.message || String(err)) + '</div>';
  }
  </script>
</body>
</html>`;
}

/**
 * Ensures a project repository has all mandatory Next.js App Router scaffold files in Prisma DB.
 */
export async function ensureProjectNextJsScaffold(projectId: string): Promise<void> {
  try {
    let repo = await prisma.repository.findUnique({
      where: { projectId },
      include: { files: true },
    });

    if (!repo) {
      repo = await prisma.repository.create({
        data: {
          projectId,
          path: `/projects/${projectId}`,
          provider: 'internal',
        },
        include: { files: true },
      });
    }

    const hasPackageJson = repo.files.some((f) => f.path === 'package.json');
    if (!hasPackageJson) {
      console.log(`[PreviewBuilder] Project ${projectId} missing package.json. Auto-seeding Next.js App Router scaffold...`);
      const baseFiles = generateNextJsBaseFiles(projectId);

      for (const [path, content] of baseFiles.entries()) {
        const existing = repo.files.find((f) => f.path === path);
        if (!existing) {
          await prisma.file.create({
            data: {
              repositoryId: repo.id,
              path,
              content,
              language: path.endsWith('.ts') || path.endsWith('.tsx') ? 'typescript' : 'json',
            },
          });
        }
      }
    }
  } catch (err) {
    console.error(`[PreviewBuilder] Error ensuring Next.js scaffold for ${projectId}:`, err);
  }
}

export async function buildPreview(projectId: string): Promise<PreviewResult> {
  try {
    // 1. Auto-seed missing Next.js scaffold if needed
    await ensureProjectNextJsScaffold(projectId);

    const repository = await prisma.repository.findUnique({
      where: { projectId },
      include: { files: true },
    });

    if (repository && repository.files.length > 0) {
      const filesMap: Record<string, string> = {};
      for (const f of repository.files) {
        if (f.path === 'next.config.ts') {
          filesMap['next.config.mjs'] = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;`;
        } else {
          filesMap[f.path] = f.content;
        }
      }

      // Direct HTML file preview
      const htmlFile = repository.files.find((f) => f.path.endsWith('.html') || f.path === 'index.html');
      if (htmlFile) {
        const cssFile = repository.files.find((f) => f.path.endsWith('.css'));
        const jsFile = repository.files.find((f) => f.path.endsWith('.js') && !f.path.includes('config'));

        const html = htmlFile.content
          .replace('</head>', `${cssFile ? `<style>${cssFile.content}</style>` : ''}</head>`)
          .replace('</body>', `${jsFile ? `<script>${jsFile.content}</script>` : ''}</body>`);

        return { type: 'HTML', html, files: filesMap };
      }

      // Find primary React TSX/JSX file (e.g. src/components/todo-app.tsx, src/app/page.tsx, etc.)
      const tsxFile =
        repository.files.find((f) => f.path === 'src/components/todo-app.tsx') ||
        repository.files.find((f) => f.path === 'src/app/page.tsx') ||
        repository.files.find((f) => (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')) && !f.path.endsWith('layout.tsx'));

      const cssFile = repository.files.find((f) => f.path.endsWith('.css'));

      if (tsxFile) {
        const rawContent = tsxFile.content;

        const cleanedSource = rawContent
          .replace(/^import\s[^;]+;?\s*$/gm, '')
          .replace(/^export\s+default\s+function\s+(\w+)/gm, 'function $1')
          .replace(/^export\s+default\s+class\s+(\w+)/gm, 'class $1')
          .replace(/^export\s+default\s+(\w+)\s*;?\s*$/gm, 'const __defaultExport__ = $1;')
          .replace(/^export\s+\{[^}]*\bdefault\b[^}]*\}\s*;?\s*$/gm, '')
          .replace(/^export\s+(function|class|const|let|var)\s+/gm, '$1 ');

        const html = buildBabelPreviewHtml(cleanedSource, cssFile?.content, tsxFile.path);
        return { type: 'HTML', html, files: filesMap };
      }
    }
  } catch (err) {
    console.error(`[PreviewBuilder] Error querying DB files for ${projectId}:`, err);
  }

  // Default Next.js App Router Welcome Preview HTML
  const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #f8fafc; color: #0f172a; font-family: system-ui, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
  </style>
</head>
<body>
  <div style="text-align: center; padding: 2rem; max-w: 420px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.75rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">
    <div style="font-size: 36px; margin-bottom: 0.75rem;">🚀</div>
    <h2 style="font-size: 20px; font-weight: 700; color: #0284c7; margin-bottom: 0.5rem;">Next.js App Router Ready</h2>
    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 1.25rem;">
      Your project structure was auto-scaffolded with Next.js App Router! Edit files or prompt the AI team to render live components.
    </p>
    <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.75rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 9999px; font-size: 11px; font-family: monospace; color: #0369a1;">
      <span style="width: 6px; height: 6px; border-radius: 50%; background: #0284c7;"></span>
      <span>Next.js App Router Live Preview Active</span>
    </div>
  </div>
</body>
</html>`;

  return { type: 'HTML', html: defaultHtml };
}
