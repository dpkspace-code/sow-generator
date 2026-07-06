// src/data.js — Mauritius secondary curriculum + API helpers

export const SUBJECTS = {
  lower: [
    'Science (Integrated)', 'Mathematics', 'English Language', 'French', 'ICT',
    'Technology Studies', 'Business & Entrepreneurship Education',
    'Social & Modern Studies', 'Art & Design', 'Physical Education',
    'Kreol Morisien', 'Asian Languages / Arabic',
  ],
  upper_o: [
    { n: 'Biology', c: '5090' }, { n: 'Chemistry', c: '5070' }, { n: 'Physics', c: '5054' },
    { n: 'Mathematics', c: '4037' }, { n: 'English Language', c: '1125' }, { n: 'French', c: '3014' },
    { n: 'Economics', c: '2281' }, { n: 'Business Studies', c: '7115' }, { n: 'Accounting', c: '7707' },
    { n: 'Computer Science', c: '2210' }, { n: 'Sociology', c: '2251' }, { n: 'Literature in English', c: '2010' },
    { n: 'History', c: '2147' }, { n: 'Geography', c: '2217' }, { n: 'Travel & Tourism', c: '7096' },
    { n: 'Physical Education', c: '5016' }, { n: 'Combined Science', c: '5129' },
    { n: 'Agriculture', c: '5038' }, { n: 'Commerce', c: '7100' }, { n: 'Statistics', c: '4040' },
  ],
  upper_a: [
    { n: 'Biology', c: '9700' }, { n: 'Chemistry', c: '9701' }, { n: 'Physics', c: '9702' },
    { n: 'Mathematics', c: '9709' }, { n: 'English Language', c: '9093' }, { n: 'French', c: '9094' },
    { n: 'Economics', c: '9708' }, { n: 'Business Studies', c: '9609' }, { n: 'Accounting', c: '9706' },
    { n: 'Computer Science', c: '9618' }, { n: 'Sociology', c: '9699' }, { n: 'Literature in English', c: '9695' },
    { n: 'History', c: '9489' }, { n: 'Geography', c: '9696' }, { n: 'Travel & Tourism', c: '9395' },
    { n: 'Physical Education', c: '9396' }, { n: 'General Paper', c: '8021 (AS)' },
    { n: 'Law', c: '9084' }, { n: 'Psychology', c: '9990' },
  ],
}

export const GRADE_LABELS = {
  lower: 'NYCBE / MIE curriculum',
  upper_o: 'Cambridge O Level / SC',
  upper_a: 'Cambridge A Level / HSC',
}

export const SOW_COLS = [
  'Week & Dates', 'Topics / Subtopics', 'Learning Objectives',
  'Teaching & Learning Activities', 'Resources', 'Assessment', 'Notes / Differentiation',
]

export function getGroup(grade) {
  const g = parseInt(grade)
  if (g <= 9) return 'lower'
  if (g <= 11) return 'upper_o'
  return 'upper_a'
}

export function getSubjectList(grade) {
  return SUBJECTS[getGroup(grade)]
}

export async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const RENDER_BASE = 'https://caie-api.onrender.com/api/v1/sow'

// Call Render backend directly for AI generation
export async function callGenerate(system, messages) {
  const safeMessages = messages.map(m => ({
    ...m,
    content: Array.isArray(m.content)
      ? m.content.filter(c => c.type === 'text')
      : m.content,
  }))

  const res = await fetch(`${RENDER_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages: safeMessages }),
  })

  // Safe parse — backend may return plain text on error
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Server error: ' + text.slice(0, 120))
  }

  if (!res.ok) throw new Error(data.detail || data.error || 'Generation failed')
  return data.content.filter(b => b.type === 'text').map(b => b.text).join('')
}

// Render SOW via Render backend — returns a blob for download
export async function renderSOW(weeks, meta, format) {
  const res = await fetch(`${RENDER_BASE}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weeks, format, ...meta }),
  })

  if (!res.ok) {
    const text = await res.text()
    let msg = 'Render failed'
    try { msg = JSON.parse(text).detail || msg } catch { msg = text.slice(0, 120) }
    throw new Error(msg)
  }

  return res.blob()
}

export function parseWeeksJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim()
  try { return JSON.parse(clean) } catch {
    const m = clean.match(/\[[\s\S]*\]/)
    if (m) return JSON.parse(m[0])
    throw new Error('AI returned invalid format — please try again')
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
