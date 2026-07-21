export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface ScanFinding {
  type: string;
  severity: Severity;
  description: string;
  file: string;
  line?: number;
  recommendation: string;
}

interface PatternRule {
  type: string;
  severity: Severity;
  regex: RegExp;
  description: string;
  recommendation: string;
}

const PATTERNS: PatternRule[] = [
  {
    type: 'SQL_INJECTION',
    severity: 'CRITICAL',
    regex: /(?:query|execute|raw|rawQuery|rawExecute)\s*\(\s*[`'"].*?\$\{|(?:query|execute|raw)\s*\(\s*['"].*?\+\s*\w+/gi,
    description: 'Potential SQL injection via string interpolation or concatenation in database query',
    recommendation: 'Use parameterized queries or Prisma query builders instead of string interpolation',
  },
  {
    type: 'SQL_INJECTION',
    severity: 'HIGH',
    regex: /(?:WHERE|AND|OR|SET|VALUES|ORDER BY|GROUP BY|HAVING)\s+['"]?\s*\+\s*\w+/gi,
    description: 'SQL clause constructed via string concatenation',
    recommendation: 'Use parameterized queries or Prisma query builders',
  },
  {
    type: 'SQL_INJECTION',
    severity: 'HIGH',
    regex: /sequelize\.literal\s*\(\s*['"].*?\+/gi,
    description: 'Sequelize literal with string concatenation',
    recommendation: 'Use parameterized replacements instead of literal values',
  },
  {
    type: 'XSS_VULNERABILITY',
    severity: 'HIGH',
    regex: /dangerouslySetInnerHTML\s*=\s*\{.*?\}/g,
    description: 'Use of dangerouslySetInnerHTML may expose to XSS attacks',
    recommendation: 'Sanitize HTML input before rendering or use a library like DOMPurify',
  },
  {
    type: 'XSS_VULNERABILITY',
    severity: 'HIGH',
    regex: /innerHTML\s*=\s*[^;]+/g,
    description: 'Direct innerHTML assignment may allow XSS injection',
    recommendation: 'Use textContent or sanitize input before setting innerHTML',
  },
  {
    type: 'XSS_VULNERABILITY',
    severity: 'MEDIUM',
    regex: /document\.write\s*\(/g,
    description: 'document.write() can be exploited for XSS attacks',
    recommendation: 'Use DOM manipulation methods like appendChild or textContent',
  },
  {
    type: 'XSS_VULNERABILITY',
    severity: 'MEDIUM',
    regex: /eval\s*\(/g,
    description: 'eval() executes arbitrary code and is a security risk',
    recommendation: 'Avoid eval(); use JSON.parse for data and Function constructor for dynamic code when necessary',
  },
  {
    type: 'UNSAFE_EVAL',
    severity: 'CRITICAL',
    regex: /new\s+Function\s*\([^)]*?\)/g,
    description: 'Dynamic function creation can execute arbitrary code',
    recommendation: 'Avoid dynamic function creation; use structured logic or safe alternatives',
  },
  {
    type: 'HARDCODED_PASSWORD',
    severity: 'CRITICAL',
    regex: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{4,}['"]/gi,
    description: 'Hardcoded password detected in source code',
    recommendation: 'Move secrets to environment variables or a secrets manager',
  },
  {
    type: 'HARDCODED_PASSWORD',
    severity: 'HIGH',
    regex: /(?:secret|auth_token|access_key)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    description: 'Hardcoded secret or auth token detected',
    recommendation: 'Use environment variables or a secrets manager',
  },
  {
    type: 'CSRF_VULNERABILITY',
    severity: 'MEDIUM',
    regex: /(?:app\.(post|put|delete|patch))\s*\(\s*['"][^'"]*['"]\s*,\s*(?!.*csrf)(?!.*csrfToken)/g,
    description: 'API route may be missing CSRF protection',
    recommendation: 'Add CSRF token validation to state-changing API routes',
  },
  {
    type: 'UNSAFE_REDIRECT',
    severity: 'MEDIUM',
    regex: /res\.redirect\s*\(\s*(?:req\.|params\.|query\.|body\.)/g,
    description: 'Redirect with user-controlled input may enable open redirect attacks',
    recommendation: 'Validate redirect URLs against an allowlist before redirecting',
  },
  {
    type: 'DEBUG_ENABLED',
    severity: 'LOW',
    regex: /console\.(log|debug|info)\s*\(/g,
    description: 'Debug logging in production code may leak sensitive information',
    recommendation: 'Remove debug statements or use a structured logging library with log levels',
  },
  {
    type: 'INSECURE_DEPENDENCY',
    severity: 'MEDIUM',
    regex: /require\s*\(\s*['"]child_process['"]\s*\)|from\s+['"]child_process['"]/g,
    description: 'Use of child_process module can be dangerous if inputs are not sanitized',
    recommendation: 'Validate and sanitize all inputs passed to child process execution',
  },
  {
    type: 'UNSAFE_DESERIALIZATION',
    severity: 'CRITICAL',
    regex: /(?:node-object-destroyer|serialize-javascript|eval\s*\(\s*JSON\.parse|eval\s*\(\s*require)/gi,
    description: 'Unsafe deserialization can lead to remote code execution',
    recommendation: 'Use safe parsing libraries and validate data before deserialization',
  },
  {
    type: 'PATH_TRAVERSAL',
    severity: 'HIGH',
    regex: /readFile(?:Sync)?\s*\(\s*(?:req\.|params\.|query\.|body\.)/g,
    description: 'File read with user-controlled path may allow path traversal',
    recommendation: 'Validate and sanitize file paths; use path.resolve and verify against allowed directories',
  },
  {
    type: 'CRYPTO_WEAKNESS',
    severity: 'HIGH',
    regex: /\b(?:md5|sha1)\b.*?(?:password|hash|digest|create(?:Hash)?)\b|\bcreateHash\s*\(\s*['"](?:md5|sha1)['"]\)/gi,
    description: 'Weak cryptographic algorithm (MD5/SHA1) detected',
    recommendation: 'Use SHA-256 or stronger algorithms for hashing; use bcrypt/argon2 for passwords',
  },
  {
    type: 'MISSING_AUTH',
    severity: 'HIGH',
    regex: /export\s+async\s+function\s+(?:GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*\{(?![\s\S]*?(?:auth|session|token|middleware))/g,
    description: 'API route handler may be missing authentication check',
    recommendation: 'Add authentication middleware or session validation to API route handlers',
  },
];

function countLine(content: string, matchIndex: number): number {
  let line = 1;
  for (let i = 0; i < matchIndex && i < content.length; i++) {
    if (content[i] === '\n') line++;
  }
  return line;
}

export function scanContent(filePath: string, content: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  const seen = new Set<string>();

  for (const rule of PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(rule.regex.source, rule.regex.flags);

    while ((match = regex.exec(content)) !== null) {
      const line = countLine(content, match.index);
      const dedupKey = `${rule.type}:${line}`;

      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      findings.push({
        type: rule.type,
        severity: rule.severity,
        description: rule.description,
        file: filePath,
        line,
        recommendation: rule.recommendation,
      });
    }
  }

  return findings;
}
