import { useState } from 'react';
import { mediaUrl } from '../../utils/mediaUrl.js';

const SIZES = {
  xs: { dim: 24, font: '10px' },
  sm: { dim: 36, font: '12px' },
  md: { dim: 42, font: '14px' },
  lg: { dim: 56, font: '18px' },
  xl: { dim: 80, font: '24px' },
  xxl: { dim: 110, font: '32px' },
};

export default function Avatar({
  src,
  name = 'User',
  size = 'md',
  isOnline = false,
  className = '',
  onClick,
  showBorder = false,
}) {
  const [imgError, setImgError] = useState(false);
  const sizeConfig = SIZES[size] || SIZES.md;

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const avatarSrc = src ? mediaUrl(src) : null;
  const dimensionPx = `${sizeConfig.dim}px`;

  return (
    <div
      className={`avatar-wrapper ${className}`}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: dimensionPx,
        height: dimensionPx,
        minWidth: dimensionPx,
        minHeight: dimensionPx,
        maxWidth: dimensionPx,
        maxHeight: dimensionPx,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div
        className={`avatar-container ${size} ${showBorder ? 'avatar-ring' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '9999px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--gradient-primary)',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: sizeConfig.font,
          border: showBorder ? '2px solid var(--primary)' : 'none',
          boxShadow: 'var(--shadow-sm)',
          boxSizing: 'border-box',
        }}
      >
        {avatarSrc && !imgError ? (
          <img
            src={avatarSrc}
            alt={name}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '9999px',
              display: 'block',
            }}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {isOnline && (
        <span
          className="online-dot"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size === 'xs' || size === 'sm' ? '8px' : '12px',
            height: size === 'xs' || size === 'sm' ? '8px' : '12px',
            borderRadius: '9999px',
            backgroundColor: 'var(--success)',
            border: '2px solid var(--surface)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
}
