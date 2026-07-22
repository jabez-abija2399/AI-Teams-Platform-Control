import Link from 'next/link';
import { auth } from '@/lib/auth';
import { buttonVariants } from '@/components/ui/button';
import { OnboardingFlow } from '@/features/onboarding/components/onboarding-flow';
import { APP_NAME } from '@/config/constants';

export default async function HomePage() {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Stale or corrupted JWT cookie — treat as logged out.
    // The browser will get a fresh session on next login.
  }

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <span className="text-sm font-semibold">{APP_NAME}</span>
        {session?.user ? (
          <Link href="/dashboard" className={buttonVariants({ size: 'sm' })}>Go to dashboard</Link>
        ) : (
          <div className="flex gap-2">
            <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Log in</Link>
            <Link href="/register" className={buttonVariants({ size: 'sm' })}>Sign up</Link>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-20">
        {session?.user ? (
          <OnboardingFlow />
        ) : (
          <div className="space-y-8 text-center">
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight">An AI software team, on demand.</h1>
              <p className="mx-auto max-w-lg text-muted-foreground">
                Describe what you want to build. CEO, Architect, Developer, and QA AI take it from idea to working software.
              </p>
            </div>
            <Link href="/register" className={buttonVariants({ size: 'lg' })}>Start building — it&apos;s free</Link>
          </div>
        )}
      </main>
    </div>
  );
}
