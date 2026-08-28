import type { ValidationResult } from './integration.types';
import { companyEventBus } from './event-bus';
import { LifecycleManager } from './lifecycle-manager';
import { ExecutionStateService } from './execution-state.service';
import { canTransition } from './integration.types';
import { prisma } from '@/lib/prisma';

export class IntegrationValidator {
  public static async validateSystem(): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!companyEventBus || typeof companyEventBus.publish !== 'function') {
      errors.push('CompanyEventBus is not initialized or missing publish method.');
    }
    if (!ExecutionStateService || typeof ExecutionStateService.getState !== 'function') {
      errors.push('ExecutionStateService is not initialized or missing getState method.');
    }

    try {
      if (!prisma) {
        errors.push('Prisma client instance is undefined.');
      } else {
        const result = await prisma.$queryRaw`SELECT 1`;
        if (!result) {
          warnings.push('Prisma database query returned unexpected result.');
        }
      }
    } catch (err: any) {
      warnings.push(`Prisma database check generated a warning: ${err?.message || err}`);
    }

    const requiredTransitions = ['CREATED', 'DISCOVERY', 'PLANNING', 'ARCHITECTURE', 'EXECUTION', 'REVIEW', 'DEPLOYMENT_READY', 'COMPLETED'];
    for (let i = 0; i < requiredTransitions.length - 1; i++) {
      const from = requiredTransitions[i] as any;
      const to = requiredTransitions[i + 1] as any;
      if (!canTransition(from, to)) {
        errors.push(`Pipeline consistency error: Cannot transition from ${from} to ${to}.`);
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  public static async validateProjectPipeline(projectId: string): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!projectId) {
      errors.push('Project ID is required for pipeline validation.');
      return { valid: false, warnings, errors };
    }

    const state = ExecutionStateService.getState(projectId);
    if (!state) {
      errors.push(`Could not retrieve execution state for project ${projectId}.`);
    } else {
      if (state.executionHealth === 'FAILED') {
        warnings.push(`Project ${projectId} is currently in a FAILED state: ${state.error?.message || 'Unknown error'}`);
      }
      if (state.executionHealth === 'PAUSED') {
        warnings.push(`Project ${projectId} execution is currently PAUSED.`);
      }
      if (state.blockedTasks.length > 0) {
        warnings.push(`Project ${projectId} has ${state.blockedTasks.length} blocked task(s).`);
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }
}
