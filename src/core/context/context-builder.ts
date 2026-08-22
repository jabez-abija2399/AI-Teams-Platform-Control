/**
 * Context Builder & Memory Slicing Engine
 * 
 * Assembles task-scoped, high-signal execution context for each agent:
 * - Project Memory (permanent vision & stack boundaries)
 * - Decision Memory (relevant architecture/product decisions)
 * - Working Memory (task-specific context)
 * - Failure Memory (previous failure evidence & lessons)
 * - Direct Parent Artifacts (not the entire project dump)
 */

import type { ProjectState } from '@/core/state/project-state.types';
import type { CoreAgentRole } from '@/core/contracts/agent-contract.types';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';

export interface CompiledAgentContext {
  role: CoreAgentRole;
  systemPrompt: string;
  userPrompt: string;
  tokenEstimate: number;
}

export class ContextBuilder {
  /**
   * Assembles a minimal, task-scoped context tailored to the executing agent.
   */
  public static async buildContext(params: {
    state: ProjectState;
    role: CoreAgentRole;
    taskTitle: string;
    systemPromptCharter: string;
    retryFeedback?: string;
  }): Promise<CompiledAgentContext> {
    const { state, role, taskTitle, systemPromptCharter, retryFeedback } = params;

    // 1. Project Memory (Permanent constraints)
    const projectMemory = `
# Project Mission & Boundaries:
- Project Name: ${state.projectName}
- Problem to Solve: ${state.product.problem || state.mission}
- Target Users: ${state.product.targetUsers.join(', ') || 'General Users'}
- Confirmed Stack: ${JSON.stringify(state.architecture.targetStack || {})}
`.trim();

    // 2. Decision Memory (Important technical/product decisions)
    const decisions = state.decisions.slice(0, 5);
    const decisionMemory = decisions.length > 0
      ? `\n# Approved Decisions:\n${decisions.map((d) => `- [${d.decision}] Choice: ${d.selectedOption}. Reason: ${d.rationale}`).join('\n')}`
      : '';

    // 3. Direct Parent Artifact Memory
    let artifactSlice = '';
    switch (role) {
      case 'PM': {
        artifactSlice = `\n# Raw Mission Input:\n${state.mission}`;
        break;
      }
      case 'ARCHITECT': {
        const prd = await ArtifactRegistryService.getLatestArtifact(state.projectId, 'PRODUCT_REQUIREMENTS_DOC');
        if (prd) {
          artifactSlice = `\n# Approved PRD Summary:\n${prd.metadata.summary}\n\nFeatures:\n${JSON.stringify(state.requirements.features, null, 2)}`;
        } else {
          artifactSlice = `\n# Requirements Summary:\nFeatures: ${JSON.stringify(state.requirements.features || [])}`;
        }
        break;
      }
      case 'DESIGNER': {
        artifactSlice = `\n# User Stories & Scope:\n${JSON.stringify(state.requirements.userStories || [])}\n\nArchitecture Constraints: ${state.architecture.systemOverview || 'Modern Web'}`;
        break;
      }
      case 'DEVELOPER': {
        const arch = await ArtifactRegistryService.getLatestArtifact(state.projectId, 'ARCHITECTURE_SPECIFICATION');
        const design = await ArtifactRegistryService.getLatestArtifact(state.projectId, 'UI_DESIGN_SPECIFICATION');
        
        artifactSlice = `
# Architecture File Structure & Plan:
${JSON.stringify(state.architecture.fileStructure || [], null, 2)}

# API Design:
${JSON.stringify(state.architecture.apiDesign?.endpoints || [], null, 2)}

# Existing Files in Explorer (${Object.keys(state.implementation.files).length} files):
${Object.keys(state.implementation.files).join('\n')}
`.trim();
        break;
      }
      case 'QA': {
        artifactSlice = `
# Implementation Summary:
Files Created/Modified: ${Object.keys(state.implementation.files).join(', ')}

# Expected Acceptance Criteria:
${JSON.stringify(state.requirements.userStories.map((s) => ({ title: s.title, criteria: s.acceptanceCriteria })), null, 2)}
`.trim();
        break;
      }
    }

    // 4. Failure Memory (Previous attempt error evidence if retrying)
    const failureMemory = retryFeedback ? `\n\n${retryFeedback}` : '';

    // 5. User prompt assembly
    const userPrompt = `
Task: ${taskTitle}

${projectMemory}
${decisionMemory}
${artifactSlice}
${failureMemory}

Please execute this task following your strict contract obligations and produce your complete structured deliverable.
`.trim();

    const tokenEstimate = Math.ceil((systemPromptCharter.length + userPrompt.length) / 4);

    return {
      role,
      systemPrompt: systemPromptCharter,
      userPrompt,
      tokenEstimate,
    };
  }
}
