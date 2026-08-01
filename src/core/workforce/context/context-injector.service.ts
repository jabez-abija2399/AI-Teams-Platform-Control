import type { AgentExecutionContext } from './context.types';
import type { AIAgentProfile } from '../types';
import { AgentProfileService } from '../agent-profile.service';
import { CapabilityMatcherService } from '../capability/capability-matcher.service';
import { ContextBuilderService } from './context-builder.service';
import { ContextValidatorService } from './context-validator.service';
import { CompanyMemoryService } from '../../memory/company-memory.service';

export class ContextInjectorService {
  /**
   * Loads task, profile, capability, and company memory to construct an AgentExecutionContext
   */
  public static async injectContextForTask(
    taskId: string,
    taskTitle: string,
    taskDescription: string,
    projectId?: string
  ): Promise<AgentExecutionContext> {
    const capabilityMatch = CapabilityMatcherService.matchTask({
      title: taskTitle,
      description: taskDescription,
    });

    const defaultProfiles = AgentProfileService.getDefaultProfiles();
    const fetchedProfile = await AgentProfileService.getProfileByRole(capabilityMatch.primaryAgent, projectId);
    const profile: AIAgentProfile = fetchedProfile || defaultProfiles[0] || {
      id: 'prof_fallback',
      role: 'BACKEND_ENGINEER',
      name: 'Sarah Jenkins',
      avatar: '/avatars/backend.webp',
      title: 'Staff Backend Engineer AI',
      skills: ['Node.js', 'REST API Routes'],
      personality: 'Methodical and performance-focused.',
      responsibilities: ['Develop backend route handlers'],
      experienceLevel: 'Staff',
    };

    const memoryResult = projectId
      ? await CompanyMemoryService.getMemory(projectId).catch(() => null)
      : null;

    const vision = memoryResult?.data.vision;
    const constraints = memoryResult?.data.constraints || [];
    const risks = memoryResult?.data.risks || [];

    const context = ContextBuilderService.buildContext(
      profile,
      capabilityMatch,
      {
        id: taskId,
        title: taskTitle,
        description: taskDescription,
      },
      {
        vision,
        constraints: constraints.length > 0 ? constraints : undefined,
        risks: risks.length > 0 ? risks : undefined,
      }
    );

    const validation = ContextValidatorService.validate(context);
    if (!validation.valid) {
      console.warn(`[ContextInjectorService] Context validation warnings for task ${taskId}:`, validation.errors);
    }

    return context;
  }
}
