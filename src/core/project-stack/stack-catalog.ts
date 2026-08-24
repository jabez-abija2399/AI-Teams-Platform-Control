/**
 * Project stack catalog — single source of truth for create, Preview, agents.
 * Preview runs by user-confirmed stack (chosen once at create; Change only when asked).
 */

export type ProjectStackId = 'static-html' | 'react' | 'nextjs' | 'unknown';

export type PreviewStrategy = 'srcdoc-static' | 'srcdoc-babel' | 'webcontainer';

export interface StackCatalogEntry {
  id: ProjectStackId;
  label: string;
  shortLabel: string;
  /** One-line product copy */
  description: string;
  /** Plain-language line for non-technical users */
  plainLanguage: string;
  /** Honest fact about preview */
  honesty: string;
  previewStrategy: PreviewStrategy;
  usesWebContainer: boolean;
  /** Human timing expectation */
  speed: string;
  /** Show “Recommended” — best default for non-tech users */
  recommended?: boolean;
  /** Show “Default” — pre-selected on create */
  isDefault?: boolean;
}

/** Default / recommended for non-technical users — instant preview, no install. */
export const DEFAULT_PROJECT_STACK: Exclude<ProjectStackId, 'unknown'> = 'static-html';

export const STACK_CATALOG: Record<Exclude<ProjectStackId, 'unknown'>, StackCatalogEntry> = {
  'static-html': {
    id: 'static-html',
    label: 'HTML5 + CSS3 + JS (Static Site)',
    shortLabel: 'HTML/CSS',
    description: 'Zero-framework pure web pages: semantic HTML, modern CSS, and vanilla JavaScript.',
    plainLanguage: 'Simple website pages. Best if you are not sure — no setup, instant Preview.',
    honesty:
      'Preview is instant in the browser (srcDoc). No install, no WebContainer. Best for static demos.',
    previewStrategy: 'srcdoc-static',
    usesWebContainer: false,
    speed: 'Instant',
    recommended: true,
    isDefault: true,
  },
  react: {
    id: 'react',
    label: 'React + Vite (Frontend SPA)',
    shortLabel: 'React SPA',
    description: 'Interactive client-side single-page application with Vite, React 19, and Tailwind CSS.',
    plainLanguage: 'Interactive single-page app. Choose this when you want richer UI behavior.',
    honesty:
      'WebContainer runs Vite (~20–60s first boot). If Vite files are missing, we fall back to fast Babel for a single component.',
    previewStrategy: 'webcontainer',
    usesWebContainer: true,
    speed: '~20–60s first boot',
  },
  nextjs: {
    id: 'nextjs',
    label: 'Next.js 15 (Full Stack Golden Path)',
    shortLabel: 'Next.js 15',
    description: 'Production full-stack: App Router, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL + Prisma, and Vitest.',
    plainLanguage: 'Full web app with server features. For teams that need APIs and routing.',
    honesty:
      'Real Next.dev runs in WebContainer — expect ~30–90s first boot (npm install). Babel fallback shows UI sooner but is not a full Next server.',
    previewStrategy: 'webcontainer',
    usesWebContainer: true,
    speed: 'Golden Path',
  },
};

export const STACK_OPTIONS: StackCatalogEntry[] = [
  STACK_CATALOG['static-html'],
  STACK_CATALOG.react,
  STACK_CATALOG.nextjs,
];

export function getStackCatalogEntry(id: ProjectStackId): StackCatalogEntry | null {
  if (id === 'unknown') return null;
  return STACK_CATALOG[id] ?? null;
}

export interface DetectedStack {
  stack: ProjectStackId;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
  /** Why we think this — shown to the user */
  rationale: string;
}

