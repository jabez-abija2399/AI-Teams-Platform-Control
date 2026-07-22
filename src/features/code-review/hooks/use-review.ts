'use client';

import { useMutation } from '@tanstack/react-query';
import type { CodeReviewResult, ReviewRequest } from '../types';
import type { ApiResult } from '@/types/common.types';

async function runReview(input: ReviewRequest): Promise<CodeReviewResult> {
  const res = await fetch('/api/ai/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as ApiResult<CodeReviewResult>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export function useCodeReview() {
  return useMutation({ mutationFn: runReview });
}
