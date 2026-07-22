import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/api-response';
import { search } from '@/features/marketplace/core/marketplace.engine';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  const type = url.searchParams.get('type') ?? undefined;
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);

  const result = await search(query, type, limit);
  return NextResponse.json(result);
}
