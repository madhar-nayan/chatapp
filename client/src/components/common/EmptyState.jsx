export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAling: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        margin: '0 auto',
      }}
    >
      {Icon && (
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--primary-soft)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <Icon size={32} />
        </div>
      )}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>{title}</h3>
      {description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '360px', marginBottom: actionLabel ? '20px' : 0 }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