/** Detect stack from file paths + optional package.json content. Honest, file-based. */
export function detectStackFromFiles(
  paths: string[],
  packageJsonContent?: string | null,
): DetectedStack {
  const normalized = paths.map((p) => p.replace(/\\/g, '/').toLowerCase());
  const signals: string[] = [];

  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } = {};
  if (packageJsonContent) {
    try {
      pkg = JSON.parse(packageJsonContent);
    } catch {
      /* ignore */
    }
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const hasNextConfig = normalized.some((p) => p.includes('next.config'));
  const hasNextDep = Boolean(deps.next);
  const hasAppRouter = normalized.some(
    (p) => p.includes('src/app/') || p.startsWith('app/'),
  );
  const hasReactDep = Boolean(deps.react);
  const hasTsx = normalized.some((p) => p.endsWith('.tsx') || p.endsWith('.jsx'));
  const hasHtml = normalized.some((p) => p.endsWith('.html'));
  const htmlCount = normalized.filter((p) => p.endsWith('.html')).length;

  const hasViteDep = Boolean(deps.vite);
  const hasViteConfig = normalized.some((p) => p.includes('vite.config'));

  if (hasNextConfig || hasNextDep) {
    if (hasNextConfig) signals.push('next.config present');
    if (hasNextDep) signals.push('package.json depends on next');
    if (hasAppRouter) signals.push('App Router paths');
    return {
      stack: 'nextjs',
      confidence: hasNextConfig || hasNextDep ? 'high' : 'medium',
      signals,
      rationale: 'This project looks like Next.js — Preview can run a real dev server in WebContainer.',
    };
  }

  if (hasViteDep || hasViteConfig) {
    if (hasViteDep) signals.push('vite dependency');
    if (hasViteConfig) signals.push('vite.config present');
    return {
      stack: 'react',
      confidence: 'high',
      signals,
      rationale: 'Vite/React SPA detected — Preview can run Vite in WebContainer.',
    };
  }

  if (hasHtml && !hasTsx) {
    signals.push(`${htmlCount} HTML file(s)`);
    if (normalized.some((p) => p.endsWith('.css'))) signals.push('CSS files');
    return {
      stack: 'static-html',
      confidence: htmlCount >= 2 ? 'high' : 'medium',
      signals,
      rationale: 'HTML/CSS pages detected — Preview can show them instantly (no framework boot).',
    };
  }

  if (hasHtml && hasTsx) {
    signals.push('Both .html and .tsx files');
    return {
      stack: 'unknown',
      confidence: 'low',
      signals,
      rationale:
        'Mixed HTML and React/TSX files. Please choose which stack Preview should use.',
    };
  }

  if (hasReactDep || hasTsx) {
    if (hasReactDep) signals.push('react dependency');
    if (hasTsx) signals.push('TSX/JSX files');
    return {
      stack: 'react',
      confidence: hasReactDep ? 'high' : 'medium',
      signals,
      rationale: 'React components detected — Preview can use fast in-browser Babel (not a full Next server).',
    };
  }

  if (hasHtml) {
    signals.push('HTML present');
    return {
      stack: 'static-html',
      confidence: 'medium',
      signals,
      rationale: 'HTML files found — treating as static HTML/CSS until you choose otherwise.',
    };
  }

  return {
    stack: 'unknown',
    confidence: 'low',
    signals: ['No clear stack signals'],
    rationale: 'We could not detect a stack yet. Choose one so Preview knows how to run your app.',
  };
}

/** Map catalog stack → agent DeliveryStack-compatible constraints. */
export function constraintsForStack(stack: ProjectStackId): string[] {
  switch (stack) {
    case 'static-html':
      return [
        'Deliver static HTML + CSS only (login.html, signup.html, home.html)',
        'No Next.js, no React, no framework',
        'No backend, no database, no API server',
      ];
    case 'react':
      return [
        'UI is React components (no Next.js App Router required)',
        'Prefer client components; avoid inventing full Next scaffolding',
      ];
    case 'nextjs':
      return ['Next.js App Router full-stack is allowed'];
    default:
      return [];
  }
}

export function labelForStack(stack: ProjectStackId): string {
  return getStackCatalogEntry(stack)?.label ?? 'Choose stack';
}

export function isValidProjectStack(id: unknown): id is Exclude<ProjectStackId, 'unknown'> {
  return id === 'static-html' || id === 'react' || id === 'nextjs';
}
