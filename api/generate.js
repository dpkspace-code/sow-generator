export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel environment variables' })

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
    let data
    try { data = JSON.parse(text) } catch {
      return res.status(500).json({ error: 'Anthropic returned: ' + text.slice(0, 300) })
    }

    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || JSON.stringify(data) })
    return res.status(200).json(data)

  } catch (err) {
    return res.status(500).json({ error: 'Fetch error: ' + err.message })
  }
}
