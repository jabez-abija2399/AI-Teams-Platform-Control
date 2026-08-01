import { describe, it, expect } from 'vitest';
import { AgentProfileService } from '../../src/core/workforce/agent-profile.service';
import type { CompanyRole } from '../../src/core/workforce/types';

describe('Phase 28 Step 1 — AI Agent Profile System', () => {
  const projectId = 'proj_workforce_test';

  it('1. Returns default profiles covering all 10 AI Company Roles', () => {
    const defaults = AgentProfileService.getDefaultProfiles();

    expect(defaults.length).toBe(10);

    const requiredRoles: CompanyRole[] = [
      'CEO',
      'PRODUCT_MANAGER',
      'SOFTWARE_ARCHITECT',
      'DATABASE_ENGINEER',
      'BACKEND_ENGINEER',
      'FRONTEND_ENGINEER',
      'UI_ENGINEER',
      'QA_ENGINEER',
      'SECURITY_ENGINEER',
      'DEVOPS_ENGINEER',
    ];

    const presentRoles = defaults.map((p) => p.role);
    for (const role of requiredRoles) {
      expect(presentRoles).toContain(role);
    }
  });

  it('2. Every AI employee has skills, personality, responsibilities, and experience level', async () => {
    const profiles = await AgentProfileService.getProfiles(projectId);

    for (const p of profiles) {
      expect(p.name).toBeDefined();
      expect(p.title).toBeDefined();
      expect(p.skills.length).toBeGreaterThan(0);
      expect(p.personality.length).toBeGreaterThan(0);
      expect(p.responsibilities.length).toBeGreaterThan(0);
      expect(p.experienceLevel).toBeDefined();
    }
  });

  it('3. Can query individual AI employee by role', async () => {
    const architect = await AgentProfileService.getProfileByRole('SOFTWARE_ARCHITECT', projectId);
    expect(architect).toBeDefined();
    expect(architect?.name).toBe('Marcus Thorne');
    expect(architect?.experienceLevel).toBe('Principal');

    const dbEngineer = await AgentProfileService.getProfileByRole('DATABASE_ENGINEER', projectId);
    expect(dbEngineer).toBeDefined();
    expect(dbEngineer?.skills).toContain('PostgreSQL');
  });

  it('4. Seeds default profiles into workspace', async () => {
    const seeded = await AgentProfileService.seedDefaultProfiles(projectId);
    expect(seeded.length).toBe(10);
  });
});
