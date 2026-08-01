import type { ConflictReport } from './types';
import type { ExecutiveTask } from '@/core/executive/types';

const inMemoryConflicts = new Map<string, ConflictReport[]>();

export class ConflictDetector {
  /**
   * Evaluates tasks for conflicts before or during execution
   */
  public static detectConflicts(projectId: string, tasks: ExecutiveTask[]): ConflictReport[] {
    const existing = inMemoryConflicts.get(projectId) || [];
    const newConflicts: ConflictReport[] = [];

    // Check for duplicate titles/objectives
    const seenTitles = new Map<string, string>();
    for (const t of tasks) {
      if (seenTitles.has(t.title)) {
        newConflicts.push({
          id: `cnf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          projectId,
          conflictType: 'duplicate_work',
          description: `Task "${t.title}" duplicates existing task ${seenTitles.get(t.title)}`,
          affectedTask: t.id,
          resolved: false,
          timestamp: new Date().toISOString(),
        });
      } else {
        seenTitles.set(t.title, t.id);
      }

      // Check dependency violations (e.g. task running while dependency is not completed)
      if (t.status === 'in_progress' && t.blockers.length > 0) {
        newConflicts.push({
          id: `cnf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          projectId,
          conflictType: 'dependency_violation',
          description: `Task "${t.title}" attempted running while blocked by dependency.`,
          affectedTask: t.id,
          resolved: false,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const merged = [...existing, ...newConflicts];
    inMemoryConflicts.set(projectId, merged);
    return merged;
  }

  public static getConflicts(projectId: string): ConflictReport[] {
    return inMemoryConflicts.get(projectId) || [];
  }
}
