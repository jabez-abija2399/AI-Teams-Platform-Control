import { describe, it, expect, beforeEach } from 'vitest';
import { HumanExperienceService } from '../../src/ai/evaluation/human-experience.service';

describe('Phase 15 Human Experience Validation — Creator Mode', () => {
  let service: HumanExperienceService;

  beforeEach(() => {
    service = new HumanExperienceService();
  });

  it('should map workflow steps to user-friendly progress messages in Creator Mode', () => {
    expect(service.formatProgressMessage('ceo_vision').userFacingMessage).toBe('AI is understanding your idea...');
    expect(service.formatProgressMessage('architecture_design').userFacingMessage).toBe('AI is designing your application...');
    expect(service.formatProgressMessage('frontend_implementation').userFacingMessage).toBe('AI is building your product...');
    expect(service.formatProgressMessage('qa_review').userFacingMessage).toBe('AI is testing quality...');
    expect(service.formatProgressMessage('workflow_completed').userFacingMessage).toBe('Your application is ready.');
  });

  it('should never expose npm install, TS errors, or stack traces in Creator Mode when an error occurs', () => {
    const rawErrorLog = 'npm ERR! code ERESOLVE\nTS2307: Cannot find module @/components/header\nat async WorkflowExecutor.executeStep (execution.ts:145)';
    
    const formatted = service.formatProgressMessage('frontend_implementation', rawErrorLog, false);
    expect(formatted.userFacingMessage).toBe('AI encountered a verification check and is automatically self-correcting...');
    expect(formatted.userFacingMessage).not.toContain('npm ERR!');
    expect(formatted.userFacingMessage).not.toContain('TS2307');
    expect(formatted.userFacingMessage).not.toContain('at async');

    const sanitized = service.sanitizeLogForCreatorMode(rawErrorLog);
    expect(sanitized).not.toContain('npm ERR!');
    expect(sanitized).not.toContain('TS2307');
    expect(sanitized).not.toContain('at async');
  });

  it('should allow technical logs when Developer Mode is enabled', () => {
    const rawErrorLog = 'TS2307: Cannot find module @/components/header';
    const formatted = service.formatProgressMessage('frontend_implementation', rawErrorLog, true);
    expect(formatted.userFacingMessage).toBe('AI is building your product...');
  });
});
