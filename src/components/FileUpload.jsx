// src/components/FileUpload.jsx
import { useRef } from 'react'

export default function FileUpload({
  label, hint, accept = '.pdf,.docx,.xlsx',
  file, onChange,
  multiple = false, files = [], onMultiChange,
}) {
  const inputRef = useRef()

  const handleChange = (e) => {
    if (multiple && onMultiChange) {
      const newFiles = Array.from(e.target.files)
      onMultiChange([...files, ...newFiles])
    } else {
      onChange(e.target.files[0] || null)
    }
    e.target.value = ''
  }

  const removeMulti = (idx) => {
    onMultiChange(files.filter((_, i) => i !== idx))
  }

  const hasFiles = multiple ? files.length > 0 : !!file

  return (
    <div>
      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '5px' }}>
        {label} <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
      </div>
      {hint && <p style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px' }}>{hint}</p>}
      <div style={{
        border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius)',
        padding: '10px 14px', background: 'var(--surface-1)', cursor: 'pointer',
      }} onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple}
          style={{ display: 'none' }} onChange={handleChange} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📎</span>
          <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500 }}>
            {hasFiles ? (multiple ? 'Add more files' : 'Change file') : (multiple ? 'Choose files' : 'Choose file')}
          </span>
        </div>
      </div>

      {/* File chips */}
      {multiple && files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
          {files.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', background: 'var(--green-pale)', color: 'var(--green)',
              border: '1px solid var(--green-light)', borderRadius: '20px', padding: '3px 10px',
            }}>
              ✓ {f.name}
              <button onClick={(e) => { e.stopPropagation(); removeMulti(i) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '12px', padding: 0 }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {!multiple && file && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '11px', background: 'var(--green-pale)', color: 'var(--green)',
            border: '1px solid var(--green-light)', borderRadius: '20px', padding: '3px 10px',
          }}>
            ✓ {file.name}
            <button onClick={(e) => { e.stopPropagation(); onChange(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '12px', padding: 0 }}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
