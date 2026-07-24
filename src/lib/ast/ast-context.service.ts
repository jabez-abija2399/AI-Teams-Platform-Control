import { ContextGraph } from './context-graph';
import { getMinimalPromptContext } from './context-pruner';
import { PrunedContextResult } from './ast.types';

declare global {
  // eslint-disable-next-line no-var
  var globalASTContextGraph: ContextGraph | undefined;
}

/**
 * Singleton AST Context Graph Service for indexing workspace files
 * and building token-optimized LLM prompt contexts.
 */
export const astContextGraph =
  globalThis.globalASTContextGraph || new ContextGraph();

if (process.env.NODE_ENV !== 'production') {
  globalThis.globalASTContextGraph = astContextGraph;
}

/**
 * Indexes an array of workspace files into the AST Context Graph.
 */
export function indexWorkspaceFiles(
  files: Array<{ path: string; content: string }>
): void {
  for (const file of files) {
    astContextGraph.updateFile(file.path, file.content);
  }
}

/**
 * Retrieves token-optimized AST context for a target file to be modified by an LLM Agent.
 */
export function getASTPromptContext(
  targetFilePath: string,
  workspaceFilesMap: Map<string, string>
): PrunedContextResult {
  return getMinimalPromptContext(targetFilePath, astContextGraph, workspaceFilesMap);
}
