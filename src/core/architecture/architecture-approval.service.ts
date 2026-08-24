import { prisma } from '@/lib/prisma';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { ArchitectureProposalEngine, type ArchitectureProposal } from './proposal/architecture-proposal.engine';
import { ArchitectureScoreService, type ArchitectureQualityScores } from './proposal/architecture-score.service';

export type ArchitectureApprovalStatus =
  | 'WAITING_FOR_ARCHITECTURE_APPROVAL'
  | 'ARCHITECTURE_APPROVED'
  | 'ARCHITECTURE_REJECTED';

const inMemoryArchStatusStore = new Map<string, ArchitectureApprovalStatus>();
const inMemoryArchProposalStore = new Map<string, ArchitectureProposal>();

export class ArchitectureApprovalService {
  /**
   * Creates an architecture proposal and sets state to WAITING_FOR_ARCHITECTURE_APPROVAL
   */
  public static async createApprovalRequest(
    projectId: string,
    architectOutput: unknown
  ): Promise<{ status: ArchitectureApprovalStatus; proposal: ArchitectureProposal }> {
    await logAIEvent('ARCHITECTURE_STARTED', { projectId }, 'ARCHITECT');

    const proposal = ArchitectureProposalEngine.generateProposal(architectOutput, projectId);

    inMemoryArchStatusStore.set(projectId, 'WAITING_FOR_ARCHITECTURE_APPROVAL');
    inMemoryArchProposalStore.set(projectId, proposal);

    await prisma.architectureProposal.upsert({
      where: { projectId },
      update: {
        proposal: JSON.stringify(proposal),
        approved: false,
      },
      create: {
        projectId,
        proposal: JSON.stringify(proposal),
        approved: false,
      },
    }).catch(() => {});

    await logAIEvent('ARCHITECTURE_PROPOSAL_CREATED', { projectId, pattern: proposal.architecturePattern }, 'ARCHITECT');
    await logAIEvent('WAITING_ARCHITECTURE_APPROVAL', { projectId }, 'ARCHITECT');

    return {
      status: 'WAITING_FOR_ARCHITECTURE_APPROVAL',
      proposal,
    };
  }

  /**
   * Approves the architecture proposal, allowing pipeline execution to proceed to developer agents
   */
  public static async approveArchitecture(projectId: string): Promise<{ status: ArchitectureApprovalStatus }> {
    inMemoryArchStatusStore.set(projectId, 'ARCHITECTURE_APPROVED');

    await prisma.architectureProposal.update({
      where: { projectId },
      data: { approved: true },
    }).catch(() => {});

    await logAIEvent('ARCHITECTURE_APPROVED', { projectId }, 'ARCHITECT');

    return { status: 'ARCHITECTURE_APPROVED' };
  }

  /**
   * Rejects the architecture proposal
   */
  public static async rejectArchitecture(projectId: string): Promise<{ status: ArchitectureApprovalStatus }> {
    inMemoryArchStatusStore.set(projectId, 'ARCHITECTURE_REJECTED');

    await prisma.architectureProposal.update({
      where: { projectId },
      data: { approved: false },
    }).catch(() => {});

    await logAIEvent('ARCHITECTURE_REJECTED', { projectId }, 'ARCHITECT');

    return { status: 'ARCHITECTURE_REJECTED' };
  }

  /**
   * Updates an existing architecture proposal
   */
  public static async updateArchitecture(
    projectId: string,
    updatedProposal: Partial<ArchitectureProposal>
  ): Promise<{ proposal: ArchitectureProposal; scores: ArchitectureQualityScores }> {
    const existing = await this.getArchitectureProposal(projectId);
    const baseProposal = existing?.proposal ?? ArchitectureProposalEngine.generateProposal({}, projectId);

    const merged: ArchitectureProposal = {
      ...baseProposal,
      ...updatedProposal,
    };

    merged.qualityScores = ArchitectureScoreService.calculateScore(merged);
    inMemoryArchProposalStore.set(projectId, merged);

    await prisma.architectureProposal.upsert({
      where: { projectId },
      update: { proposal: JSON.stringify(merged) },
      create: { projectId, proposal: JSON.stringify(merged), approved: false },
    }).catch(() => {});

    return { proposal: merged, scores: merged.qualityScores };
  }

  /**
   * Retrieves the architecture proposal for a project
   */
  public static async getArchitectureProposal(projectId: string): Promise<{ proposal: ArchitectureProposal; approved: boolean } | null> {
    const record = await prisma.architectureProposal.findUnique({
      where: { projectId },
    }).catch(() => null);

    let proposal: ArchitectureProposal | null = null;
    let approved = false;

    if (record?.proposal) {
      proposal = typeof record.proposal === 'string' ? JSON.parse(record.proposal) : (record.proposal as unknown as ArchitectureProposal);
      approved = record.approved;
    } else {
      proposal = inMemoryArchProposalStore.get(projectId) ?? null;
      approved = inMemoryArchStatusStore.get(projectId) === 'ARCHITECTURE_APPROVED';
    }

    if (!proposal) return null;
    return { proposal, approved };
  }

  /**
   * Gets current architecture approval status
   */
  public static async getApprovalStatus(projectId: string): Promise<ArchitectureApprovalStatus | 'PENDING'> {
    const memStatus = inMemoryArchStatusStore.get(projectId);
    if (memStatus === 'ARCHITECTURE_REJECTED') {
      return 'ARCHITECTURE_REJECTED';
    }

    const record = await prisma.architectureProposal.findUnique({
      where: { projectId },
    }).catch(() => null);

    if (record) {
      return record.approved ? 'ARCHITECTURE_APPROVED' : 'WAITING_FOR_ARCHITECTURE_APPROVAL';
    }

    return memStatus ?? 'PENDING';
  }
}
