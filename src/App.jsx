// src/App.jsx
import { useState } from 'react'
import GeneratePage from './pages/GeneratePage.jsx'
import ConvertPage from './pages/ConvertPage.jsx'

export default function App() {
  const [mode, setMode] = useState('generate')

  return (
    <div>
      {/* Header */}
      <header style={{
        background: 'var(--green)', color: '#fff',
        padding: '18px 32px', display: 'flex',
        alignItems: 'center', gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,.2)'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '.3px' }}>
            📋 SOW Generator
          </h1>
          <p style={{ fontSize: '13px', opacity: .85, marginTop: '2px' }}>
            AI-powered Scheme of Work for Mauritius secondary schools — Grades 7 to 13
          </p>
        </div>
        <span style={{
          background: 'rgba(255,255,255,.18)', fontSize: '11px',
          padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap'
        }}>AI-powered</span>
      </header>

      {/* Mode switcher */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '28px 20px 0' }}>
        <div style={{
          display: 'flex', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          overflow: 'hidden', marginBottom: '24px',
          boxShadow: 'var(--shadow)'
        }}>
          {[
            { id: 'generate', label: '✦ Generate new SOW' },
            { id: 'convert',  label: '⇄ Convert existing SOW' },
          ].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              flex: 1, padding: '13px 16px', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 500, transition: 'all .15s',
              background: mode === m.id ? 'var(--green)' : 'none',
              color: mode === m.id ? '#fff' : 'var(--text-2)',
            }}>{m.label}</button>
          ))}
        </div>
      </div>

      {/* Pages */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 20px 60px' }}>
        {mode === 'generate' ? <GeneratePage /> : <ConvertPage />}
      </div>
    </div>
  )
}
