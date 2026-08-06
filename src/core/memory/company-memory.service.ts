import { prisma } from '@/lib/prisma';
import type { CompanyMemoryData } from './types';

const inMemoryStore = new Map<string, { data: CompanyMemoryData; version: number }>();

function defaultMemory(): CompanyMemoryData {
  return {
    vision: 'AI Teams Platform — Autonomous AI Software Company',
    goals: ['Build production ready software', 'Streamline AI-human collaboration'],
    userPreferences: {},
    constraints: ['No unapproved structural changes', 'Strict TypeScript types'],
    risks: ['LLM rate limits', 'Database migration locks'],
    milestones: ['Vision Defined', 'Product Proposal Approved', 'Architecture Approved'],
    approvals: ['Product Proposal', 'System Architecture'],
    notes: ['Initial company kickoff completed successfully.'],
  };
}

function parseMemoryValue(value: unknown): CompanyMemoryData | null {
  try {
    const data =
      typeof value === 'string' ? JSON.parse(value) : (value as CompanyMemoryData);
    if (!data || typeof data !== 'object') return null;
    return data as CompanyMemoryData;
  } catch {
    return null;
  }
}

export class CompanyMemoryService {
  /**
   * Retrieves current company memory data for a project (awaits Prisma — no race).
   */
  public static async getMemory(
    projectId: string,
  ): Promise<{ data: CompanyMemoryData; version: number }> {
    try {
      const record = await prisma.companyMemoryRecord.findFirst({
        where: { projectId, key: 'company_memory' },
        orderBy: { version: 'desc' },
      });

      if (record?.value) {
        const data = parseMemoryValue(record.value);
        if (data) {
          const result = { data, version: record.version };
          inMemoryStore.set(projectId, result);
          return result;
        }
      }
    } catch {
      // fall through to cache / defaults
    }

    const cached = inMemoryStore.get(projectId);
    if (cached) return cached;

    const defaultResult = { data: defaultMemory(), version: 1 };
    inMemoryStore.set(projectId, defaultResult);
    return defaultResult;
  }

  /**
   * Updates company memory data and increments version history
   */
  public static async updateMemory(
    projectId: string,
    updates: Partial<CompanyMemoryData>,
  ): Promise<{ data: CompanyMemoryData; version: number }> {
    const current = await this.getMemory(projectId);
    const updatedData: CompanyMemoryData = {
      ...current.data,
      ...updates,
      userPreferences: {
        ...current.data.userPreferences,
        ...(updates.userPreferences || {}),
      },
      goals: Array.from(new Set([...current.data.goals, ...(updates.goals || [])])),
      constraints: Array.from(
        new Set([...current.data.constraints, ...(updates.constraints || [])]),
      ),
      risks: Array.from(new Set([...current.data.risks, ...(updates.risks || [])])),
      milestones: Array.from(
        new Set([...current.data.milestones, ...(updates.milestones || [])]),
      ),
      approvals: Array.from(
        new Set([...current.data.approvals, ...(updates.approvals || [])]),
      ),
      notes: Array.from(new Set([...current.data.notes, ...(updates.notes || [])])),
    };

    const newVersion = current.version + 1;
    inMemoryStore.set(projectId, { data: updatedData, version: newVersion });

    try {
      await prisma.companyMemoryRecord.create({
        data: {
          projectId,
          key: 'company_memory',
          value: updatedData as object,
          version: newVersion,
        },
      });
    } catch {
      // keep in-memory copy even if persistence fails
    }

    return { data: updatedData, version: newVersion };
  }

  /** Test helper — clear in-memory cache. */
  public static clearCache(projectId?: string): void {
    if (projectId) inMemoryStore.delete(projectId);
    else inMemoryStore.clear();
  }
}
