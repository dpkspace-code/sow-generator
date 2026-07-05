module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(500).json({ error: 'Server not configured — contact administrator' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: body.system,
        messages: body.messages,
      }),
    })
    const text = await r.text()
    try {
      const data = JSON.parse(text)
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'AI error' })
      return res.status(200).json(data)
    } catch {
      return res.status(500).json({ error: 'AI returned unexpected response. Please try again.' })
    }
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
