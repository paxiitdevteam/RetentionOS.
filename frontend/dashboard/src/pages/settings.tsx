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
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

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
    setShowDeleteConfirm(id);
  };

  const confirmDeleteKey = async () => {
    if (!showDeleteConfirm) return;

    try {
      await apiClient.deleteApiKey(showDeleteConfirm);
      await loadApiKeys();
      setShowDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete API key');
      setShowDeleteConfirm(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    // Validate passwords
    if (newPassword.length < 12) {
      setPasswordError('Password must be at least 12 characters');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(newPassword)) {
      setPasswordError('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      setPasswordLoading(true);
      await apiClient.updatePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
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
            <div style={{ marginBottom: '16px' }}>
              <strong>Role:</strong> {admin?.role}
            </div>
            
            {passwordSuccess && (
              <div
                style={{
                  background: '#e8f5e9',
                  color: '#1F9D55',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '14px',
                }}
              >
                ✅ Password updated successfully!
              </div>
            )}

            <button
              onClick={() => setShowPasswordForm(true)}
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
              Change Password
            </button>

            <Modal
              isOpen={showPasswordForm}
              onClose={() => {
                setShowPasswordForm(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError('');
              }}
              title="Change Password"
              maxWidth="500px"
            >
              <form
                onSubmit={handlePasswordChange}
                style={{ margin: 0 }}
              >
                <FormField label="Current Password" required error={passwordError && passwordError.includes('current') ? passwordError : undefined}>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter current password"
                  />
                </FormField>

                <FormField
                  label="New Password"
                  required
                  helpText="Must contain: uppercase, lowercase, number, and special character (min 12 characters)"
                  error={passwordError && !passwordError.includes('current') && !passwordError.includes('match') ? passwordError : undefined}
                >
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={12}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter new password (min 12 chars)"
                  />
                </FormField>

                <FormField
                  label="Confirm New Password"
                  required
                  error={passwordError && passwordError.includes('match') ? passwordError : undefined}
                >
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Confirm new password"
                  />
                </FormField>

                {passwordError && !passwordError.includes('current') && !passwordError.includes('match') && (
                  <div
                    style={{
                      background: '#fee',
                      color: '#c33',
                      padding: '12px',
                      borderRadius: '6px',
                      marginBottom: '16px',
                      fontSize: '14px',
                    }}
                  >
                    {passwordError}
                  </div>
                )}

                <ModalActions>
                  <ModalButton
                    variant="secondary"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordError('');
                    }}
                  >
                    Cancel
                  </ModalButton>
                  <ModalButton
                    variant="primary"
                    onClick={() => {}}
                    disabled={passwordLoading}
                    type="submit"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </ModalButton>
                </ModalActions>
              </form>
            </Modal>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm !== null}
          onClose={() => setShowDeleteConfirm(null)}
          title="Delete API Key"
          maxWidth="400px"
        >
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              Are you sure you want to delete this API key? This action cannot be undone.
            </p>
          </div>
          <ModalActions>
            <ModalButton variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </ModalButton>
            <ModalButton variant="danger" onClick={confirmDeleteKey}>
              Delete
            </ModalButton>
          </ModalActions>
        </Modal>

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

          <Modal
            isOpen={showNewKey && !!newKey}
            onClose={() => {
              setShowNewKey(false);
              setNewKey(null);
            }}
            title="New API Key Created"
            maxWidth="500px"
          >
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                ⚠️ <strong>Save this key now!</strong> This key will not be shown again. Make sure to copy it to a secure location.
              </div>
              <FormField label="API Key">
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    background: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                  }}
                >
                  <code style={{ flex: 1, fontSize: '14px', fontFamily: 'monospace', color: '#333', wordBreak: 'break-all' }}>
                    {newKey?.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newKey?.key || '')}
                    style={{
                      padding: '8px 16px',
                      background: '#003A78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Copy
                  </button>
                </div>
              </FormField>
            </div>
            <ModalActions>
              <ModalButton
                variant="primary"
                onClick={() => {
                  setShowNewKey(false);
                  setNewKey(null);
                }}
              >
                I've saved it
              </ModalButton>
            </ModalActions>
          </Modal>

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

