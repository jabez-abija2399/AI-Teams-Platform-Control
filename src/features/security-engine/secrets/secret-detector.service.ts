export type SecretSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface SecretFinding {
  type: string;
  severity: SecretSeverity;
  description: string;
  file: string;
  line?: number;
  recommendation: string;
  masked: string;
}

interface SecretPattern {
  type: string;
  severity: SecretSeverity;
  regex: RegExp;
  description: string;
  recommendation: string;
}

const SECRET_PATTERNS: SecretPattern[] = [
  {
    type: 'AWS_ACCESS_KEY',
    severity: 'CRITICAL',
    regex: /(?:^|[^A-Za-z0-9/+=])(?:AKIA|ASIA)[A-Z0-9]{16}(?:$|[^A-Za-z0-9/+=])/gm,
    description: 'AWS access key ID detected',
    recommendation: 'Remove the key from source code and rotate it immediately in the AWS console',
  },
  {
    type: 'AWS_SECRET_KEY',
    severity: 'CRITICAL',
    regex: /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*[:=]\s*['"]([A-Za-z0-9/+=]{40})['"]/gi,
    description: 'AWS secret access key detected',
    recommendation: 'Remove the key and rotate it immediately; use IAM roles or environment variables',
  },
  {
    type: 'GITHUB_TOKEN',
    severity: 'CRITICAL',
    regex: /ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|ghu_[A-Za-z0-9]{36}|ghs_[A-Za-z0-9]{36}|ghr_[A-Za-z0-9]{36}/g,
    description: 'GitHub personal access token detected',
    recommendation: 'Revoke the token immediately on GitHub and use environment variables',
  },
  {
    type: 'PRIVATE_KEY',
    severity: 'CRITICAL',
    regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH)?\s*PRIVATE\s+KEY-----/gi,
    description: 'Private key (PEM format) detected in source code',
    recommendation: 'Remove the private key and store it in a secure vault or environment variable',
  },
  {
    type: 'JWT_SECRET',
    severity: 'CRITICAL',
    regex: /(?:jwt[_-]?secret|JWT_SECRET|signing[_-]?key|SIGNING_KEY)\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
    description: 'JWT secret or signing key detected in source code',
    recommendation: 'Move the secret to environment variables; rotate if this is production code',
  },
  {
    type: 'STRIPE_SECRET_KEY',
    severity: 'CRITICAL',
    regex: /sk_live_[A-Za-z0-9]{24,}|sk_test_[A-Za-z0-9]{24,}/g,
    description: 'Stripe secret API key detected',
    recommendation: 'Revoke the key on Stripe dashboard and use environment variables',
  },
  {
    type: 'STRIPE_PUBLISHABLE_KEY',
    severity: 'MEDIUM',
    regex: /pk_live_[A-Za-z0-9]{24,}/g,
    description: 'Stripe publishable key detected (lower risk but should not be hardcoded)',
    recommendation: 'Move to environment variables for consistency',
  },
  {
    type: 'DATABASE_URL',
    severity: 'CRITICAL',
    regex: /(?:DATABASE_URL|DB_URL|DB_CONNECTION|POSTGRES_URL|MONGO_URI|MONGODB_URI|REDIS_URL)\s*[:=]\s*['"]((?:postgres(?:ql)?|mysql|mongodb|redis|amqp):\/\/[^'"]+)['"]/gi,
    description: 'Database connection string with embedded credentials detected',
    recommendation: 'Use environment variables for all database connection strings',
  },
  {
    type: 'API_KEY_GENERIC',
    severity: 'HIGH',
    regex: /(?:api[_-]?key|API_KEY|apikey)\s*[:=]\s*['"]([A-Za-z0-9_\-]{20,})['"]/gi,
    description: 'Generic API key detected',
    recommendation: 'Move the API key to environment variables',
  },
  {
    type: 'GENERIC_SECRET',
    severity: 'HIGH',
    regex: /(?:secret|SECRET)\s*[:=]\s*['"]([A-Za-z0-9_\-./+=]{16,})['"]/gi,
    description: 'Generic secret value detected',
    recommendation: 'Move secrets to environment variables or a secrets manager',
  },
  {
    type: 'NGINX_PASSWORD',
    severity: 'HIGH',
    regex: /(?:htpasswd|basic_auth_pass)\s+['"]([^'"]+)['"]/gi,
    description: 'Nginx htpasswd or basic auth password detected',
    recommendation: 'Use environment variables for authentication credentials',
  },
  {
    type: 'SLACK_TOKEN',
    severity: 'CRITICAL',
    regex: /xox[baprs]-[A-Za-z0-9\-]{10,}/g,
    description: 'Slack token detected',
    recommendation: 'Revoke the token on Slack API dashboard and use environment variables',
  },
  {
    type: 'MAILGUN_API_KEY',
    severity: 'CRITICAL',
    regex: /key-[A-Za-z0-9]{32}/g,
    description: 'Mailgun API key detected',
    recommendation: 'Revoke and rotate the key; store in environment variables',
  },
];

function maskValue(raw: string): string {
  if (raw.length <= 6) return '***';
  return raw.slice(0, 3) + '*'.repeat(raw.length - 6) + raw.slice(-3);
}

function countLine(content: string, matchIndex: number): number {
  let line = 1;
  for (let i = 0; i < matchIndex && i < content.length; i++) {
    if (content[i] === '\n') line++;
  }
  return line;
}

export function detectSecrets(filePath: string, content: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const seen = new Set<string>();

  for (const pattern of SECRET_PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

    while ((match = regex.exec(content)) !== null) {
      const line = countLine(content, match.index);
      const matchedText = match[0];
      const dedupKey = `${pattern.type}:${line}`;

      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      findings.push({
        type: pattern.type,
        severity: pattern.severity,
        description: pattern.description,
        file: filePath,
        line,
        recommendation: pattern.recommendation,
        masked: maskValue(matchedText.trim()),
      });
    }
  }

  return findings;
}
