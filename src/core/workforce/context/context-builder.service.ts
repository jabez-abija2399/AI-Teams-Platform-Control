import type { AgentExecutionContext, TaskContextDetails, ProjectContextDetails, MemoryContextDetails, ReviewerRequirements } from './context.types';
import type { AIAgentProfile } from '../types';
import type { CapabilityMatchResult } from '../capability/capability.types';

export class ContextBuilderService {
  /**
   * Constructs an AgentExecutionContext structure from individual loaded domain models
   */
  public static buildContext(
    profile: AIAgentProfile,
    capabilityMatch: CapabilityMatchResult,
    task: Partial<TaskContextDetails> & { id: string; title: string },
    projectMemory?: { vision?: string; decisions?: string[]; constraints?: string[]; risks?: string[] }
  ): AgentExecutionContext {
    const taskDetails: TaskContextDetails = {
      id: task.id,
      title: task.title,
      description: task.description || task.title,
      objective: task.objective || `Execute task: ${task.title}`,
      dependencies: task.dependencies || [],
      expectedOutput: task.expectedOutput || 'Production code with test coverage and error handling',
    };

    const projectDetails: ProjectContextDetails = {
      vision: projectMemory?.vision || 'Build modern, resilient AI-driven software platform',
      productSpecification: 'Next.js App Router, Tailwind CSS/Vanilla CSS, Prisma ORM, PostgreSQL',
      architectureDecisions: projectMemory?.decisions || [
        'ADR-01: Modular Monolith Architecture',
        'ADR-02: Next.js 14 App Router Server Controllers',
        'ADR-03: PostgreSQL with Prisma ORM Schema',
      ],
      technologyStack: ['TypeScript', 'Next.js', 'React 18', 'PostgreSQL', 'Prisma', 'Vitest'],
    };

    const memoryDetails: MemoryContextDetails = {
      previousDecisions: projectMemory?.decisions || [],
      constraints: projectMemory?.constraints || [
        'Must maintain 0 TypeScript errors',
        'Must adhere to modular monolith boundaries',
      ],
      risks: projectMemory?.risks || ['Dependency bottleneck risk', 'Data schema mismatch'],
      lessonsLearned: ['Enforce strict validation before execution', 'Include unit tests with every module'],
    };

    const reviewerRequirements: ReviewerRequirements = {
      securityChecks: true,
      qualityChecks: true,
      testingRequirements: true,
    };

    return {
      agentId: profile.id,
      role: profile.role,
      personality: profile.personality,
      experienceLevel: profile.experienceLevel,
      capabilities: profile.skills.map((skill) => ({
        skill,
        confidence: capabilityMatch.confidenceScore,
      })),
      task: taskDetails,
      project: projectDetails,
      memory: memoryDetails,
      reviewerRequirements,
    };
  }
}
