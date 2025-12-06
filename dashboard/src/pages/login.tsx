/**
 * Login Page
 * Admin authentication page
 */

import { useState, FormEvent, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';

const Login: NextPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  if (isAuthenticated && !authLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#F5F5F5'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          Redirecting to dashboard...
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - RetentionOS Dashboard</title>
        <meta name="description" content="RetentionOS Admin Login" />
        {/* Prevent prefetching of API endpoints */}
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'} />
      </Head>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F5F5',
          padding: '20px',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            width: '100%',
            background: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#003A78',
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            RetentionOS
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#666',
              marginBottom: '32px',
              textAlign: 'center',
            }}
          >
            Admin Dashboard Login
          </p>

          {error && (
            <div
              style={{
                background: '#fee',
                color: '#c33',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px',
                whiteSpace: 'pre-line',
              }}
            >
              {error}
              {error.includes('Database connection failed') && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #fcc', fontSize: '12px', color: '#a00' }}>
                  <strong>⚠️ This is a database configuration issue, not a login problem.</strong>
                  <br />
                  The database needs to be configured before you can log in.
                  <br />
                  See <code>FIX_DATABASE_NOW.txt</code> in the project root for instructions.
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#333',
                  marginBottom: '8px',
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
                placeholder="admin@example.com"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#333',
                  marginBottom: '8px',
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#ccc' : '#003A78',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#002d5c';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#003A78';
                }
              }}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;

