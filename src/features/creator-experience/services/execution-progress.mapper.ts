export interface FriendlyStageMapping {
  key: string;
  stageName: string;
  friendlyTitle: string;
  friendlyDescription: string;
  iconName: 'workspace' | 'design' | 'build' | 'quality' | 'preview' | 'ready' | 'error';
  targetProgress: number;
}

export const STAGE_MAPPINGS: FriendlyStageMapping[] = [
  {
    key: 'INITIALIZING',
    stageName: 'Preparation',
    friendlyTitle: '🏗 AI is preparing your workspace...',
    friendlyDescription: 'Setting up dependencies, environment, and build pipelines.',
    iconName: 'workspace',
    targetProgress: 15,
  },
  {
    key: 'ARCHITECT_PLANNING',
    stageName: 'Architecture & Design',
    friendlyTitle: '🎨 AI is designing your interface...',
    friendlyDescription: 'Crafting user flows, database schemas, and component structure.',
    iconName: 'design',
    targetProgress: 40,
  },
  {
    key: 'GENERATING_CODE',
    stageName: 'Engineering',
    friendlyTitle: '💻 AI is building your application...',
    friendlyDescription: 'Writing clean TypeScript, Tailwind UI, and server routes.',
    iconName: 'build',
    targetProgress: 75,
  },
  {
    key: 'QA_VERIFYING',
    stageName: 'Quality Verification',
    friendlyTitle: '🧪 AI is checking quality...',
    friendlyDescription: 'Running syntax checks, unit tests, and security scans.',
    iconName: 'quality',
    targetProgress: 90,
  },
  {
    key: 'DEPLOYING',
    stageName: 'Deployment',
    friendlyTitle: '🚀 AI is preparing your live preview...',
    friendlyDescription: 'Packaging artifacts and launching web preview server.',
    iconName: 'preview',
    targetProgress: 98,
  },
  {
    key: 'COMPLETED',
    stageName: 'Ready',
    friendlyTitle: '✨ Your application is ready!',
    friendlyDescription: 'All features built, tested, and ready for launch.',
    iconName: 'ready',
    targetProgress: 100,
  },
  {
    key: 'FAILED',
    stageName: 'Issue Encountered',
    friendlyTitle: '⚡ AI is adjusting execution strategy...',
    friendlyDescription: 'An issue occurred during build; AI recovery mode activated.',
    iconName: 'error',
    targetProgress: 0,
  },
];

export class ExecutionProgressMapper {
  /**
   * Maps raw technical step strings or status codes to human-friendly titles
   */
  public static mapToFriendlyTitle(rawStatusOrStep: string): string {
    const uppercase = rawStatusOrStep.toUpperCase();

    if (uppercase.includes('NPM') || uppercase.includes('INSTALL') || uppercase.includes('ENQUEUING') || uppercase.includes('INITIALIZING')) {
      return '🏗 AI is preparing your workspace...';
    }
    if (uppercase.includes('COMPILING') || uppercase.includes('PLANNING') || uppercase.includes('ARCHITECT') || uppercase.includes('DESIGN')) {
      return '🎨 AI is designing your interface...';
    }
    if (uppercase.includes('FRONTEND') || uppercase.includes('DEVELOPER') || uppercase.includes('WRITING') || uppercase.includes('GENERATING')) {
      return '💻 AI is building your application...';
    }
    if (uppercase.includes('QA') || uppercase.includes('VERIFYING') || uppercase.includes('TEST')) {
      return '🧪 AI is checking quality...';
    }
    if (uppercase.includes('DEPLOY') || uppercase.includes('CONTAINER') || uppercase.includes('PREVIEW')) {
      return '🚀 AI is preparing your live preview...';
    }
    if (uppercase.includes('COMPLETED') || uppercase.includes('SUCCESS')) {
      return '✨ Your application is ready!';
    }
    if (uppercase.includes('FAILED') || uppercase.includes('ERROR')) {
      return '⚡ AI is resolving an optimization issue...';
    }

    return '⚡ AI is processing your request...';
  }

  /**
   * Retrieves the detailed FriendlyStageMapping object matching the given status
   */
  public static getStageMapping(rawStatus: string): FriendlyStageMapping {
    const uppercase = rawStatus.toUpperCase();
    const found = STAGE_MAPPINGS.find(
      (m) => uppercase.includes(m.key) || uppercase === m.key
    );
    if (found) return found;

    if (uppercase.includes('PLAN')) return STAGE_MAPPINGS[1]!;
    if (uppercase.includes('CODE') || uppercase.includes('BUILD')) return STAGE_MAPPINGS[2]!;
    if (uppercase.includes('TEST') || uppercase.includes('VERIF')) return STAGE_MAPPINGS[3]!;
    if (uppercase.includes('DEPLOY') || uppercase.includes('PREVIEW')) return STAGE_MAPPINGS[4]!;

    return STAGE_MAPPINGS[0]!;
  }

  /**
   * Sanitizes technical terminal log entries for non-technical Creator view.
   * Strips out raw npm traces, tsconfig path errors, compiler stack dumps.
   */
  public static sanitizeLogForCreator(logMessage: string): string | null {
    const raw = logMessage.toLowerCase();
    
    // Exclude technical clutter in Creator Mode
    if (
      raw.includes('npm err!') ||
      raw.includes('node_modules') ||
      raw.includes('stack trace') ||
      raw.includes('ts2304') ||
      raw.includes('ts2322') ||
      raw.includes('exit code') ||
      raw.includes('bullmq') ||
      raw.includes('event-stream') ||
      raw.includes('internal/modules')
    ) {
      return null;
    }

    // Map technical logs to friendly descriptions
    return this.mapToFriendlyTitle(logMessage);
  }
}
