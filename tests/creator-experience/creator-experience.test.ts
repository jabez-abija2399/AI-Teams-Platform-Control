import { describe, it, expect } from 'vitest';
import { ExecutionProgressMapper } from '../../src/features/creator-experience/services/execution-progress.mapper';
import { CreatorExperienceService } from '../../src/features/creator-experience/services/creator-experience.service';

describe('Phase 20 - Creator Experience System', () => {
  it('should map technical statuses to human-friendly titles', () => {
    expect(ExecutionProgressMapper.mapToFriendlyTitle('INITIALIZING')).toBe('🏗 AI is preparing your workspace...');
    expect(ExecutionProgressMapper.mapToFriendlyTitle('ARCHITECT_PLANNING')).toBe('🎨 AI is designing your interface...');
    expect(ExecutionProgressMapper.mapToFriendlyTitle('GENERATING_CODE')).toBe('💻 AI is building your application...');
    expect(ExecutionProgressMapper.mapToFriendlyTitle('QA_VERIFYING')).toBe('🧪 AI is checking quality...');
    expect(ExecutionProgressMapper.mapToFriendlyTitle('DEPLOYING')).toBe('🚀 AI is preparing your live preview...');
    expect(ExecutionProgressMapper.mapToFriendlyTitle('COMPLETED')).toBe('✨ Your application is ready!');
  });

  it('should sanitize technical terminal logs for Creator Mode', () => {
    const npmErrorLog = 'npm ERR! code ERESOLVE';
    const tsErrorLog = 'src/app.ts(12,5): error TS2304: Cannot find name foo';
    const friendlyLog = 'Executing FRONTEND agent build phase';

    expect(ExecutionProgressMapper.sanitizeLogForCreator(npmErrorLog)).toBeNull();
    expect(ExecutionProgressMapper.sanitizeLogForCreator(tsErrorLog)).toBeNull();
    expect(ExecutionProgressMapper.sanitizeLogForCreator(friendlyLog)).toBe('💻 AI is building your application...');
  });

  it('should calculate complete CreatorProgressState with milestones & time estimation', () => {
    const rawLogs = [
      { message: 'Executing FRONTEND agent' },
      { message: 'npm ERR! stack trace' },
      { message: 'QA VERIFYING step' },
    ];

    const state = CreatorExperienceService.calculateProgressState('GENERATING_CODE', 60, rawLogs);

    expect(state.friendlyTitle).toBe('💻 AI is building your application...');
    expect(state.progressPercent).toBeGreaterThanOrEqual(60);
    expect(state.estimatedSecondsRemaining).toBeGreaterThan(0);
    expect(state.milestones.length).toBe(6);
    expect(state.friendlyLogs).not.toContain('npm ERR! stack trace');
  });
});
