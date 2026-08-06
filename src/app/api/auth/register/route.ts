import { toResponse } from '@/lib/api-response';
import { registerUser } from '@/features/auth/services/auth.service';
import {
  checkRegisterRateLimit,
  formatRetryMessage,
  getClientIp,
  rateLimitHeaders,
} from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limited = checkRegisterRateLimit(ip);
    if (!limited.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: formatRetryMessage(limited),
            code: 'RATE_LIMITED',
          },
        },
        { status: 429, headers: rateLimitHeaders(limited) },
      );
    }

    const body = await request.json();
    const result = await registerUser(body);
    return toResponse(result, 201);
  } catch (err) {
    console.error('[auth/register]', err);
    return toResponse({
      success: false,
      error: { message: 'Registration failed', code: 'INTERNAL_ERROR' },
    });
  }
}
