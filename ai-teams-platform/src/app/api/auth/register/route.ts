import { NextResponse } from 'next/server';
import { registerUser } from '@/features/auth/services/auth.service';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { allowed } = rateLimit(`register:${ip}`, 5);
  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Too many attempts',
          code: 'RATE_LIMITED',
        },
      },
      { status: 429 },
    );
  }

  const body = await request.json();
  const result = await registerUser(body);

  if (!result.success) {
    return NextResponse.json(result, {
      status: result.error.code === 'EMAIL_TAKEN' ? 409 : 400,
    });
  }
  return NextResponse.json(result, { status: 201 });
}
