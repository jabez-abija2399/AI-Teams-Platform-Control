import { describe, expect, it } from 'vitest';
import {
  detectStackMismatch,
  resolveStackIntent,
} from '@/core/company-orchestration/stack-intent';
import { buildHeuristicArchitecture } from '@/ai/agents/roles/architect/architect.service';
import { buildHeuristicImplementation } from '@/ai/agents/roles/developer/developer.service';
import { buildHeuristicCEOAnalysis } from '@/ai/agents/roles/ceo/ceo.service';
import { buildHeuristicRefinedRequirements } from '@/ai/agents/roles/product-manager/product-manager.service';
import { buildHeuristicQaReport } from '@/ai/agents/roles/qa/qa.service';
import { buildHeuristicSecurityReport } from '@/ai/agents/roles/security/security.service';
import { buildHeuristicDevopsPlan } from '@/ai/agents/roles/devops/devops.service';
import { ReviewCommittee } from '@/core/review-committee/review-committee';

const FIXTURE =
  "i don't need next js or other framwork i need you to build only using html and css login and signup page static page no bakcned";

describe('Agent excellence — static HTML / no backend fixture', () => {
  it('resolves stack intent to static-html', () => {
    const intent = resolveStackIntent(FIXTURE);
    expect(intent.stack).toBe('static-html');
    expect(intent.staticNoBackend).toBe(true);
    expect(intent.htmlCss).toBe(true);
  });

  it('Architect never invents Express/DB', () => {
    const arch = buildHeuristicArchitecture({ title: 'Login App' }, FIXTURE);
    expect(arch.architecture.backend.toLowerCase()).toContain('none');
    expect(arch.architecture.database.toLowerCase()).toContain('none');
    expect(arch.architecture.frontend.toLowerCase()).toMatch(/html/);
  });

  it('Developer writes HTML files not Next.js', () => {
    const arch = buildHeuristicArchitecture({ title: 'Login App' }, FIXTURE);
    const impl = buildHeuristicImplementation(arch, FIXTURE);
    const files = impl.report.changedFiles;
    expect(files).toEqual(
      expect.arrayContaining(['login.html', 'signup.html', 'home.html', 'css/styles.css']),
    );
    expect(files.some((f) => f.includes('next.config') || f.endsWith('.tsx'))).toBe(false);
  });

  it('CEO and PM forward stack constraints', () => {
    const ceo = buildHeuristicCEOAnalysis('simple login signup', FIXTURE);
    expect(ceo.requirements.constraints.some((c) => /html|backend|next/i.test(c))).toBe(true);
    const pm = buildHeuristicRefinedRequirements(ceo, FIXTURE);
    expect(pm.featureSpecs.every((f) => /html/i.test(f.description) || /html/i.test(f.name))).toBe(
      true,
    );
  });

  it('QA and Security stay demo-static (no cookie/session invention)', () => {
    const qa = buildHeuristicQaReport({ title: 'Login' }, FIXTURE);
    expect(qa.integrationTests.length).toBe(0);
    expect(qa.e2eTests.some((t) => /login\.html/i.test(t.title + t.steps.join(' ')))).toBe(true);

    const sec = buildHeuristicSecurityReport({ title: 'Login' }, FIXTURE);
    expect(sec.authenticationAudit.mechanism.toLowerCase()).toMatch(/none|demo|static/);
  });

  it('DevOps plans static host not Node/Postgres', () => {
    const plan = buildHeuristicDevopsPlan({ title: 'Login' }, FIXTURE);
    expect(plan.docker.toLowerCase()).toMatch(/nginx/);
    expect(JSON.stringify(plan.environmentVariables)).not.toMatch(/DATABASE_URL/);
  });

  it('Review Committee rejects Next.js files for static intent', () => {
    const report = ReviewCommittee.evaluateCodebase(
      'proj_test',
      {
        'package.json': '{"dependencies":{"next":"15"}}',
        'src/app/page.tsx': 'export default function Page(){return null}',
        'next.config.ts': 'export default {}',
      },
      { feedback: FIXTURE },
    );
    expect(report.isApproved).toBe(false);
    expect(report.requiredActionItems.some((i) => /stack mismatch/i.test(i))).toBe(true);
  });

  it('Review Committee approves static HTML files', () => {
    const files = {
      'index.html': '<html></html>',
      'login.html': '<html></html>',
      'signup.html': '<html></html>',
      'home.html': '<html></html>',
      'css/styles.css': 'body{}',
    };
    const report = ReviewCommittee.evaluateCodebase('proj_test', files, { feedback: FIXTURE });
    expect(report.isApproved).toBe(true);
    expect(detectStackMismatch(resolveStackIntent(FIXTURE), Object.keys(files)).mismatch).toBe(
      false,
    );
  });
});
