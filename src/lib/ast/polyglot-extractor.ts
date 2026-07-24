import type { Tree } from 'web-tree-sitter';
import { SymbolNode, FileASTMetadata } from './ast.types';
import { resolveLanguageFromPath, SupportedLanguage } from './tree-sitter-parser';
import { POLYGLOT_PATTERNS } from './queries';

/**
 * Resolves imported module paths across multi-language import schemes.
 */
export function resolvePolyglotPath(
  importerFilePath: string,
  importSpecifier: string,
  language: SupportedLanguage
): string {
  if (!importSpecifier) return importSpecifier;

  // 1. JS / TS: `@/` alias and relative `./`, `../`
  if (language === 'typescript' || language === 'tsx' || language === 'javascript') {
    if (importSpecifier.startsWith('@/')) {
      let resolved = importSpecifier.replace(/^@\//, 'src/');
      if (!hasExtension(resolved)) resolved = `${resolved}.ts`;
      return normalizePath(resolved);
    }
    if (importSpecifier.startsWith('.')) {
      const dir = getDirectory(importerFilePath);
      let resolved = dir ? `${dir}/${importSpecifier}` : importSpecifier;
      resolved = normalizePath(resolved);
      if (!hasExtension(resolved)) resolved = `${resolved}.ts`;
      return resolved;
    }
  }

  // 2. Python: `from package.module import symbol` -> `package/module.py`
  if (language === 'python') {
    let resolved = importSpecifier.replace(/\./g, '/');
    if (!resolved.endsWith('.py')) resolved = `${resolved}.py`;
    return normalizePath(resolved);
  }

  // 3. Go: `"github.com/org/repo/pkg/auth"` -> `pkg/auth.go`
  if (language === 'go') {
    const pkgName = importSpecifier.split('/').pop() || importSpecifier;
    return normalizePath(`pkg/${pkgName}.go`);
  }

  // 4. Rust: `use crate::services::user` -> `src/services/user.rs`
  if (language === 'rust') {
    let resolved = importSpecifier.replace(/^crate::/, 'src/').replace(/::/g, '/');
    if (!resolved.endsWith('.rs')) resolved = `${resolved}.rs`;
    return normalizePath(resolved);
  }

  // 5. C / C++: `#include "header.h"` -> `header.h` or relative
  if (language === 'c' || language === 'cpp') {
    const header = importSpecifier.replace(/[<">]/g, '');
    const dir = getDirectory(importerFilePath);
    return dir ? normalizePath(`${dir}/${header}`) : normalizePath(header);
  }

  // 6. Java / C# / PHP
  if (language === 'java' || language === 'c_sharp') {
    let resolved = importSpecifier.replace(/\./g, '/');
    const ext = language === 'java' ? '.java' : '.cs';
    return normalizePath(`${resolved}${ext}`);
  }

  if (language === 'php') {
    let resolved = importSpecifier.replace(/\\/g, '/');
    if (!resolved.endsWith('.php')) resolved = `${resolved}.php`;
    return normalizePath(resolved);
  }

  return importSpecifier;
}

function hasExtension(pathStr: string): boolean {
  return /\.(ts|tsx|js|jsx|json|py|go|rs|java|cs|c|cpp|h|hpp|php)$/.test(pathStr);
}

function getDirectory(filePath: string): string {
  const parts = filePath.split('/');
  parts.pop();
  return parts.join('/');
}

function normalizePath(pathStr: string): string {
  const parts = pathStr.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

export function computeCodeHash(sourceCode: string): string {
  let hash = 0;
  for (let i = 0; i < sourceCode.length; i++) {
    const char = sourceCode.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(16);
}

/**
 * Extracts Polyglot AST metadata (symbols, imports, exports) across 11 languages.
 */
export async function extractPolyglotMetadata(
  filePath: string,
  sourceCode: string,
  _tree?: Tree
): Promise<FileASTMetadata> {
  const language = resolveLanguageFromPath(filePath);
  const pattern = POLYGLOT_PATTERNS[language] || POLYGLOT_PATTERNS.typescript;

  const symbols: SymbolNode[] = [];
  const exports: string[] = [];
  const importsMap = new Map<string, string[]>();

  const lines = sourceCode.split('\n');

  // 1. Extract Imports
  pattern.importRegex.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.importRegex.exec(sourceCode)) !== null) {
    const { specifier, symbols: importedSymbols } = pattern.extractImportSpecifier(match);
    if (!specifier) continue;

    const resolvedPath = resolvePolyglotPath(filePath, specifier, language);
    const existingList = importsMap.get(resolvedPath) || [];
    importsMap.set(resolvedPath, Array.from(new Set([...existingList, ...importedSymbols])));
  }

  // 2. Extract Symbols
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const isExported = checkExportStatus(line, language);

    pattern.symbolPatterns.forEach(({ regex, type, extractName }) => {
      const symMatch = line.match(regex);
      if (symMatch) {
        const name = extractName(symMatch);
        if (name && !symbols.some((s) => s.name === name)) {
          const endLine = findClosingBraceLine(lines, index);
          symbols.push({
            name,
            type,
            filePath,
            lineStart: lineNum,
            lineEnd: endLine,
            exportStatus: isExported,
          });
          if (isExported) {
            exports.push(name);
          }
        }
      }
    });
  });

  return {
    filePath,
    language,
    symbols,
    exports: Array.from(new Set(exports)),
    imports: importsMap,
    hash: computeCodeHash(sourceCode),
  };
}

function checkExportStatus(line: string, language: SupportedLanguage): boolean {
  const trimmed = line.trim();
  if (language === 'typescript' || language === 'tsx' || language === 'javascript') {
    return trimmed.startsWith('export ');
  }
  if (language === 'go' || language === 'rust') {
    return trimmed.startsWith('pub ') || /^[A-Z]/.test(trimmed);
  }
  if (language === 'java' || language === 'c_sharp') {
    return trimmed.startsWith('public ');
  }
  return true; // Default export visibility for Python/C/C++/PHP
}

function findClosingBraceLine(lines: string[], startIdx: number): number {
  let openCount = 0;
  let started = false;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i] ?? '';
    for (const char of line) {
      if (char === '{' || char === ':') {
        openCount++;
        started = true;
      } else if (char === '}') {
        openCount--;
      }
    }
    if (started && openCount <= 0) {
      return i + 1;
    }
  }

  return Math.min(startIdx + 20, lines.length);
}
