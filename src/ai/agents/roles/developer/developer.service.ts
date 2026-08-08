import { prisma } from '@/lib/prisma';
import { developmentPlannerTool, codeGeneratorTool } from './developer.tools';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { developerOutputSchema, type DeveloperOutput, type BuildEvent, type BuildState, type TaskInfo, type TaskStatus, type CodeChange } from './developer.types';
import type { ArchitectAnalysis } from '@/ai/agents/roles/architect/architect.types';
import type { ProductRequirement } from '@/ai/agents/roles/ceo/ceo.types';
import type { ApiResult } from '@/types/common.types';
import { syncFilesToWorkspace } from '@/features/workspace/explorer/services/workspace-sync.service';
import { aiBuildQueue } from '@/lib/queues/ai-build.queue';
import { EventEmitter } from 'events';
import { pulseGenerationHeartbeat } from '@/core/company-orchestration/generation-status';
import {
  wantsHtmlCssStack,
  wantsStaticNoBackend,
} from '@/core/company-orchestration/revision-feedback';
import { buildStaticHtmlCssFiles } from './static-html-scaffold';
import { buildReactViteFiles } from './react-vite-scaffold';
import { scoreAgentDeliverable } from '@/ai/agents/excellence/output-quality';
import {
  buildDeliveryPlanForStack,
  type ImplementationTodo,
  todosAllDone,
} from '@/core/company-orchestration/architecture-delivery-plan';
import type { DeliveryStack, StackIntent } from '@/core/company-orchestration/stack-intent';
import {
  loadDeliveryPlan,
  persistDeliveryPlan,
  updateImplementationTodos,
} from '@/core/company-orchestration/implementation-todo.store';

const MAX_RETRIES_PER_TASK = 3;

export function getLanguageFromPath(path: string): string | null {
  const ext = path.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
    css: 'css', scss: 'scss', html: 'html', json: 'json', md: 'markdown',
    yaml: 'yaml', yml: 'yaml', sql: 'sql', sh: 'shell', bash: 'shell',
    prisma: 'prisma',
  };
  return map[ext ?? ''] ?? null;
}

function extractProjectTitle(architecture: Record<string, unknown>): string {
  const candidates = [
    architecture.projectName,
    architecture.name,
    architecture.title,
    (architecture.overview as Record<string, unknown> | undefined)?.title,
    (architecture.systemOverview as Record<string, unknown> | undefined)?.name,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim().slice(0, 80);
  }
  return 'Generated App';
}

async function getOrCreateDeveloperAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'DEVELOPER' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: 'Developer AI', role: 'DEVELOPER', status: 'IDLE', capabilities: [] },
  });
  return created.id;
}

// ── In-memory build state ──────────────────────────────────────────
const builds = new Map<string, BuildState>();
const buildEmitters = new Map<string, EventEmitter>();

function getBuildEmitter(projectId: string): EventEmitter {
  let emitter = buildEmitters.get(projectId);
  if (!emitter) {
    emitter = new EventEmitter();
    emitter.setMaxListeners(100);
    buildEmitters.set(projectId, emitter);
  }
  return emitter;
}

function emitBuildEvent(projectId: string, event: BuildEvent): void {
  const state = builds.get(projectId);
  if (state) state.progress = event;
  const emitter = getBuildEmitter(projectId);
  emitter.emit('progress', event);
  // Keep Mission Control "live" so status does not flip to Stalled mid-build
  void pulseGenerationHeartbeat(projectId, {
    message: event.message,
    phase: 'DEVELOPMENT_RUNNING',
    department: 'Software Engineering',
  }).catch(() => {});
}

function cleanupBuildState(projectId: string): void {
  builds.delete(projectId);
  const emitter = buildEmitters.get(projectId);
  if (emitter) {
    emitter.removeAllListeners();
    buildEmitters.delete(projectId);
  }
}

export function getBuildState(projectId: string): BuildState | undefined {
  return builds.get(projectId);
}

/** True when a code-generation build is already in flight for this project. */
export function isBuildActive(projectId: string): boolean {
  const state = builds.get(projectId);
  return Boolean(state && !state.controller.signal.aborted);
}

export function subscribeToBuild(projectId: string, listener: (event: BuildEvent) => void): () => void {
  const emitter = getBuildEmitter(projectId);
  emitter.on('progress', listener);
  return () => { emitter.off('progress', listener); };
}

