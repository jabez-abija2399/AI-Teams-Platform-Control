export type PluginPermissionKey = 'files.read' | 'files.write' | 'ai.use' | 'terminal.execute' | 'db.read' | 'project.read';

export interface PluginContext {
  projectId: string;
  requestPermission(permission: PluginPermissionKey): boolean;
  ai: { generate: (prompt: string) => Promise<string> };
  storage: { get: (key: string) => Promise<unknown>; set: (key: string, value: unknown) => Promise<void> };
  events: { on: (event: string, handler: (payload: unknown) => void) => void; emit: (event: string, payload: unknown) => void };
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  type: 'AI_AGENT' | 'TOOL' | 'INTEGRATION' | 'WORKFLOW' | 'UI_EXTENSION' | 'DATA_PROVIDER';
  requiredPermissions: PluginPermissionKey[];
}

export interface PluginInterface {
  manifest: PluginManifest;
  initialize(context: PluginContext): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  destroy(): Promise<void>;
}
