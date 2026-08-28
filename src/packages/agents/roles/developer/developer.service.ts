/**
 * @file developer.service.ts
 * @package @ai-teams/agents/roles/developer
 * @description Code generation service for the Developer Agent.
 */

import { ContractValidator } from '../../contracts/contract-validator';
import { ImplementationDeliverableSchema, type ImplementationDeliverable } from '../../contracts/deliverable-schemas';
import { DeveloperTools } from './developer.tools';
import type { DeveloperExecutionInput } from './developer.types';

export class DeveloperService {
  /**
   * Generates production code files and saves them to the virtual repository.
   */
  public static async generateCode(input: DeveloperExecutionInput): Promise<ImplementationDeliverable> {
    const mainPageCode = `'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function App() {
  const [status, setStatus] = useState('Ready');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex flex-col items-center justify-center font-sans">
      <div className="max-w-xl w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
          ${input.projectName || 'Autonomous Software'}
        </h1>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed">
          ${input.visionPrompt}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setStatus('Active')}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-sky-400"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Status: {status}</span>
        </div>
      </div>
    </main>
  );
}
`;

    const generatedFiles = [
      {
        path: 'src/app/page.tsx',
        content: mainPageCode,
        language: 'typescript',
      },
    ];

    // Save files to repository
    for (const file of generatedFiles) {
      await DeveloperTools.writeProjectFile(input.projectId, file.path, file.content);
    }

    const deliverable: ImplementationDeliverable = {
      generatedFiles,
      totalLOC: mainPageCode.split('\n').length,
      executionSummary: `Generated ${generatedFiles.length} file(s) for ${input.projectName || 'project'}.`,
    };

    const validation = ContractValidator.validate(ImplementationDeliverableSchema, deliverable);
    if (!validation.success) {
      throw new Error(`Developer deliverable validation failed: ${validation.error}`);
    }

    return validation.data;
  }
}
