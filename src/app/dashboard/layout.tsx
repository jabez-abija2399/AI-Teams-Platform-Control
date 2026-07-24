import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/session-helper';
import { DashboardLayoutClient } from './dashboard-layout-client';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session?.user) redirect('/login');

  return (
    <DashboardLayoutClient
      userName={session.user.name ?? 'User'}
      userImage={session.user.image}
    >
      {children}
    </DashboardLayoutClient>
  );
}
