import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthSession } from '@/lib/session-helper';
import { isPlatformSuperAdmin } from '@/lib/platform-admin';
import { prisma } from '@/lib/prisma';
import { ROUTES } from '@/config/constants';

export default async function AdminUsersPage() {
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

  let users: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    platformRole?: string;
  }> = [];

  try {
    users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        platformRole: true,
      },
    });
  } catch {
    try {
      users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, name: true, email: true, createdAt: true },
      });
    } catch {
      users = [];
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={ROUTES.admin}
          className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
        >
          ← Analytics
        </Link>
        <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent accounts on the platform ({users.length} shown).
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/80">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/70 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No users found (or database unavailable).
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {u.platformRole || 'USER'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {u.createdAt.toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
