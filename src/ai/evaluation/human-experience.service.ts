export interface CreatorProgressMessage {
  stepId: string;
  userFacingMessage: string;
  isTechnicalDetail: boolean;
}

export class HumanExperienceService {
  public formatProgressMessage(stepId: string, rawLog?: string, isDeveloperMode = false): CreatorProgressMessage {
    const lowerStep = stepId.toLowerCase();

    if (rawLog && !isDeveloperMode) {
      const lowerLog = rawLog.toLowerCase();
      const containsTechnicalNoise =
        lowerLog.includes('npm install') ||
        lowerLog.includes('npm err!') ||
        lowerLog.includes('ts2307') ||
        lowerLog.includes('ts error') ||
        lowerLog.includes('webpack') ||
        lowerLog.includes('stack trace') ||
        lowerLog.includes('node_modules');

      if (containsTechnicalNoise) {
        return {
          stepId,
          userFacingMessage: 'AI encountered a verification check and is automatically self-correcting...',
          isTechnicalDetail: false,
        };
      }
    }

    if (lowerStep.includes('ceo') || lowerStep.includes('vision') || lowerStep.includes('pm') || lowerStep.includes('requirement')) {
      return { stepId, userFacingMessage: 'AI is understanding your idea...', isTechnicalDetail: false };
    }

    if (lowerStep.includes('architect') || lowerStep.includes('database') || lowerStep.includes('design') || lowerStep.includes('schema')) {
      return { stepId, userFacingMessage: 'AI is designing your application...', isTechnicalDetail: false };
    }

    if (lowerStep.includes('backend') || lowerStep.includes('frontend') || lowerStep.includes('implementation') || lowerStep.includes('code') || lowerStep.includes('devops') || lowerStep.includes('deploy')) {
      return { stepId, userFacingMessage: 'AI is building your product...', isTechnicalDetail: false };
    }

    if (lowerStep.includes('qa') || lowerStep.includes('test') || lowerStep.includes('security') || lowerStep.includes('review')) {
      return { stepId, userFacingMessage: 'AI is testing quality...', isTechnicalDetail: false };
    }

    if (lowerStep.includes('complete') || lowerStep.includes('ready') || lowerStep.includes('done')) {
      return { stepId, userFacingMessage: 'Your application is ready.', isTechnicalDetail: false };
    }

    return { stepId, userFacingMessage: 'AI is working on your project...', isTechnicalDetail: false };
  }

  public sanitizeLogForCreatorMode(rawLog: string): string {
    const lines = rawLog.split('\n');
    const cleanLines = lines.filter((line) => {
      const l = line.toLowerCase();
      return !(
        l.includes('npm ') ||
        l.includes('node_modules') ||
        /ts\d+:/i.test(line) ||
        l.includes('error ts') ||
        l.includes('webpack') ||
        l.includes('at process.') ||
        l.includes('at async') ||
        l.includes('stack trace')
      );
    });
    return cleanLines.length > 0 ? cleanLines.join('\n') : 'AI is processing tasks...';
  }
}

let humanExperienceInstance: HumanExperienceService | null = null;
export function getHumanExperienceService(): HumanExperienceService {
  if (!humanExperienceInstance) {
    humanExperienceInstance = new HumanExperienceService();
  }
  return humanExperienceInstance;
}
