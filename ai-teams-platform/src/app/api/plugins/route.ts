import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlugins } from '@/features/plugins/core/plugin.engine';
import { unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId') ?? undefined;
  const plugins = await getPlugins(organizationId);
  return NextResponse.json({ success: true, data: plugins });
}
