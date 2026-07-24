import type { Tree } from 'web-tree-sitter';
import { FileASTMetadata } from './ast.types';
import { extractPolyglotMetadata } from './polyglot-extractor';

/**
 * Universal Polyglot Context Graph tracking structural symbol dependencies
 * across multi-language repositories (TS/JS, Python, Go, Rust, Java, C#, C/C++, PHP).
 */
export class ContextGraph {
  private nodes: Map<string, FileASTMetadata> = new Map();
  private dependentsMap: Map<string, Set<string>> = new Map();

  /**
   * Adds or updates a file node in the polyglot dependency graph asynchronously.
   */
  public async updateFile(filePath: string, sourceCode: string, tree?: Tree): Promise<void> {
    this.cleanFileDependents(filePath);

    const metadata = await extractPolyglotMetadata(filePath, sourceCode, tree);
    this.nodes.set(filePath, metadata);

    metadata.imports.forEach((_, importedPath) => {
      if (!this.dependentsMap.has(importedPath)) {
        this.dependentsMap.set(importedPath, new Set());
      }
      this.dependentsMap.get(importedPath)!.add(filePath);
    });
  }

  /**
   * Synchronous update helper for compatibility.
   */
  public updateFileSync(filePath: string, sourceCode: string, tree?: Tree): void {
    this.updateFile(filePath, sourceCode, tree).catch((err) => {
      console.error(`[ContextGraph] Async update failed for ${filePath}:`, err);
    });
  }

  /**
   * Removes a file node and cleans up graph edges when deleted.
   */
  public removeFile(filePath: string): void {
    this.nodes.delete(filePath);
    this.dependentsMap.delete(filePath);
    this.cleanFileDependents(filePath);
  }

  /**
   * Retrieves metadata for indexed file.
   */
  public getFileMetadata(filePath: string): FileASTMetadata | undefined {
    return this.nodes.get(filePath);
  }

  /**
   * Calculates universal Blast Radius using BFS graph traversal.
   * Returns ALL direct and indirect downstream dependent file paths across any programming language.
   */
  public getBlastRadius(targetFilePath: string): string[] {
    const affectedFiles: Set<string> = new Set();
    const queue: string[] = [targetFilePath];
    const visited: Set<string> = new Set([targetFilePath]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const dependents = this.dependentsMap.get(current);

      if (dependents) {
        for (const dependent of dependents) {
          if (!visited.has(dependent)) {
            visited.add(dependent);
            affectedFiles.add(dependent);
            queue.push(dependent);
          }
        }
      }
    }

    return Array.from(affectedFiles);
  }

  /**
   * Returns dependent files specifically importing a given exported symbol from `targetFilePath`.
   */
  public getDependentsForSymbol(targetFilePath: string, symbolName: string): string[] {
    const directDependents = this.dependentsMap.get(targetFilePath);
    if (!directDependents) return [];

    const symbolDependents: string[] = [];

    for (const dependentPath of directDependents) {
      const metadata = this.nodes.get(dependentPath);
      if (metadata) {
        const importedSymbols = metadata.imports.get(targetFilePath) || [];
        if (importedSymbols.includes(symbolName) || importedSymbols.includes('*')) {
          symbolDependents.push(dependentPath);
        }
      }
    }

    return symbolDependents;
  }

  private cleanFileDependents(filePath: string): void {
    for (const [, dependents] of this.dependentsMap) {
      dependents.delete(filePath);
    }
  }

  public getNodeCount(): number {
    return this.nodes.size;
  }
}
