import { ContextGraph } from './context-graph';
import { PrunedContextResult } from './ast.types';
import { resolveLanguageFromPath } from './tree-sitter-parser';

/**
 * Prunes workspace files down to a token-optimized polyglot context block for LLM prompts.
 * Dynamically uses language-appropriate comment syntax (# for Python, // for TS/Go/Rust/C++/Java/PHP).
 */
export function getMinimalPromptContext(
  targetFilePath: string,
  graph: ContextGraph,
  workspaceFiles: Map<string, string>
): PrunedContextResult {
  const targetFileContent = workspaceFiles.get(targetFilePath) || `// File not found: ${targetFilePath}`;
  const blastRadiusFiles = graph.getBlastRadius(targetFilePath);

  const prunedContracts: Array<{
    filePath: string;
    importedSymbols: string[];
    contractSnippet: string;
  }> = [];

  for (const dependentFilePath of blastRadiusFiles) {
    const dependentContent = workspaceFiles.get(dependentFilePath);
    const dependentMetadata = graph.getFileMetadata(dependentFilePath);

    if (!dependentContent || !dependentMetadata) continue;

    const importedSymbols = dependentMetadata.imports.get(targetFilePath) || [];
    const contractLines: string[] = [];
    const lines = dependentContent.split('\n');

    dependentMetadata.symbols.forEach((symbol) => {
      if (
        importedSymbols.includes(symbol.name) ||
        symbol.exportStatus ||
        symbol.type === 'INTERFACE' ||
        symbol.type === 'TYPE' ||
        symbol.type === 'STRUCT' ||
        symbol.type === 'CLASS' ||
        symbol.type === 'TRAIT'
      ) {
        const startLineIdx = Math.max(0, symbol.lineStart - 1);
        const endLineIdx = Math.min(lines.length - 1, symbol.lineEnd - 1);
        const symbolSnippet = lines.slice(startLineIdx, endLineIdx + 1).join('\n');
        contractLines.push(symbolSnippet);
      }
    });

    const contractSnippet = contractLines.length > 0
      ? contractLines.join('\n\n')
      : lines.slice(0, 15).join('\n');

    prunedContracts.push({
      filePath: dependentFilePath,
      importedSymbols,
      contractSnippet,
    });
  }

  const formattedPromptContext = buildPolyglotPromptString(
    targetFilePath,
    targetFileContent,
    prunedContracts
  );

  return {
    targetFilePath,
    targetFileContent,
    blastRadiusFiles,
    prunedContracts,
    formattedPromptContext,
  };
}

function buildPolyglotPromptString(
  targetFilePath: string,
  targetFileContent: string,
  prunedContracts: Array<{ filePath: string; importedSymbols: string[]; contractSnippet: string }>
): string {
  const lang = resolveLanguageFromPath(targetFilePath);
  const commentPrefix = lang === 'python' ? '#' : '//';

  let output = `${commentPrefix} ========================================================\n`;
  output += `${commentPrefix} TARGET FILE TO MODIFY: ${targetFilePath}\n`;
  output += `${commentPrefix} ========================================================\n\n`;
  output += `${targetFileContent}\n\n`;

  if (prunedContracts.length > 0) {
    output += `${commentPrefix} ========================================================\n`;
    output += `${commentPrefix} DEPENDENT CONTRACTS & BLAST RADIUS (${prunedContracts.length} affected files)\n`;
    output += `${commentPrefix} ========================================================\n\n`;

    prunedContracts.forEach((contract) => {
      const depLang = resolveLanguageFromPath(contract.filePath);
      const depPrefix = depLang === 'python' ? '#' : '//';
      const symbolStr = contract.importedSymbols.length > 0
        ? contract.importedSymbols.join(', ')
        : 'All';
      output += `${depPrefix} File: ${contract.filePath} (Imported symbols: ${symbolStr})\n`;
      output += `${contract.contractSnippet}\n\n`;
    });
  } else {
    output += `${commentPrefix} BLAST RADIUS: No downstream dependent files affected.\n`;
  }

  return output;
}
