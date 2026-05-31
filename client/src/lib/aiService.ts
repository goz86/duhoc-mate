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
  pronunciation: string
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
[{"ko": "từ tiếng Hàn", "pronunciation": "phát âm thực tế bằng tiếng Hàn nếu có biến âm 받침 (ví dụ: 학화 -> 하콰, 입니다 -> 임니다, 꽃이 -> 꼬치), nếu giống với ko thì ghi giống ko", "vi": "nghĩa tiếng Việt", "en": "English meaning", "level": ${level}, "example": "câu ví dụ tiếng Hàn"}]`

  const raw = await callDeepSeek(prompt)
  const json = extractJson(raw)
  const parsed = JSON.parse(json)

  if (!Array.isArray(parsed)) throw new Error('Kết quả AI không phải mảng')

  return parsed.map((w: any) => ({
    ko: w.ko || '',
    pronunciation: w.pronunciation || w.ko || '',
    vi: w.vi || '',
    en: w.en || '',
    level: w.level || level,
    example: w.example || '',
  }))
}


// ─── TOPIK Mock Exams Generators ─────────────────────────────────

export interface AiGeneratedQuestion {
  question_number: number
  question_type: string
  instructions: string
  passage?: string
  question_text: string
  options: string[]
  correct_option: number
  explanation: string
  audio_script?: string
}

/**
 * AI tạo đề thi Đọc (Reading Mock Exam - 15 câu)
 */
export async function generateReadingExam(level: number): Promise<AiGeneratedQuestion[]> {
  const prompt = `Bạn là một chuyên gia khảo thí tiếng Hàn chuyên nghiệp chuyên soạn thảo đề thi TOPIK quốc tế cho Viện Giáo dục Quốc tế Quốc gia Hàn Quốc (NIIED).
Hãy tạo một Đề thi thử Đọc TOPIK ${level === 1 ? 'I (Sơ cấp)' : 'II (Trung-Cao cấp)'} hệ Mini gồm đúng 15 câu hỏi trắc nghiệm cực kỳ chất lượng, bám sát các cấu trúc ngữ pháp và từ vựng thực tế của đề thi chính thức.

PHÂN BỔ 15 CÂU HỎI ĐỌC NHƯ SAU:
- Câu 1-2: Điền ngữ pháp thích hợp vào chỗ trống
- Câu 3-4: Chọn ngữ pháp có nghĩa tương đồng với phần gạch chân
- Câu 5-6: Đọc hiểu bảng quảng cáo, biển báo công cộng, nhãn hiệu
- Câu 7-8: Sắp xếp 4 câu 가, 나, 다, 라 theo đúng thứ tự logic thành đoạn văn
- Câu 9-11: Điền cụm từ phù hợp nhất vào chỗ trống của một đoạn văn ngắn 2-3 câu
- Câu 12-15: Đọc hiểu đoạn văn trung cấp (chọn câu đúng với nội dung đoạn văn, chọn suy nghĩ/thái độ chính của tác giả, giải nghĩa cụm từ gạch chân).

YÊU CẦU ĐỘ CHÍNH XÁC TUYỆT ĐỐI (TRÁNH SAI ĐÁP ÁN):
1. CHỈ CÓ DUY NHẤT MỘT phương án trong "options" là chính xác hoàn toàn về ngữ pháp và ngữ cảnh. Các phương án nhiễu phải sai rõ ràng về mặt cấu trúc ngữ pháp hoặc ngữ nghĩa.
2. Kiểm tra chéo: Chỉ số "correct_option" (từ 1 đến 4) bắt buộc phải trỏ chính xác vào phần tử đúng trong mảng "options".
3. Tự giải thích: Trong phần "explanation", hãy viết rõ ràng vì sao đáp án đó đúng và tại sao các đáp án còn lại sai bằng tiếng Việt.

