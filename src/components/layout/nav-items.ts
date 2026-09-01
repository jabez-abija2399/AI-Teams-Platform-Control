import {
  LayoutDashboard,
  FolderKanban,
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
  exact?: boolean;
}> = [
  { href: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: ROUTES.projects, label: 'Projects', icon: FolderKanban },
  { href: ROUTES.settings, label: 'Settings', icon: Settings },
];

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
