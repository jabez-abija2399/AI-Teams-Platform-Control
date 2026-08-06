import type { Metadata } from 'next';
import { Fraunces, Manrope, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers/providers';
import { APP_NAME } from '@/config/constants';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
  adjustFontFallback: true,
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  fallback: ['ui-serif', 'Georgia', 'serif'],
  adjustFontFallback: true,
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    'Build software with an entire AI company. Specialized AI employees plan, design, build, test, and deploy production-ready applications.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${fraunces.variable} ${jetbrains.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: 'rounded-xl border border-border/80 shadow-lg',
                title: 'text-sm font-medium',
                description: 'text-xs text-muted-foreground',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
