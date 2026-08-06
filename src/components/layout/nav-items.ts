import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  Settings,
  Shield,
  Users,
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

/** Visible only to platform SUPER_ADMIN */
export const ADMIN_NAV_ITEMS: ReadonlyArray<{
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}> = [
  { href: ROUTES.admin, label: 'Analytics', icon: Shield, exact: true },
  { href: ROUTES.adminUsers, label: 'Users', icon: Users },
];

export function isDashboardNavActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href === ROUTES.dashboard || href === ROUTES.admin) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
