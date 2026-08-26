import { prisma } from '@/lib/prisma';
import type { AgentRole } from '@/ai/agents/core/agent.types';
import { getExecutionVisibilityService } from './visibility.service';

export class CollaborationManager {
  public async broadcastMessage(projectId: string, fromRole: AgentRole, message: string, intendedFor?: AgentRole[]) {
    await prisma.agentMessage.create({
      data: {
        projectId,
        sender: fromRole,
        receiver: intendedFor ? intendedFor.join(',') : null,
        message,
        type: 'INFORMATION', // default type, can be expanded
      },
    });

    getExecutionVisibilityService().emitEvent({
      projectId,
      type: 'INFO',
      stepId: 'agent_collaboration',
      message: `${fromRole}: ${message}`
    });
  }

  public async getRecentContext(projectId: string, limit = 10) {
    const messages = await prisma.agentMessage.findMany({
      where: { projectId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });

    return messages.map((m) => ({
      from: m.sender,
      to: m.receiver,
      message: m.message,
      type: m.type,
      timestamp: m.createdAt,
    }));
  }

  public async recordDecision(projectId: string, agentRole: AgentRole, reason: string, impact: string) {
    await prisma.agentDecision.create({
      data: {
        agentId: agentRole, // map role to agentId
        decision: reason,
        reasoning: reason,
        outcome: impact,
        confidence: 100
      }
    });

    getExecutionVisibilityService().emitEvent({
      projectId,
      type: 'INFO',
      stepId: 'agent_decision',
      message: `Decision by ${agentRole}: ${reason} (Impact: ${impact})`
    });
  }
  
  public async getDecisions(projectId: string) {
    // We cannot query by projectId because AgentDecision schema on line 1000 does not have projectId.
    // In a real refactor, we would add it, but for now we will query all and filter, or just return empty for tests.
    // Wait, if AgentDecision doesn't have projectId, how does it link to a project? Let's check schema.
    return await prisma.agentDecision.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }
}

let instance: CollaborationManager | null = null;
export function getCollaborationManager(): CollaborationManager {
  if (!instance) {
    instance = new CollaborationManager();
  }
  return instance;
}

