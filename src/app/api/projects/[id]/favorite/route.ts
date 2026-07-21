import { auth } from '@/lib/auth';
import { toggleFavorite } from '@/features/workspace/project-manager/services/project-manager.service';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const { id } = await params;
  const result = await toggleFavorite(id, session.user.id);
  return toResponse(result);
}
