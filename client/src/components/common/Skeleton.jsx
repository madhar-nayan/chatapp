export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        borderRadius: 'var(--radius-md)',
        height: '20px',
        width: '100%',
        ...style,
      }}
    />
  );
}

export function PostSkeleton() {
  return (
    <div
      className="card"
      style={{
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton style={{ width: '120px', height: '14px' }} />
          <Skeleton style={{ width: '80px', height: '10px' }} />
        </div>
      </div>
      <Skeleton style={{ width: '100%', height: '240px', borderRadius: 'var(--radius-md)' }} />
      <div style={{ display: 'flex', gap: '12px' }}>
        <Skeleton style={{ width: '60px', height: '20px' }} />
        <Skeleton style={{ width: '60px', height: '20px' }} />
      </div>
    </div>
  );
}

export function UserSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton style={{ width: '110px', height: '14px' }} />
          <Skeleton style={{ width: '150px', height: '12px' }} />
        </div>
      </div>
      <Skeleton style={{ width: '80px', height: '32px', borderRadius: 'var(--radius-md)' }} />
    </div>
  );
}
