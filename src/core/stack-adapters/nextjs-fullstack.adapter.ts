/**
 * Next.js Full-Stack Adapter (Golden Path)
 */

import type { IStackAdapter, GeneratedCodeFile, DevServerConfig } from './stack-adapter.interface';
import type { ProjectRuntimeContract } from '../runtime-contract/runtime-contract.types';
import type { ValidationEvidence } from '../deterministic-validation/validation.types';
import { DeterministicValidator } from '../deterministic-validation/deterministic-validator';

export class NextjsFullstackAdapter implements IStackAdapter {
  public readonly stackId = 'nextjs-fullstack-v1';
  public readonly version = '1.0.0';

  public generateBaseScaffold(contract: ProjectRuntimeContract): GeneratedCodeFile[] {
    return [
      {
        path: 'package.json',
        content: JSON.stringify(
          {
            name: 'ai-teams-generated-app',
            version: '0.1.0',
            private: true,
            scripts: {
              dev: 'next dev',
              build: 'next build',
              start: 'next start',
              lint: 'next lint',
              test: 'vitest run',
            },
            dependencies: {
              next: '^15.0.0',
              react: '^19.0.0',
              'react-dom': '^19.0.0',
              'lucide-react': '^0.460.0',
              clsx: '^2.1.1',
              'tailwind-merge': '^2.5.4',
              zod: '^3.23.8',
            },
            devDependencies: {
              typescript: '^5.6.0',
              '@types/node': '^20.0.0',
              '@types/react': '^19.0.0',
              '@types/react-dom': '^19.0.0',
              tailwindcss: '^3.4.14',
              postcss: '^8.4.47',
              autoprefixer: '^10.4.20',
              vitest: '^2.1.4',
            },
          },
          null,
          2,
        ),
        language: 'json',
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify(
          {
            compilerOptions: {
              target: 'es5',
              lib: ['dom', 'dom.iterable', 'esnext'],
              allowJs: true,
              skipLibCheck: true,
              strict: true,
              noEmit: true,
              esModuleInterop: true,
              module: 'esnext',
              moduleResolution: 'bundler',
              resolveJsonModule: true,
              isolatedModules: true,
              jsx: 'preserve',
              incremental: true,
              plugins: [{ name: 'next' }],
              paths: { '@/*': ['./src/*'] },
            },
            include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
            exclude: ['node_modules'],
          },
          null,
          2,
        ),
        language: 'json',
      },
    ];
  }

  public async validate(
    files: Record<string, string>,
    contract: ProjectRuntimeContract,
  ): Promise<ValidationEvidence> {
    return DeterministicValidator.validateFiles({
      projectId: 'validation-run',
      files,
      contract,
    });
  }

  public getDevServerConfig(contract: ProjectRuntimeContract): DevServerConfig {
    const service = contract.services.find((s) => s.type === 'frontend') || contract.services[0];
    return {
      command: service?.devCommand || 'npm run dev',
      port: service?.port || 3000,
      healthEndpoint: service?.healthEndpoint || '/api/health',
      workingDir: service?.workingDirectory || '.',
    };
  }
}
