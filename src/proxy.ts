import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard'];
const AUTH_ROUTES = ['/login', '/register', '/signup'];

function hasSessionToken(request: NextRequest): boolean {
  return (
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token') ||
    request.cookies.has('next-auth.session-token') ||
    request.cookies.has('__Secure-next-auth.session-token')
  );
}

/**
 * Edge-safe proxy: page auth redirects only.
 * Project API ownership/rate-limit checks run in route handlers (Node runtime).
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = hasSessionToken(request);
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isAuthRoute && hasToken) {
    return NextResponse.redirect(new URL('/dashboard/projects', request.nextUrl.origin));
  }

  if (isProtected && !hasToken) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
