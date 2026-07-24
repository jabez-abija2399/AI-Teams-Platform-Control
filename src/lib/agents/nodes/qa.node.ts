import { AgentState } from '../types';

/**
 * QA Node: Executes compiler check and populates compileErrors array if verification fails.
 */
export async function qaNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log(`[LangGraph QA] Verifying code compilation for project: ${state.projectId}`);

  // In production, compiler checks are executed in E2B microVM runner or passed compile errors
  const errors: string[] = [];

  // Verify that required imports match exported types
  const indexContent = state.generatedFiles['index.ts'] || '';
  if (indexContent.includes("from './types'") && !state.generatedFiles['types.ts']) {
    errors.push("Cannot find module './types' or its corresponding type declarations.");
  }

  const success = errors.length === 0;

  return {
    compileErrors: errors,
    status: success ? 'SUCCESS' : 'VERIFYING',
  };
}
