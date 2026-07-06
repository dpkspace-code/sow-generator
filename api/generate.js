export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const key = process.env.GEMINI_API_KEY
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY not set in Vercel environment variables' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const systemText = body.system || ''
    const userParts = body.messages?.[0]?.content || []
    const userText = Array.isArray(userParts)
      ? userParts.filter(c => c.type === 'text').map(c => c.text).join('\n')
      : String(userParts)

    const prompt = `${systemText}\n\n${userText}`

    // Try models in order until one works
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-pro']
    let text = null
    let lastError = ''

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        }),
      })
      const raw = await r.text()
      if (raw.trim().startsWith('<')) { lastError = 'HTML error from Gemini'; continue }
      let data
      try { data = JSON.parse(raw) } catch { lastError = raw.slice(0, 100); continue }
      if (!r.ok || data.error) { lastError = data.error?.message || raw.slice(0, 100); continue }
      text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) break
    }

    if (!text) return res.status(500).json({ error: 'All Gemini models failed: ' + lastError })
    return res.status(200).json({ content: [{ type: 'text', text }] })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
