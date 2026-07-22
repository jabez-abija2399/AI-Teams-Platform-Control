import { prisma } from '@/lib/prisma';
import { aiGenerate } from '@/ai/gateway/ai.gateway';
import type {
  PerformanceScore,
  BundleAnalysis,
  PerformanceIssue,
  PerformanceReport,
} from '../types';

export async function analyzeProject(
  projectId: string,
): Promise<PerformanceReport> {
  const files = await prisma.file.findMany({
    where: { repository: { projectId } },
    select: { path: true, content: true },
  });

  const jsFiles = files.filter((f) =>
    /\.(ts|tsx|js|jsx)$/.test(f.path) && !f.path.includes('node_modules'),
  );
  const cssFiles = files.filter((f) => /\.(css|scss|less)$/.test(f.path));
  const imgFiles = files.filter((f) =>
    /\.(png|jpg|jpeg|gif|svg|webp)$/.test(f.path),
  );

  const jsSize = jsFiles.reduce((sum, f) => sum + f.content.length, 0);
  const cssSize = cssFiles.reduce((sum, f) => sum + f.content.length, 0);
  const imageSize = imgFiles.reduce((sum, f) => sum + f.content.length, 0);

  const packages = detectPackages(files);

  const allCode = jsFiles.map((f) => `// ${f.path}\n${f.content}`).join('\n\n');

  let issues: PerformanceIssue[] = [];
  let score: PerformanceScore = { overall: 0, performance: 0, accessibility: 0, bestPractices: 0, seo: 0 };
  let recommendations: string[] = [];

  if (allCode.length > 0) {
    try {
      const aiResult = await aiGenerate({
        messages: [
          {
            role: 'system',
            content: `You are a performance profiling expert. Analyze the code and return a JSON object with:
{
  "score": { "overall": 0-100, "performance": 0-100, "accessibility": 0-100, "bestPractices": 0-100, "seo": 0-100 },
  "issues": [{ "id": "string", "severity": "critical|warning|info", "category": "string", "title": "string", "description": "string", "recommendation": "string", "impact": "string" }],
  "recommendations": ["string"]
}
Return ONLY valid JSON, no markdown.`,
          },
          {
            role: 'user',
            content: `Analyze these ${jsFiles.length} files (${(jsSize / 1024).toFixed(1)}KB JS, ${(cssSize / 1024).toFixed(1)}KB CSS):\n\n${allCode.slice(0, 15000)}`,
          },
        ],
        temperature: 0.3,
        maxTokens: 3000,
      });

      let jsonStr = aiResult.content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      }
      const parsed = JSON.parse(jsonStr);
      score = parsed.score || score;
      issues = Array.isArray(parsed.issues) ? parsed.issues : [];
      recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    } catch {
      score = computeStaticScore(jsFiles, jsSize, cssSize, packages);
      issues = detectStaticIssues(jsFiles, jsSize);
      recommendations = generateStaticRecommendations(score, jsSize, issues);
    }
  } else {
    score = { overall: 50, performance: 50, accessibility: 50, bestPractices: 50, seo: 50 };
  }

  return {
    id: `perf_${projectId}_${Date.now()}`,
    projectId,
    score,
    bundle: {
      totalSize: jsSize + cssSize + imageSize,
      jsSize,
      cssSize,
      imageSize,
      packages,
    },
    issues,
    recommendations,
    createdAt: new Date(),
  };
}

function detectPackages(files: Array<{ path: string; content: string }>): BundleAnalysis['packages'] {
  const pkgFile = files.find((f) => f.path === 'package.json');
  if (!pkgFile) return [];

  try {
    const pkg = JSON.parse(pkgFile.content);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return Object.entries(deps).map(([name, version]) => ({
      name,
      version: String(version),
      size: estimatePkgSize(name),
      gzipSize: Math.round(estimatePkgSize(name) * 0.3),
    }));
  } catch {
    return [];
  }
}

function estimatePkgSize(name: string): number {
  const knownSizes: Record<string, number> = {
    react: 42000,
    'react-dom': 130000,
    next: 85000,
    lodash: 70000,
    axios: 14000,
    zustand: 3000,
    'react-query': 12000,
    tailwindcss: 350000,
    prisma: 50000,
    '@prisma/client': 200000,
    zod: 12000,
    'lucide-react': 80000,
  };
  return knownSizes[name] || 8000;
}

