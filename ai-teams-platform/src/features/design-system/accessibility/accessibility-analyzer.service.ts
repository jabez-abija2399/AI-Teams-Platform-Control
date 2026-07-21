export interface AccessibilityIssue {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
}

export interface AccessibilityResult {
  score: number;
  issues: AccessibilityIssue[];
  passed: number;
  failed: number;
  total: number;
}

const RULES: { id: string; severity: 'error' | 'warning' | 'info'; check: (code: string) => AccessibilityIssue[] }[] = [
  {
    id: 'img-alt',
    severity: 'error',
    check(code) {
      const issues: AccessibilityIssue[] = [];
      const imgRegex = /<img\b[^>]*>/gi;
      let match;
      while ((match = imgRegex.exec(code)) !== null) {
        if (!/alt\s*=/.test(match[0])) {
          const line = code.substring(0, match.index).split('\n').length;
          issues.push({ rule: 'img-alt', severity: 'error', message: '<img> is missing an alt attribute.', line });
        }
      }
      return issues;
    },
  },
  {
    id: 'button-label',
    severity: 'error',
    check(code) {
      const issues: AccessibilityIssue[] = [];
      const btnRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
      let match;
      while ((match = btnRegex.exec(code)) !== null) {
        const attrs = match[1] ?? '';
        const content = (match[2] ?? '').replace(/<[^>]+>/g, '').trim();
        const hasLabel = content.length > 0 || /aria-label\s*=/.test(attrs) || /aria-labelledby\s*=/.test(attrs);
        if (!hasLabel) {
          const line = code.substring(0, match.index).split('\n').length;
          issues.push({ rule: 'button-label', severity: 'error', message: '<button> has no accessible label (empty text, no aria-label).', line });
        }
      }
      return issues;
    },
  },
  {
    id: 'no-clickable-div',
    severity: 'warning',
    check(code) {
      const issues: AccessibilityIssue[] = [];
      const divRegex = /<div\b([^>]*)>/gi;
      let match;
      while ((match = divRegex.exec(code)) !== null) {
        const attrs = match[1] ?? '';
        if (/onClick\s*=/.test(attrs) && !/role\s*=/.test(attrs) && !/tabIndex/.test(attrs)) {
          const line = code.substring(0, match.index).split('\n').length;
          issues.push({
            rule: 'no-clickable-div',
            severity: 'warning',
            message: 'Clickable <div> is missing role="button" and tabIndex for keyboard accessibility.',
            line,
          });
        }
      }
      return issues;
    },
  },
  {
    id: 'html-lang',
    severity: 'info',
    check(code) {
      if (/<html\b/.test(code) && !/lang\s*=/.test(code.match(/<html\b[^>]*>/i)?.[0] ?? '')) {
        return [{ rule: 'html-lang', severity: 'info', message: '<html> element is missing a lang attribute.' }];
      }
      return [];
    },
  },
];

export function analyzeAccessibility(componentCode: string): AccessibilityResult {
  const allIssues: AccessibilityIssue[] = [];
  let passed = 0;

  for (const rule of RULES) {
    const issues = rule.check(componentCode);
    if (issues.length === 0) {
      passed++;
    } else {
      allIssues.push(...issues.map((i) => ({ ...i, rule: rule.id, severity: rule.severity })));
    }
  }

  const total = RULES.length;
  const failed = total - passed;
  const score = total > 0 ? Math.round((passed / total) * 100) : 100;

  return { score, issues: allIssues, passed, failed, total };
}
