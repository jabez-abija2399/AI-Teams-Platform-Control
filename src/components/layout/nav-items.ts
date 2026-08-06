import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/config/constants';

export const DASHBOARD_NAV_ITEMS: ReadonlyArray<{
  href: string;
  label: string;
  icon: LucideIcon;
  /** Exact path only — avoids /dashboard lighting up on /dashboard/projects */
  exact?: boolean;
}> = [
  { href: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: ROUTES.projects, label: 'Projects', icon: FolderKanban },
  { href: ROUTES.aiTeams, label: 'AI Teams', icon: Bot },
  { href: ROUTES.settings, label: 'Settings', icon: Settings },
];

export function isDashboardNavActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href === ROUTES.dashboard) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
