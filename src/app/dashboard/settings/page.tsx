import { AiCredentialsForm } from '@/features/settings/components/ai-credentials-form';
import { SettingsNavTabs } from '@/features/settings/components/settings-nav-tabs';

export const metadata = {
  title: 'AI Providers & Settings | HibirDev AI',
  description: 'Manage AI provider connections and BYOK API credentials.',
};

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col h-full bg-background text-on-background p-6 md:p-10 max-w-5xl mx-auto w-full gap-6">
      <div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-2">
          <span>WORKSPACE</span>
          <span className="opacity-40">/</span>
          <span className="text-primary font-bold">SETTINGS</span>
        </div>
        <div className="border-b border-outline-variant/60 pb-5 mb-4">
          <h1 className="font-sans text-2xl font-bold text-on-surface mb-1">AI Providers & Credentials</h1>
          <p className="font-sans text-xs text-on-surface-variant max-w-2xl">
            Configure BYOK (Bring Your Own Key) credentials for your AI providers. Keys are encrypted at rest.
          </p>
        </div>
      </div>

      <SettingsNavTabs />
      <AiCredentialsForm />
    </div>
  );
}
