import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/session-helper';
import { isPlatformSuperAdmin } from '@/lib/platform-admin';
import { prisma } from '@/lib/prisma';
import { ROUTES } from '@/config/constants';
import Link from 'next/link';

export default async function AdminAnalyticsPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect('/login');
  if (
    !isPlatformSuperAdmin({
      email: session.user.email,
      platformRole: session.user.platformRole,
    })
  ) {
    redirect(ROUTES.dashboard);
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let userCount = 0;
  let projectCount = 0;
  let orgCount = 0;
  let usersLast7Days = 0;

  try {
    [userCount, projectCount, orgCount, usersLast7Days] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.organization.count().catch(() => 0),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);
  } catch {
    /* DB may be unavailable */
  }

  const cards = [
    { label: 'Total users', value: userCount },
    { label: 'New users (7d)', value: usersLast7Days },
    { label: 'Projects', value: projectCount },
    { label: 'Organizations', value: orgCount },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Platform · SUPER_ADMIN
        </p>
        <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simple system overview — how many people are using the platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border/70 bg-card/80 px-4 py-4"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={ROUTES.adminUsers}
          className="inline-flex rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30"
        >
          View users
        </Link>
      </div>
    </div>
  );
}
