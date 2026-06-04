import { publishTopikGrammarBundle } from '../lib/topik-publish.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const result = await publishTopikGrammarBundle({
      bundle: req.body?.bundle,
      level: Number(req.body?.level),
      supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    })
    return res.status(201).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Khong the luu mau ngu phap.'
    const status = Number.isInteger(error?.status) ? error.status : 500
    return res.status(status).json({ error: message })
  }
}
