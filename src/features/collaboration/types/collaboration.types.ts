export type MemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEWER' | 'AI_MANAGER' | 'AI_WORKER';
export type MemberType = 'HUMAN' | 'AI_AGENT';

export const ROLE_PERMISSIONS: Record<MemberRole, string[]> = {
  OWNER: ['*'],
  ADMIN: ['project.manage', 'members.manage', 'settings.manage', 'ai.use', 'deploy'],
  MANAGER: ['project.manage', 'members.invite', 'ai.use'],
  DEVELOPER: ['project.edit', 'code.generate', 'ai.use'],
  VIEWER: ['project.view'],
  AI_MANAGER: ['ai.assign', 'ai.use', 'workflow.manage'],
  AI_WORKER: ['ai.execute'],
};

export interface RealtimeChannel {
  subscribe(event: string, handler: (payload: unknown) => void): () => void;
  publish(event: string, payload: unknown): void;
}

export interface PresenceInfo {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
}
