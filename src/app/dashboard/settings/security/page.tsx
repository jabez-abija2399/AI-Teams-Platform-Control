import { SecuritySettings } from '@/features/settings/components/security-settings';

export const metadata = {
  title: 'Security & Audit Log | HibirDev AI',
  description: 'Manage BYOK zero-knowledge credentials and monitor security audit logs.',
};

export default function SecuritySettingsPage() {
  return <SecuritySettings />;
}
