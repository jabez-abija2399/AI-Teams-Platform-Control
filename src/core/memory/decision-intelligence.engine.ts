import { prisma } from '@/lib/prisma';
import type { CompanyDecision, DecisionCategory, DecisionStatus } from './types';

const inMemoryDecisions = new Map<string, CompanyDecision[]>();

export class DecisionIntelligenceEngine {
  /**
   * Records a new company decision
   */
  public static async recordDecision(
    projectId: string,
    category: DecisionCategory,
    title: string,
    selectedOption: string,
    alternatives: string[],
    rationale: string,
    createdByAgent: string,
    confidenceScore = 0.9,
    status: DecisionStatus = 'approved'
  ): Promise<CompanyDecision> {
    const decision: CompanyDecision = {
      id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      category,
      title,
      selectedOption,
      alternatives,
      rationale,
      confidenceScore,
      status,
      createdByAgent,
      approvedByUser: true,
      timestamp: new Date().toISOString(),
    };

    const existing = inMemoryDecisions.get(projectId) || [];
    existing.unshift(decision);
    inMemoryDecisions.set(projectId, existing);

    await prisma.companyDecision.create({
      data: {
        id: decision.id,
        projectId,
        category,
        title,
        selectedOption,
        alternatives: JSON.stringify(alternatives),
        rationale,
        confidenceScore,
        status,
        createdByAgent,
        approvedByUser: true,
      },
    }).catch(() => {});

    return decision;
  }

  /**
   * Gets all decisions for a project
   */
  public static async getDecisions(projectId: string, category?: DecisionCategory): Promise<CompanyDecision[]> {
    const records = await prisma.companyDecision.findMany({
      where: {
        projectId,
        ...(category ? { category } : {}),
      },
      orderBy: { timestamp: 'desc' },
    }).catch(() => []);

    if (records.length > 0) {
      return records.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        category: r.category as DecisionCategory,
        title: r.title,
        selectedOption: r.selectedOption,
        alternatives: typeof r.alternatives === 'string' ? JSON.parse(r.alternatives) : (r.alternatives as unknown as string[]),
        rationale: r.rationale,
        confidenceScore: r.confidenceScore,
        status: r.status as DecisionStatus,
        createdByAgent: r.createdByAgent,
        approvedByUser: r.approvedByUser,
        timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : (r.timestamp ? String(r.timestamp) : new Date().toISOString()),
      }));
    }

    const list = inMemoryDecisions.get(projectId) || [];
    if (category) return list.filter((d) => d.category === category);
    return list;
  }

  /**
   * Seeds default company decisions for a workspace
   */
  public static seedDefaultDecisions(projectId: string): CompanyDecision[] {
    if (inMemoryDecisions.has(projectId)) return inMemoryDecisions.get(projectId)!;

    const defaults: CompanyDecision[] = [
      {
        id: `dec_seed_1`,
        projectId,
        category: 'architecture',
        title: 'Use Next.js 14 App Router fullstack architecture',
        selectedOption: 'Next.js 14 App Router',
        alternatives: ['Express + Vite React SPA', 'NestJS + Next.js'],
        rationale: 'Provides unified SSR, server components, and native API routes with optimal performance.',
        confidenceScore: 0.95,
        status: 'approved',
        createdByAgent: 'ARCHITECT',
        approvedByUser: true,
        timestamp: new Date().toISOString(),
      },
      {
        id: `dec_seed_2`,
        projectId,
        category: 'database',
        title: 'Use PostgreSQL 16 with Prisma ORM',
        selectedOption: 'PostgreSQL + Prisma',
        alternatives: ['MongoDB + Mongoose', 'SQLite + Drizzle'],
        rationale: 'Relational consistency with full TypeScript type safety and automated migration workflows.',
        confidenceScore: 0.92,
        status: 'approved',
        createdByAgent: 'DATABASE',
        approvedByUser: true,
        timestamp: new Date().toISOString(),
      },
    ];

    inMemoryDecisions.set(projectId, defaults);
    return defaults;
  }
}
