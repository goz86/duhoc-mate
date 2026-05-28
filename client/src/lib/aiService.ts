/**
 * DeepSeek AI Service — Tạo câu ví dụ & mở rộng từ vựng TOPIK
 * 
 * Ưu tiên gọi qua Vercel Serverless Proxy (/api/deepseek) → không cần API Key
 * Fallback: gọi trực tiếp DeepSeek nếu có API Key cá nhân
 */

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions'
const PROXY_ENDPOINT = '/api/deepseek'

/** Lấy API key cá nhân (dự phòng): localStorage > .env */
export function getApiKey(): string {
  return localStorage.getItem('deepseek_api_key') || import.meta.env.VITE_DEEPSEEK_API_KEY || ''
}

/** Lưu API key vào localStorage */
export function setApiKey(key: string) {
  localStorage.setItem('deepseek_api_key', key.trim())
}

/** Luôn trả true vì có server proxy — không bắt buộc nhập key nữa */
export function hasApiKey(): boolean {
  return true
}

export interface AiGeneratedExample {
  sentence: string
  meaning: string
}

export interface AiGeneratedWord {
  ko: string
  vi: string
  en: string
  level: number
  example: string
}

/**
 * Gọi qua Vercel Proxy trước, fallback gọi trực tiếp DeepSeek
 */
async function callDeepSeek(prompt: string): Promise<string> {
  // ── Thử qua Server Proxy (không cần API Key) ──────────────────
  try {
    const proxyRes = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, max_tokens: 4096 }),
    })

    if (proxyRes.ok) {
      const data = await proxyRes.json()
      if (data.content) return data.content
    }
    // Nếu proxy trả lỗi, tiếp tục fallback
  } catch {
    // Proxy không khả dụng (local dev hoặc lỗi network), fallback
  }

  // ── Fallback: gọi trực tiếp DeepSeek với API Key cá nhân ─────
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Không thể kết nối AI. Vui lòng thử lại sau hoặc nhập API Key DeepSeek trong phần Cài đặt.')

  const res = await fetch(DEEPSEEK_ENDPOINT, {
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
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API lỗi (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

/** Trích xuất JSON từ response (xử lý markdown code block + recovery) */
function extractJson(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  let json = match ? match[1].trim() : raw.trim()

  try {
    JSON.parse(json)
    return json
  } catch {
    // Recovery: tìm object hoàn chỉnh cuối cùng
    const lastCompleteObj = json.lastIndexOf('}')
    if (lastCompleteObj > 0) {
      json = json.substring(0, lastCompleteObj + 1)
      if (json.trimStart().startsWith('[') && !json.trimEnd().endsWith(']')) {
        json = json + ']'
      }
    }
    return json
  }
}

/**
 * Tạo câu ví dụ cho 1 từ vựng (tạo 2 câu ví dụ)
 */
export async function generateExample(word: string): Promise<AiGeneratedExample[]> {
  const prompt = `Tạo 2 câu ví dụ thực tế khác nhau bằng tiếng Hàn có sử dụng từ "${word}".
Trả lời bằng JSON array theo format sau (KHÔNG markdown, KHÔNG giải thích thêm):
[
  {"sentence": "câu tiếng Hàn 1", "meaning": "nghĩa tiếng Việt của câu 1"},
  {"sentence": "câu tiếng Hàn 2", "meaning": "nghĩa tiếng Việt của câu 2"}
]`

  const raw = await callDeepSeek(prompt)
  const json = extractJson(raw)
  const parsed = JSON.parse(json)

  if (!Array.isArray(parsed)) {
    throw new Error('Kết quả ví dụ AI không phải mảng')
  }

  return parsed.map((item: any) => ({
    sentence: item.sentence || '',
    meaning: item.meaning || '',
  }))
}

/**
 * Tạo từ vựng mới theo level, loại trừ các từ đã có
 */
export async function generateNewWords(
  level: number,
  existingWords: string[],
  count: number = 5,
): Promise<AiGeneratedWord[]> {
  const existingList = existingWords.slice(0, 100).join(', ')
  const prompt = `Tạo ${count} từ vựng tiếng Hàn mới phù hợp cấp độ TOPIK ${level}.
KHÔNG được trùng với các từ sau: [${existingList}]

Trả lời bằng JSON array theo format sau (KHÔNG markdown, KHÔNG giải thích thêm):
[{"ko": "từ tiếng Hàn", "vi": "nghĩa tiếng Việt", "en": "English meaning", "level": ${level}, "example": "câu ví dụ tiếng Hàn"}]`

  const raw = await callDeepSeek(prompt)
  const json = extractJson(raw)
  const parsed = JSON.parse(json)

  if (!Array.isArray(parsed)) throw new Error('Kết quả AI không phải mảng')

  return parsed.map((w: any) => ({
    ko: w.ko || '',
    vi: w.vi || '',
    en: w.en || '',
    level: w.level || level,
    example: w.example || '',
  }))
}
