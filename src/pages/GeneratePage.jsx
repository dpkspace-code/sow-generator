// src/pages/GeneratePage.jsx
import { useState, useEffect } from 'react'
import { SUBJECTS, GRADE_LABELS, getGroup, toBase64, callGenerate, parseWeeksJSON } from '../data.js'
import { buildExcel, buildWord, buildPrint } from '../builders.js'
import FileUpload from '../components/FileUpload.jsx'
import FormatPicker from '../components/FormatPicker.jsx'
import Card from '../components/Card.jsx'

const SOW_SYSTEM = `You are an expert Cambridge International Education curriculum developer for Mauritius secondary schools.
Generate a complete, professional Scheme of Work aligned to Cambridge CAIE and Mauritius MES requirements.
Output ONLY a valid JSON array — no markdown, no preamble, no explanation.

Each element must have exactly these keys:
{"week":N,"dates":"Week N","topics":"topic name and subtopics","objectives":"By end of week, students will be able to...","activities":"list of teaching and learning activities","resources":"textbook chapters, past papers, videos, lab equipment","assessment":"formative or summative assessment for this week","notes":"Support: ... | Extension: ..."}`

export default function GeneratePage() {
  const [grade, setGrade] = useState('12')
  const [subject, setSubject] = useState('')
  const [term, setTerm] = useState('Term 1')
  const [year, setYear] = useState('2026')
  const [numWeeks, setNumWeeks] = useState('')
  const [termWeeks, setTermWeeks] = useState(['', '', ''])
  const [startDate, setStartDate] = useState('')
  const [requirements, setRequirements] = useState('')
  const [format, setFormat] = useState('excel')
  const [singleFiles, setSingleFiles] = useState({})
  const [sowFiles, setSowFiles] = useState([])
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [msg, setMsg] = useState(null) // {text, type}

  const grp = getGroup(grade)
  const subjectList = SUBJECTS[grp]
  const isFY = term === 'Full Year'

  useEffect(() => {
    // Reset subject if not in new grade group
    const names = subjectList.map(s => typeof s === 'string' ? s : s.n)
    if (subject && !names.includes(subject)) setSubject('')
  }, [grade])

  const totalFYWeeks = termWeeks.reduce((s, w) => s + (parseInt(w) || 0), 0)

  const handleGenerate = async () => {
    if (!subject) { setMsg({ text: 'Please select a subject.', type: 'err' }); return }

    let weeksInt = 0, weeksDesc = ''
    if (isFY) {
      const [w1, w2, w3] = termWeeks.map(w => parseInt(w) || 0)
      if (!w1 || !w2 || !w3) { setMsg({ text: 'Please enter weeks for all three terms.', type: 'err' }); return }
      weeksInt = w1 + w2 + w3
      weeksDesc = `Full Year: Term 1 = ${w1} weeks, Term 2 = ${w2} weeks, Term 3 = ${w3} weeks (total ${weeksInt} weeks). Clearly label Term 1, Term 2, Term 3 sections.`
    } else {
      weeksInt = parseInt(numWeeks)
      if (!weeksInt || weeksInt < 1) { setMsg({ text: 'Please enter the number of weeks for this term.', type: 'err' }); return }
      weeksDesc = `${term}: ${weeksInt} weeks`
    }

    setGenerating(true); setProgress(10); setMsg({ text: 'Preparing documents…', type: 'running' })

    const fileAttachments = []
    const userParts = []

    for (const key of ['template', 'syllabus', 'textbook', 'style']) {
      if (singleFiles[key]) {
        const b64 = await toBase64(singleFiles[key])
        fileAttachments.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } })
        userParts.push({ type: 'text', text: `A ${key} reference file has been provided — follow it closely.` })
      }
    }
    for (const f of sowFiles) {
      const b64 = await toBase64(f)
      fileAttachments.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } })
    }
    if (sowFiles.length > 0)
      userParts.push({ type: 'text', text: `${sowFiles.length} existing SOW file(s) provided — match their style, depth and terminology.` })

    userParts.push({
      type: 'text',
      text: `Grade: ${grade} (${GRADE_LABELS[grp]})
Subject: ${subject}
${weeksDesc}
Academic Year: ${year}
${startDate ? 'Start date: ' + startDate : ''}

${requirements ? 'SPECIFIC REQUIREMENTS:\n' + requirements + '\n' : ''}
Generate exactly ${weeksInt} week objects. Distribute Cambridge syllabus topics logically.
Return ONLY the JSON array.`
    })

    setProgress(30); setMsg({ text: 'Generating Scheme of Work with AI — this may take 30–60 seconds…', type: 'running' })

    let weeks
    try {
      const raw = await callGenerate(SOW_SYSTEM, [{ role: 'user', content: [...fileAttachments, ...userParts] }])
      weeks = parseWeeksJSON(raw)
    } catch (e) {
      setMsg({ text: 'Error: ' + e.message, type: 'err' })
      setGenerating(false); return
    }

    setProgress(85); setMsg({ text: `Generated ${weeks.length} weeks — building file…`, type: 'running' })

    const meta = { subject, grade, term, year, numWeeks: weeksInt }
    try {
      if (format === 'excel') buildExcel(weeks, meta)
      else if (format === 'word') buildWord(weeks, meta)
      else buildPrint(weeks, meta)
      setProgress(100)
      setMsg({ text: `✓ Downloaded — ${weeks.length}-week SOW for ${subject} (Grade ${grade}), ${term} ${year}`, type: 'done' })
    } catch (e) {
      setMsg({ text: 'File error: ' + e.message, type: 'err' })
    }
    setGenerating(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 1. Course Details */}
      <Card title="1. Course details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={lbl}>Grade <span style={{ color: '#c62828' }}>*</span></label>
            <select value={grade} onChange={e => setGrade(e.target.value)}>
              {[7,8,9,10,11,12,13].map(g => (
                <option key={g} value={g}>
                  Grade {g} ({g <= 9 ? 'NYCBE' : g <= 11 ? 'O Level / SC' : 'A Level / HSC'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Academic year</label>
            <input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="2026" />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={lbl}>
            Subject <span style={{ color: '#c62828' }}>*</span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 400 }}> — {GRADE_LABELS[grp]}</span>
          </label>
          <select value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">— Select subject —</option>
            {subjectList.map(s => {
              const name = typeof s === 'string' ? s : s.n
              const code = typeof s === 'string' ? '' : s.c
              return <option key={name} value={name}>{name}{code ? ` (${code})` : ''}</option>
            })}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isFY ? '1fr' : '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={lbl}>Term</label>
            <select value={term} onChange={e => setTerm(e.target.value)}>
              {['Term 1', 'Term 2', 'Term 3', 'Full Year'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          {!isFY && (
            <div>
              <label style={lbl}>Number of weeks <span style={{ color: '#c62828' }}>*</span></label>
              <input type="number" min="1" max="40" value={numWeeks}
                onChange={e => setNumWeeks(e.target.value)} placeholder="e.g. 13" />
              <p style={hint}>Your school's actual weeks for this term</p>
            </div>
          )}

          <div>
            <label style={lbl}>Start date (optional)</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
        </div>

        {isFY && (
          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Weeks per term <span style={{ color: '#c62828' }}>*</span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 400 }}> — your school's actual lengths</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '6px' }}>
              {['Term 1', 'Term 2', 'Term 3'].map((t, i) => (
                <div key={t}>
                  <label style={{ ...lbl, color: 'var(--text-3)' }}>{t}</label>
                  <input type="number" min="1" max="20"
                    value={termWeeks[i]}
                    onChange={e => { const u = [...termWeeks]; u[i] = e.target.value; setTermWeeks(u) }}
                    placeholder={i === 0 ? 'e.g. 13' : i === 1 ? 'e.g. 10' : 'e.g. 9'} />
                </div>
              ))}
            </div>
            {totalFYWeeks > 0 && (
              <p style={{ fontSize: '12px', color: 'var(--green-mid)', fontWeight: 500, marginTop: '6px' }}>
                Total: {totalFYWeeks} weeks
              </p>
            )}
          </div>
        )}
      </Card>

      {/* 2. Reference Documents */}
      <Card title="2. Reference documents (all optional)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FileUpload label="SOW template"
            hint="Your school's standard SOW template — output will follow its structure"
            onChange={f => setSingleFiles(p => ({ ...p, template: f }))}
            file={singleFiles.template} />
          <FileUpload label="Existing Scheme(s) of Work" multiple
            hint="Upload one or more previous SOWs — style, depth and terminology will be matched"
            files={sowFiles} onMultiChange={setSowFiles} />
          <FileUpload label="Cambridge syllabus PDF"
            hint="Official CAIE syllabus — learning objectives will align precisely to it"
            accept=".pdf"
            onChange={f => setSingleFiles(p => ({ ...p, syllabus: f }))}
            file={singleFiles.syllabus} />
          <FileUpload label="Textbook"
            hint="Main textbook — chapter references will appear in the Resources column"
            accept=".pdf"
            onChange={f => setSingleFiles(p => ({ ...p, textbook: f }))}
            file={singleFiles.textbook} />
          <FileUpload label="Output style / formatting guide"
            hint="A sample showing the exact layout, colours and fonts you want — the output will mirror this style"
            accept=".pdf,.docx,.xlsx,.png,.jpg"
            onChange={f => setSingleFiles(p => ({ ...p, style: f }))}
            file={singleFiles.style} />
        </div>
      </Card>

      {/* 3. Requirements */}
      <Card title="3. Specific requirements">
        <textarea value={requirements} onChange={e => setRequirements(e.target.value)}
          placeholder={`e.g.\n- Include at least one practical per fortnight\n- Week 5 must cover Cell Division for upcoming class test\n- Cross-curricular links to Chemistry where relevant\n- We use the Hodder Cambridge Biology A Level textbook\n- Follow the MES 2025 SOW format guidelines`} />
      </Card>

      {/* 4. Format */}
      <Card title="4. Output format">
        <FormatPicker value={format} onChange={setFormat} />
      </Card>

      {/* Generate button */}
      <button disabled={generating} onClick={handleGenerate}
        style={{
          width: '100%', padding: '14px', borderRadius: 'var(--radius)',
          background: generating ? '#aaa' : 'var(--green-mid)', color: '#fff',
          fontSize: '15px', fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer',
          border: 'none', letterSpacing: '.2px',
        }}>
        {generating ? '⏳ Generating…' : '✦ Generate Scheme of Work'}
      </button>

      {/* Progress */}
      {generating && (
        <div style={{ width: '100%', height: '4px', background: 'var(--green-light)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: progress + '%', background: 'var(--green-mid)', transition: 'width .4s' }} />
        </div>
      )}

      {/* Message */}
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

const lbl = { display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '5px' }
const hint = { fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }
