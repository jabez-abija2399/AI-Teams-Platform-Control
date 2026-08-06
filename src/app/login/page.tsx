import { LoginForm } from '@/components/auth/login-form';
import { AuthShell } from '@/components/auth/auth-shell';

export const metadata = {
  title: 'Sign In | AI Teams Platform',
  description: 'Sign in to Mission Control and continue building with your AI software company.',
};

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