export function cancelBuild(projectId: string): boolean {
  const state = builds.get(projectId);
  if (!state) return false;
  state.controller.abort();
  emitBuildEvent(projectId, {
    type: 'cancelled',
    phase: 'complete',
    message: 'Build cancelled by user',
    completedTasks: state.progress.completedTasks,
    totalTasks: state.progress.totalTasks,
  });
  return true;
}

/**
 * Lean implementation package for the company pipeline.
 * Honors confirmed stack from project memory (HTML/CSS · React/Vite · Next.js).
 */
export function buildHeuristicImplementation(
  architecture: unknown,
  revisionFeedback?: string,
  stack?: {
    htmlCss?: boolean;
    staticNoBackend?: boolean;
    stack?: string;
    label?: string;
  } | null,
): DeveloperOutput {
  const arch = architecture && typeof architecture === 'object'
    ? (architecture as Record<string, unknown>)
    : {};
  const title = extractProjectTitle(arch);
  const feedback = (revisionFeedback || '').trim();
  const stackHint = feedback
    ? `Revised per user feedback: ${feedback}`
    : 'Generated from architecture + design specs for pipeline continuity.';
  const safeTitle = title.replace(/`/g, "'");

  const nestedArch = arch.architecture as Record<string, unknown> | undefined;
  const archBlob = [
    feedback,
    nestedArch?.frontend,
    nestedArch?.backend,
    nestedArch?.database,
    JSON.stringify(arch),
  ]
    .filter(Boolean)
    .join(' ');

  const useStaticHtml =
    stack?.htmlCss === true ||
    stack?.staticNoBackend === true ||
    stack?.stack === 'static-html' ||
    wantsStaticNoBackend(archBlob) ||
    wantsHtmlCssStack(archBlob) ||
    String(nestedArch?.backend || '')
      .toLowerCase()
      .includes('none');

  if (useStaticHtml) {
    const fileContents = buildStaticHtmlCssFiles(safeTitle, stackHint);
    const files = Object.keys(fileContents);
    const tasks = [
      'Create static login.html',
      'Create static signup.html',
      'Create static home.html + index',
      'Add shared css/styles.css',
      'Document how to open without a framework',
    ];
    const changes: CodeChange[] = files.map((file) => ({
      file,
      changeType: 'CREATE',
      description: `Static file ${file}`,
      code: fileContents[file]!,
    }));
    const excellence = scoreAgentDeliverable({
      role: 'DEVELOPER',
      payload: { files, sample: fileContents['login.html'] },
      constraints: archBlob,
      mustInclude: ['login.html', 'signup.html', 'css/styles.css'],
      mustExclude: ['next.config', '.tsx'],
    });
    return developerOutputSchema.parse({
      plan: {
        tasks,
        files,
        dependencies: [],
        implementationOrder: tasks,
      },
      changes,
      report: {
        completed: true,
        changedFiles: files,
        issues: excellence.verdict === 'APPROVED' ? [] : excellence.notes,
        notes: `Static HTML/CSS package (${files.length} files). Quality ${excellence.overall}/10 (${excellence.verdict}). No Next.js, no backend. ${stackHint}`,
      },
      qualityScore: {
        completeness: excellence.completeness,
        typeSafety: excellence.fidelity,
        errorHandling: excellence.clarity,
        consistency: excellence.fidelity,
        overall: excellence.overall,
        verdict: excellence.verdict,
        notes: excellence.notes.join('; '),
      },
    });
  }

  const useReactVite =
    stack?.stack === 'react-vite' ||
    stack?.stack === 'react' ||
    /react\s*\(vite\)|vite\s*spa|react spa/i.test(stack?.label || '') ||
    /react\s*\(vite\)|vite spa/i.test(archBlob);

  if (useReactVite) {
    const fileContents = buildReactViteFiles(safeTitle, stackHint);
    const files = Object.keys(fileContents);
    const tasks = [
      'Scaffold Vite + React package.json',
      'Add vite.config.ts and index.html',
      'Create src/App.tsx with home/login/signup',
      'Add Yacht Club styles in src/index.css',
      'Document Fast vs Full Preview',
    ];
    const changes: CodeChange[] = files.map((file) => ({
      file,
      changeType: 'CREATE',
      description: `React/Vite file ${file}`,
      code: fileContents[file]!,
    }));
    const excellence = scoreAgentDeliverable({
      role: 'DEVELOPER',
      payload: { files, sample: fileContents['src/App.tsx'] },
      constraints: archBlob,
      mustInclude: ['vite.config.ts', 'src/App.tsx', 'package.json'],
      mustExclude: ['next.config', 'src/app/page.tsx'],
    });
    return developerOutputSchema.parse({
      plan: {
        tasks,
        files,
        dependencies: ['react', 'react-dom', 'vite'],
        implementationOrder: tasks,
      },
      changes,
      report: {
        completed: true,
        changedFiles: files,
        issues: excellence.verdict === 'APPROVED' ? [] : excellence.notes,
        notes: `React + Vite SPA (${files.length} files). Quality ${excellence.overall}/10 (${excellence.verdict}). No Next.js App Router. ${stackHint}`,
      },
      qualityScore: {
        completeness: excellence.completeness,
        typeSafety: excellence.fidelity,
        errorHandling: excellence.clarity,
        consistency: excellence.fidelity,
        overall: excellence.overall,
        verdict: excellence.verdict,
        notes: excellence.notes.join('; '),
      },
    });
  }

  const fileContents: Record<string, string> = {
    'package.json': JSON.stringify(
      {
        name: safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'generated-app',
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
        },
        dependencies: {
          next: '15.1.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
        devDependencies: {
          typescript: '^5.7.0',
          '@types/react': '^19.0.0',
          '@types/node': '^22.0.0',
        },
      },
      null,
      2,
    ),
    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2017',
          lib: ['dom', 'dom.iterable', 'esnext'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
          paths: { '@/*': ['./src/*'] },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
        exclude: ['node_modules'],
      },
      null,
      2,
    ),
    'next.config.ts': `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
`,
    'src/app/globals.css': `:root {
  --bg: #f2f0ef;
  --fg: #1a3339;
  --primary: #245f73;
  --accent: #733e24;
  --muted: #4a5f66;
  --card: #ffffff;
  --border: #d4d2d0;
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
  background: var(--bg);
  color: var(--fg);
}
a { color: var(--primary); }
`,
    'src/app/layout.tsx': `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${safeTitle}',
  description: 'Built by AI Teams Platform',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
    'src/app/page.tsx': `export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        background:
          'radial-gradient(ellipse at top, rgba(36,95,115,0.12), transparent 55%), #f2f0ef',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#245f73',
          fontWeight: 600,
        }}
      >
        AI Teams Platform
      </p>
      <h1
        style={{
          margin: '12px 0 0',
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          color: '#1a3339',
          textAlign: 'center',
          maxWidth: 720,
        }}
      >
        ${safeTitle}
      </h1>
      <p
        style={{
          margin: '16px 0 0',
          maxWidth: 520,
          textAlign: 'center',
          color: '#4a5f66',
          lineHeight: 1.6,
          fontSize: 16,
        }}
      >
        ${stackHint.replace(/`/g, "'").replace(/\$/g, '')}
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
        <a
          href="/api/health"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '10px 18px',
            borderRadius: 10,
            background: '#245f73',
            color: '#f2f0ef',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Check health API
        </a>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '10px 18px',
            borderRadius: 10,
            border: '1px solid #d4d2d0',
            background: '#fff',
            color: '#1a3339',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Preview ready · Deploy when you choose
        </span>
      </div>
    </main>
  );
}
`,
    'src/app/api/health/route.ts': `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: '${safeTitle}',
    timestamp: new Date().toISOString(),
  });
}
`,
    'prisma/schema.prisma': `// ${safeTitle} — schema scaffold from pipeline architecture
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`,
    'README.md': `# ${safeTitle}

