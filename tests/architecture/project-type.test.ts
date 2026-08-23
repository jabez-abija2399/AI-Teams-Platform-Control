import { describe, it, expect } from 'vitest';
import {
  classifyProjectType,
  PROJECT_TYPE_DEFAULT_CAPABILITIES,
} from '@/core/project-type/project-type.types';

describe('Project Type Taxonomy & Classification', () => {
  it('classifies frontend-only prompts correctly', () => {
    const type = classifyProjectType('I want a simple landing page for my mobile app waitlist');
    expect(type).toBe('FRONTEND_ONLY');
    expect(PROJECT_TYPE_DEFAULT_CAPABILITIES[type].frontend).toBe(true);
    expect(PROJECT_TYPE_DEFAULT_CAPABILITIES[type].backend).toBe(false);
    expect(PROJECT_TYPE_DEFAULT_CAPABILITIES[type].database).toBe(false);
  });

  it('classifies backend-only API prompts correctly', () => {
    const type = classifyProjectType('Build only backend REST API service for customer billing');
    expect(type).toBe('BACKEND_ONLY');
    expect(PROJECT_TYPE_DEFAULT_CAPABILITIES[type].frontend).toBe(false);
    expect(PROJECT_TYPE_DEFAULT_CAPABILITIES[type].backend).toBe(true);
    expect(PROJECT_TYPE_DEFAULT_CAPABILITIES[type].database).toBe(true);
  });

  it('classifies full-stack SaaS prompts correctly', () => {
    const type = classifyProjectType('Build a full stack inventory management SaaS with user auth and dashboard');
    expect(type).toBe('FULL_STACK');
    expect(PROJECT_TYPE_DEFAULT_CAPABILITIES[type].frontend).toBe(true);
    expect(PROJECT_TYPE_DEFAULT_CAPABILITIES[type].backend).toBe(true);
    expect(PROJECT_TYPE_DEFAULT_CAPABILITIES[type].database).toBe(true);
  });
});
