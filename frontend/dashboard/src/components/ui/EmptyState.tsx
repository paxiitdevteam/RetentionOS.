/**
 * Empty State Component
 * Displays empty state with icon and message
 */

import React from 'react';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#666',
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
      <div style={{ fontSize: '18px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: '14px', color: '#999', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
          {description}
        </div>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

