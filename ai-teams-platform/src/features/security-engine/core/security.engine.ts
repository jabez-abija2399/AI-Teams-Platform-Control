import { prisma } from '@/lib/prisma';
import { recordTimelineEvent } from '@/features/ai-workspace/services/timeline.service';
import { scanContent, type ScanFinding } from '@/features/security-engine/scanner/pattern-scanner.service';
import { detectSecrets, type SecretFinding } from '@/features/security-engine/secrets/secret-detector.service';
import { calculateSecurityScore } from '@/features/security-engine/core/security-score.service';


interface ProjectFile {
  id: string;
  path: string;
  content: string;
  language: string | null;
}

interface ScanResult {
  scanId: string;
  issuesCreated: number;
  criticalIssues: string[];
  score: number;
}

interface SecurityReport {
  scanId: string;
  projectId: string;
  score: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  issues: {
    id: string;
    type: string;
    severity: string;
    description: string;
    location: string | null;
    recommendation: string | null;
    status: string;
    createdAt: Date;
  }[];
  lastScanAt: Date | null;
}

function mapFindingToIssue(finding: ScanFinding | SecretFinding): {
  type: string;
  severity: string;
  description: string;
  location: string;
  recommendation: string;
} {
  return {
    type: finding.type,
    severity: finding.severity,
    description: finding.description,
    location: `${finding.file}:${finding.line ?? 'unknown'}`,
    recommendation: finding.recommendation,
  };
}

async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const repository = await prisma.repository.findFirst({
    where: { projectId },
    select: { id: true },
  });

  if (!repository) return [];

  const files = await prisma.file.findMany({
    where: { repositoryId: repository.id },
    select: { id: true, path: true, content: true, language: true },
  });

  return files;
}

async function createAutoTaskForCritical(
  projectId: string,
  issueType: string,
  description: string,
  location: string,
): Promise<void> {
  await prisma.task.create({
    data: {
      title: `[SECURITY] Fix critical: ${issueType}`,
      description: `Critical security issue detected during automated scan.\n\n**Type**: ${issueType}\n**Location**: ${location}\n**Description**: ${description}\n\nThis task was auto-created by the Security Engine. Please address immediately.`,
      priority: 'URGENT',
      status: 'TODO',
      projectId,
    },
  });
}

export async function scanProject(projectId: string): Promise<ScanResult> {
  const scan = await prisma.securityScan.create({
    data: {
      projectId,
      status: 'RUNNING',
    },
  });

  try {
    const files = await getProjectFiles(projectId);
    const allFindings: (ScanFinding | SecretFinding)[] = [];
    const issueRecords: {
      projectId: string;
      type: string;
      severity: string;
      description: string;
      location: string;
      recommendation: string;
    }[] = [];

    for (const file of files) {
      const patterns = scanContent(file.path, file.content);
      const secrets = detectSecrets(file.path, file.content);

      allFindings.push(...patterns, ...secrets);

      for (const finding of patterns) {
        issueRecords.push(mapFindingToIssue(finding) as typeof issueRecords[number]);
      }
      for (const finding of secrets) {
        issueRecords.push(mapFindingToIssue(finding) as typeof issueRecords[number]);
      }
    }

    if (issueRecords.length > 0) {
      await prisma.securityIssue.createMany({
        data: issueRecords.map((r) => ({
          projectId,
          type: r.type,
          severity: r.severity,
          description: r.description,
          location: r.location,
          recommendation: r.recommendation,
          status: 'OPEN',
        })),
      });
    }

    const criticalFindings = allFindings.filter((f) => f.severity === 'CRITICAL');
    const criticalLocations: string[] = [];

    for (const finding of criticalFindings) {
      const location = 'file' in finding ? `${finding.file}:${finding.line ?? 'unknown'}` : 'unknown';
      criticalLocations.push(location);
      await createAutoTaskForCritical(projectId, finding.type, finding.description, location);
    }

    await prisma.securityScan.update({
      where: { id: scan.id },
      data: {
        status: 'COMPLETED',
        result: JSON.parse(JSON.stringify({
          filesScanned: files.length,
          issuesFound: issueRecords.length,
          criticalIssues: criticalFindings.length,
        })),
      },
    });

    await recordTimelineEvent({
      type: 'SECURITY_SCAN_COMPLETED',
      message: `Security scan completed: ${issueRecords.length} issues found (${criticalFindings.length} critical) across ${files.length} files`,
      metadata: {
        scanId: scan.id,
        filesScanned: files.length,
        totalIssues: issueRecords.length,
        criticalIssues: criticalFindings.length,
      },
    });

    const score = await calculateSecurityScore(projectId);

    return {
      scanId: scan.id,
      issuesCreated: issueRecords.length,
      criticalIssues: criticalLocations,
      score,
    };
  } catch (error) {
    await prisma.securityScan.update({
      where: { id: scan.id },
      data: { status: 'FAILED' },
    });

    await recordTimelineEvent({
      type: 'SECURITY_SCAN_FAILED',
      message: `Security scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: { scanId: scan.id },
    });

    throw error;
  }
}

export async function getSecurityReport(projectId: string): Promise<SecurityReport | null> {
  const scan = await prisma.securityScan.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  if (!scan) return null;

  const issues = await prisma.securityIssue.findMany({
    where: { projectId },
    orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
  });

  const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  for (const issue of issues) {
    const key = issue.severity as keyof typeof severityCounts;
    if (key in severityCounts) severityCounts[key]++;
  }

  const score = await calculateSecurityScore(projectId);

  return {
    scanId: scan.id,
    projectId,
    score,
    totalIssues: issues.length,
    criticalIssues: severityCounts.CRITICAL,
    highIssues: severityCounts.HIGH,
    mediumIssues: severityCounts.MEDIUM,
    lowIssues: severityCounts.LOW + severityCounts.INFO,
    issues: issues.map((i) => ({
      id: i.id,
      type: i.type,
      severity: i.severity,
      description: i.description,
      location: i.location,
      recommendation: i.recommendation,
      status: i.status,
      createdAt: i.createdAt,
    })),
    lastScanAt: scan.createdAt,
  };
}
