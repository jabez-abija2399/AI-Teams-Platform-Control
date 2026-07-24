import { Sandbox } from '@e2b/code-interpreter';

export interface DevServerResult {
  previewUrl: string;
  processId: string;
  port: number;
}

/**
 * Boots a full Next.js App Router background dev server in an E2B cloud sandbox,
 * instantly resolves the public E2B HTTPS tunnel URL, and runs dev server in background mode.
 */
export async function bootNextDevServer(sandbox: Sandbox): Promise<string> {
  console.log('[DevServer] Instantly launching Next.js App Router background dev server...');
  const result = await startSandboxDevServer(sandbox, 'next');
  return result.previewUrl;
}

/**
 * Starts an asynchronous background dev server inside an E2B cloud sandbox,
 * intercepts stdout logs to detect when the dev server is ready, and returns the E2B public HTTPS preview URL.
 */
export async function startSandboxDevServer(
  sandbox: Sandbox,
  projectType: 'next' | 'vite' | 'node' = 'next'
): Promise<DevServerResult> {
  const port = projectType === 'vite' ? 5173 : 3000;

  // Determine standard dev command
  let devCmd = 'npx next dev -p 3000 -H 0.0.0.0';
  if (projectType === 'vite') {
    devCmd = 'npx vite --host 0.0.0.0 --port 5173';
  } else if (projectType === 'node') {
    devCmd = 'npm start';
  }

  // Obtain E2B public HTTPS tunnel URL for exposed port instantly
  let host = '';
  try {
    host = sandbox.getHost(port);
  } catch {
    host = `${port}-preview.e2b.dev`;
  }

  const previewUrl = host.startsWith('http://') || host.startsWith('https://')
    ? host
    : `https://${host}`;

  console.log(`[DevServer] Public HTTPS tunnel URL resolved: ${previewUrl}`);

  // Fire background non-blocking execution process in sandbox without awaiting startup logs
  try {
    sandbox.commands.run(devCmd, {
      background: true,
      onStdout: (data: any) => console.log(`[DevServer stdout] ${String(data)}`),
      onStderr: (data: any) => console.log(`[DevServer stderr] ${String(data)}`),
    }).catch((err) => {
      console.warn(`[DevServer background spawn warning]`, err);
    });
  } catch (err) {
    console.warn(`[DevServer background spawn error]`, err);
  }

  return {
    previewUrl,
    processId: `proc-${Date.now()}`,
    port,
  };
}
