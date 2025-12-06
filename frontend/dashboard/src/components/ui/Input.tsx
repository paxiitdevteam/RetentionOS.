/**
 * Input Component
 * Reusable input field
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  style,
  ...props
}: InputProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 600,
            color: '#333',
            marginBottom: '8px',
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        className={className}
        style={{
          width: '100%',
          padding: '12px',
          border: error ? '1px solid #e74c3c' : '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '14px',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          transition: 'all 200ms ease',
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? '#e74c3c' : '#003A78';
          e.target.style.boxShadow = '0 0 0 3px rgba(0, 58, 120, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#e74c3c' : '#ddd';
          e.target.style.boxShadow = 'none';
        }}
      />
      {error && (
        <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '4px' }}>
          {error}
        </div>
      )}
      {helperText && !error && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          {helperText}
        </div>
      )}
    </div>
  );
}

