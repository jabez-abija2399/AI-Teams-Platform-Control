import { prisma } from '@/lib/prisma';
import { generateNextJsBaseFiles } from '@/lib/templates/nextjs-template';
import { preferredStaticPreviewPaths } from '@/core/company-orchestration/stack-intent';
import { getProjectStackState } from '@/core/project-stack/project-stack.service';
import {
  getStackCatalogEntry,
  DEFAULT_PROJECT_STACK,
  type ProjectStackId,
  type PreviewStrategy,
} from '@/core/project-stack/stack-catalog';

export type PreviewMode = 'static' | 'babel' | 'webcontainer' | 'choose';

export interface PreviewSmokeResult {
  ok: boolean;
  checks: { id: string; pass: boolean; detail: string }[];
}

export interface PreviewStackInfo {
  id: ProjectStackId;
  label: string;
  shortLabel: string;
  honesty: string;
  speed: string;
  strategy: PreviewStrategy;
  confirmed: boolean;
  needsConfirmation: boolean;
  detected: {
    stack: ProjectStackId;
    confidence: string;
    rationale: string;
    signals: string[];
  };
  catalog: {
    id: ProjectStackId;
    label: string;
    shortLabel: string;
    description: string;
    honesty: string;
    speed: string;
    usesWebContainer: boolean;
  }[];
}

export interface PreviewResult {
  type: 'HTML' | 'UNSUPPORTED' | 'NEEDS_STACK';
  mode: PreviewMode;
  html?: string;
  reason?: string;
  /** Included when WebContainer should boot (Next / Vite). */
  files?: Record<string, string>;
  entryPath?: string;
  constraintLabel?: string;
  smoke?: PreviewSmokeResult;
  stack: PreviewStackInfo;
  /** True when Fast (instant) preview is available for this stack. */
  fastAvailable?: boolean;
  /** True when Full (WebContainer) preview is available. */
  fullAvailable?: boolean;
  /** Which speed path was used for this response. */
  speed?: 'fast' | 'full';
}

export interface BuildPreviewOptions {
  entryPath?: string | null;
  smoke?: boolean;
  /** Force run even if user has not confirmed (uses effective/detected). */
  skipConfirmation?: boolean;
  /**
   * Prefer instant preview (srcDoc / Babel) over WebContainer.
   * Default true for production UX — Full mode boots container when needed.
   */
  preferFast?: boolean;
}

