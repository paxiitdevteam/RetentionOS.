/**
 * Loading Spinner Component
 */

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function LoadingSpinner({ size = 'md', color = '#003A78' }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: '16px',
    md: '24px',
    lg: '32px',
  };

  return (
    <div
      style={{
        display: 'inline-block',
        width: sizeMap[size],
        height: sizeMap[size],
        border: `3px solid ${color}20`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
    />
  );
}

