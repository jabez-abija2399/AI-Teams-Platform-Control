const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  md: 'markdown',
  mdx: 'markdown',
  sql: 'sql',
  graphql: 'graphql',
  gql: 'graphql',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  dockerfile: 'dockerfile',
  toml: 'ini',
  ini: 'ini',
  cfg: 'ini',
  env: 'plaintext',
  txt: 'plaintext',
  log: 'plaintext',
  csv: 'plaintext',
  prisma: 'prisma',
  vue: 'html',
  svelte: 'html',
  astro: 'html',
  tf: 'terraform',
  hcl: 'terraform',
};

const FILENAME_MAP: Record<string, string> = {
  'Dockerfile': 'dockerfile',
  'Makefile': 'makefile',
  'CMakeLists.txt': 'cmake',
  '.gitignore': 'plaintext',
  '.env': 'plaintext',
  '.env.local': 'plaintext',
  'tsconfig.json': 'json',
  'package.json': 'json',
  'Cargo.toml': 'toml',
  'go.mod': 'plaintext',
  'Gemfile': 'ruby',
  'requirements.txt': 'plaintext',
  'pyproject.toml': 'toml',
};

export function detectLanguage(filePath: string): string {
  const filename = filePath.split('/').pop() ?? '';

  if (FILENAME_MAP[filename]) {
    return FILENAME_MAP[filename];
  }

  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return 'plaintext';

  const ext = filename.slice(lastDot + 1).toLowerCase();
  return EXTENSION_LANGUAGE_MAP[ext] ?? 'plaintext';
}
