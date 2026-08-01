import { prisma } from '@/lib/prisma';
import type { ProductSpecification } from '@/ai/agents/roles/product-discovery.agent';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { ProductProposalEngine, type ProductProposal } from '../product/proposal/product-proposal.engine';
import { ProposalScoreService, type ProposalScore } from '../product/proposal/proposal-score.service';

export type ProjectApprovalStatus =
  | 'PENDING_DISCOVERY'
  | 'WAITING_FOR_CLARIFICATION'
  | 'WAITING_FOR_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

const inMemoryApprovalStore = new Map<string, ProjectApprovalStatus>();
const inMemoryProposalStore = new Map<string, ProductProposal>();

export class DiscoveryApprovalService {
  /**
   * Generates, saves proposal, and sets status to WAITING_FOR_APPROVAL
   */
  public static async createProposalApproval(
    projectId: string,
    specification: ProductSpecification
  ): Promise<{ status: ProjectApprovalStatus; proposal: ProductProposal; score: ProposalScore }> {
    const proposal = ProductProposalEngine.generateProposal(specification, projectId);
    const score = ProposalScoreService.calculateScore(proposal);

    inMemoryApprovalStore.set(projectId, 'WAITING_FOR_APPROVAL');
    inMemoryProposalStore.set(projectId, proposal);

    await prisma.productProposal.upsert({
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

    await prisma.productClarification.upsert({
      where: { projectId },
      update: { status: 'WAITING_FOR_APPROVAL' },
      create: { projectId, questions: '[]', status: 'WAITING_FOR_APPROVAL' },
    }).catch(() => {});

    await logAIEvent('PRODUCT_PROPOSAL_GENERATED', { projectId, productName: proposal.productName, score }, 'PRODUCT_DISCOVERY');
    await logAIEvent('WAITING_USER_INPUT', { projectId }, 'PRODUCT_DISCOVERY');

    return {
      status: 'WAITING_FOR_APPROVAL',
      proposal,
      score,
    };
  }

  /**
   * Retrieves proposal and score for a project
   */
  public static async getProposal(projectId: string): Promise<{ proposal: ProductProposal; score: ProposalScore } | null> {
    const record = await prisma.productProposal.findUnique({
      where: { projectId },
    }).catch(() => null);

    let proposal: ProductProposal | null = null;
    if (record?.proposal) {
      proposal = typeof record.proposal === 'string' ? JSON.parse(record.proposal) : (record.proposal as unknown as ProductProposal);
    } else {
      proposal = inMemoryProposalStore.get(projectId) ?? null;
    }

    if (!proposal) return null;
    const score = ProposalScoreService.calculateScore(proposal);
    return { proposal, score };
  }

  /**
   * Updates an existing proposal (e.g. editing MVP features)
   */
  public static async updateProposal(
    projectId: string,
    updatedProposal: Partial<ProductProposal>
  ): Promise<{ proposal: ProductProposal; score: ProposalScore }> {
    const existing = await this.getProposal(projectId);
    const baseProposal = existing?.proposal ?? ProductProposalEngine.generateProposal({
      productName: 'AppCraft',
      vision: '',
      problemStatement: '',
      targetAudience: '',
      platform: '',
      complexity: 'MVP',
      mvpFeatures: [],
      futureFeatures: [],
      questions: [],
    });

    const newProposal: ProductProposal = {
      ...baseProposal,
      ...updatedProposal,
    };

    const score = ProposalScoreService.calculateScore(newProposal);

    inMemoryProposalStore.set(projectId, newProposal);

    await prisma.productProposal.upsert({
      where: { projectId },
      update: { proposal: JSON.stringify(newProposal) },
      create: { projectId, proposal: JSON.stringify(newProposal), approved: false },
    }).catch(() => {});

    await logAIEvent('PRODUCT_PROPOSAL_UPDATED', { projectId, score }, 'PRODUCT_DISCOVERY');

    return { proposal: newProposal, score };
  }

  /**
   * Stores product proposal and requests user approval
   */
  public static async requestApproval(
    projectId: string,
    specification: ProductSpecification
  ): Promise<{ status: ProjectApprovalStatus; specification: ProductSpecification }> {
    const updatedSpec: ProductSpecification = {
      ...specification,
      approvalRequired: true,
    };

    inMemoryApprovalStore.set(projectId, 'WAITING_FOR_APPROVAL');

    await prisma.productClarification.upsert({
      where: { projectId },
      update: {
        questions: JSON.stringify(specification.questions ?? []),
        status: 'WAITING_FOR_APPROVAL',
      },
      create: {
        projectId,
        questions: JSON.stringify(specification.questions ?? []),
        status: 'WAITING_FOR_APPROVAL',
      },
    }).catch(() => {});

    await logAIEvent(
      'PRODUCT_PROPOSAL_CREATED',
      { projectId, productName: specification.productName },
      'PRODUCT_DISCOVERY'
    );
    await logAIEvent('WAITING_USER_INPUT', { projectId }, 'PRODUCT_DISCOVERY');

    return {
      status: 'WAITING_FOR_APPROVAL',
      specification: updatedSpec,
    };
  }

  /**
   * Approves project discovery phase, allowing pipeline to proceed
   */
  public static async approveProject(projectId: string): Promise<{ status: ProjectApprovalStatus }> {
    inMemoryApprovalStore.set(projectId, 'APPROVED');

    await prisma.productClarification.update({
      where: { projectId },
      data: { status: 'APPROVED' },
    }).catch(() => {});

    await prisma.productProposal.update({
      where: { projectId },
      data: { approved: true },
    }).catch(() => {});

    await logAIEvent('USER_APPROVED_PRODUCT', { projectId }, 'PRODUCT_DISCOVERY');
    await logAIEvent('PRODUCT_PROPOSAL_APPROVED', { projectId }, 'PRODUCT_DISCOVERY');

    return { status: 'APPROVED' };
  }

  /**
   * Rejects project proposal, returning back to clarification
   */
  public static async rejectProject(projectId: string): Promise<{ status: ProjectApprovalStatus }> {
    inMemoryApprovalStore.set(projectId, 'REJECTED');

    await prisma.productClarification.update({
      where: { projectId },
      data: { status: 'REJECTED' },
    }).catch(() => {});

    await logAIEvent('USER_REJECTED_PRODUCT', { projectId }, 'PRODUCT_DISCOVERY');

    return { status: 'REJECTED' };
  }

  /**
   * Gets current approval status of a project
   */
  public static async getApprovalStatus(projectId: string): Promise<ProjectApprovalStatus> {
    const record = await prisma.productClarification.findUnique({
      where: { projectId },
    }).catch(() => null);

    return (record?.status as ProjectApprovalStatus) ?? inMemoryApprovalStore.get(projectId) ?? 'PENDING_DISCOVERY';
  }
}
