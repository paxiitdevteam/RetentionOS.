/**
 * Dashboard Layout Component
 * Main layout with sidebar and header
 */

import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { admin, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!isAuthenticated && router.pathname !== '/login') {
    return null; // Will redirect via middleware or useEffect
  }

  if (router.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          background: 'linear-gradient(180deg, #003A78 0%, #002855 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          padding: '32px 0',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          zIndex: 100,
        }}
      >
        <div style={{ padding: '0 24px', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
            RetentionOS
          </h1>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', fontWeight: 500 }}>
            Customer Retention Platform
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <NavLink href="/" label="Overview" icon="📊" />
          <NavLink href="/roi" label="ROI Calculator" icon="💰" />
          <NavLink href="/subscriptions" label="Subscriptions" icon="💳" />
          <NavLink href="/analytics" label="Analytics" icon="📈" />
          <NavLink href="/flows" label="Flows" icon="🔄" />
          <NavLink href="/ai" label="AI Analytics" icon="🤖" />
          <NavLink href="/settings" label="Settings" icon="⚙️" />
        </nav>

        <div style={{ padding: '0 24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <div style={{ marginBottom: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
            {admin?.email}
          </div>
          <div style={{ marginBottom: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {admin?.role}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'white',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header Bar */}
        <header
          style={{
            background: 'white',
            borderBottom: '1px solid #e0e0e0',
            padding: '20px 32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
                {router.pathname === '/' && 'Dashboard Overview'}
                {router.pathname === '/roi' && 'ROI Calculator'}
                {router.pathname === '/subscriptions' && 'Subscription Monitoring'}
                {router.pathname === '/analytics' && 'Analytics'}
                {router.pathname === '/flows' && 'Retention Flows'}
                {router.pathname === '/flows/builder' && 'Flow Builder'}
                {router.pathname === '/ai' && 'AI Analytics'}
                {router.pathname === '/settings' && 'Settings'}
              </h2>
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '32px', maxWidth: '1400px', width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  icon: string;
}

function NavLink({ href, label, icon }: NavLinkProps) {
  const router = useRouter();
  // Check if current path matches or starts with href (for nested routes)
  const isActive = router.pathname === href || (href !== '/' && router.pathname.startsWith(href));

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        router.push(href);
      }}
      style={{
        display: 'block',
        padding: '14px 24px',
        color: isActive ? 'white' : 'rgba(255,255,255,0.8)',
        textDecoration: 'none',
        fontWeight: isActive ? 600 : 500,
        background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
        borderLeft: isActive ? '4px solid white' : '4px solid transparent',
        transition: 'all 0.2s ease',
        fontSize: '14px',
      }}
      onMouseOver={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = 'white';
        }
      }}
      onMouseOut={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
        }
      }}
    >
      <span style={{ marginRight: '12px', fontSize: '16px' }}>{icon}</span>
      {label}
    </a>
  );
}

