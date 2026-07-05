// src/components/FormatPicker.jsx
const FORMATS = [
  { id: 'excel', icon: '📊', name: 'Excel (.xlsx)', desc: 'Best for editing and sharing' },
  { id: 'word',  icon: '📝', name: 'Word (.doc)',   desc: 'Best for formal submission — A3 landscape' },
  { id: 'print', icon: '🖨️', name: 'Print / PDF',  desc: 'Opens print dialog — save as PDF from there' },
]

export default function FormatPicker({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
      {FORMATS.map(f => (
        <div key={f.id} onClick={() => onChange(f.id)}
          style={{
            border: value === f.id ? '2px solid var(--green-mid)' : '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '14px 12px', cursor: 'pointer',
            background: value === f.id ? 'var(--green-pale)' : 'var(--surface)',
            transition: 'all .15s',
          }}>
          <div style={{ fontSize: '22px', marginBottom: '6px' }}>{f.icon}</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{f.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{f.desc}</div>
        </div>
      ))}
    </div>
  )
}
