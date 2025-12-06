/**
 * Reusable Modal Component
 * Consistent modal/dialog style for all forms across the dashboard
 */

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px',
  showCloseButton = true,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          padding: '24px',
          maxWidth: maxWidth,
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', margin: 0 }}>
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                color: '#666',
                cursor: 'pointer',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#f0f0f0';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}

/**
 * Form Field Component for consistent styling
 */
interface FormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
  helpText?: string;
}

export function FormField({ label, children, required, error, helpText }: FormFieldProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#333',
          marginBottom: '8px',
        }}
      >
        {label}
        {required && <span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>}
      </label>
      {children}
      {error && (
        <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '4px' }}>{error}</div>
      )}
      {helpText && !error && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{helpText}</div>
      )}
    </div>
  );
}

/**
 * Modal Actions Component for consistent button styling
 */
interface ModalActionsProps {
  children: ReactNode;
}

export function ModalActions({ children }: ModalActionsProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: '1px solid #e0e0e0',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Button Component for modals
 */
interface ModalButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function ModalButton({
  children,
  onClick,
  variant = 'secondary',
  disabled = false,
  type = 'button',
}: ModalButtonProps) {
  const styles = {
    primary: {
      background: '#003A78',
      color: 'white',
      border: 'none',
    },
    secondary: {
      background: 'white',
      color: '#333',
      border: '1px solid #ddd',
    },
    danger: {
      background: '#e74c3c',
      color: 'white',
      border: 'none',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 20px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...styles[variant],
      }}
      onMouseOver={(e) => {
        if (!disabled && variant === 'secondary') {
          e.currentTarget.style.background = '#f8f9fa';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && variant === 'secondary') {
          e.currentTarget.style.background = 'white';
        }
      }}
    >
      {children}
    </button>
  );
}

