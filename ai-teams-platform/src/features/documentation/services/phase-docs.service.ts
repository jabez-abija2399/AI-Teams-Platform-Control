import { prisma } from '@/lib/prisma';
import { syncFileToWorkspace } from '@/features/workspace/explorer/services/workspace-sync.service';
import type { CEOAnalysis } from '@/ai/agents/roles/ceo/ceo.types';
import type { ArchitectAnalysis } from '@/ai/agents/roles/architect/architect.types';
import type { DeveloperOutput } from '@/ai/agents/roles/developer/developer.types';
import type { QAOutput } from '@/ai/agents/roles/qa/qa.types';

function li(items: string[] | undefined): string {
  if (!items?.length) return '- _none_\n';
  return items.map((i) => `- ${i}`).join('\n') + '\n';
}

export async function saveCEOSummary(projectId: string, data: CEOAnalysis): Promise<void> {
  const v = data.vision;
  const r = data.requirements;
  const p = data.plan;

  const features = r.features.map((f) => `- **${f.name}:** ${f.description}`).join('\n');
  const stories = r.userStories.map((s) => `- As a **${s.as}**, I want **${s.iWant}** so that **${s.soThat}**`).join('\n');
  const phases = p.phases.map((ph) => `### ${ph.name}\n**Goal:** ${ph.goal}\n${li(ph.tasks)}`).join('\n');

  const content = [
    `# CEO Analysis`,
    '',
    `## Product Vision`,
    '',
    `**Problem:** ${v.problem || '_not specified_'}`,
    `**Solution:** ${v.solution || '_not specified_'}`,
    `**Target Users:** ${v.targetUsers?.join(', ') || '_not specified_'}`,
    `**Business Goal:** ${v.businessGoal || '_not specified_'}`,
    '',
    `## Requirements`,
    '',
    `### Features`,
    features || '- _none_',
    '',
    `### User Stories`,
    stories || '- _none_',
    '',
    `### Priorities`,
    li(r.priorities),
    `### Constraints`,
    li(r.constraints),
    `## Development Plan`,
    '',
    `**Estimated Complexity:** ${p.estimatedComplexity || '_not specified_'}`,
    '',
    phases || '_no phases defined_',
    '',
    `### All Tasks`,
    li(p.tasks),
  ].join('\n');

  await prisma.document.create({
    data: { projectId, type: 'CEO_SUMMARY', title: 'CEO Analysis', content, author: 'CEO AI' },
  });

  syncFileToWorkspace(projectId, 'docs/CEO_ANALYSIS.md', content, 'markdown').catch(() => {});
}

export async function saveArchitectSummary(projectId: string, data: ArchitectAnalysis): Promise<void> {
  const a = data.architecture;
  const d = data.database;
  const api = data.api;

  const entityTables = d.entities.map((e) => {
    const rows = e.fields.map((f) => `| ${f.name} | ${f.type} |`).join('\n');
    return `### ${e.name}\n\n| Field | Type |\n|-------|------|\n${rows}`;
  }).join('\n\n');

  const endpointRows = api.endpoints.map((ep) => `| \`${ep.method}\` | \`${ep.path}\` | ${ep.request || '-'} | ${ep.response || '-'} |`).join('\n');

  const decisions = data.decisions.map((dd) => `| **${dd.technology}** | ${dd.reason} | ${dd.alternative} | ${dd.tradeoff} |`).join('\n');

  const content = [
    `# Architecture Design`,
    '',
    `## Technical Architecture`,
    '',
    `**Frontend:** ${a.frontend || '_not specified_'}`,
    `**Backend:** ${a.backend || '_not specified_'}`,
    `**Database:** ${a.database || '_not specified_'}`,
    `**Infrastructure:** ${a.infrastructure || '_not specified_'}`,
    `**Security:** ${a.security || '_not specified_'}`,
    '',
    `## Database Design`,
    '',
    entityTables || '_no entities defined_',
    '',
    `### Relationships`,
    li(d.relationships),
    `### Indexes`,
    li(d.indexes),
    `### Constraints`,
    li(d.constraints),
    `## API Specification`,
    '',
    `| Method | Path | Request | Response |`,
    `|--------|------|---------|----------|`,
    endpointRows || '| _no endpoints defined_ | | | |',
    '',
    `## Technology Decisions`,
    '',
    decisions ? `| Technology | Reason | Alternative | Tradeoff |\n|------------|--------|-------------|----------|\n${decisions}` : '_no decisions recorded_',
    '',
  ].join('\n');

  await prisma.document.create({
    data: { projectId, type: 'ARCHITECT_SUMMARY', title: 'Architecture Design', content, author: 'Architect AI' },
  });

  syncFileToWorkspace(projectId, 'docs/ARCHITECTURE.md', content, 'markdown').catch(() => {});
}

export async function saveDeveloperSummary(projectId: string, data: DeveloperOutput): Promise<void> {
  const r = data.report;
  const fileLines = r.changedFiles.map((f) => `- \`${f}\``).join('\n');
  const issueLines = r.issues.map((i) => `- ⚠️ ${i}`).join('\n');

  const content = [
    `# Development Summary`,
    '',
    `**Status:** ${r.completed ? '✅ Completed' : '❌ Incomplete'}`,
    `**Notes:** ${r.notes || '_none_'}`,
    '',
    `## Changed Files (${r.changedFiles.length})`,
    fileLines || '- _no files changed_',
    '',
    `## Issues (${r.issues.length})`,
    issueLines || '- _no issues_',
    '',
  ].join('\n');

  await prisma.document.create({
    data: { projectId, type: 'DEVELOPMENT_SUMMARY', title: 'Development Summary', content, author: 'Developer AI' },
  });

  syncFileToWorkspace(projectId, 'docs/DEVELOPMENT_SUMMARY.md', content, 'markdown').catch(() => {});
}

export async function saveQASummary(projectId: string, data: QAOutput): Promise<void> {
  const q = data.qualityReport;
  const tp = data.testPlan;

  const issueRows = q.issues.map((b) => `| **${b.severity}** | ${b.description} | \`${b.location}\` | ${b.solution} |`).join('\n');
  const recs = q.recommendations.map((r) => `- ${r}`).join('\n');
  const testRows = tp.tests.map((t) => `| ${t.name} | ${t.type} | ${t.steps.join(', ')} |`).join('\n');

  const content = [
    `# QA Review Report`,
    '',
    `## Quality Score: ${q.score}/100`,
    '',
    `## Issues Found (${q.issues.length})`,
    '',
    `| Severity | Description | Location | Solution |`,
    `|----------|-------------|----------|----------|`,
    issueRows || '| _no issues found_ | | | |',
    '',
    `## Recommendations`,
    recs || '- _none_',
    '',
    `## Test Plan`,
    '',
    `**Coverage:** ${tp.coverage || '_not specified_'}`,
    `**Strategy:** ${tp.strategy || '_not specified_'}`,
    '',
    `### Test Cases (${tp.tests.length})`,
    '',
    `| Name | Type | Steps |`,
    `|------|------|-------|`,
    testRows || '| _no tests defined_ | | |',
    '',
  ].join('\n');

  await prisma.document.create({
    data: { projectId, type: 'QA_REVIEW', title: 'QA Review Report', content, author: 'QA AI' },
  });

  syncFileToWorkspace(projectId, 'docs/QA_REVIEW.md', content, 'markdown').catch(() => {});
}
