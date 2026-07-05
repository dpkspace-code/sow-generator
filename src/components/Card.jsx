// src/components/Card.jsx
export default function Card({ title, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '22px',
      boxShadow: 'var(--shadow)',
    }}>
      {title && (
        <h2 style={{
          fontSize: '12px', fontWeight: 600, color: 'var(--text-2)',
          marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '.6px',
        }}>{title}</h2>
      )}
      {children}
    </div>
  )
}
