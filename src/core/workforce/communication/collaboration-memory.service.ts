import { CompanyMemoryService } from '../../memory/company-memory.service';
import type { CompanyRole } from '../types';
import { ActivityService } from '../../workspace/activity.service';

export class CollaborationMemoryService {
  /**
   * Records a consensus decision from AI agent conversations into Company Memory
   */
  public static async recordDecision(
    projectId: string,
    topic: string,
    selectedDecision: string,
    createdByRole: CompanyRole
  ): Promise<void> {
    const formattedNote = `[Decision by ${createdByRole}] Topic: "${topic}" -> Decision: ${selectedDecision}`;

    await CompanyMemoryService.updateMemory(projectId, {
      notes: [formattedNote],
      constraints: [`Decided policy: ${selectedDecision}`],
    });

    ActivityService.recordActivity(
      projectId,
      createdByRole,
      createdByRole,
      `[DECISION]: ${topic} -> ${selectedDecision}`,
      'decision'
    );
  }

  /**
   * Records lessons learned from agent collaboration discussions
   */
  public static async recordLessonLearned(
    projectId: string,
    lesson: string,
    reportedByRole: CompanyRole
  ): Promise<void> {
    const formattedNote = `[Lesson Learned by ${reportedByRole}] ${lesson}`;

    await CompanyMemoryService.updateMemory(projectId, {
      notes: [formattedNote],
    });

    ActivityService.recordActivity(
      projectId,
      reportedByRole,
      reportedByRole,
      `[LESSON LEARNED]: ${lesson}`,
      'update'
    );
  }
}
