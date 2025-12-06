/**
 * Loading State Component
 * Displays loading state with spinner
 */

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingState({ message = 'Loading...', size = 'md' }: LoadingStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        color: '#666',
      }}
    >
      <LoadingSpinner size={size} />
      <div style={{ marginTop: '16px', fontSize: '14px', fontWeight: 500 }}>
        {message}
      </div>
    </div>
  );
}

