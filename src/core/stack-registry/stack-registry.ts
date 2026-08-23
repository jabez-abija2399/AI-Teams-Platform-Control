/**
 * Centralized Stack Registry
 * 
 * Defines all verified platform stack profiles.
 * The Architect chooses strictly from this registry.
 */

import type { StackProfile } from './stack-profile.types';
import type { ProjectType } from '../project-type/project-type.types';

export const GOLDEN_STACK_ID = 'nextjs-fullstack-v1';

export const VERIFIED_STACK_PROFILES: Record<string, StackProfile> = {
  'nextjs-fullstack-v1': {
    id: 'nextjs-fullstack-v1',
    version: '1.0.0',
    name: 'Next.js Full-Stack (Golden Path)',
    description: 'Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL + Prisma, Vitest.',
    plainLanguage: 'Complete web application with frontend UI, backend APIs, and database storage.',
    supportedProjectTypes: ['FULL_STACK'],
    isGoldenPath: true,
    capabilities: {
      frontend: true,
      backend: true,
      database: true,
      authentication: true,
      realtime: false,
      backgroundJobs: false,
      mobile: false,
    },
    runtime: {
      language: 'typescript',
      nodeVersion: '20.x',
      packageManager: 'npm',
    },
    frontend: {
      framework: 'nextjs',
      styling: 'tailwind',
      components: 'shadcn-ui',
    },
    backend: {
      framework: 'nextjs-route-handlers',
      apiType: 'rest',
    },
    database: {
      engine: 'postgresql',
      orm: 'prisma',
    },
    services: [
      {
        id: 'web-app',
        name: 'Next.js Application',
        type: 'frontend',
        workingDirectory: '.',
        port: 3000,
        healthEndpoint: '/api/health',
        installCommand: 'npm install --no-audit --no-fund',
        devCommand: 'npm run dev',
        buildCommand: 'npm run build',
      },
    ],
    validation: {
      typecheckCommand: 'npx tsc --noEmit',
      lintCommand: 'npm run lint',
      testCommand: 'npm test -- --run',
      buildCommand: 'npm run build',
    },
    preview: {
      type: 'WEB',
      defaultPort: 3000,
      healthEndpoint: '/api/health',
      primaryServiceId: 'web-app',
    },
    filesystemStructure: {
      requiredFiles: ['package.json', 'tsconfig.json', 'src/app/page.tsx', 'src/app/layout.tsx'],
      entryPoints: {
        page: 'src/app/page.tsx',
        layout: 'src/app/layout.tsx',
      },
    },
    environmentRequirements: ['DATABASE_URL'],
  },

  'nextjs-frontend-v1': {
    id: 'nextjs-frontend-v1',
    version: '1.0.0',
    name: 'Next.js Frontend-Only',
    description: 'Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui without backend database.',
    plainLanguage: 'Frontend UI application with modern components and client-side interactions.',
    supportedProjectTypes: ['FRONTEND_ONLY'],
    isGoldenPath: false,
    capabilities: {
      frontend: true,
      backend: false,
      database: false,
      authentication: false,
      realtime: false,
      backgroundJobs: false,
      mobile: false,
    },
    runtime: {
      language: 'typescript',
      nodeVersion: '20.x',
      packageManager: 'npm',
    },
    frontend: {
      framework: 'nextjs',
      styling: 'tailwind',
      components: 'shadcn-ui',
    },
    services: [
      {
        id: 'web-frontend',
        name: 'Next.js Frontend',
        type: 'frontend',
        workingDirectory: '.',
        port: 3000,
        installCommand: 'npm install --no-audit --no-fund',
        devCommand: 'npm run dev',
        buildCommand: 'npm run build',
      },
    ],
    validation: {
      typecheckCommand: 'npx tsc --noEmit',
      lintCommand: 'npm run lint',
      buildCommand: 'npm run build',
    },
    preview: {
      type: 'WEB',
      defaultPort: 3000,
      primaryServiceId: 'web-frontend',
    },
    filesystemStructure: {
      requiredFiles: ['package.json', 'tsconfig.json', 'src/app/page.tsx', 'src/app/layout.tsx'],
      entryPoints: {
        page: 'src/app/page.tsx',
        layout: 'src/app/layout.tsx',
      },
    },
    environmentRequirements: [],
  },

  'react-vite-frontend-v1': {
    id: 'react-vite-frontend-v1',
    version: '1.0.0',
    name: 'React SPA (Vite)',
    description: 'Single-page React application with Vite, TypeScript, and Tailwind CSS.',
    plainLanguage: 'Fast, lightweight single-page application.',
    supportedProjectTypes: ['FRONTEND_ONLY'],
    capabilities: {
      frontend: true,
      backend: false,
      database: false,
      authentication: false,
      realtime: false,
      backgroundJobs: false,
      mobile: false,
    },
    runtime: {
      language: 'typescript',
      nodeVersion: '20.x',
      packageManager: 'npm',
    },
    frontend: {
      framework: 'react-vite',
      styling: 'tailwind',
    },
    services: [
      {
        id: 'vite-app',
        name: 'Vite Development Server',
        type: 'frontend',
        workingDirectory: '.',
        port: 5173,
        installCommand: 'npm install --no-audit --no-fund',
        devCommand: 'npm run dev',
        buildCommand: 'npm run build',
      },
    ],
    validation: {
      typecheckCommand: 'npx tsc --noEmit',
      buildCommand: 'npm run build',
    },
    preview: {
      type: 'WEB',
      defaultPort: 5173,
      primaryServiceId: 'vite-app',
    },
    filesystemStructure: {
      requiredFiles: ['package.json', 'vite.config.ts', 'src/App.tsx', 'src/main.tsx'],
      entryPoints: {
        app: 'src/App.tsx',
        main: 'src/main.tsx',
      },
    },
    environmentRequirements: [],
  },

  'fastapi-backend-v1': {
    id: 'fastapi-backend-v1',
    version: '1.0.0',
    name: 'FastAPI Backend Service',
    description: 'Python FastAPI REST API service with Swagger documentation, Pydantic, and SQLAlchemy.',
    plainLanguage: 'High-performance backend API with automatic Swagger docs and health endpoints.',
    supportedProjectTypes: ['BACKEND_ONLY', 'API'],
    capabilities: {
      frontend: false,
      backend: true,
      database: true,
      authentication: true,
      realtime: false,
      backgroundJobs: false,
      mobile: false,
    },
    runtime: {
      language: 'python',
      packageManager: 'npm', // or pip / poetry
    },
    backend: {
      framework: 'fastapi',
      apiType: 'rest',
    },
    database: {
      engine: 'postgresql',
      orm: 'sqlalchemy',
    },
    services: [
      {
        id: 'api-server',
        name: 'FastAPI Server',
        type: 'api',
        workingDirectory: '.',
        port: 8000,
        healthEndpoint: '/health',
        docsEndpoint: '/docs',
        installCommand: 'pip install -r requirements.txt',
        devCommand: 'uvicorn main:app --reload --port 8000',
      },
    ],
    validation: {
      testCommand: 'pytest',
      lintCommand: 'flake8',
    },
    preview: {
      type: 'API',
      defaultPort: 8000,
      healthEndpoint: '/health',
      docsEndpoint: '/docs',
      primaryServiceId: 'api-server',
    },
    filesystemStructure: {
      requiredFiles: ['requirements.txt', 'main.py'],
      entryPoints: {
        app: 'main.py',
      },
    },
    environmentRequirements: ['DATABASE_URL'],
  },

  'static-html-v1': {
    id: 'static-html-v1',
    version: '1.0.0',
    name: 'Static HTML + CSS + JS',
    description: 'Pure static web pages without framework dependencies.',
    plainLanguage: 'Instant preview static web pages. No build step required.',
    supportedProjectTypes: ['FRONTEND_ONLY'],
    capabilities: {
      frontend: true,
      backend: false,
      database: false,
      authentication: false,
      realtime: false,
      backgroundJobs: false,
      mobile: false,
    },
    runtime: {
      language: 'html',
      packageManager: 'npm',
    },
    services: [
      {
        id: 'static-site',
        name: 'Static Server',
        type: 'static',
        workingDirectory: '.',
        port: 3000,
        installCommand: '',
        devCommand: '',
      },
    ],
    validation: {},
    preview: {
      type: 'STATIC',
      defaultPort: 3000,
      primaryServiceId: 'static-site',
    },
    filesystemStructure: {
      requiredFiles: ['index.html', 'styles.css'],
      entryPoints: {
        html: 'index.html',
      },
    },
    environmentRequirements: [],
  },
};

