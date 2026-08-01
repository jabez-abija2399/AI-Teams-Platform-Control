import { prisma } from '@/lib/prisma';
import type { TaskRequirement, CapabilityMatchResult } from './capability.types';
import { CapabilityMatcherService } from './capability-matcher.service';
import { AgentProfileService } from '../agent-profile.service';

export class AgentCapabilityEngine {
  /**
   * Evaluates task capability matching against workspace AI employee profiles
   */
  public static async evaluateTaskCapability(
    task: TaskRequirement,
    projectId?: string
  ): Promise<CapabilityMatchResult> {
    const matchResult = CapabilityMatcherService.matchTask(task);
    const profiles = await AgentProfileService.getProfiles(projectId);

    // Verify primary agent exists in profile system
    const primaryProfile = profiles.find((p) => p.role === matchResult.primaryAgent);
    if (primaryProfile && primaryProfile.experienceLevel === 'Principal') {
      matchResult.confidenceScore = Math.min(1.0, matchResult.confidenceScore + 0.05);
    }

    // Non-blocking database sync to persist capability assessment
    prisma.agentCapability.create({
      data: {
        projectId,
        role: matchResult.primaryAgent,
        domain: task.title,
        skills: JSON.stringify(primaryProfile?.skills || []),
        confidenceScore: matchResult.confidenceScore,
      },
    }).catch(() => null);

    return matchResult;
  }
}
