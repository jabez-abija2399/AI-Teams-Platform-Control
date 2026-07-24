import { getAuthSession } from '@/lib/session-helper';
import { getUserProfile } from '@/features/auth/services/user.service';
import { ProfileForm } from '@/features/settings/components/profile-form';
import { PageContainer } from '@/components/layout/page-container';
import { redirect, notFound } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) notFound();

  return (
    <PageContainer className="max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account.</p>
      </div>
      <ProfileForm
        defaultValues={{
          name: profile.name,
          email: profile.email,
        }}
      />
    </PageContainer>
  );
}
