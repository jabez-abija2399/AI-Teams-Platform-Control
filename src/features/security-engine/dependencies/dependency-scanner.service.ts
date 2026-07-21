import type { Severity } from '@/features/security-engine/scanner/pattern-scanner.service';

export type DependencySeverity = Severity;

export interface DependencyFinding {
  type: string;
  severity: DependencySeverity;
  package: string;
  description: string;
  recommendation: string;
}

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const KNOWN_VULNERABLE: Record<string, { severity: DependencySeverity; reason: string }> = {
  'minimist': { severity: 'HIGH', reason: 'Prototype pollution vulnerability in versions before 1.2.6' },
  'node-fetch': { severity: 'MEDIUM', reason: 'Exposure of sensitive information in versions before 3.1.1' },
  'axios': { severity: 'MEDIUM', reason: 'Server-Side Request Forgery in versions before 0.21.2' },
  'lodash': { severity: 'HIGH', reason: 'Prototype pollution in versions before 4.17.21' },
  'underscore': { severity: 'HIGH', reason: 'Arbitrary code execution in versions before 1.13.6' },
  'express': { severity: 'LOW', reason: 'Open redirect in certain configurations' },
  'jsonwebtoken': { severity: 'CRITICAL', reason: ' insecure key retrieval in versions before 9.0.0' },
  'bcrypt': { severity: 'MEDIUM', reason: 'Use bcryptjs for pure JS environments; bcrypt may have native dependency issues' },
  'multer': { severity: 'HIGH', reason: 'Denial of Service via crafted file upload in versions before 1.4.5-lts.1' },
  'ws': { severity: 'HIGH', reason: 'ReDoS vulnerability in versions before 7.4.6 and 8.17.1' },
  'tar': { severity: 'HIGH', reason: 'Arbitrary file creation/overwrite in versions before 4.4.18' },
  'glob-parent': { severity: 'HIGH', reason: 'ReDoS in versions before 5.1.2' },
  'shelljs': { severity: 'CRITICAL', reason: 'Improper privilege management in versions before 0.8.5' },
  'flat': { severity: 'CRITICAL', reason: 'Prototype pollution in versions before 5.0.1' },
  'marked': { severity: 'HIGH', reason: 'ReDoS in versions before 4.0.10' },
  'ua-parser-js': { severity: 'HIGH', reason: 'ReDoS and supply chain attack in versions before 0.7.33' },
  'got': { severity: 'MEDIUM', reason: 'Open redirect in versions before 11.8.5' },
  'express-rate-limit': { severity: 'LOW', reason: 'Should verify using latest patched version' },
};

const HIGH_RISK_PATTERNS: { regex: RegExp; type: string; severity: DependencySeverity; description: string; recommendation: string }[] = [
  {
    regex: /^https?:\/\//,
    type: 'REMOTE_DEPENDENCY',
    severity: 'HIGH',
    description: 'Dependency installed from a remote URL instead of npm registry',
    recommendation: 'Use a pinned version from the npm registry; audit remote dependencies thoroughly',
  },
  {
    regex: /^github:/,
    type: 'GITHUB_DEPENDENCY',
    severity: 'MEDIUM',
    description: 'Dependency installed directly from a GitHub repository',
    recommendation: 'Pin to a specific commit SHA or tag; ensure the repository is trusted',
  },
  {
    regex: /^file:/,
    type: 'LOCAL_DEPENDENCY',
    severity: 'MEDIUM',
    description: 'Dependency installed from a local file path',
    recommendation: 'Ensure local dependencies are version-controlled and audited',
  },
  {
    regex: /^\*/,
    type: 'WILDCARD_VERSION',
    severity: 'HIGH',
    description: 'Wildcard version specifier allows any version to be installed',
    recommendation: 'Pin to a specific version range using semver (e.g., ^1.2.3)',
  },
];

function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.replace(/^[~^>=<]*/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return { major: parseInt(match[1] ?? '0'), minor: parseInt(match[2] ?? '0'), patch: parseInt(match[3] ?? '0') };
}

function getEffectiveVersion(versionRange: string): string {
  return versionRange.replace(/^[~^>=<]*/, '').trim();
}

export function scanDependencies(packageJson: PackageJson): DependencyFinding[] {
  const findings: DependencyFinding[] = [];
  const seen = new Set<string>();

  const allDeps: Record<string, string> = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };

  const isDev = (name: string): boolean => name in (packageJson.devDependencies ?? {});

  for (const [name, versionRange] of Object.entries(allDeps)) {
    const effective = getEffectiveVersion(versionRange);
    const parsed = parseVersion(effective);

    if (KNOWN_VULNERABLE[name]) {
      const known = KNOWN_VULNERABLE[name];
      const dedupKey = `VULN:${name}`;
      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        findings.push({
          type: 'KNOWN_VULNERABLE',
          severity: known.severity,
          package: name,
          description: `${name}@${versionRange} — ${known.reason}${isDev(name) ? ' (devDependency)' : ''}`,
          recommendation: `Update ${name} to the latest patched version`,
        });
      }
    }

    if (parsed && parsed.major === 0 && parsed.minor < 1) {
      const dedupKey = `PRE_RELEASE:${name}`;
      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        findings.push({
          type: 'PRE_RELEASE',
          severity: 'MEDIUM',
          package: name,
          description: `${name}@${versionRange} is a pre-1.0 release and may have breaking changes`,
          recommendation: 'Review changelog for breaking changes before upgrading; consider pinning',
        });
      }
    }

    for (const pattern of HIGH_RISK_PATTERNS) {
      if (pattern.regex.test(versionRange)) {
        const dedupKey = `${pattern.type}:${name}`;
        if (!seen.has(dedupKey)) {
          seen.add(dedupKey);
          findings.push({
            type: pattern.type,
            severity: pattern.severity,
            package: name,
            description: `${name} — ${pattern.description} (${versionRange})`,
            recommendation: pattern.recommendation,
          });
        }
      }
    }
  }

  return findings;
}
