'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-GB">
      <body style={{ margin: 0, background: '#0B0A0E', color: '#fff', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>Something went wrong</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>We hit an unexpected error</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '2rem', maxWidth: '24rem', lineHeight: 1.6 }}>
            Our team has been notified. Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            style={{ background: 'linear-gradient(135deg, #d4a029, #c9a84c)', color: '#0B0A0E', border: 'none', borderRadius: '9999px', padding: '0.75rem 2rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
