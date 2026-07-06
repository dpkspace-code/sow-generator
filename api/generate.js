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

    const ct = r.headers.get('content-type') || ''

    if (!r.ok) {
      const errText = await r.text()
      try {
        const errJson = JSON.parse(errText)
        return res.status(r.status).json({ error: errJson.detail || errJson.error || errText.slice(0, 200) })
      } catch {
        return res.status(r.status).json({ error: errText.slice(0, 200) })
      }
    }

    // JSON response (generation result)
    if (ct.includes('application/json')) {
      const data = await r.json()
      return res.status(200).json(data)
    }

    // Binary file response (Excel, Word etc)
    const arrayBuffer = await r.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const cd = r.headers.get('content-disposition') || ''
    res.setHeader('Content-Type', ct)
    if (cd) res.setHeader('Content-Disposition', cd)
    return res.status(200).send(buffer)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
