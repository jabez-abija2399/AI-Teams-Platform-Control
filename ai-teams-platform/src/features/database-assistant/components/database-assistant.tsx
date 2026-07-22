'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/components/ui/toast';
import { useDBQuery } from '../hooks/use-db-query';
import { Database, Play, Table, Copy, Check } from 'lucide-react';
import type { DBQueryResult } from '../types';

const EXAMPLE_QUERIES = [
  'Show me all projects and their status',
  'How many tasks are in each status?',
  'List recent deployments',
  'Show project documents',
];

export function DatabaseAssistant({ projectId }: { projectId: string }) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<DBQueryResult | null>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const queryMutation = useDBQuery();
  const { addToast } = useToast();

  async function handleQuery() {
    if (!question.trim()) return;
    try {
      const res = await queryMutation.mutateAsync({ projectId, question });
      setResult(res);
      addToast({ type: 'success', title: `Query returned ${res.rowCount} row(s)` });
    } catch {
      addToast({ type: 'error', title: 'Query failed' });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  }

  function handleCopyQuery() {
    if (result?.query) {
      navigator.clipboard.writeText(result.query);
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2000);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Database className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">Database Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Ask a question about your data
          </label>
          <div className="flex gap-1.5">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "Show me all projects with their task counts"'
              rows={2}
              className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
            />
            <Button
              onClick={handleQuery}
              disabled={!question.trim() || queryMutation.isPending}
              size="sm"
              className="shrink-0"
            >
              {queryMutation.isPending ? (
                <Loading label="" className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {!result && !queryMutation.isPending && (
          <div>
            <p className="mb-2 text-[11px] text-muted-foreground">Try asking:</p>
            <div className="space-y-1.5">
              {EXAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuestion(q)}
                  className="block w-full rounded-md border bg-muted/30 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted/60 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {queryMutation.isPending && (
          <div className="flex items-center justify-center py-8">
            <Loading label="Translating to SQL..." />
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase text-muted-foreground">Generated SQL</span>
                <button onClick={handleCopyQuery} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                  {copiedQuery ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedQuery ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="overflow-x-auto text-xs text-foreground/80">{result.query}</pre>
            </div>

            <p className="text-xs text-muted-foreground">{result.explanation}</p>

            <div className="rounded-lg border overflow-hidden">
              <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-1.5">
                <Table className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium">
                  {result.rowCount} row{result.rowCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      {result.columns.map((col) => (
                        <th key={col} className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        {result.columns.map((col) => (
                          <td key={col} className="px-3 py-1.5">
                            {String(row[col] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
