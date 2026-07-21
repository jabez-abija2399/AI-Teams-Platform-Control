import { NextResponse } from 'next/server';
import type { ApiResult } from '@/types/common.types';

const ERROR_STATUS: Record<string, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  EMAIL_TAKEN: 409,
  RATE_LIMITED: 429,
};

export function toResponse<T>(result: ApiResult<T>, successStatus = 200) {
  if (result.success) {
    return NextResponse.json(result, { status: successStatus });
  }
  const status = ERROR_STATUS[result.error.code] ?? 500;
  return NextResponse.json(result, { status });
}

export function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      },
    },
    { status: 401 },
  );
}
