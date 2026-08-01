import { prisma } from '@/lib/prisma';
import type { CompanyMemoryData } from './types';

const inMemoryStore = new Map<string, { data: CompanyMemoryData; version: number }>();

export class CompanyMemoryService {
  /**
   * Retrieves current company memory data for a project
   */
  public static async getMemory(projectId: string): Promise<{ data: CompanyMemoryData; version: number }> {
    const cached = inMemoryStore.get(projectId);
    if (cached) return cached;

    const defaultData: CompanyMemoryData = {
      vision: 'AI Teams Platform — Autonomous AI Software Company',
      goals: ['Build production ready software', 'Streamline AI-human collaboration'],
      userPreferences: { framework: 'Next.js 14', styling: 'Vanilla CSS' },
      constraints: ['No unapproved structural changes', 'Strict TypeScript types'],
      risks: ['LLM rate limits', 'Database migration locks'],
      milestones: ['Vision Defined', 'Product Proposal Approved', 'Architecture Approved'],
      approvals: ['Product Proposal', 'System Architecture'],
      notes: ['Initial company kickoff completed successfully.'],
    };

    const defaultResult = { data: defaultData, version: 1 };
    inMemoryStore.set(projectId, defaultResult);

    // Non-blocking Prisma refresh — overwrites cache if DB record exists
    prisma.companyMemoryRecord.findFirst({
      where: { projectId, key: 'company_memory' },
      orderBy: { version: 'desc' },
    }).then((record) => {
      if (record?.value) {
        const data = typeof record.value === 'string' ? JSON.parse(record.value) : (record.value as unknown as CompanyMemoryData);
        inMemoryStore.set(projectId, { data, version: record.version });
      }
    }).catch(() => null);

    return defaultResult;
  }

  /**
   * Updates company memory data and increments version history
   */
  public static async updateMemory(
    projectId: string,
    updates: Partial<CompanyMemoryData>
  ): Promise<{ data: CompanyMemoryData; version: number }> {
    const current = await this.getMemory(projectId);
    const updatedData: CompanyMemoryData = {
      ...current.data,
      ...updates,
      goals: Array.from(new Set([...current.data.goals, ...(updates.goals || [])])),
      constraints: Array.from(new Set([...current.data.constraints, ...(updates.constraints || [])])),
      risks: Array.from(new Set([...current.data.risks, ...(updates.risks || [])])),
      milestones: Array.from(new Set([...current.data.milestones, ...(updates.milestones || [])])),
      approvals: Array.from(new Set([...current.data.approvals, ...(updates.approvals || [])])),
      notes: Array.from(new Set([...current.data.notes, ...(updates.notes || [])])),
    };

    const newVersion = current.version + 1;
    inMemoryStore.set(projectId, { data: updatedData, version: newVersion });

    // Non-blocking Prisma persistence
    prisma.companyMemoryRecord.create({
      data: {
        projectId,
        key: 'company_memory',
        value: JSON.stringify(updatedData),
        version: newVersion,
      },
    }).catch(() => {});

    return { data: updatedData, version: newVersion };
  }
}