export function buildBabelPreviewHtml(cleanedSource: string, css?: string, filePath?: string): string {
  const filePathJson = JSON.stringify(filePath ?? 'component.tsx');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin="anonymous"></script>
  <script>window.React = React; window.ReactDOM = ReactDOM;</script>
  <script src="https://unpkg.com/lucide-react@0.378.0/dist/umd/lucide-react.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin="anonymous"></script>
  <style>
    body { background-color: #ffffff; color: #1a3339; font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; min-height: 100vh; }
    ${css ?? ''}
    .preview-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center; color: #4a5f66; }
    .preview-error { padding: 1.5rem; margin: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; color: #991b1b; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="root"><div class="preview-loading"><div class="label">Loading preview...</div></div></div>
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
        '<div style="padding:2rem;color:#475569;font-family:sans-serif"><h3>Component Ready</h3><p>No default export in ' + ${filePathJson} + '.</p></div>';
    }
  } catch (err) {
    document.getElementById('root').innerHTML = '<div class="preview-error">Render error: ' + (err.message || String(err)) + '</div>';
  }
  </script>
</body>
</html>`;
}

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

export function assembleStaticHtmlPreview(
  htmlContent: string,
  filesMap: Record<string, string>,
  entryPath: string,
): string {
  let html = htmlContent;

  html = html.replace(
    /<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi,
    (_match, href: string) => {
      const normalized = href.replace(/^\.\//, '');
      const css =
        filesMap[normalized] ||
        filesMap[`css/${normalized}`] ||
        Object.entries(filesMap).find(([p]) => p.endsWith(normalized) || p.endsWith(`/${normalized}`))?.[1];
      return css ? `<style data-inlined="${normalized}">${css}</style>` : _match;
    },
  );

  if (!/<style[\s>]/i.test(html)) {
    const cssFile =
      filesMap['css/styles.css'] ||
      Object.entries(filesMap).find(([p]) => p.endsWith('.css'))?.[1];
    if (cssFile) {
      html = html.includes('</head>')
        ? html.replace('</head>', `<style>${cssFile}</style></head>`)
        : `<style>${cssFile}</style>${html}`;
    }
  }

  const htmlPages = Object.keys(filesMap).filter((p) => p.endsWith('.html'));
  if (htmlPages.length > 1) {
    const pageMap: Record<string, string> = {};
    for (const path of htmlPages) {
      const assembled = assembleStaticHtmlPreviewOnce(filesMap[path]!, filesMap);
      pageMap[path.split('/').pop()!] = assembled;
      pageMap[path] = assembled;
    }
    const bridge = `<script>
(function(){
  var PAGES = ${JSON.stringify(pageMap)};
  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
    var key = href.replace(/^\\.\\//,'').split('?')[0].split('#')[0];
    var next = PAGES[key] || PAGES[key.split('/').pop()];
    if (next) {
      e.preventDefault();
      document.open();
      document.write(next);
      document.close();
    }
  }, true);
})();
</script>`;
    html = html.includes('</body>')
      ? html.replace('</body>', `${bridge}</body>`)
      : `${html}${bridge}`;
  }

  if (!html.includes('data-preview-entry')) {
    html = html.replace('<html', `<html data-preview-entry="${entryPath}"`);
  }

  return html;
}

function assembleStaticHtmlPreviewOnce(
  htmlContent: string,
  filesMap: Record<string, string>,
): string {
  let html = htmlContent;
  html = html.replace(
    /<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi,
    (_match, href: string) => {
      const normalized = href.replace(/^\.\//, '');
      const css =
        filesMap[normalized] ||
        filesMap[`css/${normalized}`] ||
        Object.entries(filesMap).find(([p]) => p.endsWith(normalized))?.[1];
      return css ? `<style>${css}</style>` : _match;
    },
  );
  if (!/<style[\s>]/i.test(html)) {
    const cssFile = filesMap['css/styles.css'];
    if (cssFile) {
      html = html.includes('</head>')
        ? html.replace('</head>', `<style>${cssFile}</style></head>`)
        : `<style>${cssFile}</style>${html}`;
    }
  }
  return html;
}

export function runStaticSmokeCheck(
  filesMap: Record<string, string>,
  entryPath?: string,
): PreviewSmokeResult {
  const checks: PreviewSmokeResult['checks'] = [];
  const paths = Object.keys(filesMap);
  const preferred = preferredStaticPreviewPaths();
  const hasPreferred = preferred.some((p) => paths.includes(p) || paths.some((x) => x.endsWith(`/${p}`)));
  checks.push({
    id: 'preferred-pages',
    pass: hasPreferred || paths.some((p) => p.endsWith('.html')),
    detail: hasPreferred
      ? 'Found preferred HTML entry pages'
      : paths.some((p) => p.endsWith('.html'))
        ? 'HTML pages present'
        : 'No HTML pages found',
  });

  const hasCss = paths.some((p) => p.endsWith('.css'));
  checks.push({
    id: 'css',
    pass: hasCss,
    detail: hasCss ? 'CSS stylesheet present' : 'No CSS file found',
  });

  const entry =
    entryPath && filesMap[entryPath]
      ? entryPath
      : preferred.find((p) => filesMap[p]) || paths.find((p) => p.endsWith('.html'));
  const html = entry ? filesMap[entry] : '';
  const parses =
    !!html &&
    (/<!DOCTYPE html>/i.test(html) || /<html[\s>]/i.test(html)) &&
    /<\/html>/i.test(html);
  checks.push({
    id: 'html-parse',
    pass: parses,
    detail: parses ? `Entry ${entry} looks like valid HTML` : 'Entry HTML missing doctype/html tags',
  });

  return { ok: checks.every((c) => c.pass), checks };
}

function toStackInfo(
  state: Awaited<ReturnType<typeof getProjectStackState>>,
  effectiveId: ProjectStackId,
): PreviewStackInfo {
  const entry = getStackCatalogEntry(effectiveId === 'unknown' ? 'static-html' : effectiveId);
  return {
    id: effectiveId,
    label: entry?.label ?? 'Choose stack',
    shortLabel: entry?.shortLabel ?? 'Stack',
    honesty: entry?.honesty ?? 'Confirm a stack so Preview knows how to run.',
    speed: entry?.speed ?? '—',
    strategy: entry?.previewStrategy ?? 'srcdoc-static',
    confirmed: Boolean(state.confirmed),
    needsConfirmation: state.needsConfirmation,
    detected: {
      stack: state.detected.stack,
      confidence: state.detected.confidence,
      rationale: state.detected.rationale,
      signals: state.detected.signals,
    },
    catalog: state.catalog.map((c) => ({
      id: c.id,
      label: c.label,
      shortLabel: c.shortLabel,
      description: c.description,
      honesty: c.honesty,
      speed: c.speed,
      usesWebContainer: c.usesWebContainer,
    })),
  };
}

function brandEmptyHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { background: #f2f0ef; color: #1a3339; font-family: Georgia, serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
  </style>
</head>
<body>
  <div style="text-align:center;padding:2rem;max-width:420px">
    <p style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#245f73;font-weight:700;font-family:system-ui,sans-serif">Preview</p>
    <h2 style="font-size:1.35rem;color:#245f73;margin:0.5rem 0">${title}</h2>
    <p style="font-size:0.95rem;color:#4a5f66;line-height:1.5;font-family:system-ui,sans-serif">${body}</p>
  </div>
</body>
</html>`;
}

