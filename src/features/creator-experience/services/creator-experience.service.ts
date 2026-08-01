import { ExecutionProgressMapper, FriendlyStageMapping, STAGE_MAPPINGS } from './execution-progress.mapper';

export interface MilestoneStep {
  id: string;
  stageName: string;
  friendlyTitle: string;
  status: 'completed' | 'current' | 'remaining';
  progress: number;
}

export interface CreatorProgressState {
  currentStage: FriendlyStageMapping;
  friendlyTitle: string;
  friendlyDescription: string;
  progressPercent: number;
  estimatedSecondsRemaining: number;
  milestones: MilestoneStep[];
  friendlyLogs: string[];
  isCompleted: boolean;
  hasError: boolean;
}

export class CreatorExperienceService {
  /**
   * Generates a complete CreatorProgressState from raw build telemetry
   */
  public static calculateProgressState(
    rawStatus: string,
    rawProgress: number,
    rawLogs: Array<{ message: string }> = []
  ): CreatorProgressState {
    const stage = ExecutionProgressMapper.getStageMapping(rawStatus);
    const friendlyTitle = ExecutionProgressMapper.mapToFriendlyTitle(rawStatus);

    // Calculate normalized progress percentage
    const progressPercent = Math.min(100, Math.max(rawProgress, stage.targetProgress));

    // Calculate estimated seconds remaining based on typical 60-second build cycle
    const remainingPercent = 100 - progressPercent;
    const estimatedSecondsRemaining = Math.max(0, Math.ceil((remainingPercent / 100) * 45));

    // Map milestone steps
    const currentStageIndex = STAGE_MAPPINGS.findIndex((s) => s.key === stage.key);

    const milestones: MilestoneStep[] = STAGE_MAPPINGS.filter(s => s.key !== 'FAILED').map((s, index) => {
      let status: 'completed' | 'current' | 'remaining' = 'remaining';
      if (rawStatus === 'COMPLETED' || index < currentStageIndex) {
        status = 'completed';
      } else if (index === currentStageIndex) {
        status = 'current';
      }

      return {
        id: s.key,
        stageName: s.stageName,
        friendlyTitle: s.friendlyTitle,
        status,
        progress: s.targetProgress,
      };
    });

    // Sanitize logs for non-technical Creator view
    const friendlyLogs: string[] = [];
    for (const log of rawLogs) {
      const sanitized = ExecutionProgressMapper.sanitizeLogForCreator(log.message);
      if (sanitized && !friendlyLogs.includes(sanitized)) {
        friendlyLogs.push(sanitized);
      }
    }

    return {
      currentStage: stage,
      friendlyTitle,
      friendlyDescription: stage.friendlyDescription,
      progressPercent,
      estimatedSecondsRemaining,
      milestones,
      friendlyLogs: friendlyLogs.slice(-5), // Keep last 5 friendly events
      isCompleted: rawStatus.toUpperCase() === 'COMPLETED' || progressPercent >= 100,
      hasError: rawStatus.toUpperCase() === 'FAILED',
    };
  }
}
