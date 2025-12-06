/**
 * Button Component
 * Reusable button with variants
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    padding: size === 'sm' ? '8px 16px' : size === 'lg' ? '12px 24px' : '10px 20px',
    borderRadius: '6px',
    fontSize: size === 'sm' ? '13px' : size === 'lg' ? '16px' : '14px',
    fontWeight: 500,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 200ms ease',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    opacity: disabled || isLoading ? 0.6 : 1,
    ...style,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: '#003A78',
      color: 'white',
    },
    secondary: {
      background: 'transparent',
      color: '#666',
      border: '1px solid #ddd',
    },
    success: {
      background: '#1F9D55',
      color: 'white',
    },
    danger: {
      background: '#e74c3c',
      color: 'white',
    },
    ghost: {
      background: 'transparent',
      color: '#003A78',
    },
  };

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: { background: '#0056b3', transform: 'translateY(-1px)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    secondary: { background: '#f8f9fa', borderColor: '#bbb' },
    success: { background: '#1a8a4a', transform: 'translateY(-1px)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    danger: { background: '#c0392b', transform: 'translateY(-1px)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    ghost: { background: '#f0f4f8' },
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={className}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...(isHovered && !disabled && !isLoading ? hoverStyles[variant] : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLoading && (
        <span
          style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: 'currentColor',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  );
}