function computeStaticScore(
  jsFiles: Array<{ path: string; content: string }>,
  jsSize: number,
  cssSize: number,
  packages: BundleAnalysis['packages'],
): PerformanceScore {
  let perf = 80;
  let a11y = 75;
  let bp = 80;
  let seo = 70;

  if (jsSize > 500000) perf -= 20;
  else if (jsSize > 200000) perf -= 10;
  else if (jsSize < 50000) perf += 10;

  if (packages.length > 30) perf -= 15;
  else if (packages.length > 15) perf -= 5;

  const code = jsFiles.map((f) => f.content).join('\n');
  if (/className=/.test(code) && !/aria-/.test(code)) a11y -= 15;
  if (/<img(?![^>]*alt=)/.test(code)) a11y -= 10;
  if (!/meta|head|title/.test(code)) seo -= 20;
  if (/console\.(log|debug)/.test(code)) bp -= 10;
  if (/eval\(/.test(code)) bp -= 20;

  const overall = Math.round((perf + a11y + bp + seo) / 4);
  return {
    overall: clamp(overall),
    performance: clamp(perf),
    accessibility: clamp(a11y),
    bestPractices: clamp(bp),
    seo: clamp(seo),
  };
}

function detectStaticIssues(
  jsFiles: Array<{ path: string; content: string }>,
  jsSize: number,
): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];
  const code = jsFiles.map((f) => f.content).join('\n');

  if (jsSize > 500000) {
    issues.push({
      id: 'bundle-size',
      severity: 'critical',
      category: 'Bundle Size',
      title: 'Large JavaScript bundle',
      description: `Total JS size is ${(jsSize / 1024).toFixed(0)}KB`,
      recommendation: 'Code-split your app and lazy-load routes',
      impact: 'Significant impact on load time',
    });
  }

  if (/console\.(log|debug|info)/.test(code)) {
    issues.push({
      id: 'console-logs',
      severity: 'warning',
      category: 'Code Quality',
      title: 'Console statements in production code',
      description: 'Found console.log/debug statements',
      recommendation: 'Remove or use a proper logging library',
      impact: 'Minor performance and security impact',
    });
  }

  if (/eval\(/.test(code)) {
    issues.push({
      id: 'eval-usage',
      severity: 'critical',
      category: 'Security',
      title: 'eval() usage detected',
      description: 'eval() is a security risk and performance anti-pattern',
      recommendation: 'Replace eval() with proper alternatives',
      impact: 'Major security and performance risk',
    });
  }

  if (/className=/.test(code) && !/aria-/.test(code)) {
    issues.push({
      id: 'missing-aria',
      severity: 'warning',
      category: 'Accessibility',
      title: 'Missing ARIA attributes',
      description: 'JSX elements use className but no aria attributes found',
      recommendation: 'Add appropriate ARIA attributes for screen readers',
      impact: 'Accessibility compliance',
    });
  }

  if (/import \* as/.test(code)) {
    issues.push({
      id: 'wildcard-imports',
      severity: 'warning',
      category: 'Bundle Size',
      title: 'Wildcard imports detected',
      description: 'import * as may include unused exports',
      recommendation: 'Use named imports to enable tree-shaking',
      impact: 'Increased bundle size',
    });
  }

  return issues;
}

function generateStaticRecommendations(
  score: PerformanceScore,
  jsSize: number,
  issues: PerformanceIssue[],
): string[] {
  const recs: string[] = [];

  if (score.performance < 70) recs.push('Enable code splitting and lazy loading');
  if (jsSize > 200000) recs.push('Analyze bundle with webpack-bundle-analyzer');
  if (score.accessibility < 70) recs.push('Run axe-core accessibility audit');
  if (score.seo < 70) recs.push('Add meta tags and structured data');
  if (score.bestPractices < 70) recs.push('Remove eval() and console statements');
  if (issues.filter((i) => i.severity === 'critical').length > 0) {
    recs.push('Address critical issues before deployment');
  }
  if (recs.length === 0) recs.push('Project performance looks good!');

  return recs;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}