export async function buildPreview(
  projectId: string,
  options: BuildPreviewOptions = {},
): Promise<PreviewResult> {
  const preferFast = options.preferFast !== false; // default Fast
  const stackState = await getProjectStackState(projectId);

  // Soft-resolve stack — never block Preview. Confirmed wins; else detect; else default.
  const softStack: ProjectStackId =
    stackState.confirmed ??
    (stackState.detected.confidence === 'high' && stackState.detected.stack !== 'unknown'
      ? stackState.detected.stack
      : stackState.detected.stack !== 'unknown'
        ? stackState.detected.stack
        : DEFAULT_PROJECT_STACK);

  const activeStack: ProjectStackId = softStack === 'unknown' ? DEFAULT_PROJECT_STACK : softStack;

  const catalog = getStackCatalogEntry(activeStack)!;
  const stackInfo = toStackInfo(stackState, activeStack);

  try {
    // Backfill empty Explorer so Complete projects still preview
    let repository = await prisma.repository.findUnique({
      where: { projectId },
      include: { files: true },
    });

    if (!repository || repository.files.length === 0) {
      // Do NOT invent scaffold files here — empty Preview is correct until Development writes.
      return {
        type: 'UNSUPPORTED',
        mode: catalog.previewStrategy === 'webcontainer' ? 'webcontainer' : 'static',
        reason:
          'No files in this project yet. Resume Development from Mission Control to generate them.',
        constraintLabel: catalog.label,
        stack: stackInfo,
        fastAvailable: false,
        fullAvailable: false,
        speed: preferFast ? 'fast' : 'full',
        html: brandEmptyHtml(
          'No project files yet',
          'Resume Development from Mission Control so the Developer agent writes files for this project only.',
        ),
      };
    }

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

    // ── Static HTML/CSS ──────────────────────────────────────────
    if (activeStack === 'static-html') {
      const preferred = preferredStaticPreviewPaths();
      const requested = options.entryPath?.replace(/^\//, '') || null;
      const htmlFile =
        (requested &&
          repository.files.find(
            (f) => f.path === requested || f.path.endsWith(`/${requested}`),
          )) ||
        preferred
          .map((name) =>
            repository.files.find((f) => f.path === name || f.path.endsWith(`/${name}`)),
          )
          .find(Boolean) ||
        repository.files.find((f) => f.path.endsWith('.html'));

      if (!htmlFile) {
        return {
          type: 'UNSUPPORTED',
          mode: 'static',
          reason: 'Stack is HTML/CSS but no .html files found — generate pages or change stack',
          constraintLabel: catalog.label,
          stack: stackInfo,
          fastAvailable: true,
          fullAvailable: false,
          speed: 'fast',
          smoke: options.smoke ? runStaticSmokeCheck(filesMap) : undefined,
          html: brandEmptyHtml(
            'No HTML pages yet',
            'Your stack is HTML/CSS. Sync Explorer or run Development to generate login/home pages.',
          ),
        };
      }

      const html = assembleStaticHtmlPreview(htmlFile.content, filesMap, htmlFile.path);
      return {
        type: 'HTML',
        mode: 'static',
        html,
        entryPath: htmlFile.path,
        constraintLabel: catalog.label,
        stack: stackInfo,
        fastAvailable: true,
        fullAvailable: false,
        speed: 'fast',
        smoke: options.smoke ? runStaticSmokeCheck(filesMap, htmlFile.path) : undefined,
      };
    }

    // ── React (Fast Babel · Full Vite WebContainer) ───────────────
    if (activeStack === 'react') {
      const hasVite =
        Boolean(filesMap['vite.config.ts'] || filesMap['vite.config.js'] || filesMap['vite.config.mjs']) ||
        (() => {
          try {
            const pkg = JSON.parse(filesMap['package.json'] || '{}');
            return Boolean(pkg.dependencies?.vite || pkg.devDependencies?.vite);
          } catch {
            return false;
          }
        })();

      const tsxFile =
        repository.files.find((f) => f.path === 'src/App.tsx' || f.path === 'App.tsx') ||
        repository.files.find((f) => f.path === 'src/main.tsx') ||
        repository.files.find((f) => f.path === 'src/components/todo-app.tsx') ||
        repository.files.find(
          (f) =>
            (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')) &&
            !f.path.endsWith('layout.tsx'),
        );
      const cssFile = repository.files.find((f) => f.path.endsWith('.css'));

      let babelHtml: string | undefined;
      if (tsxFile) {
        const cleanedSource = tsxFile.content
          .replace(/^import\s[^;]+;?\s*$/gm, '')
          .replace(/^export\s+default\s+function\s+(\w+)/gm, 'function $1')
          .replace(/^export\s+default\s+class\s+(\w+)/gm, 'class $1')
          .replace(/^export\s+default\s+(\w+)\s*;?\s*$/gm, 'const __defaultExport__ = $1;')
          .replace(/^export\s+\{[^}]*\bdefault\b[^}]*\}\s*;?\s*$/gm, '')
          .replace(/^export\s+(function|class|const|let|var)\s+/gm, '$1 ');
        babelHtml = buildBabelPreviewHtml(cleanedSource, cssFile?.content, tsxFile.path);
      }

      const canFull = hasVite && Boolean(filesMap['package.json']);
      const canFast = Boolean(babelHtml);

      if (preferFast && canFast) {
        return {
          type: 'HTML',
          mode: 'babel',
          html: babelHtml,
          files: canFull ? filesMap : undefined,
          entryPath: tsxFile?.path,
          constraintLabel: catalog.label,
          stack: stackInfo,
          fastAvailable: true,
          fullAvailable: canFull,
          speed: 'fast',
        };
      }

      if (canFull && !preferFast) {
        return {
          type: 'HTML',
          mode: 'webcontainer',
          html:
            babelHtml ||
            brandEmptyHtml(
              'Starting Vite…',
              'Full preview installs dependencies in WebContainer (~20–60s first boot).',
            ),
          files: filesMap,
          entryPath: tsxFile?.path,
          constraintLabel: catalog.label,
          stack: { ...stackInfo, strategy: 'webcontainer' },
          fastAvailable: canFast,
          fullAvailable: true,
          speed: 'full',
        };
      }

      if (canFull) {
        return {
          type: 'HTML',
          mode: 'webcontainer',
          html:
            babelHtml ||
            brandEmptyHtml('Starting Vite…', 'WebContainer boot in progress.'),
          files: filesMap,
          entryPath: tsxFile?.path,
          constraintLabel: catalog.label,
          stack: { ...stackInfo, strategy: 'webcontainer' },
          fastAvailable: canFast,
          fullAvailable: true,
          speed: 'full',
        };
      }

      if (!tsxFile) {
        return {
          type: 'UNSUPPORTED',
          mode: 'babel',
          reason: 'Stack is React but no .tsx/.jsx component (and no Vite app) found',
          constraintLabel: catalog.label,
          stack: stackInfo,
          fastAvailable: false,
          fullAvailable: false,
          speed: 'fast',
          html: brandEmptyHtml('No React UI yet', 'Generate components, then Preview will run instantly.'),
        };
      }

      return {
        type: 'HTML',
        mode: 'babel',
        html: babelHtml,
        entryPath: tsxFile.path,
        constraintLabel: catalog.label,
        stack: stackInfo,
        fastAvailable: true,
        fullAvailable: false,
        speed: 'fast',
      };
    }

    // ── Next.js (Fast Babel · Full WebContainer) ──────────────────
    if (activeStack === 'nextjs') {
      const tsxFile =
        repository.files.find((f) => f.path === 'src/app/page.tsx') ||
        repository.files.find((f) => f.path === 'src/components/todo-app.tsx') ||
        repository.files.find(
          (f) =>
            (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')) &&
            !f.path.endsWith('layout.tsx'),
        );
      const cssFile = repository.files.find((f) => f.path.endsWith('.css'));

      let babelHtml: string | undefined;
      if (tsxFile) {
        const cleanedSource = tsxFile.content
          .replace(/^import\s[^;]+;?\s*$/gm, '')
          .replace(/^export\s+default\s+function\s+(\w+)/gm, 'function $1')
          .replace(/^export\s+default\s+class\s+(\w+)/gm, 'class $1')
          .replace(/^export\s+default\s+(\w+)\s*;?\s*$/gm, 'const __defaultExport__ = $1;')
          .replace(/^export\s+\{[^}]*\bdefault\b[^}]*\}\s*;?\s*$/gm, '')
          .replace(/^export\s+(function|class|const|let|var)\s+/gm, '$1 ');
        babelHtml = buildBabelPreviewHtml(cleanedSource, cssFile?.content, tsxFile.path);
      }

      const canFast = Boolean(babelHtml);
      const canFull = Boolean(filesMap['package.json']);

      if (preferFast && canFast) {
        return {
          type: 'HTML',
          mode: 'babel',
          html: babelHtml,
          files: canFull ? filesMap : undefined,
          entryPath: tsxFile?.path,
          constraintLabel: catalog.label,
          stack: stackInfo,
          fastAvailable: true,
          fullAvailable: canFull,
          speed: 'fast',
        };
      }

      return {
        type: 'HTML',
        mode: 'webcontainer',
        html:
          babelHtml ||
          brandEmptyHtml(
            'Starting Next.js…',
            'Full preview runs next dev in WebContainer (~30–90s first boot). Switch to Fast for instant UI.',
          ),
        files: filesMap,
        entryPath: tsxFile?.path,
        constraintLabel: catalog.label,
        stack: stackInfo,
        fastAvailable: canFast,
        fullAvailable: canFull,
        speed: 'full',
      };
    }
  } catch (err) {
    console.error(`[PreviewBuilder] Error for ${projectId}:`, err);
  }

  return {
    type: 'UNSUPPORTED',
    mode: 'static',
    reason: 'Preview could not build for this stack',
    stack: stackInfo,
    fastAvailable: true,
    fullAvailable: false,
    speed: 'fast',
    html: brandEmptyHtml('Preview unavailable', 'Try regenerating files or changing stack from Preview settings.'),
  };
}
