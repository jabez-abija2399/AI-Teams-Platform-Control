'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';

export function DashboardLayoutClient({
  children,
  userName,
  userImage,
  isSuperAdmin = false,
}: {
  children: React.ReactNode;
  userName: string;
  userImage?: string | null;
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const isWorkspace = pathname?.includes('/workspace') ?? false;

  if (isWorkspace) {
    return <div className="h-dvh overflow-hidden bg-background">{children}</div>;
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar isSuperAdmin={isSuperAdmin} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar userName={userName} userImage={userImage} />
        <main className="relative flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,rgba(36,95,115,0.08),transparent_70%)]" />
          <div className="relative p-5 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
