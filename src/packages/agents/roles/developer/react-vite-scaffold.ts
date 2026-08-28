/**
 * React + Vite SPA scaffold when user confirmed React stack (not Next.js).
 */

export function buildReactViteFiles(
  safeTitle: string,
  stackHint: string,
): Record<string, string> {
  const note = stackHint.replace(/`/g, "'").replace(/\$/g, '');
  const slug =
    safeTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'generated-app';

  return {
    'package.json': JSON.stringify(
      {
        name: slug,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc -b && vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
        devDependencies: {
          '@types/react': '^19.0.0',
          '@types/react-dom': '^19.0.0',
          '@vitejs/plugin-react': '^4.3.4',
          typescript: '^5.7.0',
          vite: '^6.0.0',
        },
      },
      null,
      2,
    ),
    'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
});
`,
    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          useDefineForClassFields: true,
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          isolatedModules: true,
          moduleDetection: 'force',
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: false,
          noUnusedParameters: false,
          noFallthroughCasesInSwitch: true,
        },
        include: ['src'],
      },
      null,
      2,
    ),
    'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    'src/main.tsx': `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
    'src/App.tsx': `import { useState } from 'react';

/**
 * ${safeTitle} — React (Vite) SPA
 * ${note}
 */
export default function App() {
  const [view, setView] = useState<'home' | 'login' | 'signup'>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="shell">
      <div className="card">
        <p className="eyebrow">Yacht Club · React</p>
        <h1>${safeTitle}</h1>
        <p className="lede">
          Vite + React SPA. Use Fast Preview for instant UI, or Full for a real Vite server.
        </p>

        <nav className="tabs" aria-label="Views">
          <button type="button" className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>
            Home
          </button>
          <button type="button" className={view === 'login' ? 'active' : ''} onClick={() => setView('login')}>
            Login
          </button>
          <button type="button" className={view === 'signup' ? 'active' : ''} onClick={() => setView('signup')}>
            Sign up
          </button>
        </nav>

        {view === 'home' && (
          <div className="panel">
            <h2>Welcome</h2>
            <p>This app was generated for your confirmed React stack — not Next.js.</p>
            <button type="button" className="primary" onClick={() => setView('login')}>
              Continue
            </button>
          </div>
        )}

        {view === 'login' && (
          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              alert('Demo login for ' + email);
            }}
          >
            <h2>Log in</h2>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </label>
            <label>
              Password
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </label>
            <button type="submit" className="primary">
              Sign in
            </button>
          </form>
        )}

        {view === 'signup' && (
          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              alert('Demo signup for ' + email);
            }}
          >
            <h2>Create account</h2>
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </label>
            <label>
              Password
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </label>
            <button type="submit" className="primary">
              Create account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
`,
    'src/index.css': `/* ${safeTitle} — Yacht Club React SPA */
:root {
  --bg: #f2f0ef;
  --fg: #1a3339;
  --primary: #245f73;
  --accent: #733e24;
  --muted: #4a5f66;
  --card: #ffffff;
  --border: #d4d2d0;
}

* { box-sizing: border-box; }
html, body, #root {
  margin: 0;
  min-height: 100%;
  font-family: "Manrope", system-ui, sans-serif;
  background:
    radial-gradient(ellipse at top, rgba(36, 95, 115, 0.12), transparent 55%),
    var(--bg);
  color: var(--fg);
}

.shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.card {
  width: 100%;
  max-width: 420px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px 24px;
  box-shadow: 0 16px 40px rgba(36, 95, 115, 0.1);
}

.eyebrow {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--primary);
}

h1 {
  margin: 8px 0 0;
  font-family: Georgia, "Fraunces", serif;
  font-size: 1.6rem;
  color: var(--primary);
}

.lede {
  margin: 10px 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--muted);
}

.tabs {
  display: flex;
  gap: 6px;
  margin: 20px 0 0;
}

.tabs button {
  flex: 1;
  border: 1px solid var(--border);
  background: transparent;
  border-radius: 8px;
  padding: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
}

.tabs button.active {
  background: rgba(36, 95, 115, 0.1);
  border-color: rgba(36, 95, 115, 0.35);
  color: var(--primary);
}

.panel {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel h2 {
  margin: 0;
  font-size: 1.1rem;
}

.panel p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--muted);
  line-height: 1.45;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--fg);
}

input {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  background: #fff;
}

.primary {
  margin-top: 4px;
  border: 0;
  border-radius: 10px;
  padding: 11px 14px;
  background: var(--primary);
  color: var(--bg);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.primary:hover {
  filter: brightness(1.05);
}
`,
    'README.md': `# ${safeTitle}

React + Vite SPA (confirmed project stack — not Next.js).

\`\`\`bash
npm install
npm run dev
\`\`\`

Preview in Studio: **Fast** = instant Babel UI · **Full** = WebContainer Vite.

${note}
`,
  };
}
