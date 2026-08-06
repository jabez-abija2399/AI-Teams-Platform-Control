/**
 * Architecture → Development delivery plan:
 * full folder/file structure + implementation todos (+ optional QA todos).
 */

import { z } from 'zod';
import type { StackIntent } from '@/core/company-orchestration/stack-intent';

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const fileStructureItemSchema = z.object({
  path: smartString,
  type: z.enum(['file', 'folder']).default('file'),
  description: smartString.default(''),
  layer: smartString.optional(),
});
export type FileStructureItem = z.infer<typeof fileStructureItemSchema>;

export const implementationTodoSchema = z.object({
  id: smartString,
  title: smartString,
  description: smartString.default(''),
  files: z.array(smartString).default([]),
  status: z.enum(['pending', 'in_progress', 'done', 'failed']).default('pending'),
  dependsOn: z.array(smartString).default([]),
  layer: smartString.optional(),
});
export type ImplementationTodo = z.infer<typeof implementationTodoSchema>;

export const qaTodoSchema = z.object({
  id: smartString,
  title: smartString,
  description: smartString.default(''),
  relatedFiles: z.array(smartString).default([]),
  status: z.enum(['pending', 'in_progress', 'done', 'failed']).default('pending'),
});
export type QaTodo = z.infer<typeof qaTodoSchema>;

export const architectureDeliveryPlanSchema = z.object({
  fileStructure: z.array(fileStructureItemSchema).default([]),
  implementationTodos: z.array(implementationTodoSchema).default([]),
  qaTodos: z.array(qaTodoSchema).default([]),
});
export type ArchitectureDeliveryPlan = z.infer<typeof architectureDeliveryPlanSchema>;

function folder(path: string, description: string, layer?: string): FileStructureItem {
  return { path, type: 'folder', description, layer };
}
function file(path: string, description: string, layer?: string): FileStructureItem {
  return { path, type: 'file', description, layer };
}
function todo(
  id: string,
  title: string,
  description: string,
  files: string[],
  dependsOn: string[] = [],
  layer?: string,
): ImplementationTodo {
  return { id, title, description, files, status: 'pending', dependsOn, layer };
}
function qa(id: string, title: string, description: string, relatedFiles: string[]): QaTodo {
  return { id, title, description, relatedFiles, status: 'pending' };
}

/** Static HTML/CSS delivery plan */
export function buildStaticHtmlDeliveryPlan(title: string): ArchitectureDeliveryPlan {
  const structure: FileStructureItem[] = [
    folder('css', 'Shared stylesheets', 'frontend'),
    file('index.html', 'Entry redirect / home for the app', 'frontend'),
    file('home.html', `Home page for ${title}`, 'frontend'),
    file('login.html', 'Login page UI', 'frontend'),
    file('signup.html', 'Signup page UI', 'frontend'),
    file('css/styles.css', 'Shared visual design system', 'frontend'),
    file('README.md', 'How to open and run this static site', 'docs'),
  ];

  const implementationTodos: ImplementationTodo[] = [
    todo(
      'html-1',
      'Create shared CSS',
      'Write css/styles.css with layout, forms, and brand-friendly base styles for the whole site.',
      ['css/styles.css'],
      [],
      'frontend',
    ),
    todo(
      'html-2',
      'Create login page',
      'Build login.html using shared CSS — email/password form and clear CTA.',
      ['login.html'],
      ['html-1'],
      'frontend',
    ),
    todo(
      'html-3',
      'Create signup page',
      'Build signup.html with name/email/password fields linked to shared CSS.',
      ['signup.html'],
      ['html-1'],
      'frontend',
    ),
    todo(
      'html-4',
      'Create home + index',
      'Build home.html and index.html as the landing entry for the product.',
      ['home.html', 'index.html'],
      ['html-1'],
      'frontend',
    ),
    todo(
      'html-5',
      'Document how to open',
      'Write README.md explaining how to open the static files (no backend required).',
      ['README.md'],
      ['html-2', 'html-3', 'html-4'],
      'docs',
    ),
  ];

  const qaTodos: QaTodo[] = [
    qa('qa-1', 'Pages open without errors', 'Open index/login/signup/home in a browser; no broken layout.', [
      'index.html',
      'login.html',
      'signup.html',
      'home.html',
    ]),
    qa('qa-2', 'CSS applies correctly', 'Confirm shared styles load on all pages.', ['css/styles.css']),
    qa('qa-3', 'Forms are usable', 'Login and signup forms are visible and keyboard-accessible.', [
      'login.html',
      'signup.html',
    ]),
  ];

  return architectureDeliveryPlanSchema.parse({
    fileStructure: structure,
    implementationTodos,
    qaTodos,
  });
}

