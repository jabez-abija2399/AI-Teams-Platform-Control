'use client';

import { useEffect } from 'react';

/**
 * Replaces the root layout when a fatal error occurs.
 * Must define its own html/body.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#F2F0EF',
          color: '#1a1a1a',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              margin: '0 auto 16px',
              borderRadius: 16,
              background: 'rgba(115,62,36,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#733E24',
              fontSize: 22,
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 600 }}>
            Application error
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#666', lineHeight: 1.5 }}>
            A critical error occurred. Please reload the page.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: 'none',
              borderRadius: 12,
              background: '#245F73',
              color: '#F2F0EF',
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