${stackHint}

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

## Pipeline notes

This scaffold was written into the project Explorer by Software Engineering.
Use **Studio → Preview** to run it, then click **Deploy** when you are ready (never auto-deployed).
`,
  };

  const files = Object.keys(fileContents);
  const tasks = [
    'Scaffold Next.js app shell and routing',
    'Ship home surface from product design',
    'Wire API health endpoint',
    'Apply database schema from architecture',
    'Document run + deploy instructions',
  ];

  const changes: CodeChange[] = files.map((file) => ({
    file,
    changeType: 'CREATE',
    description: `Implementation file ${file}`,
    code: fileContents[file]!,
  }));

  return developerOutputSchema.parse({
    plan: {
      tasks,
      files,
      dependencies: [],
      implementationOrder: tasks,
    },
    changes,
    report: {
      completed: true,
      changedFiles: files,
      issues: [],
      notes: `Pipeline implementation package ready (${files.length} real files). ${stackHint}`,
    },
  });
}

// ── DAG execution ──────────────────────────────────────────────────
function buildTaskLayers(tasks: string[], dependencies: string[]): string[][] {
  const depMap = new Map<string, string[]>();
  for (const t of tasks) depMap.set(t, []);
  for (const dep of dependencies) {
    const [from, to] = dep.split('->').map((s) => s.trim());
    if (from && to && depMap.has(from)) {
      depMap.get(from)!.push(to);
    }
  }

  const layers: string[][] = [];
  const done = new Set<string>();

  while (done.size < tasks.length) {
    const batch = tasks.filter((t) => {
      if (done.has(t)) return false;
      return (depMap.get(t) ?? []).every((d) => done.has(d));
    });
    if (batch.length === 0) {
      layers.push(tasks.filter((t) => !done.has(t)));
      break;
    }
    layers.push(batch);
    for (const t of batch) done.add(t);
  }
  return layers;
}

async function executeWithRetry(
  fn: () => Promise<CodeChange[]>,
  taskDesc: string,
  signal?: AbortSignal,
  attempt = 0,
): Promise<CodeChange[]> {
  try {
    if (signal?.aborted) return [];
    return await fn();
  } catch (err) {
    if (signal?.aborted) return [];
    if (attempt < MAX_RETRIES_PER_TASK) {
      const delayMs = 1000 * Math.pow(2, attempt);
      await new Promise((r) => {
        const timer = setTimeout(r, delayMs);
        const onAbort = () => { clearTimeout(timer); r(undefined); };
        signal?.addEventListener('abort', onAbort, { once: true });
      });
      if (signal?.aborted) return [];
      return executeWithRetry(fn, taskDesc, signal, attempt + 1);
    }
    throw err;
  }
}

// ── Todo-driven implementation (Architect file tree → Developer todos) ──

function extractTitleFromArch(architecture: unknown): string {
  const arch = architecture && typeof architecture === 'object'
    ? (architecture as Record<string, unknown>)
    : {};
  return (
    (typeof arch.title === 'string' && arch.title) ||
    (typeof arch.projectName === 'string' && arch.projectName) ||
    'Application'
  );
}

/**
 * Prefer Architect's implementationTodos + fileStructure.
 * Creates each todo's files, marks todo done, then hands off to QA only when all done.
 */
export async function implementFromArchitectureTodos(
  projectId: string,
  architecture: ArchitectAnalysis,
  stack?: Pick<StackIntent, 'htmlCss' | 'staticNoBackend' | 'stack'> | null,
  revisionFeedback?: string,
): Promise<ApiResult<DeveloperOutput>> {
  let plan =
    architecture.implementationTodos?.length
      ? {
          fileStructure: architecture.fileStructure || [],
          implementationTodos: architecture.implementationTodos.map((t) => ({
            ...t,
            status: t.status === 'done' ? ('pending' as const) : t.status,
          })),
          qaTodos: architecture.qaTodos || [],
        }
      : await loadDeliveryPlan(projectId);

  if (!plan?.implementationTodos?.length) {
    const title = extractTitleFromArch(architecture);
    plan = buildDeliveryPlanForStack(title, stack);
  }

  // Reset todos to pending for a fresh Development run
  plan = {
    ...plan,
    implementationTodos: plan.implementationTodos.map((t) => ({
      ...t,
      status: 'pending' as const,
    })),
  };
  await persistDeliveryPlan(projectId, plan);

  const heuristic = buildHeuristicImplementation(architecture, revisionFeedback, stack);
  const fileMap = new Map(heuristic.changes.map((c) => [c.file.replace(/^\.\//, ''), c]));

  const todos: ImplementationTodo[] = [...plan.implementationTodos];
  const allChanges: CodeChange[] = [];
  const generatedFiles: string[] = [];

  await pulseGenerationHeartbeat(projectId, {
    message: `Developer starting ${todos.length} architecture todos…`,
    phase: 'DEVELOPMENT_RUNNING',
    department: 'Software Engineering',
  });

  for (let i = 0; i < todos.length; i++) {
    const todo = todos[i]!;
    todo.status = 'in_progress';
    await updateImplementationTodos(projectId, todos, plan.qaTodos);

    await pulseGenerationHeartbeat(projectId, {
      message: `Todo ${i + 1}/${todos.length}: ${todo.title}`,
      phase: 'DEVELOPMENT_RUNNING',
      department: 'Software Engineering',
    });

    const todoChanges: CodeChange[] = [];
    try {
      const aiResult = await codeGeneratorTool.execute({
        architecture,
        task: todo.title,
        projectId,
      });
      if (aiResult.success && aiResult.data && aiResult.data.length > 0) {
        todoChanges.push(...aiResult.data);
      } else if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI code generation returned no changes');
      } else {
        throw new Error('AI code generation returned no changes');
      }
    } catch (aiErr) {
      console.warn('[Developer] AI generation failed for todo, falling back to stub:', aiErr);
      for (const path of todo.files) {
        const key = path.replace(/^\\.\//, '');
        const existing = fileMap.get(key);
        if (existing) {
          todoChanges.push(existing);
        } else {
          const layerNote = plan.fileStructure.find((f) => f.path === key)?.description || todo.description;
          todoChanges.push({
            file: key,
            changeType: 'CREATE',
            description: todo.title,
            code: key.endsWith('.md')
              ? `# ${todo.title}\n\n${layerNote}\n`
              : key.endsWith('.json')
                ? '{}\n'
                : key.endsWith('.css')
                  ? `/* ${todo.title} — ${layerNote} */\n`
                  : key.endsWith('.html')
                    ? `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${todo.title}</title></head><body><h1>${todo.title}</h1><p>${layerNote}</p></body></html>\n`
                    : `// ${todo.title}\n// ${layerNote}\nexport {};\n`,
          });
        }
      }
    }

    if (todoChanges.length === 0) {
      todo.status = 'failed';
      await updateImplementationTodos(projectId, todos, plan.qaTodos);
      return {
        success: false,
        error: {
          message: `Todo "${todo.title}" produced no files`,
          code: 'TODO_EMPTY',
        },
      };
    }

    const syncPaths = todoChanges.map((c) => c.file);
    let syncOk = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await syncFilesToWorkspace(
          projectId,
          todoChanges.map((c) => ({
            path: c.file,
            content: c.code,
            language: getLanguageFromPath(c.file),
          })),
        );
        syncOk = true;
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }

    if (!syncOk) {
      todo.status = 'failed';
      await updateImplementationTodos(projectId, todos, plan.qaTodos);
      return {
        success: false,
        error: {
          message: `Failed writing files for "${todo.title}" after retries`,
          code: 'SYNC_FAILED',
        },
      };
    }

    // Verify files were actually persisted
    try {
      const { getProjectFileEvidence } = await import('@/core/company-orchestration/implementation-file-gate');
      const evidence = await getProjectFileEvidence(projectId);
      if (!evidence.ok && evidence.fileCount === 0) {
        throw new Error('Files were not persisted to Explorer after sync');
      }
    } catch (verifyErr) {
      console.warn('[Developer] Post-sync verification failed:', verifyErr);
    }

    for (const c of todoChanges) {
      allChanges.push(c);
      if (!generatedFiles.includes(c.file)) generatedFiles.push(c.file);
    }
    todo.status = 'done';
    await updateImplementationTodos(projectId, todos, plan.qaTodos);
  }

  if (!todosAllDone(todos)) {
    return {
      success: false,
      error: {
        message: 'Not all implementation todos are done — cannot move to QA',
        code: 'TODOS_INCOMPLETE',
      },
    };
  }

  const output = developerOutputSchema.parse({
    plan: {
      tasks: todos.map((t) => t.title),
      files: generatedFiles,
      dependencies: todos.flatMap((t) => t.dependsOn),
      implementationOrder: todos.map((t) => t.title),
    },
    changes: allChanges,
    report: {
      completed: true,
      changedFiles: generatedFiles,
      issues: [],
      notes: `Completed ${todos.length}/${todos.length} architecture todos. Ready for QA.`,
    },
  });

  await pulseGenerationHeartbeat(projectId, {
    message: `All ${todos.length} todos done — handing off to QA`,
    phase: 'DEVELOPMENT_RUNNING',
    department: 'Software Engineering',
  });

  return { success: true, data: output };
}