/** React + Vite SPA delivery plan */
export function buildReactViteDeliveryPlan(title: string): ArchitectureDeliveryPlan {
  const structure: FileStructureItem[] = [
    folder('src', 'Application source', 'frontend'),
    folder('src/components', 'Reusable UI components', 'frontend'),
    folder('public', 'Static assets', 'frontend'),
    file('package.json', 'Dependencies and scripts', 'tooling'),
    file('vite.config.ts', 'Vite bundler config', 'tooling'),
    file('index.html', 'Vite HTML shell', 'frontend'),
    file('src/main.tsx', 'React entrypoint', 'frontend'),
    file('src/App.tsx', `Root app shell for ${title}`, 'frontend'),
    file('src/App.css', 'App-level styles', 'frontend'),
    file('src/components/AuthForm.tsx', 'Login/signup form component', 'frontend'),
    file('README.md', 'How to run the Vite app', 'docs'),
  ];

  const implementationTodos: ImplementationTodo[] = [
    todo('rv-1', 'Scaffold package + Vite', 'Create package.json and vite.config.ts for React+Vite.', [
      'package.json',
      'vite.config.ts',
      'index.html',
    ], [], 'tooling'),
    todo('rv-2', 'Create React entry', 'Create src/main.tsx and mount App.', ['src/main.tsx'], ['rv-1'], 'frontend'),
    todo(
      'rv-3',
      'Build App shell',
      `Implement App.tsx / App.css for ${title} with basic navigation between auth and home.`,
      ['src/App.tsx', 'src/App.css'],
      ['rv-2'],
      'frontend',
    ),
    todo(
      'rv-4',
      'Build AuthForm',
      'Implement AuthForm component for login/signup UI.',
      ['src/components/AuthForm.tsx'],
      ['rv-3'],
      'frontend',
    ),
    todo('rv-5', 'Document run steps', 'Write README with npm install && npm run dev.', ['README.md'], ['rv-4'], 'docs'),
  ];

  const qaTodos: QaTodo[] = [
    qa('qa-1', 'App mounts', 'main.tsx mounts App without runtime errors.', ['src/main.tsx', 'src/App.tsx']),
    qa('qa-2', 'Auth UI present', 'AuthForm renders login/signup fields.', ['src/components/AuthForm.tsx']),
    qa('qa-3', 'Scripts valid', 'package.json has dev/build scripts.', ['package.json']),
  ];

  return architectureDeliveryPlanSchema.parse({
    fileStructure: structure,
    implementationTodos,
    qaTodos,
  });
}

/** Next.js app delivery plan */
export function buildNextJsDeliveryPlan(title: string): ArchitectureDeliveryPlan {
  const structure: FileStructureItem[] = [
    folder('src', 'Next.js source', 'frontend'),
    folder('src/app', 'App Router pages', 'frontend'),
    folder('src/components', 'UI components', 'frontend'),
    file('package.json', 'Next.js dependencies and scripts', 'tooling'),
    file('next.config.mjs', 'Next config', 'tooling'),
    file('tsconfig.json', 'TypeScript config', 'tooling'),
    file('src/app/layout.tsx', 'Root layout', 'frontend'),
    file('src/app/page.tsx', `Home page for ${title}`, 'frontend'),
    file('src/app/globals.css', 'Global styles', 'frontend'),
    file('src/components/AuthCard.tsx', 'Auth UI card', 'frontend'),
    file('README.md', 'How to run Next.js', 'docs'),
  ];

  const implementationTodos: ImplementationTodo[] = [
    todo('nx-1', 'Scaffold Next package', 'Create package.json, next.config.mjs, tsconfig.json.', [
      'package.json',
      'next.config.mjs',
      'tsconfig.json',
    ], [], 'tooling'),
    todo('nx-2', 'Create layout + globals', 'Implement root layout and global CSS.', [
      'src/app/layout.tsx',
      'src/app/globals.css',
    ], ['nx-1'], 'frontend'),
    todo(
      'nx-3',
      'Create home page',
      `Implement src/app/page.tsx for ${title}.`,
      ['src/app/page.tsx'],
      ['nx-2'],
      'frontend',
    ),
    todo(
      'nx-4',
      'Create AuthCard',
      'Build AuthCard component for login/signup presentation.',
      ['src/components/AuthCard.tsx'],
      ['nx-2'],
      'frontend',
    ),
    todo('nx-5', 'Document run steps', 'Write README with npm install && npm run dev.', ['README.md'], ['nx-3'], 'docs'),
  ];

  const qaTodos: QaTodo[] = [
    qa('qa-1', 'Home page renders', 'page.tsx exports a valid React page.', ['src/app/page.tsx']),
    qa('qa-2', 'Layout wraps app', 'layout.tsx includes children + globals.', ['src/app/layout.tsx']),
    qa('qa-3', 'Package scripts', 'package.json includes next dev/build.', ['package.json']),
  ];

  return architectureDeliveryPlanSchema.parse({
    fileStructure: structure,
    implementationTodos,
    qaTodos,
  });
}

export function buildDeliveryPlanForStack(
  title: string,
  stack?: Pick<StackIntent, 'htmlCss' | 'staticNoBackend' | 'stack'> | null,
): ArchitectureDeliveryPlan {
  if (stack?.htmlCss || stack?.staticNoBackend || stack?.stack === 'static-html') {
    return buildStaticHtmlDeliveryPlan(title);
  }
  if (stack?.stack === 'react-vite' || stack?.stack === 'react') {
    return buildReactViteDeliveryPlan(title);
  }
  if (stack?.stack === 'nextjs' || stack?.stack === 'next') {
    return buildNextJsDeliveryPlan(title);
  }
  // Default: static HTML (product default stack)
  return buildStaticHtmlDeliveryPlan(title);
}

export function todosAllDone(todos: ImplementationTodo[]): boolean {
  return todos.length > 0 && todos.every((t) => t.status === 'done');
}

export function summarizeTodoProgress(todos: ImplementationTodo[]): {
  total: number;
  done: number;
  failed: number;
  pending: number;
} {
  return {
    total: todos.length,
    done: todos.filter((t) => t.status === 'done').length,
    failed: todos.filter((t) => t.status === 'failed').length,
    pending: todos.filter((t) => t.status === 'pending' || t.status === 'in_progress').length,
  };
}
