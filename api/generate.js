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

    // Build Gemini prompt from system + user messages
    const systemText = body.system || ''
    const userText = body.messages?.[0]?.content
      ?.filter(c => c.type === 'text')
      ?.map(c => c.text)
      ?.join('\n') || ''

    const prompt = `${systemText}\n\n${userText}`

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    )

    const text = await r.text()
    let data
    try { data = JSON.parse(text) } catch {
      return res.status(500).json({ error: 'Gemini returned: ' + text.slice(0, 300) })
    }

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error?.message || JSON.stringify(data) })
    }

    // Convert Gemini response to Anthropic-compatible format
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return res.status(200).json({
      content: [{ type: 'text', text: content }]
    })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
