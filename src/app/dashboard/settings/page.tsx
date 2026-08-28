import { getAuthSession } from '@/lib/session-helper';
import { getUserProfile } from '@/features/auth/services/user.service';
import { ProfileForm } from '@/features/settings/components/profile-form';
import { AiCredentialsForm } from '@/features/settings/components/ai-credentials-form';
import { GlassCard } from '@/packages/ui';
import { Settings, Shield, UserCheck, Key } from 'lucide-react';
import { redirect, notFound } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) notFound();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-white">Platform Settings</h1>
        </div>
        <p className="text-sm text-white/50">
          Manage your account profile and autonomous AI workforce credentials.
        </p>
      </div>

      {/* AI Credentials BYOK Section */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-white tracking-tight">AI Provider Credentials</h2>
          </div>
          <p className="text-xs text-white/50">
            Required before launching projects. Free tiers available via Google Gemini and Groq.
          </p>
        </div>
        <AiCredentialsForm />
      </section>

      {/* User Profile Section */}
      <section className="space-y-4 pt-4 border-t border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-white tracking-tight">Account Profile</h2>
          </div>
          <p className="text-xs text-white/50">Your personal details and authentication email.</p>
        </div>
        <GlassCard className="p-6 border-white/10 shadow-xl">
          <ProfileForm
            defaultValues={{
              name: profile.name,
              email: profile.email,
            }}
          />
        </GlassCard>
      </section>
    </div>
  );
}
