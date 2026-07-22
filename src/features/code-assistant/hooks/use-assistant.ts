'use client';

import { useMutation } from '@tanstack/react-query';
import type { CodeAssistantRequest, CodeAssistantResponse } from '../types';
import type { ApiResult } from '@/types/common.types';

async function sendAssistantMessage(input: CodeAssistantRequest): Promise<CodeAssistantResponse> {
  const res = await fetch('/api/ai/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as ApiResult<CodeAssistantResponse>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export function useCodeAssistant() {
  return useMutation({
    mutationFn: sendAssistantMessage,
  });
}
