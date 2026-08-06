import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/session-helper';
import { isPlatformSuperAdmin } from '@/lib/platform-admin';
import { DashboardLayoutClient } from './dashboard-layout-client';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session?.user) redirect('/login');

  const isSuperAdmin = isPlatformSuperAdmin({
    email: session.user.email,
    platformRole: session.user.platformRole,
  });

  return (
    <DashboardLayoutClient
      userName={session.user.name ?? 'User'}
      userImage={session.user.image}
      isSuperAdmin={isSuperAdmin}
    >
      {children}
    </DashboardLayoutClient>
  );
}
