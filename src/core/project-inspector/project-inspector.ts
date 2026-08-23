/**
 * Project Inspector
 * 
 * Inspects actual repository files, compares reality against the Runtime Contract,
 * and detects discrepancies (e.g. scripts, ports, package manager).
 */

import type { ProjectRuntimeContract } from '../runtime-contract/runtime-contract.types';
import type { ProjectType } from '../project-type/project-type.types';

export interface InspectionDiscrepancy {
  field: string;
  expected: string | number;
  actual: string | number;
  severity: 'WARNING' | 'ERROR' | 'INFO';
  recommendation: string;
}

export interface ProjectInspectionResult {
  detectedProjectType: ProjectType;
  detectedPackageManager: 'npm' | 'pnpm' | 'yarn';
  detectedFramework: string;
  detectedScripts: Record<string, string>;
  detectedPorts: number[];
  discrepancies: InspectionDiscrepancy[];
  isCompliant: boolean;
  totalFiles: number;
}

export class ProjectInspector {
  public static inspectFiles(
    files: Record<string, string>,
    contract?: ProjectRuntimeContract | null,
  ): ProjectInspectionResult {
    const filePaths = Object.keys(files);
    const discrepancies: InspectionDiscrepancy[] = [];

    // 1. Detect Package Manager
    let detectedPackageManager: 'npm' | 'pnpm' | 'yarn' = 'npm';
    if (filePaths.some((p) => p.includes('pnpm-lock.yaml'))) {
      detectedPackageManager = 'pnpm';
    } else if (filePaths.some((p) => p.includes('yarn.lock'))) {
      detectedPackageManager = 'yarn';
    }

    // 2. Detect Framework & Scripts
    let detectedFramework = 'unknown';
    const detectedScripts: Record<string, string> = {};
    const pkgJsonContent = files['package.json'] || files['/package.json'];

    if (pkgJsonContent) {
      try {
        const pkg = JSON.parse(pkgJsonContent);
        if (pkg.scripts) {
          Object.assign(detectedScripts, pkg.scripts);
        }
        if (pkg.dependencies?.next || pkg.devDependencies?.next) {
          detectedFramework = 'nextjs';
        } else if (pkg.dependencies?.react && pkg.devDependencies?.vite) {
          detectedFramework = 'react-vite';
        } else if (pkg.dependencies?.react) {
          detectedFramework = 'react';
        }
      } catch {}
    } else if (filePaths.some((p) => p.endsWith('.py') || p.includes('requirements.txt'))) {
      detectedFramework = 'fastapi';
    } else if (filePaths.some((p) => p.endsWith('.html'))) {
      detectedFramework = 'static-html';
    }

    // 3. Detect Project Type
    let detectedProjectType: ProjectType = 'FULL_STACK';
    if (detectedFramework === 'static-html' || detectedFramework === 'react-vite') {
      detectedProjectType = 'FRONTEND_ONLY';
    } else if (detectedFramework === 'fastapi') {
      detectedProjectType = 'BACKEND_ONLY';
    } else if (detectedFramework === 'nextjs') {
      const hasApiRoutes = filePaths.some((p) => p.includes('src/app/api') || p.includes('pages/api'));
      detectedProjectType = hasApiRoutes ? 'FULL_STACK' : 'FRONTEND_ONLY';
    }

    // 4. Detect Ports from files
    const detectedPorts: number[] = [];
    const allContent = Object.values(files).join(' ');
    const portMatches = allContent.match(/(?:port|PORT)\s*[:=]\s*(\d{4})/g);
    if (portMatches) {
      for (const m of portMatches) {
        const num = parseInt(m.replace(/\D/g, ''), 10);
        if (num && !detectedPorts.includes(num)) {
          detectedPorts.push(num);
        }
      }
    }

    // 5. Compare against Runtime Contract if present
    if (contract) {
      if (contract.runtime.packageManager !== detectedPackageManager && pkgJsonContent) {
        discrepancies.push({
          field: 'packageManager',
          expected: contract.runtime.packageManager,
          actual: detectedPackageManager,
          severity: 'WARNING',
          recommendation: `Lockfile indicates ${detectedPackageManager}, but runtime contract expects ${contract.runtime.packageManager}.`,
        });
      }

      for (const requiredFile of contract.filesystemStructure.requiredFiles) {
        const exists = filePaths.some((p) => p.toLowerCase().endsWith(requiredFile.toLowerCase()));
        if (!exists) {
          discrepancies.push({
            field: `file:${requiredFile}`,
            expected: requiredFile,
            actual: 'MISSING',
            severity: 'ERROR',
            recommendation: `Required entry point file "${requiredFile}" is missing from workspace.`,
          });
        }
      }
    }

    const isCompliant = discrepancies.filter((d) => d.severity === 'ERROR').length === 0;

    return {
      detectedProjectType,
      detectedPackageManager,
      detectedFramework,
      detectedScripts,
      detectedPorts,
      discrepancies,
      isCompliant,
      totalFiles: filePaths.length,
    };
  }
}
