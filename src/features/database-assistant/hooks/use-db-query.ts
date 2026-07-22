'use client';

import { useMutation } from '@tanstack/react-query';
import type { DBQueryResult } from '../types';
import type { ApiResult } from '@/types/common.types';

async function runDBQuery(input: { projectId: string; question: string }): Promise<DBQueryResult> {
  const res = await fetch('/api/ai/db-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as ApiResult<DBQueryResult>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export function useDBQuery() {
  return useMutation({ mutationFn: runDBQuery });
}
