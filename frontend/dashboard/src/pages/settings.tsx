/**
 * Settings Page
 * API Keys and Account Settings
 */

import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

interface ApiKey {
  id: number;
  maskedKey: string;
  ownerId: number;
  ownerEmail: string | null;
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string | null;
  isExpired: boolean;
}

const Settings: NextPage = () => {
  const { isAuthenticated, admin } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<{ key: string; id: number } | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadApiKeys();
    }
  }, [isAuthenticated]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getApiKeys();
      if (response.success) {
        setApiKeys(response.keys);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load API keys');
      console.error('Error loading API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      const response = await apiClient.createApiKey();
      if (response.success) {
        setNewKey({ key: response.key.key, id: response.key.id });
        setShowNewKey(true);
        await loadApiKeys();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create API key');
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteApiKey(id);
      await loadApiKeys();
    } catch (err: any) {
      alert(err.message || 'Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Settings - RetentionOS Dashboard</title>
        <meta name="description" content="RetentionOS Settings" />
      </Head>

      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#003A78', marginBottom: '32px' }}>
          Settings
        </h1>

        {/* Account Section */}
        <div
          style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', marginBottom: '16px' }}>
            Account
          </h2>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Email:</strong> {admin?.email}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Role:</strong> {admin?.role}
            </div>
          </div>
        </div>

        {/* API Keys Section */}
        <div
          style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', margin: 0 }}>
              API Keys
            </h2>
            <button
              onClick={handleCreateKey}
              style={{
                padding: '10px 20px',
                background: '#003A78',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              + Create API Key
            </button>
          </div>

          {showNewKey && newKey && (
            <div
              style={{
                background: '#f0f4f8',
                border: '2px solid #003A78',
                padding: '16px',
                borderRadius: '6px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#003A78', marginBottom: '8px' }}>
                ⚠️ New API Key Created - Save this key now!
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                This key will not be shown again. Make sure to copy it to a secure location.
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  background: 'white',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '8px',
                }}
              >
                <code style={{ flex: 1, fontSize: '14px', fontFamily: 'monospace', color: '#333' }}>
                  {newKey.key}
                </code>
                <button
                  onClick={() => copyToClipboard(newKey.key)}
                  style={{
                    padding: '6px 12px',
                    background: '#003A78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Copy
                </button>
              </div>
              <button
                onClick={() => {
                  setShowNewKey(false);
                  setNewKey(null);
                }}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                I've saved it
              </button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Loading API keys...
            </div>
          )}

          {error && (
            <div
              style={{
                background: '#fee',
                color: '#c33',
                padding: '16px',
                borderRadius: '6px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {apiKeys.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  No API keys created yet
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Key</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Created</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Last Used</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((key) => (
                      <tr key={key.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px', color: '#333', fontFamily: 'monospace', fontSize: '12px' }}>
                          {key.maskedKey}
                        </td>
                        <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                          {new Date(key.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                          {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 500,
                              background: key.isExpired ? '#fee' : '#e8f5e9',
                              color: key.isExpired ? '#c33' : '#1F9D55',
                            }}
                          >
                            {key.isExpired ? 'Expired' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteKey(key.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'transparent',
                              color: '#c33',
                              border: '1px solid #c33',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Settings;

