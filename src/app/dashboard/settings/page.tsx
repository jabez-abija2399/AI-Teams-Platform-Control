import { getAuthSession } from '@/lib/session-helper';
import { getUserProfile } from '@/features/auth/services/user.service';
import { AiCredentialsForm } from '@/features/settings/components/ai-credentials-form';
import { Shield, Key, Users, Lock, CheckCircle } from 'lucide-react';
import { redirect, notFound } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) notFound();

  return (
    <div className="max-w-7xl mx-auto py-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* SECTION 1: SETTINGS CATEGORIES */}
      <div className="lg:col-span-3 border border-white/10 p-4 bg-surface-container-low">
        <div className="font-heading text-lg font-bold mb-6 pb-2 border-b border-white/10 text-white">
          Configuration
        </div>
        <ul className="space-y-2 font-mono text-xs">
          <li>
            <a className="block px-4 py-2 bg-surface-container text-primary border-l-2 border-primary font-bold" href="#">
              AI Providers
            </a>
          </li>
          <li>
            <a className="block px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors" href="#">
              Workspace Configuration
            </a>
          </li>
          <li>
            <a className="block px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors" href="#">
              User Access Keys
            </a>
          </li>
          <li>
            <a className="block px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors" href="#">
              Security Audits
            </a>
          </li>
        </ul>
      </div>

      <div className="lg:col-span-9 space-y-8">
        {/* SECTION 2: AI CREDENTIAL FORM */}
        <section className="relative">
          <AiCredentialsForm />
        </section>

        {/* SECTION 3: CONNECTION STATUS MATRIX */}
        <section className="border border-white/10 overflow-hidden bg-surface">
          <div className="p-4 bg-surface-container-high font-mono text-xs uppercase font-bold text-white border-b border-white/10">
            Connection Status Matrix
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-surface-container-lowest border-b border-white/10">
                <tr>
                  <th className="p-4 text-on-surface-variant uppercase font-bold">Provider</th>
                  <th className="p-4 text-on-surface-variant uppercase font-bold">Active Model</th>
                  <th className="p-4 text-on-surface-variant uppercase font-bold">Status</th>
                  <th className="p-4 text-on-surface-variant uppercase font-bold">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr className="hover:bg-surface-container-high transition-colors">
                  <td className="p-4 font-bold text-white">Anthropic</td>
                  <td className="p-4 text-on-surface-variant">claude-3-5-sonnet</td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 font-bold">Active</span>
                  </td>
                  <td className="p-4">142ms</td>
                </tr>
                <tr className="hover:bg-surface-container-high transition-colors">
                  <td className="p-4 font-bold text-white">OpenAI</td>
                  <td className="p-4 text-on-surface-variant">gpt-4o</td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 font-bold">Active</span>
                  </td>
                  <td className="p-4">204ms</td>
                </tr>
                <tr className="hover:bg-surface-container-high transition-colors">
                  <td className="p-4 font-bold text-white">Groq</td>
                  <td className="p-4 text-on-surface-variant">llama-3-70b</td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-0.5 bg-surface-container-highest text-on-surface border border-white/10">Idle</span>
                  </td>
                  <td className="p-4">--</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 4: ACCESS CONTROL */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-white/10 p-6 bg-surface-container">
            <h3 className="font-mono text-xs uppercase font-bold text-on-surface-variant mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Active Users
            </h3>
            <ul className="space-y-4 font-mono text-xs">
              <li className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-white">{profile.email}</span>
                <span className="text-primary font-bold">Owner</span>
              </li>
              <li className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-on-surface-variant">eng-lead@hibir.dev</span>
                <span className="text-on-surface-variant">Write</span>
              </li>
            </ul>
            <button type="button" className="mt-4 text-primary font-mono text-xs font-bold hover:underline">
              + Invite User
            </button>
          </div>
          <div className="border border-white/10 p-6 bg-surface-container">
            <h3 className="font-mono text-xs uppercase font-bold text-on-surface-variant mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" /> Active Tokens
            </h3>
            <ul className="space-y-4 font-mono text-xs">
              <li className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-white">Prod-CI-Token</span>
                <span className="text-on-surface-variant text-[11px]">Last used: 2m ago</span>
              </li>
              <li className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-white">Dev-Local-Key</span>
                <span className="text-on-surface-variant text-[11px]">Last used: 1h ago</span>
              </li>
            </ul>
            <button type="button" className="mt-4 text-primary font-mono text-xs font-bold hover:underline">
              + Generate Token
            </button>
          </div>
        </section>

        {/* SECTION 5: ENCRYPTION PLEDGE */}
        <section className="border border-white/10 p-6 border-l-4 border-l-primary bg-white/[0.02]">
          <div className="flex gap-4">
            <Shield className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h4 className="font-mono text-xs font-bold mb-2 text-white uppercase">Security Guarantee</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                All API keys are encrypted at rest using AES-GCM vault storage. Credentials are never exposed to the frontend after initial input. For compliance details, review our security whitepaper.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
