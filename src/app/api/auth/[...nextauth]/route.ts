import { handlers } from '@/lib/auth';
import { NextRequest } from 'next/server';
import {
  checkLoginEmailRateLimit,
  checkLoginIpRateLimit,
  formatRetryMessage,
  getClientIp,
  rateLimitHeaders,
} from '@/lib/rate-limit';

export const { GET } = handlers;

function rateLimitedResponse(result: ReturnType<typeof checkLoginIpRateLimit>) {
  return Response.json(
    {
      error: formatRetryMessage(result),
      code: 'RATE_LIMITED',
    },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    },
  );
}

/**
 * Rate-limit Auth.js POSTs (credential sign-in) by IP and email before handlers run.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimited = checkLoginIpRateLimit(ip);
  if (!ipLimited.allowed) {
    return rateLimitedResponse(ipLimited);
  }

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const cloned = request.clone();
      const form = await cloned.formData();
      const email = String(form.get('email') ?? '').trim();
      if (email) {
        const emailLimited = checkLoginEmailRateLimit(email);
        if (!emailLimited.allowed) {
          return rateLimitedResponse(emailLimited);
        }
      }
    }
  } catch {
    // Body unreadable — IP limit still applies
  }

  return handlers.POST(request);
}
