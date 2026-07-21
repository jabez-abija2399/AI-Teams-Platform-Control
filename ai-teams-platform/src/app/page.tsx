import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
          AI Teams Platform
        </h1>
        <p className="text-muted-foreground max-w-md text-lg">
          Build software with AI agents. Your virtual team of CEO, Architect, Developer, and QA —
          working together on your projects.
        </p>
        <div className="flex gap-4">
          <Link href="/login">
            <Button size="lg">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg">
              Create account
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
