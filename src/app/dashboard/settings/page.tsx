import { getAuthSession } from '@/lib/session-helper';
import { getUserProfile } from '@/features/auth/services/user.service';
import { ProfileForm } from '@/features/settings/components/profile-form';
import { AiCredentialsForm } from '@/features/settings/components/ai-credentials-form';
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
    <PageContainer className="max-w-2xl">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and the API key that powers your AI company.
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">AI API key</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Required before creating or starting projects. Free-tier options: Gemini and Groq.
        </p>
        </div>
        <AiCredentialsForm />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your name and email on this account.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <ProfileForm
            defaultValues={{
              name: profile.name,
              email: profile.email,
            }}
          />
        </div>
      </section>
    </PageContainer>
  );
}
