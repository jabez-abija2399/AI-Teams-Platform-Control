import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listNotifications, markRead } from '@/features/collaboration/notifications/notification.service';
import { unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const notifications = await listNotifications(session.user.id, unreadOnly);
  return NextResponse.json({ success: true, data: notifications });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();
  const { notificationId } = await request.json();
  if (!notificationId) {
    return NextResponse.json({ success: false, error: { message: 'notificationId required', code: 'VALIDATION_ERROR' } }, { status: 400 });
  }
  await markRead(notificationId);
  return NextResponse.json({ success: true });
}
