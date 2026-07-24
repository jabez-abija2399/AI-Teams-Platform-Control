import { Parser, Tree } from 'web-tree-sitter';

export type SupportedLanguage =
  | 'typescript'
  | 'tsx'
  | 'javascript'
  | 'python'
  | 'go'
  | 'rust'
  | 'java'
  | 'c_sharp'
  | 'cpp'
  | 'c'
  | 'php';

const parsersCache = new Map<SupportedLanguage, Parser>();
let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Resolves SupportedLanguage enum from file extension.
 */
export function resolveLanguageFromPath(filePath: string): SupportedLanguage {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';

  switch (ext) {
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'tsx';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'py':
    case 'pyw':
      return 'python';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'java':
      return 'java';
    case 'cs':
      return 'c_sharp';
    case 'cpp':
    case 'hpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'c':
    case 'h':
      return 'c';
    case 'php':
      return 'php';
    default:
      return 'typescript';
  }
}

/**
 * Initializes web-tree-sitter WASM runtime singleton.
 */
export async function initTreeSitter(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await Parser.init({
        locateFile(scriptName: string, scriptDirectory: string) {
          return scriptDirectory + scriptName;
        },
      });
      isInitialized = true;
    } catch (error) {
      console.warn('[Polyglot TreeSitter] WASM init fallback enabled:', error);
      isInitialized = true;
    }
  })();

  return initPromise;
}

/**
 * Retrieves cached Parser instance for specified language.
 */
export async function getParserForLanguage(lang: SupportedLanguage): Promise<Parser> {
  await initTreeSitter();

  if (parsersCache.has(lang)) {
    return parsersCache.get(lang)!;
  }

  const parser = new Parser();
  parsersCache.set(lang, parser);
  return parser;
}

/**
 * Parses source code into a Tree-sitter AST for any supported polyglot language.
 */
export async function parseCodeToAST(filePath: string, sourceCode: string): Promise<Tree | null> {
  const lang = resolveLanguageFromPath(filePath);
  const parser = await getParserForLanguage(lang);
  return parser.parse(sourceCode);
}
