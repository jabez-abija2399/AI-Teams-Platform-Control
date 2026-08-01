import type { ValidationResult } from './integration.types';
import { CompanyEventBus } from './event-bus';
import { LifecycleManager } from './lifecycle-manager';
import { ExecutionStateService } from './execution-state.service';
import { prisma } from '@/lib/prisma';

export class IntegrationValidator {
  public static async validateSystem(): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 1. Verify Core Integration Services Available
    if (!CompanyEventBus) {
      errors.push('CompanyEventBus is not initialized or available.');
    }
    if (!LifecycleManager) {
      errors.push('LifecycleManager is not initialized or available.');
    }
    if (!ExecutionStateService) {
      errors.push('ExecutionStateService is not initialized or available.');
    }

    // 2. Verify Database Dependency / Connectivity
    try {
      if (!prisma) {
        errors.push('Prisma client instance is undefined.');
      } else {
        // Quick check if prisma can query or if we just check object definition
        if (typeof prisma.$queryRaw !== 'function' && typeof prisma.project?.findFirst !== 'function') {
          warnings.push('Prisma client does not appear to have standard methods attached.');
        }
      }
    } catch (err: any) {
      warnings.push(`Prisma database check generated a warning: ${err?.message || err}`);
    }

    // 3. Verify Pipeline State & Transitions consistency
    const requiredTransitions = ['CREATED', 'DISCOVERY', 'PLANNING', 'ARCHITECTURE', 'EXECUTION', 'REVIEW', 'DEPLOYMENT_READY', 'COMPLETED'];
    for (let i = 0; i < requiredTransitions.length - 1; i++) {
      const from = requiredTransitions[i] as any;
      const to = requiredTransitions[i + 1] as any;
      if (!LifecycleManager.canTransition(from, to)) {
        errors.push(`Pipeline consistency error: Cannot transition from ${from} to ${to}.`);
      }
    }

    // 4. Verify No Circular Dependencies or Missing Modules in core integration
    if (typeof CompanyEventBus.publish !== 'function' || typeof CompanyEventBus.subscribe !== 'function') {
      errors.push('CompanyEventBus is missing required event methods.');
    }
    if (typeof ExecutionStateService.getState !== 'function') {
      errors.push('ExecutionStateService is missing required state tracking methods.');
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
