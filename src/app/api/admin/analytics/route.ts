import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPlatformSuperAdmin } from '@/lib/platform-admin';

/**
 * Platform analytics for SUPER_ADMIN only.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  if (
    !isPlatformSuperAdmin({
      email: session.user.email,
      platformRole: session.user.platformRole,
    })
  ) {
    return NextResponse.json(
      { success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
      { status: 403 },
    );
  }

  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [userCount, projectCount, orgCount, recentUsers, usersLast7Days] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.organization.count().catch(() => 0),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          platformRole: true,
        },
      }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        userCount,
        projectCount,
        orgCount,
        usersLast7Days,
        recentUsers,
      },
    });
  } catch (error: any) {
    // Fallback if platformRole column not migrated yet
    try {
      const [userCount, projectCount] = await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
      ]);
      const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, name: true, email: true, createdAt: true },
      });
      return NextResponse.json({
        success: true,
        data: {
          userCount,
          projectCount,
          orgCount: 0,
          usersLast7Days: 0,
          recentUsers: recentUsers.map((u) => ({ ...u, platformRole: 'USER' })),
          warning: error?.message,
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          error: { message: err?.message || 'Failed to load analytics', code: 'INTERNAL_ERROR' },
        },
        { status: 500 },
      );
    }
  }
}
