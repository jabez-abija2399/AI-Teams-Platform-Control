'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { Terminal } from 'lucide-react';

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

  const logsText = `
    > Developer Alex successfully compiled index.tsx [OK] | 
    > AI Orchestrator scaled Cluster-Alpha to 4 nodes [INFO] | 
    > Deployment v2.1.0 to staging environment successful [SUCCESS] | 
    > Running unit tests on FitTrack ML pipeline... 98% pass rate [WARN] | 
    > Container image build completed in 45s [OK]
  `.trim();

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar isSuperAdmin={isSuperAdmin} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden relative">
        <Navbar userName={userName} userImage={userImage} />
        
        {/* Main Content Area */}
        <main className="relative flex-1 overflow-y-auto pb-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,rgba(36,95,115,0.08),transparent_70%)]" />
          <div className="relative p-5 md:p-8">{children}</div>
        </main>

        {/* SECTION 5: DEPLOYMENT TICKER */}
        <div className="absolute bottom-0 left-0 right-0 h-10 border-t border-white/10 bg-surface flex items-center overflow-hidden z-20">
          <div className="flex items-center h-full px-4 border-r border-white/10 bg-surface-container z-10 shrink-0">
            <span className="font-mono text-[10px] font-bold text-primary flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" /> LIVE LOGS
            </span>
          </div>
          <div className="flex-1 overflow-hidden relative h-full flex items-center">
            <div className="font-mono text-xs text-on-surface-variant whitespace-nowrap animate-ticker inline-block">
              {logsText} <span className="mx-8 opacity-30">|</span> {logsText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
