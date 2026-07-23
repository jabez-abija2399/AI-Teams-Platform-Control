import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import type { ITool, ToolResult } from './tool.interface';

const WORKSPACE_ROOT = join(process.cwd(), 'workspace');

export const readFileTool: ITool<{ path: string }, string> = {
  name: 'read_file',
  description: 'Reads a file from the project workspace.',
  async execute({ path }): Promise<ToolResult<string>> {
    try {
      const fullPath = join(WORKSPACE_ROOT, path);
      if (!existsSync(fullPath)) return { success: false, error: `File not found: ${path}` };
      const content = readFileSync(fullPath, 'utf-8');
      return { success: true, data: content };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Read failed' };
    }
  },
};

export const writeFileTool: ITool<{ path: string; content: string }, void> = {
  name: 'write_file',
  description: 'Writes a file to the project workspace. Creates directories if needed.',
  async execute({ path, content }): Promise<ToolResult<void>> {
    try {
      const fullPath = join(WORKSPACE_ROOT, path);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, content, 'utf-8');
      return { success: true, data: undefined };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Write failed' };
    }
  },
};

export const listDirectoryTool: ITool<{ path: string }, string[]> = {
  name: 'list_directory',
  description: 'Lists files and directories in the given path.',
  async execute({ path }): Promise<ToolResult<string[]>> {
    try {
      const fullPath = join(WORKSPACE_ROOT, path);
      if (!existsSync(fullPath)) return { success: false, error: `Directory not found: ${path}` };
      const entries = readdirSync(fullPath, { withFileTypes: true });
      return {
        success: true,
        data: entries.map((e) => `${e.isDirectory() ? '[DIR] ' : ''}${e.name}`),
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'List failed' };
    }
  },
};