Trả lời bằng JSON array chuẩn, KHÔNG dùng markdown code blocks, KHÔNG giải thích dông dài bên ngoài. Định dạng:
[
  {
    "question_number": 1,
    "question_type": "grammar_fill",
    "instructions": "[1~2] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오. (각 2점)",
    "question_text": "책을 ( ) 갑자기 고등학교 친구를 만났다.",
    "options": ["빌리거나", "빌리더니", "빌리는 길에", "빌리는 데다가"],
    "correct_option": 3,
    "explanation": "Cấu trúc '-(으)ㄴ/는 길에' diễn tả hành động nhân cơ hội, đang tiện thực hiện việc này thì thực hiện việc khác. Dịch nghĩa: Nhân tiện đi mượn sách thì tôi đột nhiên gặp lại người bạn cấp 3."
  }
]`

  const raw = await callDeepSeek(prompt)
  const json = extractJson(raw)
  const parsed = JSON.parse(json)

  if (!Array.isArray(parsed)) throw new Error('Dữ liệu đề thi đọc AI trả về không phải mảng')
  return parsed.map((q: any) => ({
    question_number: Number(q.question_number) || 1,
    question_type: q.question_type || 'reading',
    instructions: q.instructions || '',
    passage: q.passage || '',
    question_text: q.question_text || '',
    options: Array.isArray(q.options) ? q.options.map(String) : [],
    correct_option: Number(q.correct_option) || 1,
    explanation: q.explanation || '',
  }))
}

/**
 * AI tạo đề thi Nghe (Listening Mock Exam - 10 câu)
 */
export async function generateListeningExam(level: number): Promise<AiGeneratedQuestion[]> {
  const prompt = `Bạn là một chuyên gia khảo thí tiếng Hàn chuyên nghiệp chuyên soạn thảo đề thi TOPIK quốc tế cho NIIED.
Hãy tạo một Đề thi thử Nghe TOPIK ${level === 1 ? 'I (Sơ cấp)' : 'II (Trung-Cao cấp)'} hệ Mini gồm đúng 10 câu hỏi trắc nghiệm cực kỳ chất lượng, kèm theo kịch bản hội thoại tiếng Hàn tự nhiên, bám sát các dạng câu hỏi chính thức.

PHÂN BỔ 10 CÂU HỎI NGHE NHƯ SAU:
- Câu 1-2: Nghe và chọn hành động tiếp theo.
- Câu 3-4: Nghe và chọn bức tranh/tình huống mô tả đúng.
- Câu 5-7: Nghe và chọn phát biểu đúng với nội dung.
- Câu 8-10: Nghe đoạn hội thoại dài và trả lời các câu hỏi kép.

YÊU CẦU ĐỘ CHÍNH XÁC TUYỆT ĐỐI (TRÁNH SAI ĐÁP ÁN):
1. CHỈ CÓ DUY NHẤT MỘT phương án trong "options" là chính xác hoàn toàn. Các phương án nhiễu phải sai rõ ràng về mặt thông tin đã nghe hoặc cấu trúc logic.
2. Kiểm tra chéo: Chỉ số "correct_option" (từ 1 đến 4) bắt buộc phải trỏ chính xác vào phần tử đúng trong mảng "options".
3. Tự giải thích: Trong phần "explanation", hãy phân tích kịch bản nghe và chứng minh vì sao đáp án đó đúng bằng tiếng Việt.

Trả lời bằng JSON array chuẩn, KHÔNG dùng markdown code blocks, KHÔNG giải thích dông dài bên ngoài. Định dạng:
[
  {
    "question_number": 1,
    "question_type": "listening_action",
    "instructions": "[1~2] 다음을 듣고 알맞은 행동을 고르십시오. (각 2점)",
    "audio_script": "남자: 수미 씨, 이 미용실은 손님이 참 많네요.\\n여자: 네, 머리를 아주 잘하거든요. 저기 빈 자리가 있으니 앉아서 기다리세요.",
    "question_text": "여자가 다음에 할 행동으로 가장 알맞은 것을 고르십시오.",
    "options": ["자리에 앉아서 기다린다", "미용실 예약을 확인한다", "남자에게 머리를 깎아 준다", "다른 미용실로 이동한다"],
    "correct_option": 1,
    "explanation": "Người phụ nữ bảo người đàn ông ngồi ghế đợi ('저기 빈 자리가 있으니 앉아서 기다리세요') và cô ấy chuẩn bị làm tóc cho khách. Người đàn ông sẽ ngồi chờ."
  }
]`

  const raw = await callDeepSeek(prompt)
  const json = extractJson(raw)
  const parsed = JSON.parse(json)

  if (!Array.isArray(parsed)) throw new Error('Dữ liệu đề thi nghe AI trả về không phải mảng')
  return parsed.map((q: any) => ({
    question_number: Number(q.question_number) || 1,
    question_type: q.question_type || 'listening',
    instructions: q.instructions || '',
    passage: q.passage || '',
    question_text: q.question_text || '',
    options: Array.isArray(q.options) ? q.options.map(String) : [],
    correct_option: Number(q.correct_option) || 1,
    explanation: q.explanation || '',
    audio_script: q.audio_script || '',
  }))
}

