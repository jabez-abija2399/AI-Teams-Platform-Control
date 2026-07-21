import { auth } from '@/lib/auth';
import { getUserProfile } from '@/features/auth/services/user.service';
import { ProfileForm } from '@/features/settings/components/profile-form';
import { PageContainer } from '@/components/layout/page-container';
import { notFound } from 'next/navigation';

export default async function SettingsPage() {
  const session = await auth();
  const profile = await getUserProfile(session!.user!.id as string);
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
