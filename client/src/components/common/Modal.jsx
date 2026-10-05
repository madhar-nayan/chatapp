import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '500px' }) {
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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(6px)',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflowY: 'auto',
          animation: 'fadeIn 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{title}</h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon-only"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}
