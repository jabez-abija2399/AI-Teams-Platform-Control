import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf-token';

export async function validateCsrf(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  const method = request.method;

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return { valid: true };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { valid: true };
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    return { valid: false, error: 'CSRF token missing' };
  }

  if (cookieToken !== headerToken) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  return { valid: true };
}

export function generateCsrfToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join('');
}

export function setCsrfCookie(token: string): Response {
  const response = new Response();
  response.headers.set(
    'Set-Cookie',
    `${CSRF_COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`,
  );
  return response;
}