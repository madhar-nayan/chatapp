import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function BottomSheet({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxHeight: '90dvh',
          backgroundColor: 'var(--surface)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflowY: 'auto',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0))',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div
          style={{
            width: '36px',
            height: '4px',
            backgroundColor: 'var(--border)',
            borderRadius: 'var(--radius-full)',
            margin: '12px auto 8px',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon-only"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}
