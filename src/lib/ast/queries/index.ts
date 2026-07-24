import { SupportedLanguage } from '../tree-sitter-parser';
import { SymbolType } from '../ast.types';

export interface LanguageQueryPattern {
  importRegex: RegExp;
  extractImportSpecifier: (match: RegExpExecArray) => { specifier: string; symbols: string[] };
  symbolPatterns: Array<{
    regex: RegExp;
    type: SymbolType;
    extractName: (match: RegExpExecArray | RegExpMatchArray) => string;
  }>;
}

export const POLYGLOT_PATTERNS: Record<SupportedLanguage, LanguageQueryPattern> = {
  typescript: {
    importRegex: /import\s+(?:type\s+)?(?:(\w+)|{([^}]+)}|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/g,
    extractImportSpecifier: (match) => {
      const defaultImport = match[1] || match[3];
      const namedImports = match[2];
      const specifier = match[4] || '';
      const symbols: string[] = [];
      if (defaultImport) symbols.push(defaultImport.trim());
      if (namedImports) {
        symbols.push(...namedImports.split(',').map((s) => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]).filter((n): n is string => Boolean(n)));
      }
      return { specifier, symbols };
    },
    symbolPatterns: [
      { regex: /(?:export\s+)?interface\s+(\w+)/, type: 'INTERFACE', extractName: (m) => m[1] ?? '' },
      { regex: /(?:export\s+)?type\s+(\w+)\s*=/, type: 'TYPE', extractName: (m) => m[1] ?? '' },
      { regex: /(?:export\s+)?class\s+(\w+)/, type: 'CLASS', extractName: (m) => m[1] ?? '' },
      { regex: /(?:export\s+)?(?:async\s+)?function\s+(\w+)/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
      { regex: /(?:export\s+)?const\s+(\w+)\s*=\s*(?:\([^)]*\)|async\s*\([^)]*\))\s*=>/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
      { regex: /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\b/, type: 'ROUTE_HANDLER', extractName: (m) => m[1] ?? '' },
    ],
  },
  tsx: {
    importRegex: /import\s+(?:type\s+)?(?:(\w+)|{([^}]+)}|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/g,
    extractImportSpecifier: (match) => {
      const defaultImport = match[1] || match[3];
      const namedImports = match[2];
      const specifier = match[4] || '';
      const symbols: string[] = [];
      if (defaultImport) symbols.push(defaultImport.trim());
      if (namedImports) {
        symbols.push(...namedImports.split(',').map((s) => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]).filter((n): n is string => Boolean(n)));
      }
      return { specifier, symbols };
    },
    symbolPatterns: [
      { regex: /(?:export\s+)?interface\s+(\w+)/, type: 'INTERFACE', extractName: (m) => m[1] ?? '' },
      { regex: /(?:export\s+)?type\s+(\w+)\s*=/, type: 'TYPE', extractName: (m) => m[1] ?? '' },
      { regex: /(?:export\s+)?class\s+(\w+)/, type: 'CLASS', extractName: (m) => m[1] ?? '' },
      { regex: /(?:export\s+)?const\s+([A-Z]\w*)\s*=\s*/, type: 'COMPONENT', extractName: (m) => m[1] ?? '' },
      { regex: /(?:export\s+)?function\s+([A-Z]\w*)\b/, type: 'COMPONENT', extractName: (m) => m[1] ?? '' },
    ],
  },
  javascript: {
    importRegex: /(?:import\s+(?:(\w+)|{([^}]+)})\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g,
    extractImportSpecifier: (match) => {
      const defaultImp = match[1];
      const namedImp = match[2];
      const specifier = match[3] || match[4] || '';
      const symbols: string[] = [];
      if (defaultImp) symbols.push(defaultImp);
      if (namedImp) symbols.push(...namedImp.split(',').map((s) => s.trim()).filter((n): n is string => Boolean(n)));
      return { specifier, symbols };
    },
    symbolPatterns: [
      { regex: /(?:export\s+)?class\s+(\w+)/, type: 'CLASS', extractName: (m) => m[1] ?? '' },
      { regex: /(?:export\s+)?function\s+(\w+)/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
      { regex: /(?:export\s+)?const\s+(\w+)\s*=\s*function/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
    ],
  },
  python: {
    importRegex: /(?:from\s+([\w.]+)\s+import\s+([\w*,\s()]+)|import\s+([\w.]+))/g,
    extractImportSpecifier: (match) => {
      const fromModule = match[1];
      const importedSymbolsStr = match[2];
      const directImport = match[3];

      if (directImport) {
        return { specifier: directImport, symbols: [directImport] };
      }

      const specifier = fromModule || '';
      const symbols = importedSymbolsStr
        ? importedSymbolsStr.replace(/[()]/g, '').split(',').map((s) => s.trim()).filter((n): n is string => Boolean(n))
        : [];

      return { specifier, symbols };
    },
    symbolPatterns: [
      { regex: /^class\s+(\w+)/, type: 'CLASS', extractName: (m) => m[1] ?? '' },
      { regex: /^def\s+(\w+)\s*\(/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
      { regex: /^\s+def\s+(\w+)\s*\(/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
    ],
  },
  go: {
    importRegex: /import\s+(?:\(\s*([\s\S]*?)\s*\)|"([^"]+)")/g,
    extractImportSpecifier: (match) => {
      const block = match[1];
      const single = match[2];
      if (single) {
        return { specifier: single, symbols: [single.split('/').pop() || single] };
      }
      if (block) {
        const lines = block.split('\n').map((l) => l.trim().replace(/"/g, '')).filter((n): n is string => Boolean(n));
        const specifier = lines[0] || '';
        const symbols = lines.map((l) => l.split('/').pop() || l);
        return { specifier, symbols };
      }
      return { specifier: '', symbols: [] };
    },
    symbolPatterns: [
      { regex: /^type\s+(\w+)\s+struct\b/, type: 'STRUCT', extractName: (m) => m[1] ?? '' },
      { regex: /^type\s+(\w+)\s+interface\b/, type: 'INTERFACE', extractName: (m) => m[1] ?? '' },
      { regex: /^func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
    ],
  },
  rust: {
    importRegex: /use\s+([\w:]+)(?::{([^}]+)})?;/g,
    extractImportSpecifier: (match) => {
      const basePath = match[1] || '';
      const group = match[2];
      const symbols: string[] = [];
      if (group) {
        symbols.push(...group.split(',').map((s) => s.trim()).filter((n): n is string => Boolean(n)));
      } else {
        symbols.push(basePath.split('::').pop() || basePath);
      }
      return { specifier: basePath, symbols };
    },
    symbolPatterns: [
      { regex: /(?:pub\s+)?struct\s+(\w+)/, type: 'STRUCT', extractName: (m) => m[1] ?? '' },
      { regex: /(?:pub\s+)?enum\s+(\w+)/, type: 'ENUM', extractName: (m) => m[1] ?? '' },
      { regex: /(?:pub\s+)?trait\s+(\w+)/, type: 'TRAIT', extractName: (m) => m[1] ?? '' },
      { regex: /(?:pub\s+)?fn\s+(\w+)/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
    ],
  },
  java: {
    importRegex: /import\s+(?:static\s+)?([\w.*]+);/g,
    extractImportSpecifier: (match) => {
      const full = match[1] || '';
      const parts = full.split('.');
      const symbol = parts.pop() || full;
      const specifier = parts.join('.');
      return { specifier, symbols: [symbol] };
    },
    symbolPatterns: [
      { regex: /(?:public\s+)?class\s+(\w+)/, type: 'CLASS', extractName: (m) => m[1] ?? '' },
      { regex: /(?:public\s+)?interface\s+(\w+)/, type: 'INTERFACE', extractName: (m) => m[1] ?? '' },
      { regex: /(?:public|protected|private)\s+(?:static\s+)?[\w<>]+\s+(\w+)\s*\(/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
    ],
  },
  c_sharp: {
    importRegex: /using\s+([\w.]+);/g,
    extractImportSpecifier: (match) => {
      const ns = match[1] || '';
      return { specifier: ns, symbols: [ns.split('.').pop() || ns] };
    },
    symbolPatterns: [
      { regex: /(?:public\s+)?class\s+(\w+)/, type: 'CLASS', extractName: (m) => m[1] ?? '' },
      { regex: /(?:public\s+)?interface\s+(\w+)/, type: 'INTERFACE', extractName: (m) => m[1] ?? '' },
      { regex: /(?:public\s+)?struct\s+(\w+)/, type: 'STRUCT', extractName: (m) => m[1] ?? '' },
      { regex: /(?:public|protected|private)\s+(?:static\s+)?[\w<>]+\s+(\w+)\s*\(/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
    ],
  },
  cpp: {
    importRegex: /#include\s+[<"]([^>"]+)[>"]/g,
    extractImportSpecifier: (match) => {
      const header = match[1] || '';
      return { specifier: header, symbols: [header] };
    },
    symbolPatterns: [
      { regex: /class\s+(\w+)/, type: 'CLASS', extractName: (m) => m[1] ?? '' },
      { regex: /struct\s+(\w+)/, type: 'STRUCT', extractName: (m) => m[1] ?? '' },
      { regex: /(?:[\w:*&]+\s+)+(\w+)\s*\([^)]*\)\s*[{;]/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
    ],
  },
  c: {
    importRegex: /#include\s+[<"]([^>"]+)[>"]/g,
    extractImportSpecifier: (match) => {
      const header = match[1] || '';
      return { specifier: header, symbols: [header] };
    },
    symbolPatterns: [
      { regex: /struct\s+(\w+)/, type: 'STRUCT', extractName: (m) => m[1] ?? '' },
      { regex: /enum\s+(\w+)/, type: 'ENUM', extractName: (m) => m[1] ?? '' },
      { regex: /(?:[\w:*&]+\s+)+(\w+)\s*\([^)]*\)\s*[{;]/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
    ],
  },
  php: {
    importRegex: /use\s+([\w\\]+)(?:\s+as\s+(\w+))?;/g,
    extractImportSpecifier: (match) => {
      const fullNs = match[1] || '';
      const alias = match[2];
      const symbol = alias || fullNs.split('\\').pop() || fullNs;
      return { specifier: fullNs, symbols: [symbol] };
    },
    symbolPatterns: [
      { regex: /class\s+(\w+)/, type: 'CLASS', extractName: (m) => m[1] ?? '' },
      { regex: /interface\s+(\w+)/, type: 'INTERFACE', extractName: (m) => m[1] ?? '' },
      { regex: /function\s+(\w+)/, type: 'FUNCTION', extractName: (m) => m[1] ?? '' },
    ],
  },
};