export class StackRegistry {
  public static getProfile(stackId: string): StackProfile | null {
    return VERIFIED_STACK_PROFILES[stackId] || null;
  }

  public static getGoldenProfile(): StackProfile {
    return VERIFIED_STACK_PROFILES[GOLDEN_STACK_ID]!;
  }

  public static getProfilesForProjectType(projectType: ProjectType): StackProfile[] {
    return Object.values(VERIFIED_STACK_PROFILES).filter((profile) =>
      profile.supportedProjectTypes.includes(projectType),
    );
  }

  public static recommendStackForProject(params: {
    projectType: ProjectType;
    requestedStack?: string;
  }): StackProfile {
    const { projectType, requestedStack } = params;

    if (requestedStack && VERIFIED_STACK_PROFILES[requestedStack]) {
      const profile = VERIFIED_STACK_PROFILES[requestedStack]!;
      if (profile.supportedProjectTypes.includes(projectType)) {
        return profile;
      }
    }

    if (projectType === 'FRONTEND_ONLY') {
      return VERIFIED_STACK_PROFILES['nextjs-frontend-v1']!;
    }

    if (projectType === 'BACKEND_ONLY' || projectType === 'API') {
      return VERIFIED_STACK_PROFILES['fastapi-backend-v1']!;
    }

    return VERIFIED_STACK_PROFILES[GOLDEN_STACK_ID]!;
  }
}
