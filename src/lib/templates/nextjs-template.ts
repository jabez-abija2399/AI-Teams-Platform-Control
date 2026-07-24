/**
 * Next.js App Router Full-Stack Project Generator Template
 * Generates all mandatory files for Next.js App Router to boot cleanly in E2B sandboxes.
 */

export interface TemplateFile {
  path: string;
  content: string;
}

export function generateNextJsBaseFiles(projectName: string): Map<string, string> {
  const files = new Map<string, string>();
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'nextjs-app';

  // 1. package.json
  files.set(
    'package.json',
    JSON.stringify(
      {
        name: sanitizedName,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev -p 3000 -H 0.0.0.0',
          build: 'next build',
          start: 'next start -p 3000 -H 0.0.0.0',
          lint: 'next lint',
        },
        dependencies: {
          next: '^14.2.0',
          react: '^18.3.0',
          'react-dom': '^18.3.0',
          clsx: '^2.1.0',
          'tailwind-merge': '^2.3.0',
          'lucide-react': '^0.378.0',
        },
        devDependencies: {
          typescript: '^5.4.0',
          '@types/node': '^20.12.0',
          '@types/react': '^18.3.0',
          '@types/react-dom': '^18.3.0',
          tailwindcss: '^3.4.0',
          postcss: '^8.4.0',
          autoprefixer: '^10.4.0',
        },
      },
      null,
      2
    )
  );

  // 2. tsconfig.json
  files.set(
    'tsconfig.json',
    JSON.stringify(
      {
        compilerOptions: {
          target: 'es5',
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
          plugins: [
            {
              name: 'next',
            },
          ],
          paths: {
            '@/*': ['./src/*'],
          },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules'],
      },
      null,
      2
    )
  );

  // 3. next.config.mjs
  files.set(
    'next.config.mjs',
    `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
`
  );

  // 4. tailwind.config.ts
  files.set(
    'tailwind.config.ts',
    `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
};

export default config;
`
  );

  // 5. postcss.config.js
  files.set(
    'postcss.config.js',
    `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`
  );

  // 6. src/app/globals.css
  files.set(
    'src/app/globals.css',
    `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #0f172a;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #090d16;
    --foreground: #f8fafc;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  min-height: 100vh;
}
`
  );

  // 7. src/app/layout.tsx
  files.set(
    'src/app/layout.tsx',
    `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${projectName}',
  description: 'Generated with AI Teams Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
`
  );

  // 8. src/app/page.tsx
  files.set(
    'src/app/page.tsx',
    `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24 bg-slate-950 text-slate-100 font-sans">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm flex border-b border-slate-800 pb-6">
        <p className="font-mono font-bold text-sky-400">
          Project: <code className="text-slate-300 font-semibold">${sanitizedName}</code>
        </p>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Next.js App Router Dev Server Active</span>
        </div>
      </div>

      <div className="my-auto text-center max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4">
          Live Application Preview
        </h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          This preview is running live on the background E2B Next.js Dev Server. Any code changes made in Monaco Editor will trigger instant hot module updates!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full text-left text-xs">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <h3 className="font-bold text-sky-400 mb-1">⚡ Instant HMR</h3>
          <p className="text-slate-400">Edits to <code className="text-slate-300">src/app/page.tsx</code> update live in the iframe.</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <h3 className="font-bold text-sky-400 mb-1">🛠 Multi-Agent Architecture</h3>
          <p className="text-slate-400">Architect, Coder, and QA agents continuously refine components.</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <h3 className="font-bold text-sky-400 mb-1">🔒 E2B Tunneling</h3>
          <p className="text-slate-400">Isolated cloud sandboxes expose secure HTTPS preview ports.</p>
        </div>
      </div>
    </main>
  );
}
`
  );

  // 9. src/lib/utils.ts
  files.set(
    'src/lib/utils.ts',
    `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`
  );

  return files;
}

export function generateNextJsBaseFilesArray(projectName: string): TemplateFile[] {
  const map = generateNextJsBaseFiles(projectName);
  const result: TemplateFile[] = [];
  map.forEach((content, path) => {
    result.push({ path, content });
  });
  return result;
}
