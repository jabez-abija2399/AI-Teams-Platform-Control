import { WebContainer } from '@webcontainer/api';
import type { FileSystemTree } from '@webcontainer/api';

let instance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainerInstance(): Promise<WebContainer> {
  if (instance) return instance;
  if (bootPromise) return bootPromise;
  bootPromise = WebContainer.boot({ coep: 'credentialless', forwardPreviewErrors: true });
  instance = await bootPromise;
  bootPromise = null;
  return instance;
}

export function resetWebContainerInstance(): void {
  if (instance) {
    try { instance.teardown(); } catch { }
    instance = null;
  }
  bootPromise = null;
}

function setNestedKey(root: Record<string, unknown>, parts: string[], content: string): void {
  let current = root;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i] as string;
    const isLast = i === parts.length - 1;
    if (isLast) {
      current[part] = { file: { contents: content } };
      return;
    }
    const existing = current[part] as Record<string, unknown> | undefined;
    if (existing && typeof existing === 'object' && 'directory' in existing) {
      current = (existing as { directory: Record<string, unknown> }).directory;
    } else {
      const dir: Record<string, unknown> = {};
      current[part] = { directory: dir };
      current = dir;
    }
  }
}

export function buildFileSystemTree(files: Map<string, string>): FileSystemTree {
  const tree: FileSystemTree = {};
  const entries = Array.from(files.entries());
  for (const [filePath, content] of entries) {
    const parts = filePath.split('/');
    setNestedKey(tree as unknown as Record<string, unknown>, parts, content);
  }
  return tree;
}

export function buildFileSystemTreeFromRecord(files: Record<string, string>): FileSystemTree {
  return buildFileSystemTree(new Map(Object.entries(files)));
}
