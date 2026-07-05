// src/pages/ConvertPage.jsx
import { useState } from 'react'
import { toBase64, callGenerate, parseWeeksJSON } from '../data.js'
import { buildExcel, buildWord, buildPrint } from '../builders.js'
import FileUpload from '../components/FileUpload.jsx'
import FormatPicker from '../components/FormatPicker.jsx'
import Card from '../components/Card.jsx'

const CONVERT_SYSTEM = `You are an expert SOW formatter. The user has uploaded an existing Scheme of Work.
Extract ALL its content faithfully and return it as a JSON array.
Each element: {"week":N,"dates":"...","topics":"...","objectives":"...","activities":"...","resources":"...","assessment":"...","notes":"..."}
Output ONLY valid JSON — no markdown, no preamble, no explanation.`

export default function ConvertPage() {
  const [sowFile, setSowFile] = useState(null)
  const [styleFile, setStyleFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [format, setFormat] = useState('excel')
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [msg, setMsg] = useState(null)

  const handleConvert = async () => {
    if (!sowFile) { setMsg({ text: 'Please upload a SOW file to convert.', type: 'err' }); return }

    setConverting(true); setProgress(15)
    setMsg({ text: 'Reading your SOW file…', type: 'running' })

    const b64 = await toBase64(sowFile)
    const userContent = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } },
    ]

    if (styleFile) {
      const sb64 = await toBase64(styleFile)
      userContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: sb64 } })
      userContent.push({ type: 'text', text: 'An output style guide has been provided — apply its layout and formatting approach.' })
    }

    userContent.push({
      type: 'text',
      text: `Convert this Scheme of Work into the JSON format. Preserve all content faithfully.${notes ? '\n\nCONVERSION NOTES:\n' + notes : ''}\nReturn ONLY the JSON array.`,
    })

    setProgress(40); setMsg({ text: 'AI is reading and converting your SOW…', type: 'running' })

    let weeks
    try {
      const raw = await callGenerate(CONVERT_SYSTEM, [{ role: 'user', content: userContent }])
      weeks = parseWeeksJSON(raw)
    } catch (e) {
      setMsg({ text: 'Error: ' + e.message, type: 'err' })
      setConverting(false); return
    }

    setProgress(85); setMsg({ text: `Converted ${weeks.length} weeks — building ${format.toUpperCase()} file…`, type: 'running' })

    const meta = { subject: 'SOW', grade: '', term: 'Converted', year: new Date().getFullYear(), numWeeks: weeks.length }
    try {
      if (format === 'excel') buildExcel(weeks, meta)
      else if (format === 'word') buildWord(weeks, meta)
      else buildPrint(weeks, meta)
      setProgress(100)
      setMsg({ text: `✓ Converted — ${weeks.length} weeks downloaded as ${format.toUpperCase()}`, type: 'done' })
    } catch (e) {
      setMsg({ text: 'File error: ' + e.message, type: 'err' })
    }
    setConverting(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Upload SOW */}
      <Card title="1. Upload your prepared SOW">
        <div style={{
          border: '2px dashed var(--green-light)', borderRadius: '12px',
          padding: '32px', textAlign: 'center', background: 'var(--green-pale)',
          cursor: 'pointer', transition: 'border-color .2s',
        }} onClick={() => document.getElementById('sow-convert-input').click()}>
          <input type="file" id="sow-convert-input" accept=".pdf,.docx,.xlsx"
            style={{ display: 'none' }}
            onChange={e => setSowFile(e.target.files[0] || null)} />
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📂</div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--green)', marginBottom: '6px' }}>
            Click to upload your SOW file
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
            Accepted: Excel (.xlsx), Word (.docx), PDF (.pdf)
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px' }}>
            The AI will read its content and reformat it in your chosen output format
          </p>
        </div>

        {sowFile && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '12px 14px', marginTop: '10px',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green)' }}>{sowFile.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{(sowFile.size / 1024).toFixed(1)} KB</div>
            </div>
            <button onClick={() => setSowFile(null)} style={{
              fontSize: '12px', padding: '6px 12px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', background: 'none', cursor: 'pointer', color: 'var(--text-2)',
            }}>Remove</button>
          </div>
        )}
      </Card>

      {/* Output style */}
      <Card title="2. Output style (optional)">
        <FileUpload label="Style / formatting guide"
          hint="Upload a sample showing the layout, colours and fonts you want for the converted output"
          accept=".pdf,.docx,.xlsx,.png,.jpg"
          onChange={setStyleFile} file={styleFile} />
      </Card>

      {/* Conversion notes */}
      <Card title="3. Conversion notes (optional)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder={`e.g.\n- Keep the same week structure but add a 'Cross-curricular links' column\n- Change terminology to match new MES 2025 guidelines\n- Reorder columns: Week | Topics | Objectives | Activities | Assessment | Resources`} />
      </Card>

      {/* Format */}
      <Card title="4. Output format">
        <FormatPicker value={format} onChange={setFormat} />
      </Card>

      <button disabled={converting} onClick={handleConvert}
        style={{
          width: '100%', padding: '14px', borderRadius: 'var(--radius)',
          background: converting ? '#aaa' : 'var(--green-mid)', color: '#fff',
          fontSize: '15px', fontWeight: 600, cursor: converting ? 'not-allowed' : 'pointer',
          border: 'none', letterSpacing: '.2px',
        }}>
        {converting ? '⏳ Converting…' : '⇄ Convert Scheme of Work'}
      </button>

      {converting && (
        <div style={{ width: '100%', height: '4px', background: 'var(--green-light)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: progress + '%', background: 'var(--green-mid)', transition: 'width .4s' }} />
        </div>
      )}

      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius)', fontSize: '13px',
          background: msg.type === 'done' ? 'var(--green-pale)' : msg.type === 'err' ? '#FFEBEE' : 'var(--accent-light)',
          color: msg.type === 'done' ? 'var(--green)' : msg.type === 'err' ? '#c62828' : 'var(--accent)',
          border: `1px solid ${msg.type === 'done' ? 'var(--green-light)' : msg.type === 'err' ? '#FFCDD2' : '#90CAF9'}`,
        }}>{msg.text}</div>
      )}
    </div>
  )
}
