import { prisma } from '@/lib/prisma';
import type { AgentDelegationRecord } from './communication.types';
import type { CompanyRole } from '../types';
import { CapabilityMatcherService } from '../capability/capability-matcher.service';
import { MessageService } from './message.service';

const inMemoryDelegations = new Map<string, AgentDelegationRecord>();

export class DelegationEngine {
  /**
   * Delegates a subtask from a senior/lead agent to a specialist agent
   */
  public static async delegateSubtask(params: {
    parentTaskId: string;
    fromAgent: CompanyRole;
    toAgent: CompanyRole;
    subtaskTitle: string;
    subtaskDescription: string;
    projectId?: string;
  }): Promise<{ success: boolean; delegation?: AgentDelegationRecord; reason?: string }> {
    // 1. Check capability match for delegated subtask
    const match = CapabilityMatcherService.matchTask({
      title: params.subtaskTitle,
      description: params.subtaskDescription,
    });

    // 2. Build delegation record
    const delegationId = `del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const delegation: AgentDelegationRecord = {
      id: delegationId,
      parentTaskId: params.parentTaskId,
      fromAgent: params.fromAgent,
      toAgent: params.toAgent,
      subtaskTitle: params.subtaskTitle,
      subtaskDescription: params.subtaskDescription,
      status: 'assigned',
      createdAt: new Date().toISOString(),
    };

    inMemoryDelegations.set(delegationId, delegation);

    // 3. Send delegation message
    await MessageService.sendMessage({
      projectId: params.projectId,
      senderRole: params.fromAgent,
      receiverRole: params.toAgent,
      messageType: 'DELEGATION',
      content: `Delegated subtask [${params.subtaskTitle}]: ${params.subtaskDescription} (Match score: ${match.matchScore}%)`,
      priority: 'high',
    });

    // 4. Non-blocking Prisma record creation
    prisma.agentDelegation.create({
      data: {
        id: delegationId,
        parentTaskId: params.parentTaskId,
        fromAgent: params.fromAgent,
        toAgent: params.toAgent,
        status: 'assigned',
      },
    }).catch(() => null);

    return { success: true, delegation };
  }

  /**
   * Retrieves delegations for a parent task
   */
  public static async getDelegationsForTask(parentTaskId: string): Promise<AgentDelegationRecord[]> {
    return Array.from(inMemoryDelegations.values()).filter((d) => d.parentTaskId === parentTaskId);
  }

  /**
   * Updates completion status of a delegated subtask
   */
  public static async updateDelegationStatus(
    delegationId: string,
    status: AgentDelegationRecord['status']
  ): Promise<AgentDelegationRecord | undefined> {
    const delegation = inMemoryDelegations.get(delegationId);
    if (delegation) {
      delegation.status = status;
      prisma.agentDelegation.update({
        where: { id: delegationId },
        data: { status },
      }).catch(() => null);
    }
    return delegation;
  }
}
