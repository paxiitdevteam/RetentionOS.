/**
 * Alert Component
 * Display messages, errors, warnings, and success states
 */

import React from 'react';

export interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export default function Alert({ type = 'info', title, children, onClose }: AlertProps) {
  const styles = {
    success: {
      background: '#e8f5e9',
      borderColor: '#1F9D55',
      color: '#1F9D55',
      icon: '✓',
    },
    error: {
      background: '#fee',
      borderColor: '#e74c3c',
      color: '#c33',
      icon: '✗',
    },
    warning: {
      background: '#fff8e1',
      borderColor: '#f39c12',
      color: '#e67e22',
      icon: '⚠',
    },
    info: {
      background: '#e3f2fd',
      borderColor: '#003A78',
      color: '#003A78',
      icon: 'ℹ',
    },
  };

  const style = styles[type];

  return (
    <div
      style={{
        background: style.background,
        border: `1px solid ${style.borderColor}`,
        borderRadius: '8px',
        padding: '16px',
        color: style.color,
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ fontSize: '20px', lineHeight: '1' }}>{style.icon}</div>
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: '14px' }}>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: style.color,
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: '1',
            padding: '0',
            opacity: 0.7,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

