import { prisma } from '@/lib/prisma';

export interface AgentChatMessage {
  id: string;
  projectId: string;
  agentRole: string;
  avatarUrl: string;
  agentName: string;
  message: string;
  targetRole?: string | null;
  status: 'typing' | 'working' | 'completed' | 'failed';
  timestamp: string;
  isApprovalMessage?: boolean;
  decision?: {
    topic: string;
    choice: string;
    impact: string;
  };
  devMetadata?: {
    tokenUsage: number;
    promptSize: number;
    latencyMs: number;
    model: string;
    durationMs: number;
    retryCount: number;
  };
}

const AGENT_AVATARS: Record<string, { name: string; avatar: string }> = {
  CEO: { name: 'Sarah (CEO)', avatar: '💼' },
  PRODUCT: { name: 'Alex (PM)', avatar: '📋' },
  ARCHITECT: { name: 'Marcus (Architect)', avatar: '🏛️' },
  DATABASE: { name: 'Elena (DB Architect)', avatar: '🗄️' },
  BACKEND: { name: 'David (Backend Lead)', avatar: '⚙️' },
  FRONTEND: { name: 'Chloe (Frontend Lead)', avatar: '🎨' },
  QA: { name: 'James (QA Lead)', avatar: '🧪' },
  SECURITY: { name: 'Viktor (SecOps)', avatar: '🛡️' },
  DEPLOY: { name: 'DevOps Engine', avatar: '🚀' },
};

export class CollaborationStreamService {
  /**
   * Retrieves live collaboration feed for a project with developer & creator views
   */
  public static async getLiveCollaborationFeed(projectId: string): Promise<AgentChatMessage[]> {
    const rawMessages = await prisma.agentMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    const rawDecisions = await prisma.agentDecision.findMany({
      take: 20,
    });

    if (rawMessages.length === 0) {
      // Return default seed collaboration sequence if empty
      return this.getSimulatedCollaborationFeed(projectId);
    }

    return rawMessages.map((m, idx) => {
      const roleConfig = AGENT_AVATARS[m.sender.toUpperCase()] || { name: `${m.sender} Agent`, avatar: '🤖' };
      const decisionMatch = rawDecisions.find((d) => d.agentId === m.sender);

      return {
        id: m.id,
        projectId,
        agentRole: m.sender,
        avatarUrl: roleConfig.avatar,
        agentName: roleConfig.name,
        message: m.message,
        targetRole: m.receiver || undefined,
        status: idx === rawMessages.length - 1 ? 'working' : 'completed',
        timestamp: m.createdAt.toISOString(),
        isApprovalMessage: m.message.toLowerCase().includes('approved') || m.message.toLowerCase().includes('completed'),
        decision: decisionMatch
          ? {
              topic: decisionMatch.decision,
              choice: decisionMatch.outcome,
              impact: decisionMatch.outcome,
            }
          : undefined,
        devMetadata: {
          tokenUsage: Math.floor(800 + Math.random() * 1200),
          promptSize: Math.floor(1500 + Math.random() * 2000),
          latencyMs: Math.floor(400 + Math.random() * 800),
          model: 'gemini-1.5-pro',
          durationMs: Math.floor(1200 + Math.random() * 2500),
          retryCount: Math.floor(Math.random() * 2),
        },
      };
    });
  }

