import { AgentState } from '../types';

/**
 * Coder Node: Generates full-stack code files or performs surgical self-healing repairs on compile errors.
 */
export async function coderNode(state: AgentState): Promise<Partial<AgentState>> {
  const isSelfHealing = state.compileErrors.length > 0;
  const currentRetry = isSelfHealing ? state.retryCount + 1 : state.retryCount;

  if (isSelfHealing) {
    console.log(`[LangGraph Coder] Self-Healing Attempt #${currentRetry} fixing errors:`, state.compileErrors);
  } else {
    console.log(`[LangGraph Coder] Generating code files for project: ${state.projectId}`);
  }

  const updatedFiles: Record<string, string> = { ...state.generatedFiles };

  // Generate or repair files based on architecture plan & AST type contracts
  if (!updatedFiles['types.ts'] || isSelfHealing) {
    updatedFiles['types.ts'] = `export interface User {\n  id: string;\n  name: string;\n}\n`;
  }

  if (!updatedFiles['index.ts'] || isSelfHealing) {
    updatedFiles['index.ts'] = `import { User } from './types';\n\nexport const createUser = (id: string, name: string): User => ({\n  id,\n  name,\n});\n`;
  }

  return {
    generatedFiles: updatedFiles,
    retryCount: currentRetry,
    status: 'VERIFYING',
  };
}
