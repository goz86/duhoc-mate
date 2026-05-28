/**
 * Vercel Serverless Function — Proxy DeepSeek API
 * API Key được lưu trong Vercel Environment Variables (DEEPSEEK_API_KEY)
 * Người dùng không cần nhập key.
 */

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions'

export default async function handler(req, res) {
  // Chỉ cho phép POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Server chưa cấu hình DEEPSEEK_API_KEY' })
  }

  try {
    const { prompt, max_tokens = 4096 } = req.body

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Thiếu prompt' })
    }

    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Bạn là trợ lý dạy tiếng Hàn chuyên nghiệp. Luôn trả lời bằng JSON hợp lệ theo đúng format yêu cầu, không thêm markdown hay text bên ngoài.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: Math.min(max_tokens, 4096),
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(response.status).json({ error: `DeepSeek API error: ${errText}` })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''

    return res.status(200).json({ content })
  } catch (err) {
    console.error('[DeepSeek Proxy]', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
