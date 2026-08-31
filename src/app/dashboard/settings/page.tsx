import { AiProvidersSettings } from '@/features/settings/components/ai-providers-settings';

export const metadata = {
  title: 'AI Providers & Settings | HibirDev AI',
  description: 'Manage AI provider connections and BYOK API credentials.',
};

export default function SettingsPage() {
  return <AiProvidersSettings />;
}
