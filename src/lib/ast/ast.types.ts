export type SymbolType =
  | 'INTERFACE'
  | 'TYPE'
  | 'FUNCTION'
  | 'COMPONENT'
  | 'VARIABLE'
  | 'ROUTE_HANDLER'
  | 'CLASS'
  | 'STRUCT'
  | 'TRAIT'
  | 'ENUM';

export interface SymbolNode {
  name: string;
  type: SymbolType;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  exportStatus: boolean;
}

export interface FileASTMetadata {
  filePath: string;
  language: string;
  symbols: SymbolNode[];
  exports: string[];
  /**
   * Map of imported module path (resolved or specifier) -> array of imported symbol names
   */
  imports: Map<string, string[]>;
  hash: string;
}

export interface DependencyEdge {
  sourceFilePath: string;
  targetFilePath: string;
  importedSymbols: string[];
}

export interface PrunedContextResult {
  targetFilePath: string;
  targetFileContent: string;
  blastRadiusFiles: string[];
  prunedContracts: Array<{
    filePath: string;
    importedSymbols: string[];
    contractSnippet: string;
  }>;
  formattedPromptContext: string;
}
