// Proxy to PaperVault backend on Render (no timeout issues)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const endpoint = body._endpoint || 'generate'

    const r = await fetch(`https://caie-api.onrender.com/api/v1/sow/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const raw = await r.text()
    if (!r.ok) {
      try {
        const err = JSON.parse(raw)
        return res.status(r.status).json({ error: err.detail || err.error || raw.slice(0, 200) })
      } catch {
        return res.status(r.status).json({ error: raw.slice(0, 200) })
      }
    }

    // Forward response with original content type
    const ct = r.headers.get('content-type') || 'application/json'
    res.setHeader('Content-Type', ct)
    if (ct.includes('application/json')) {
      return res.status(200).json(JSON.parse(raw))
    } else {
      // Binary file (Excel etc) — forward as buffer
      const buf = Buffer.from(raw, 'binary')
      const cd = r.headers.get('content-disposition') || ''
      if (cd) res.setHeader('Content-Disposition', cd)
      return res.status(200).send(buf)
    }
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
