"use client";
import React, { useState, useEffect } from 'react';
import { RiCloseLine, RiAlertFill, RiInformationLine } from 'react-icons/ri';

export default function AdminConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  requiresInputText = null, // e.g., channel name that must be typed to confirm
  requireReason = false,
  reasonPlaceholder = 'Optional reason for audit logs...',
  onConfirm,
  onClose,
  isLoading = false
}) {
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedConfirmation('');
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmedDisabled = Boolean(
    isLoading ||
    (requiresInputText && typedConfirmation.trim().toLowerCase() !== requiresInputText.trim().toLowerCase())
  );

  const getButtonStyles = () => {
    if (confirmVariant === 'danger') {
      return {
        backgroundColor: '#ef4444',
        color: '#ffffff',
        border: 'none'
      };
    }
    if (confirmVariant === 'warning') {
      return {
        backgroundColor: 'var(--accent-warning)',
        color: '#000000',
        border: 'none'
      };
    }
    return {
      backgroundColor: 'var(--accent-primary)',
      color: 'var(--btn-primary-text)',
      border: 'none'
    };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: confirmVariant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: confirmVariant === 'danger' ? '#ef4444' : 'var(--accent-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RiAlertFill size={18} />
            </div>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: 0,
              fontFamily: 'var(--font-heading)'
            }}>
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <p style={{
            fontSize: '0.92rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            margin: 0
          }}>
            {description}
          </p>

          {requiresInputText && (
            <div style={{
              backgroundColor: 'var(--bg-darkest)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px'
            }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
                marginBottom: '8px'
              }}>
                To confirm, type <strong style={{ color: 'var(--text-main)' }}>{requiresInputText}</strong> below:
              </label>
              <input
                type="text"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                placeholder={requiresInputText}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {requireReason && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
                marginBottom: '6px'
              }}>
                Action Reason (Audit Trail)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-darkest)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-family)',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          backgroundColor: 'var(--bg-darkest)'
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '9px 16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={() => onConfirm(reason)}
            disabled={isConfirmedDisabled}
            style={{
              ...getButtonStyles(),
              padding: '9px 20px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isConfirmedDisabled ? 'not-allowed' : 'pointer',
              opacity: isConfirmedDisabled ? 0.45 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