// ── Main implementation ────────────────────────────────────────────
export async function implementArchitecture(
  projectId: string,
  architecture: ArchitectAnalysis,
  requirements?: ProductRequirement,
): Promise<ApiResult<DeveloperOutput>> {
  // Prefer Architect todos → file creation → mark done → QA
  const hasTodos =
    (architecture?.implementationTodos && architecture.implementationTodos.length > 0) ||
    Boolean(await loadDeliveryPlan(projectId));

  if (hasTodos) {
    try {
      const { resolveStackFromMemory } = await import(
        '@/core/memory/persist-stack-constraints'
      );
      const stack = await resolveStackFromMemory(projectId, architecture, requirements);
      const todoRes = await implementFromArchitectureTodos(
        projectId,
        architecture,
        stack,
      );
      if (todoRes.success) return todoRes;
      // Fall through to classic DAG only on soft failure
      if (
        todoRes.error?.code === 'BUILD_IN_PROGRESS' ||
        /402|credit|auth/i.test(todoRes.error?.message || '')
      ) {
        return todoRes;
      }
    } catch (err) {
      console.warn('[Developer] todo-driven path failed, falling back:', err);
    }
  }

  // Never cancel an in-flight build when another caller re-enters (status poll used to
  // restart the pipeline every ~90s and abort the real work → "Build cancelled" loop).
  if (isBuildActive(projectId)) {
    return {
      success: false,
      error: {
        message: 'Build already in progress',
        code: 'BUILD_IN_PROGRESS',
      },
    };
  }

  const controller = new AbortController();
  const signal = controller.signal;

  const buildState: BuildState = {
    controller,
    progress: {
      type: 'planning:analyzing',
      phase: 'planning',
      message: 'Analyzing architecture...',
      completedTasks: 0,
      totalTasks: 0,
    },
    tasks: [],
    generatedFiles: [],
    startedAt: Date.now(),
  };
  builds.set(projectId, buildState);

  const agentId = await getOrCreateDeveloperAgentId();
  const memory = getMemoryManager();

  await prisma.document.deleteMany({ where: { projectId, type: 'DEVELOPMENT_IN_PROGRESS' } });
  await prisma.document.create({
    data: {
      projectId, type: 'DEVELOPMENT_IN_PROGRESS',
      title: 'Development In Progress',
      content: JSON.stringify({ phase: 'planning', completedTasks: 0, totalTasks: 0, generatedFiles: [] }),
      author: 'Developer AI',
    },
  });

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('DEVELOPER_IMPLEMENTATION_STARTED', { projectId }, agentId);

  try {
    // ── Phase: Planning (progressive steps) ──
    emitBuildEvent(projectId, {
      type: 'planning:analyzing',
      phase: 'planning',
      message: 'Analyzing architecture document...',
      completedTasks: 0, totalTasks: 0,
    });

    if (signal.aborted) throw new Error('BUILD_CANCELLED');
    await new Promise((r) => setTimeout(r, 50));

    emitBuildEvent(projectId, {
      type: 'planning:identifying',
      phase: 'planning',
      message: 'Identifying implementation tasks...',
      completedTasks: 0, totalTasks: 0,
    });

    const planResult = await developmentPlannerTool.execute({ architecture, projectId, agentId, signal, requirements });
    if (!planResult.success) throw new Error(planResult.error);

    if (signal.aborted) throw new Error('BUILD_CANCELLED');

    const plan = planResult.data;
    const tasks: TaskInfo[] = plan.tasks.map((t) => ({ description: t, status: 'pending' as TaskStatus }));
    buildState.tasks = tasks;

    emitBuildEvent(projectId, {
      type: 'planning:ordering',
      phase: 'planning',
      message: `Ordering ${plan.tasks.length} tasks by dependencies...`,
      completedTasks: 0, totalTasks: plan.tasks.length,
      tasks,
    });

    if (signal.aborted) throw new Error('BUILD_CANCELLED');

    const layers = buildTaskLayers(plan.tasks, plan.dependencies);

    emitBuildEvent(projectId, {
      type: 'planning:complete',
      phase: 'generating', // transition to generating
      message: `Plan ready: ${plan.tasks.length} tasks in ${layers.length} parallel batch(es)`,
      completedTasks: 0, totalTasks: plan.tasks.length,
      tasks,
    });

    // Write plan to DB at milestone
    await prisma.document.updateMany({
      where: { projectId, type: 'DEVELOPMENT_IN_PROGRESS' },
      data: {
        content: JSON.stringify({
          phase: 'generating', plan,
          completedTasks: 0, totalTasks: plan.tasks.length,
          generatedFiles: [],
        }),
      },
    });

    // ── Phase: Generating (DAG parallel execution) ──
    const allChanges: CodeChange[] = [];
    const generatedFiles: string[] = [];
    let completedCount = 0;

    for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
      if (signal.aborted) throw new Error('BUILD_CANCELLED');

      const batch = layers[layerIdx]!;

      emitBuildEvent(projectId, {
        type: 'batch:starting',
        phase: 'generating',
        message: `Executing batch ${layerIdx + 1}/${layers.length} (${batch.length} task(s))`,
        completedTasks: completedCount,
        totalTasks: plan.tasks.length,
        activeTasks: batch,
        tasks: buildState.tasks,
        generatedFiles: [...generatedFiles],
      });

      const results = await Promise.all(
        batch.map(async (taskDesc) => {
          if (signal.aborted) return null;

          const taskInfo = tasks.find((t) => t.description === taskDesc);
          if (taskInfo) taskInfo.status = 'running';

          try {
            const changes = await executeWithRetry(
              () => codeGeneratorTool.execute({ architecture, task: taskDesc, projectId, agentId, signal, requirements })
                .then((r) => {
                  if (!r.success) throw new Error(r.error);
                  return r.data!;
                }),
              taskDesc,
              signal,
            );

            if (taskInfo) {
              taskInfo.status = 'done';
              taskInfo.fileCount = changes.length;
            }
            completedCount++;

            for (const c of changes) {
              if (!generatedFiles.includes(c.file)) generatedFiles.push(c.file);
            }

            const remainingActive = (buildState.progress.activeTasks ?? batch).filter(
              (t) => t !== taskDesc && tasks.find((ti) => ti.description === t)?.status === 'running',
            );

            emitBuildEvent(projectId, {
              type: 'task:complete',
              phase: 'generating',
              message: `Completed: ${taskDesc}`,
              completedTasks: completedCount,
              totalTasks: plan.tasks.length,
              activeTasks: remainingActive,
              tasks: buildState.tasks,
              generatedFiles: [...generatedFiles],
              eta: estimateEta(buildState, completedCount),
            });

            return changes;
          } catch (err) {
            if (signal.aborted) return null;
            if (taskInfo) taskInfo.status = 'failed';
            completedCount++;

            const remainingActive = (buildState.progress.activeTasks ?? batch).filter(
              (t) => t !== taskDesc && tasks.find((ti) => ti.description === t)?.status === 'running',
            );

            emitBuildEvent(projectId, {
              type: 'task:failed',
              phase: 'generating',
              message: `Failed: ${taskDesc} — ${err instanceof Error ? err.message : 'Unknown error'}`,
              completedTasks: completedCount,
              totalTasks: plan.tasks.length,
              activeTasks: remainingActive,
              tasks: buildState.tasks,
              generatedFiles: [...generatedFiles],
              error: err instanceof Error ? err.message : 'Unknown error',
            });

            return null;
          }
        }),
      );

      buildState.generatedFiles = generatedFiles;

      for (const result of results) {
        if (result) allChanges.push(...result);
      }
    }

    if (signal.aborted) throw new Error('BUILD_CANCELLED');

    // ── Phase: Saving ──
    emitBuildEvent(projectId, {
      type: 'saving',
      phase: 'saving',
      message: 'Saving results...',
      completedTasks: completedCount,
      totalTasks: plan.tasks.length,
      generatedFiles: [...generatedFiles],
    });

    const output = developerOutputSchema.parse({
      plan,
      changes: allChanges,
      report: {
        completed: allChanges.length > 0,
        changedFiles: [...new Set(allChanges.map((c) => c.file))],
        issues: allChanges.length < plan.tasks.length
          ? [`${plan.tasks.length - allChanges.length} task(s) failed to generate code`]
          : [],
        notes: `Implemented ${allChanges.length} file change(s) across ${plan.tasks.length} task(s) in ${layers.length} batch(es).`,
      },
    });

    const failedCount = tasks.filter((t) => t.status === 'failed').length;
    const summary = failedCount > 0
      ? `Implemented ${allChanges.length} file(s) across ${plan.tasks.length} task(s) (${failedCount} failed)`
      : `Project ${projectId}: implemented ${output.report.changedFiles.length} files`;

    await Promise.all([
      prisma.developmentTask.create({
        data: {
          projectId, agentId, plan: plan as never, status: 'COMPLETED',
          codeChanges: {
            create: allChanges.map((c) => ({
              file: c.file, changeType: c.changeType,
              description: c.description, code: c.code,
            })),
          },
        },
      }),
      prisma.document.create({
        data: {
          projectId, type: 'DEVELOPMENT_SUMMARY',
          title: 'Development Summary',
          content: JSON.stringify(output.report),
          author: 'Developer AI',
        },
      }),
      memory.remember({
        agentId, content: summary,
        type: 'PROJECT', metadata: { projectId },
      }),
    ]);

    await prisma.document.deleteMany({ where: { projectId, type: 'DEVELOPMENT_IN_PROGRESS' } });

    // Sync to workspace
    const filesForWorkspace = allChanges
      .filter((c) => c.changeType === 'CREATE' || c.changeType === 'MODIFY')
      .map((c) => ({
        path: c.file,
        content: c.code,
        language: getLanguageFromPath(c.file),
      }));

    let syncOk = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await syncFilesToWorkspace(projectId, filesForWorkspace);
        if (filesForWorkspace.length === 0) {
          throw new Error('Developer agent produced no files to sync');
        }
        await aiBuildQueue.add(`build-${projectId}-${Date.now()}`, {
          projectId,
          userPrompt: 'Developer AI Code Build',
          filesToGenerate: filesForWorkspace.map((f) => ({ path: f.path, content: f.content })),
        });
        syncOk = true;
        break;
      } catch (err) {
        if (attempt === 3) {
          console.error('[Developer] Workspace sync or BullMQ enqueue failed after retries:', err);
          cleanupBuildState(projectId);
          await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } }).catch(() => {});
          return {
            success: false,
            error: {
              message:
                err instanceof Error
                  ? `Failed to write project files: ${err.message}`
                  : 'Failed to write project files',
              code: 'SYNC_FAILED',
            },
          };
        }
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('DEVELOPER_IMPLEMENTATION_COMPLETED', { projectId }, agentId);

    emitBuildEvent(projectId, {
      type: 'complete',
      phase: 'complete',
      message: `Implementation complete — ${allChanges.length} file(s) changed`,
      completedTasks: completedCount,
      totalTasks: plan.tasks.length,
      generatedFiles: [...generatedFiles],
    });

    cleanupBuildState(projectId);
    return { success: true, data: output };
  } catch (err) {
    const isCancelled = err instanceof Error && err.message === 'BUILD_CANCELLED';
    const errMsg = isCancelled
      ? 'Build cancelled'
      : err instanceof Error ? err.message : 'Implementation failed';

    if (!isCancelled) {
      await prisma.document.deleteMany({ where: { projectId, type: 'DEVELOPMENT_IN_PROGRESS' } });
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
      await logAIEvent('DEVELOPER_IMPLEMENTATION_FAILED', { projectId, error: errMsg }, agentId);
    }

    emitBuildEvent(projectId, {
      type: isCancelled ? 'cancelled' : 'error',
      phase: 'complete',
      message: errMsg,
      completedTasks: buildState.progress.completedTasks,
      totalTasks: buildState.progress.totalTasks,
      error: errMsg,
    });

    cleanupBuildState(projectId);

    if (isCancelled) {
      return { success: false, error: { message: errMsg, code: 'BUILD_CANCELLED' } };
    }
    return { success: false, error: { message: errMsg, code: 'AI_ERROR' } };
  }
}

function estimateEta(state: BuildState, completed: number): number {
  const elapsed = Date.now() - state.startedAt;
  if (completed === 0 || elapsed < 1000) return 0;
  const avgPerTask = elapsed / completed;
  const remaining = state.progress.totalTasks - completed;
  return Math.round(avgPerTask * remaining);
}
