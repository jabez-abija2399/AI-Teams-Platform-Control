import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFolderContents } from '@/features/workspace/explorer/services/explorer.service';
import { unauthorizedResponse } from '@/lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const url = new URL(request.url);
  const folderId = url.searchParams.get('folderId') || null;

  const nodes = await getFolderContents(id, folderId);
  return NextResponse.json({ success: true, data: nodes });
}
