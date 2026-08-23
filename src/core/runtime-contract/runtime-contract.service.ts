/**
 * Project Runtime Contract Service
 * 
 * Manages resolution, persistence, and retrieval of immutable Project Runtime Contracts.
 */

import { prisma } from '@/lib/prisma';
import type { ProjectRuntimeContract } from './runtime-contract.types';
import type { ProjectType, ProjectCapabilities } from '../project-type/project-type.types';
import { StackRegistry, GOLDEN_STACK_ID } from '../stack-registry/stack-registry';
import { resolveRuntimeContractFromProfile } from '../stack-registry/stack-profile.types';

export class RuntimeContractService {
  /**
   * Resolve and persist an immutable Project Runtime Contract for a project.
   */
  public static async establishRuntimeContract(params: {
    projectId: string;
    projectType: ProjectType;
    stackId?: string;
    overrides?: Partial<ProjectRuntimeContract>;
  }): Promise<ProjectRuntimeContract> {
    const { projectId, projectType, stackId, overrides } = params;

    const profile = StackRegistry.recommendStackForProject({
      projectType,
      requestedStack: stackId,
    });

    const contract = resolveRuntimeContractFromProfile(profile, {
      projectType,
      ...overrides,
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        projectType: projectType as any,
        selectedStackId: contract.stackId,
        selectedStackVersion: contract.stackVersion,
        runtimeContract: contract as any,
        capabilities: contract.capabilities as any,
        stackSource: 'PLATFORM_TEMPLATE',
      },
    }).catch((err) => {
      console.warn(`[RuntimeContractService] Failed to persist contract in project ${projectId}:`, err);
    });

    return contract;
  }

  /**
   * Load the immutable Project Runtime Contract.
   * If missing (legacy project), constructs and persists a compatible contract.
   */
  public static async getRuntimeContract(projectId: string): Promise<ProjectRuntimeContract> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectType: true,
        selectedStackId: true,
        selectedStackVersion: true,
        runtimeContract: true,
        capabilities: true,
      },
    });

    if (project?.runtimeContract) {
      return project.runtimeContract as unknown as ProjectRuntimeContract;
    }

    // Resolve default contract for existing projects
    const projectType: ProjectType = (project?.projectType as ProjectType) || 'FULL_STACK';
    const stackId = project?.selectedStackId || GOLDEN_STACK_ID;

    return this.establishRuntimeContract({
      projectId,
      projectType,
      stackId,
    });
  }

  /**
   * Update specific runtime contract parameters (e.g. environment variables or ports)
   * without mutating the immutable stack version.
   */
  public static async updateContractOverrides(
    projectId: string,
    updater: (current: ProjectRuntimeContract) => ProjectRuntimeContract,
  ): Promise<ProjectRuntimeContract> {
    const current = await this.getRuntimeContract(projectId);
    const updated = updater({ ...current });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        runtimeContract: updated as any,
        capabilities: updated.capabilities as any,
      },
    });

    return updated;
  }
}
