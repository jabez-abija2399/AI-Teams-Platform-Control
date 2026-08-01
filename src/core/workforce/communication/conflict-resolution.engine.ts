import type { ConflictResolutionResult } from './communication.types';
import type { CompanyRole } from '../types';
import { MessageService } from './message.service';
import { CollaborationMemoryService } from './collaboration-memory.service';

export class ConflictResolutionEngine {
  /**
   * Resolves technical/architectural disagreements between AI employees
   */
  public static async resolveConflict(params: {
    projectId?: string;
    topic: string;
    conflictingRoles: CompanyRole[];
    proposals: Array<{ role: CompanyRole; solution: string }>;
  }): Promise<ConflictResolutionResult> {
    const conflictId = `cnf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Prioritize Architect or CEO decisions if involved, otherwise pick the first detailed proposal
    const leadRoleOrder: CompanyRole[] = [
      'SOFTWARE_ARCHITECT',
      'CEO',
      'PRODUCT_MANAGER',
      'SECURITY_ENGINEER',
      'DATABASE_ENGINEER',
      'BACKEND_ENGINEER',
      'FRONTEND_ENGINEER',
    ];

    let winningProposal = params.proposals[0] ?? { role: 'SOFTWARE_ARCHITECT' as CompanyRole, solution: 'No resolution' };
    for (const leadRole of leadRoleOrder) {
      const match = params.proposals.find((p) => p.role === leadRole);
      if (match) {
        winningProposal = match;
        break;
      }
    }

    const rationale = `Conflict on "${params.topic}" resolved in favor of ${winningProposal.role} proposal according to organizational hierarchy and system architecture constraints.`;

    if (params.projectId) {
      await CollaborationMemoryService.recordDecision(
        params.projectId,
        `Conflict Resolution: ${params.topic}`,
        winningProposal.solution,
        winningProposal.role
      );

      await MessageService.sendMessage({
        projectId: params.projectId,
        senderRole: winningProposal.role,
        messageType: 'WARNING',
        content: `[CONFLICT RESOLVED]: ${rationale} Decision: ${winningProposal.solution}`,
        priority: 'high',
      });
    }

    return {
      conflictId,
      topic: params.topic,
      conflictingRoles: params.conflictingRoles,
      winningResolution: winningProposal.solution,
      rationale,
    };
  }
}
