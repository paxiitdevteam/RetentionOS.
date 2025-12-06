/**
 * Card Component
 * Reusable card container
 */

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export default function Card({
  children,
  className = '',
  style,
  hover = true,
  padding = 'md',
}: CardProps) {
  const paddingMap = {
    sm: '16px',
    md: '24px',
    lg: '32px',
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className={className}
      style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: isHovered && hover ? '0 4px 12px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        padding: paddingMap[padding],
        transition: 'all 200ms ease',
        transform: isHovered && hover ? 'translateY(-2px)' : 'translateY(0)',
        animation: 'fadeIn 0.3s ease-out',
        ...style,
      }}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
    >
      {children}
    </div>
  );
}

