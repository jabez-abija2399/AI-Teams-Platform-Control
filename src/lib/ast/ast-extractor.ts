import type { Node, Tree } from 'web-tree-sitter';
import { SymbolNode, FileASTMetadata } from './ast.types';

/**
 * Resolves imported module paths (handling relative ./ ../ and alias @/ specifiers).
 */
export function resolveModulePath(importerFilePath: string, importSpecifier: string): string {
  if (!importSpecifier) return importSpecifier;

  // Handle path alias `@/` -> `src/`
  if (importSpecifier.startsWith('@/')) {
    let resolved = importSpecifier.replace(/^@\//, 'src/');
    if (!hasExtension(resolved)) {
      resolved = `${resolved}.ts`;
    }
    return normalizePath(resolved);
  }

  // Handle relative imports `./` or `../`
  if (importSpecifier.startsWith('.')) {
    const parts = importerFilePath.split('/');
    parts.pop(); // remove filename
    const dir = parts.join('/');
    const combined = dir ? `${dir}/${importSpecifier}` : importSpecifier;
    let normalized = normalizePath(combined);
    if (!hasExtension(normalized)) {
      normalized = `${normalized}.ts`;
    }
    return normalized;
  }

  return importSpecifier;
}

function hasExtension(pathStr: string): boolean {
  return /\.(ts|tsx|js|jsx|json)$/.test(pathStr);
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

/**
 * Generates a simple hash string for source code to track changes.
 */
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
 * Traverses Tree-sitter syntax tree or regex-enhanced AST node walker to extract symbols, imports, and exports.
 */
export function extractASTMetadata(
  filePath: string,
  sourceCode: string,
  tree?: Tree
): FileASTMetadata {
  const symbols: SymbolNode[] = [];
  const exports: string[] = [];
  const importsMap = new Map<string, string[]>();

  const lines = sourceCode.split('\n');

  // 1. Extract Imports (e.g. import { User, getUser } from '@/lib/user')
  const importRegex = /import\s+(?:type\s+)?(?:(\w+)|{([^}]+)}|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(sourceCode)) !== null) {
    const defaultImport = match[1] ?? match[3];
    const namedImportsStr = match[2];
    const importSpecifier = match[4] ?? '';

    if (!importSpecifier) continue;

    const resolvedPath = resolveModulePath(filePath, importSpecifier);
    const symbolList: string[] = importsMap.get(resolvedPath) || [];

    if (defaultImport) {
      symbolList.push(defaultImport.trim());
    }
    if (namedImportsStr) {
      const names = namedImportsStr
        .split(',')
        .map((s) => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0])
        .filter((n): n is string => Boolean(n));
      symbolList.push(...names);
    }

    importsMap.set(resolvedPath, Array.from(new Set(symbolList)));
  }

  // 2. Extract Declarations and Exports
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const isExported = line.trim().startsWith('export ');

    // Interface
    const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/);
    if (interfaceMatch && interfaceMatch[1]) {
      const name = interfaceMatch[1];
      const endLine = findClosingBraceLine(lines, index);
      symbols.push({
        name,
        type: 'INTERFACE',
        filePath,
        lineStart: lineNum,
        lineEnd: endLine,
        exportStatus: isExported,
      });
      if (isExported) exports.push(name);
    }

    // Type alias
    const typeMatch = line.match(/(?:export\s+)?type\s+(\w+)\s*=/);
    if (typeMatch && typeMatch[1]) {
      const name = typeMatch[1];
      symbols.push({
        name,
        type: 'TYPE',
        filePath,
        lineStart: lineNum,
        lineEnd: lineNum,
        exportStatus: isExported,
      });
      if (isExported) exports.push(name);
    }

    // Function / Component
    const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
    if (funcMatch && funcMatch[1]) {
      const name = funcMatch[1];
      const endLine = findClosingBraceLine(lines, index);
      const isComp = isPascalCase(name);
      symbols.push({
        name,
        type: isComp ? 'COMPONENT' : 'FUNCTION',
        filePath,
        lineStart: lineNum,
        lineEnd: endLine,
        exportStatus: isExported,
      });
      if (isExported) exports.push(name);
    }

    // Const Component or Function
    const constMatch = line.match(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:\([^)]*\)|async\s*\([^)]*\))\s*=>/);
    if (constMatch && constMatch[1]) {
      const name = constMatch[1];
      const endLine = findClosingBraceLine(lines, index);
      const isComp = isPascalCase(name);
      symbols.push({
        name,
        type: isComp ? 'COMPONENT' : 'FUNCTION',
        filePath,
        lineStart: lineNum,
        lineEnd: endLine,
        exportStatus: isExported,
      });
      if (isExported) exports.push(name);
    }

    // Route Handler (GET, POST, PUT, DELETE, PATCH)
    const routeMatch = line.match(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\b/);
    if (routeMatch && routeMatch[1]) {
      const name = routeMatch[1];
      const endLine = findClosingBraceLine(lines, index);
      symbols.push({
        name,
        type: 'ROUTE_HANDLER',
        filePath,
        lineStart: lineNum,
        lineEnd: endLine,
        exportStatus: true,
      });
      exports.push(name);
    }
  });

  // If tree is passed from Tree-sitter, walk Tree-sitter nodes for nested details
  if (tree && tree.rootNode) {
    walkTreeSitterNode(tree.rootNode, filePath, symbols, exports);
  }

  return {
    filePath,
    language: 'typescript',
    symbols,
    exports: Array.from(new Set(exports)),
    imports: importsMap,
    hash: computeCodeHash(sourceCode),
  };
}

function walkTreeSitterNode(
  node: Node,
  filePath: string,
  symbols: SymbolNode[],
  exports: string[]
) {
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (!child) continue;

    if (child.type === 'export_statement') {
      const declaration = child.childForFieldName('declaration');
      if (declaration) {
        const nameNode = declaration.childForFieldName('name');
        if (nameNode) {
          const name = nameNode.text;
          const symbol: SymbolNode = {
            name,
            type: child.type.includes('function') ? 'FUNCTION' : 'VARIABLE',
            filePath,
            lineStart: child.startPosition.row + 1,
            lineEnd: child.endPosition.row + 1,
            exportStatus: true,
          };
          if (!symbols.some((s) => s.name === symbol.name)) {
            symbols.push(symbol);
            exports.push(symbol.name);
          }
        }
      }
    }
    walkTreeSitterNode(child, filePath, symbols, exports);
  }
}

function isPascalCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

function findClosingBraceLine(lines: string[], startIdx: number): number {
  let openCount = 0;
  let started = false;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i] ?? '';
    for (const char of line) {
      if (char === '{') {
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

  return Math.min(startIdx + 15, lines.length);
}
