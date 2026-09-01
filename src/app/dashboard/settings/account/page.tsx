import { AccountSettings } from '@/features/settings/components/account-settings';
import { getAuthSession } from '@/lib/session-helper';

export const metadata = {
  title: 'Account Profile | HibirDev AI',
  description: 'Manage personal profile details and preferences.',
};

export default async function AccountSettingsPage() {
  const session = await getAuthSession();
  return (
    <AccountSettings
      userName={session?.user?.name} 
      userEmail={session?.user?.email}
    />
  );
}
