import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Sign In | AI Teams Platform',
  description: 'Sign in to access your AI software projects.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
