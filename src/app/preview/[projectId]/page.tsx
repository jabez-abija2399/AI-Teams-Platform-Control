import { prisma } from '@/lib/prisma';

function buildBabelHtml(code: string, projectName: string): string {
  const clean = code
    .replace(/'use client';\n?/g, '')
    .replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '')
    .replace(/export\s+default\s+function\s+(\w+)/g, 'function $1')
    .replace(/export\s+default\s+(\w+);?/g, 'const __defaultExport__ = $1;')
    .replace(/export\s+function\s+(\w+)/g, 'function $1')
    .replace(/export\s+const\s+(\w+)/g, 'const $1')
    .replace(/:\s*(string|number|boolean|null|void|any|never|Date|React\.\w+|Priority|Filter|Todo|Record<[^>]+>)\s*([=,)\]>])/g, '$2')
    .replace(/<[A-Z]\w*(\[\])?>/g, '')
    .replace(/interface\s+\w+\s*\{[^}]*\}/gs, '')
    .replace(/type\s+\w+\s*=[^;]+;/g, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} — Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    const { useState, useEffect, useRef, useCallback } = React;
    try {
      ${clean}

      const App =
        typeof __defaultExport__ !== 'undefined' ? __defaultExport__ :
        typeof TodoApp !== 'undefined' ? TodoApp :
        typeof SimpleAuthApp !== 'undefined' ? SimpleAuthApp :
        typeof App !== 'undefined' ? App :
        typeof Home !== 'undefined' ? Home :
        typeof Page !== 'undefined' ? Page : null;

      if (App) {
        ReactDOM.createRoot(document.getElementById('root')).render(<App />);
      } else {
        document.getElementById('root').innerHTML =
          '<div style="padding:2rem;color:#94a3b8;font-size:13px;background:#020617;min-height:100vh">Component loaded — no default export found.</div>';
      }
    } catch(err) {
      document.getElementById('root').innerHTML =
        '<pre style="color:#f87171;font-family:monospace;font-size:11px;padding:1rem;background:#1e0a0a;min-height:100vh;white-space:pre-wrap">' + String(err) + '</pre>';
    }
  </script>
</body>
</html>`;
}

export default async function ProjectPreviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  let projectName = 'Project Preview';
  let mainFileContent: string | null = null;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, description: true },
    });
    if (project?.name) projectName = project.name;

    const repo = await prisma.repository.findUnique({
      where: { projectId },
      include: { files: true },
    });

    if (repo?.files?.length) {
      const priority = ['src/components/todo-app.tsx', 'src/app/page.tsx', 'src/components/app.tsx', 'src/app/page.jsx'];
      for (const p of priority) {
        const found = repo.files.find((f) => f.path === p);
        if (found) { mainFileContent = found.content; break; }
      }
      if (!mainFileContent) {
        const tsx = repo.files.find((f) => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
        if (tsx) mainFileContent = tsx.content;
      }
    }
  } catch {}

  if (!mainFileContent) {
    // Never fall back to platform source files (src/app/page.tsx) — that leaked other projects' UI.
  }

  const html = mainFileContent
    ? buildBabelHtml(mainFileContent, projectName)
    : `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${projectName}</title></head>
<body style="margin:0;background:#020617;color:#f1f5f9;font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center">
<div style="background:#0f172a;border:1px solid #1e293b;border-radius:1rem;padding:2rem;max-width:420px;width:100%;text-align:center">
<h2 style="font-size:18px;font-weight:700;color:#f8fafc;margin-bottom:8px">${projectName}</h2>
<p style="font-size:12px;color:#475569;line-height:1.6">No files in this project yet.<br>
Resume Development so the Developer agent creates files here.<br>
<span style="color:#38bdf8;font-family:monospace;font-size:11px">ID: ${projectId}</span></p>
</div>
</body>
</html>`;

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <iframe
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Project Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
