import { SignupForm } from '@/components/auth/signup-form';
import { AuthShell } from '@/components/auth/auth-shell';

export const metadata = {
  title: 'Sign Up | AI Teams Platform',
  description: 'Create an account and launch your AI software company.',
};

export default function SignupPage() {
  return (
    <AuthShell>
      <SignupForm />
    </AuthShell>
  );
}
