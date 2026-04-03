import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page not found - RetentionOS</title>
      </Head>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F5F5',
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ color: '#003A78', marginBottom: 8 }}>RetentionOS</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>This page does not exist.</p>
        <Link href="/login" style={{ color: '#0052a3', marginBottom: 16 }}>
          Go to admin login
        </Link>
        <Link href="/" style={{ color: '#888', fontSize: 14 }}>
          Dashboard home
        </Link>
      </div>
    </>
  );
}