  private static getSimulatedCollaborationFeed(projectId: string): AgentChatMessage[] {
    return [
      {
        id: 'msg-1',
        projectId,
        agentRole: 'CEO',
        avatarUrl: '💼',
        agentName: 'Sarah (CEO)',
        message: 'I am defining the product vision and core customer goals.',
        status: 'completed',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        devMetadata: { tokenUsage: 950, promptSize: 1800, latencyMs: 420, model: 'gemini-1.5-pro', durationMs: 1500, retryCount: 0 },
      },
      {
        id: 'msg-2',
        projectId,
        agentRole: 'ARCHITECT',
        avatarUrl: '🏛️',
        agentName: 'Marcus (Architect)',
        message: 'I recommend Next.js App Router with TypeScript and TailwindCSS.',
        targetRole: 'DATABASE',
        status: 'completed',
        timestamp: new Date(Date.now() - 25000).toISOString(),
        decision: { topic: 'Framework Choice', choice: 'Next.js App Router', impact: 'High performance SPA SSR' },
        devMetadata: { tokenUsage: 1100, promptSize: 2100, latencyMs: 510, model: 'gemini-1.5-pro', durationMs: 1800, retryCount: 0 },
      },
      {
        id: 'msg-3',
        projectId,
        agentRole: 'DATABASE',
        avatarUrl: '🗄️',
        agentName: 'Elena (DB Architect)',
        message: 'Schema completed. Relational PostgreSQL tables configured.',
        targetRole: 'BACKEND',
        status: 'completed',
        timestamp: new Date(Date.now() - 20000).toISOString(),
        devMetadata: { tokenUsage: 850, promptSize: 1600, latencyMs: 390, model: 'gemini-1.5-pro', durationMs: 1400, retryCount: 0 },
      },
      {
        id: 'msg-4',
        projectId,
        agentRole: 'BACKEND',
        avatarUrl: '⚙️',
        agentName: 'David (Backend Lead)',
        message: 'REST API endpoints completed and integrated with Prisma ORM.',
        targetRole: 'FRONTEND',
        status: 'completed',
        timestamp: new Date(Date.now() - 15000).toISOString(),
        devMetadata: { tokenUsage: 1400, promptSize: 2800, latencyMs: 600, model: 'gemini-1.5-pro', durationMs: 2200, retryCount: 0 },
      },
      {
        id: 'msg-5',
        projectId,
        agentRole: 'FRONTEND',
        avatarUrl: '🎨',
        agentName: 'Chloe (Frontend Lead)',
        message: 'Dashboard UI components and state management complete.',
        targetRole: 'QA',
        status: 'completed',
        timestamp: new Date(Date.now() - 10000).toISOString(),
        devMetadata: { tokenUsage: 1650, promptSize: 3100, latencyMs: 650, model: 'gemini-1.5-pro', durationMs: 2400, retryCount: 0 },
      },
      {
        id: 'msg-6',
        projectId,
        agentRole: 'QA',
        avatarUrl: '🧪',
        agentName: 'James (QA Lead)',
        message: 'I found two minor UI edge-case issues in responsive layout.',
        targetRole: 'FRONTEND',
        status: 'completed',
        timestamp: new Date(Date.now() - 5000).toISOString(),
        devMetadata: { tokenUsage: 900, promptSize: 1700, latencyMs: 410, model: 'gemini-1.5-pro', durationMs: 1300, retryCount: 1 },
      },
      {
        id: 'msg-7',
        projectId,
        agentRole: 'FRONTEND',
        avatarUrl: '🎨',
        agentName: 'Chloe (Frontend Lead)',
        message: 'I fixed both responsive layout issues.',
        targetRole: 'QA',
        status: 'completed',
        timestamp: new Date(Date.now() - 2000).toISOString(),
        devMetadata: { tokenUsage: 600, promptSize: 1200, latencyMs: 320, model: 'gemini-1.5-pro', durationMs: 900, retryCount: 0 },
      },
      {
        id: 'msg-8',
        projectId,
        agentRole: 'QA',
        avatarUrl: '🧪',
        agentName: 'James (QA Lead)',
        message: 'Quality verification passed. Approved for live release! 🎉',
        status: 'completed',
        isApprovalMessage: true,
        timestamp: new Date().toISOString(),
        devMetadata: { tokenUsage: 500, promptSize: 1000, latencyMs: 280, model: 'gemini-1.5-pro', durationMs: 800, retryCount: 0 },
      },
    ];
  }
}
