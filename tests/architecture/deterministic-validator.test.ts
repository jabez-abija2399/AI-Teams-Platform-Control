import { describe, it, expect } from 'vitest';
import { DeterministicValidator } from '@/core/deterministic-validation/deterministic-validator';
import { StackRegistry } from '@/core/stack-registry/stack-registry';
import { resolveRuntimeContractFromProfile } from '@/core/stack-registry/stack-profile.types';

describe('Deterministic Validator', () => {
  const profile = StackRegistry.getGoldenProfile();
  const contract = resolveRuntimeContractFromProfile(profile);

  it('passes on valid Next.js files matching runtime contract', async () => {
    const files: Record<string, string> = {
      'package.json': JSON.stringify({ name: 'my-app', version: '1.0.0', scripts: { dev: 'next dev' } }),
      'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'es5' } }),
      'src/app/layout.tsx': 'export default function RootLayout({ children }: { children: React.ReactNode }) { return <html><body>{children}</body></html>; }',
      'src/app/page.tsx': 'export default function Page() { return <div>Home</div>; }',
    };

    const evidence = await DeterministicValidator.validateFiles({
      projectId: 'test-proj',
      files,
      contract,
    });

    expect(evidence.allPassed).toBe(true);
    expect(evidence.summary.failedSteps).toBe(0);
    expect(evidence.metrics.typecheckPassed).toBe(true);
    expect(evidence.metrics.buildPassed).toBe(true);
  });

  it('fails and captures stderr evidence when required files are missing', async () => {
    const files: Record<string, string> = {
      'index.html': '<h1>Hello</h1>',
    };

    const evidence = await DeterministicValidator.validateFiles({
      projectId: 'test-proj',
      files,
      contract,
    });

    expect(evidence.allPassed).toBe(false);
    expect(evidence.summary.failedSteps).toBeGreaterThan(0);
    expect(evidence.steps.some((s) => !s.passed && s.stderr.includes('Missing required files'))).toBe(true);
  });
});
