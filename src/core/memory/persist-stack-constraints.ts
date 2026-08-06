/**
 * Persist / resolve stack for agents + Preview.
 * User-confirmed stack wins over text heuristics.
 */

import { CompanyMemoryService } from './company-memory.service';
import {
  resolveStackIntent,
  type DeliveryStack,
  type StackIntent,
} from '@/core/company-orchestration/stack-intent';
import {
  constraintsForStack,
  labelForStack,
  type ProjectStackId,
} from '@/core/project-stack/stack-catalog';

function projectStackToDelivery(stack: ProjectStackId): DeliveryStack {
  if (stack === 'static-html') return 'static-html';
  if (stack === 'react') return 'react-vite';
  return 'nextjs';
}

function intentFromConfirmed(stack: ProjectStackId): StackIntent {
  const delivery = projectStackToDelivery(stack);
  const constraints = constraintsForStack(stack);
  return {
    htmlCss: stack === 'static-html',
    staticNoBackend: stack === 'static-html',
    stack: delivery,
    constraints,
    label: labelForStack(stack),
  };
}

/**
 * Persist stack from agent text heuristics — does NOT mark stackConfirmed.
 * User still confirms in Preview for durable Preview strategy.
 */
export async function persistStackConstraints(
  projectId: string,
  ...parts: unknown[]
): Promise<StackIntent> {
  // If user already confirmed, do not overwrite their choice from agent text
  try {
    const { getProjectStackState } = await import(
      '@/core/project-stack/project-stack.service'
    );
    const state = await getProjectStackState(projectId);
    if (state.confirmed) {
      return intentFromConfirmed(state.confirmed);
    }
  } catch {
    /* continue */
  }

  const intent = resolveStackIntent(...parts);
  if (intent.stack === 'nextjs' && intent.constraints.length === 0) {
    return intent;
  }

  const projectStack: ProjectStackId =
    intent.stack === 'static-html'
      ? 'static-html'
      : intent.stack === 'html-css-server'
        ? 'static-html'
        : 'nextjs';

  // Suggestion only — never clear or overwrite a confirmed choice
  await CompanyMemoryService.updateMemory(projectId, {
    constraints: intent.constraints,
    userPreferences: {
      stackSuggested: projectStack,
      styling: intent.htmlCss ? 'HTML/CSS' : 'framework',
      label: intent.label,
      staticNoBackend: intent.staticNoBackend,
    },
    notes: [`Stack suggested from idea/feedback: ${intent.label}`],
  });

  return intent;
}

/** Resolve stack: confirmed user choice first, then memory suggestion, then text parts. */
export async function resolveStackFromMemory(
  projectId: string,
  ...parts: unknown[]
): Promise<StackIntent> {
  try {
    const { getProjectStackState } = await import(
      '@/core/project-stack/project-stack.service'
    );
    const state = await getProjectStackState(projectId);
    if (state.confirmed) {
      return intentFromConfirmed(state.confirmed);
    }

    const { data } = await CompanyMemoryService.getMemory(projectId);
    const prefs = data.userPreferences || {};
    const prefsBlob = JSON.stringify(prefs);
    const constraintsBlob = (data.constraints ?? []).join('\n');
    return resolveStackIntent(
      prefsBlob,
      constraintsBlob,
      prefs.stackSuggested ?? prefs.stack,
      ...parts,
    );
  } catch {
    return resolveStackIntent(...parts);
  }
}
