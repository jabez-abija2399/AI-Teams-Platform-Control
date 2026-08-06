import { toResponse } from '@/lib/api-response';
import { registerUser } from '@/features/auth/services/auth.service';

export async function POST(request: Request) {
  try {
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
