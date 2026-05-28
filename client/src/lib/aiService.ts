/**
 * DeepSeek AI Service — Tạo câu ví dụ & mở rộng từ vựng TOPIK
 * API Key: ưu tiên localStorage, dự phòng VITE_DEEPSEEK_API_KEY trong .env
 */

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions'

/** Lấy API key: localStorage > .env */
export function getApiKey(): string {
  return localStorage.getItem('deepseek_api_key') || import.meta.env.VITE_DEEPSEEK_API_KEY || ''
}

/** Lưu API key vào localStorage */
export function setApiKey(key: string) {
  localStorage.setItem('deepseek_api_key', key.trim())
}

/** Kiểm tra đã có API key chưa */
export function hasApiKey(): boolean {
  return getApiKey().length > 0
}

export interface AiGeneratedExample {
  sentence: string  // Câu ví dụ tiếng Hàn
  meaning: string   // Nghĩa tiếng Việt
}

export interface AiGeneratedWord {
  ko: string
  vi: string
  en: string
  level: number
  example: string
}

/** Gọi DeepSeek API với prompt tuỳ chỉnh */
async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Chưa nhập API Key DeepSeek!')

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
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API lỗi (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

/** Trích xuất JSON từ response (xử lý markdown code block) */
function extractJson(raw: string): string {
  // Remove markdown code blocks if present
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1].trim() : raw.trim()
}

/**
 * Tạo câu ví dụ cho 1 từ vựng
 */
export async function generateExample(word: string): Promise<AiGeneratedExample> {
  const prompt = `Tạo 1 câu ví dụ thực tế bằng tiếng Hàn có sử dụng từ "${word}".
Trả lời bằng JSON theo format sau (KHÔNG markdown, KHÔNG giải thích thêm):
{"sentence": "câu tiếng Hàn", "meaning": "nghĩa tiếng Việt của câu"}`

  const raw = await callDeepSeek(prompt)
  const json = extractJson(raw)
  const parsed = JSON.parse(json)

  return {
    sentence: parsed.sentence || '',
    meaning: parsed.meaning || '',
  }
}

/**
 * Tạo từ vựng mới theo level, loại trừ các từ đã có
 */
export async function generateNewWords(
  level: number,
  existingWords: string[],
  count: number = 5,
): Promise<AiGeneratedWord[]> {
  const existingList = existingWords.slice(0, 100).join(', ') // tránh prompt quá dài
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
