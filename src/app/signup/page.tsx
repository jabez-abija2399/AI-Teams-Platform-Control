import { SignupForm } from '@/components/auth/signup-form';

export const metadata = {
  title: 'Sign Up | AI Teams Platform',
  description: 'Create an account to start orchestrating AI software teams.',
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <SignupForm />
    </main>
  );
}
