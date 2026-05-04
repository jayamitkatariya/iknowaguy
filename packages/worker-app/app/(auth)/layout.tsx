export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0f1e',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 8,
          }}>
            HireAHuman
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Worker Dashboard</p>
        </div>
        <div style={{
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
