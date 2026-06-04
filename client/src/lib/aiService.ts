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

export type AiGrammarQuestion = {
  usage: 'practice' | 'game'
  category: 'grammar' | 'vocabulary' | 'reading' | 'sentence'
  game_types: Array<'grammar-race' | 'topik-master' | 'sentence-build' | 'vocab-speed'>
  error_type: 'vocabulary' | 'grammar_connector' | 'honorific' | 'reading' | 'similar_meaning'
  prompt: string
  options: string[]
  answer_index: number
  explanation: string
  difficulty: number
}

export type AiGrammarBundle = {
  pattern: {
    title: string
    formula: string
    meaning_vi: string
    meaning_en: string
    grammar_type: string
    tags: string[]
    examples: Array<{ ko: string; vi: string }>
    common_mistake: string
    similar_patterns: string[]
    contrast_notes: string
    prerequisites: string[]
  }
  questions: AiGrammarQuestion[]
}

export type AiGrammarValidation = {
  valid: boolean
  errors: string[]
  practiceCount: number
  gameCount: number
}

function normalizeAiGrammarBundle(rawBundle: any): AiGrammarBundle {
  const pattern = rawBundle?.pattern || {}
  const questions = Array.isArray(rawBundle?.questions) ? rawBundle.questions : []
  return {
    pattern: {
      title: String(pattern.title || '').trim(),
      formula: String(pattern.formula || '').trim(),
      meaning_vi: String(pattern.meaning_vi || '').trim(),
      meaning_en: String(pattern.meaning_en || '').trim(),
      grammar_type: String(pattern.grammar_type || 'general').trim(),
      tags: Array.isArray(pattern.tags) ? pattern.tags.map((item: unknown) => String(item).trim()).filter(Boolean) : [],
      examples: Array.isArray(pattern.examples)
        ? pattern.examples.map((item: any) => ({ ko: String(item?.ko || '').trim(), vi: String(item?.vi || '').trim() }))
        : [],
      common_mistake: String(pattern.common_mistake || '').trim(),
      similar_patterns: Array.isArray(pattern.similar_patterns)
        ? pattern.similar_patterns.map((item: unknown) => String(item).trim()).filter(Boolean)
        : [],
      contrast_notes: String(pattern.contrast_notes || '').trim(),
      prerequisites: Array.isArray(pattern.prerequisites)
        ? pattern.prerequisites.map((item: unknown) => String(item).trim()).filter(Boolean)
        : [],
    },
    questions: questions.map((question: any) => ({
      usage: question?.usage === 'game' ? 'game' : 'practice',
      category: ['grammar', 'vocabulary', 'reading', 'sentence'].includes(question?.category) ? question.category : 'grammar',
      game_types: Array.isArray(question?.game_types)
        ? question.game_types.filter((game: string) => ['grammar-race', 'topik-master', 'sentence-build', 'vocab-speed'].includes(game))
        : [],
      error_type: ['vocabulary', 'grammar_connector', 'honorific', 'reading', 'similar_meaning'].includes(question?.error_type)
        ? question.error_type
        : 'grammar_connector',
      prompt: String(question?.prompt || '').trim(),
      options: Array.isArray(question?.options) ? question.options.map((option: unknown) => String(option).trim()) : [],
      answer_index: Number(question?.answer_index),
      explanation: String(question?.explanation || '').trim(),
      difficulty: Math.max(1, Math.min(5, Number(question?.difficulty) || 3)),
    })),
  }
}

export function validateAiGrammarBundle(bundle: AiGrammarBundle, existingTitles: string[] = []): AiGrammarValidation {
  const errors: string[] = []
  const normalizedExisting = new Set(existingTitles.map(title => title.replace(/\s+/g, '').toLowerCase()))
  const normalizedTitle = bundle.pattern.title.replace(/\s+/g, '').toLowerCase()
  const practiceCount = bundle.questions.filter(question => question.usage === 'practice').length
  const gameCount = bundle.questions.filter(question => question.usage === 'game').length

  if (!bundle.pattern.title || !bundle.pattern.formula || !bundle.pattern.meaning_vi) {
    errors.push('Mẫu ngữ pháp thiếu tên, công thức hoặc nghĩa tiếng Việt.')
  }
  if (normalizedExisting.has(normalizedTitle)) errors.push('Mẫu ngữ pháp đã tồn tại trong kho.')
  if (bundle.pattern.examples.filter(example => example.ko && example.vi).length < 3) {
    errors.push('Mẫu ngữ pháp cần ít nhất 3 ví dụ Hàn - Việt.')
  }
  if (!bundle.pattern.common_mistake) errors.push('Thiếu phần lỗi thường gặp.')
  if (practiceCount < 10) errors.push(`Chỉ có ${practiceCount}/10 câu luyện tập.`)
  if (gameCount < 5) errors.push(`Chỉ có ${gameCount}/5 câu game.`)

  bundle.questions.forEach((question, index) => {
    if (!question.prompt || !question.explanation) errors.push(`Câu ${index + 1} thiếu đề bài hoặc giải thích.`)
    if (question.options.length !== 4) errors.push(`Câu ${index + 1} phải có đúng 4 lựa chọn.`)
    if (!Number.isInteger(question.answer_index) || question.answer_index < 0 || question.answer_index > 3) {
      errors.push(`Câu ${index + 1} có answer_index không hợp lệ.`)
    }
    if (new Set(question.options).size !== question.options.length) errors.push(`Câu ${index + 1} có lựa chọn trùng nhau.`)
    if (question.usage === 'game' && question.game_types.length === 0) {
      errors.push(`Câu game ${index + 1} chưa có game_types.`)
    }
  })

  return { valid: errors.length === 0, errors: [...new Set(errors)], practiceCount, gameCount }
}

export async function generateGrammarBundle(
  level: number,
  grammarType: string,
  topic: string,
  existingTitles: string[],
): Promise<AiGrammarBundle> {
  const prompt = `You are a professional Korean TOPIK curriculum editor.
Create exactly ONE new TOPIK level ${level} grammar pattern.
Grammar type: ${grammarType || 'general'}.
Preferred topic/context: ${topic || 'general TOPIK contexts'}.
Do not duplicate these existing patterns: ${existingTitles.slice(0, 200).join(', ')}.

CONTENT RULES
- Korean must be natural, standard, and appropriate for TOPIK. No slang.
- The assigned TOPIK level must be realistic.
- Explain in Vietnamese and English.
- Include at least 3 Korean-Vietnamese examples.
- Explain common mistakes and contrast with similar patterns.
- Create exactly 15 multiple-choice questions: 10 usage="practice" and 5 usage="game".
- Every question has exactly 4 plausible options and exactly one correct answer.
- answer_index is zero-based: 0, 1, 2, or 3.
- Every question includes a Vietnamese explanation explaining why the correct option is right.
- Game questions must include at least one game_types value from grammar-race, topik-master, sentence-build, vocab-speed.

Return only one valid JSON object:
{
  "pattern": {
    "title": "-...",
    "formula": "V/A-...",
    "meaning_vi": "...",
    "meaning_en": "...",
    "grammar_type": "${grammarType || 'general'}",
    "tags": ["..."],
    "examples": [{"ko":"...","vi":"..."}],
    "common_mistake": "...",
    "similar_patterns": ["..."],
    "contrast_notes": "...",
    "prerequisites": ["..."]
  },
  "questions": [{
    "usage": "practice or game",
    "category": "grammar or vocabulary or reading or sentence",
    "game_types": ["grammar-race"],
    "error_type": "vocabulary or grammar_connector or honorific or reading or similar_meaning",
    "prompt": "...",
    "options": ["...", "...", "...", "..."],
    "answer_index": 0,
    "explanation": "...",
    "difficulty": ${Math.max(1, Math.min(5, Math.ceil(level / 1.5)))}
  }]
}

Before returning, verify that there are exactly 10 practice questions and exactly 5 game questions.`

  const raw = await callDeepSeek(prompt, 8192)
  const parsed = JSON.parse(extractJson(raw))
  const bundle = normalizeAiGrammarBundle(parsed)
  const validation = validateAiGrammarBundle(bundle, existingTitles)
  if (!validation.valid) {
    throw new Error(`Nội dung AI chưa đạt chuẩn: ${validation.errors.slice(0, 4).join(' ')}`)
  }
  return bundle
}

/**
 * Gọi qua Vercel Proxy trước, fallback gọi trực tiếp DeepSeek
 */
async function callDeepSeek(prompt: string, maxTokens = 4096): Promise<string> {
  // ── Thử qua Server Proxy (không cần API Key) ──────────────────
  try {
    const proxyRes = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, max_tokens: maxTokens }),
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
      max_tokens: maxTokens,
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

type TopikExamSection = 'reading' | 'listening'

const TOPIK_EXAM_BLUEPRINT: Record<TopikExamSection, { count: number; time: string; realFormat: string }> = {
  reading: {
    count: 15,
    time: '30 phut cho mini test',
    realFormat: 'TOPIK I co 40 cau doc trong 60 phut; TOPIK II co 50 cau doc trong 70 phut.',
  },
  listening: {
    count: 10,
    time: '20 phut cho mini test',
    realFormat: 'TOPIK I co 30 cau nghe trong 40 phut; TOPIK II co 50 cau nghe trong 60 phut.',
  },
}

function buildOfficialTopikRules(section: TopikExamSection, level: number): string {
  const isTopikI = level === 1
  const blueprint = TOPIK_EXAM_BLUEPRINT[section]
  const sectionLabel = section === 'reading' ? '읽기 / Reading' : '듣기 / Listening'

  return `
Ban la chuyen gia ra de TOPIK theo phong cach NIIED. Hay tao mini mock test ${sectionLabel} cho ${isTopikI ? 'TOPIK I cap 1-2' : 'TOPIK II cap 3-6'}.

MUC TIEU FORMAT
- Tao dung ${blueprint.count} cau, dung de luyen trong ${blueprint.time}.
- Mini test phai mo phong tinh than de that: ${blueprint.realFormat}
- Do kho tang dan theo so cau: 30% de, 40% trung binh, 20% kho, 10% rat kho.
- Phan bo nang luc: 20% nhan biet thong tin truc tiep, 25% tu vung/ngu phap trong ngu canh, 25% y chinh/chu de, 20% suy luan/muc dich/thai do, 10% tong hop.

QUY TAC NGON NGU
- Noi dung tieng Han phai tu nhien, trang trong vua phai, giong de TOPIK, khong dung slang.
- ${isTopikI ? 'Chi dung chu de doi song hang ngay, truong hoc, mua sam, thoi gian, dia diem, gia dinh, so thich; tu vung TOPIK I.' : 'Dung chu de trung-cao cap nhu doi song xa hoi, giao duc, cong nghe thuong thuc, moi truong, van hoa, cong viec; tranh qua chuyen nganh.'}
- Khong dung noi dung nhay cam: chinh tri cuc doan, bao luc, y te/phap ly/tai chinh rui ro cao.
- Khong sao chep nguyen van de that da cong bo. Hay tao cau moi nhung cung cau truc.

QUY TAC CAU HOI
- Moi cau co dung 4 lua chon.
- Chi co 1 dap an dung.
- 3 dap an sai phai la nhieu hop ly, cung loai thong tin/ngu phap/ngu nghia, khong duoc vo ly.
- Khong de lo dap an bang meo: dap an dung dai bat thuong, lap y nguyen cum tu noi bat trong passage, hoac luon nam cung vi tri.
- Phan bo correct_option tuong doi deu giua 1, 2, 3, 4.
- instructions va question_text nen viet bang tieng Han theo phong cach de thi; explanation viet bang tieng Viet.

${section === 'reading' ? `
MA TRAN READING MINI TEST
- Cau 1-2: grammar/vocabulary fill-in trong cau ngan.
- Cau 3-4: chon bieu hien gan nghia hoac cau truc phu hop.
- Cau 5-6: doc thong bao, quang cao, bien bao, memo ngan.
- Cau 7-8: sap xep 4 cau theo trinh tu logic.
- Cau 9-11: dien cau/tu phu hop vao doan van ngan.
- Cau 12-15: doc doan van trung binh, hoi y chinh, noi dung dung, suy luan thai do/muc dich.
` : `
MA TRAN LISTENING MINI TEST
- Cau 1-2: hoi thoai ngan, chon hanh dong/dap loi tiep theo.
- Cau 3-4: chon tinh huong/chu de dung.
- Cau 5-7: nghe hoi thoai/thong bao, chon noi dung dung.
- Cau 8-10: script dai hon, hoi y chinh, chi tiet, muc dich/thai do.
- audio_script phai la kich ban tieng Han tu nhien, co speaker labels nhu "남자:" va "여자:" hoac "안내:".
`}

OUTPUT BAT BUOC
- Tra ve JSON array hop le, khong markdown, khong giai thich ngoai JSON.
- Moi item phai co schema:
{
  "question_number": number,
  "question_type": "grammar_fill | synonym | notice | ordering | blank_insert | main_idea | detail | inference | listening_action | listening_topic | listening_detail | listening_inference",
  "instructions": "string",
  "passage": "string hoac rong",
  "audio_script": "string hoac rong",
  "question_text": "string",
  "options": ["string", "string", "string", "string"],
  "correct_option": 1 | 2 | 3 | 4,
  "explanation": "Giai thich tieng Viet: vi sao dap an dung, vi sao cac dap an con lai sai."
}

TU KIEM TRUOC KHI TRA LOI
- Kiem tra du ${blueprint.count} cau.
- Kiem tra tat ca options co dung 4 lua chon.
- Kiem tra correct_option tro dung dap an duy nhat.
- Kiem tra khong co cau mo ho hoac hai dap an cung dung.
- Neu cau nao chua dat, tu sua trong JSON truoc khi tra loi.
`
}

function normalizeGeneratedQuestions(
  parsed: unknown,
  section: TopikExamSection,
  expectedCount: number,
): AiGeneratedQuestion[] {
  if (!Array.isArray(parsed)) {
    throw new Error('Du lieu de thi AI tra ve khong phai mang JSON.')
  }

  const normalized = parsed.map((q: any, index) => {
    const options = Array.isArray(q?.options)
      ? q.options.map((option: unknown) => String(option ?? '').trim()).filter(Boolean)
      : []
    const correctOption = Number(q?.correct_option)

    return {
      question_number: Number(q?.question_number) || index + 1,
      question_type: String(q?.question_type || section),
      instructions: String(q?.instructions || ''),
      passage: String(q?.passage || ''),
      question_text: String(q?.question_text || ''),
      options,
      correct_option: Number.isInteger(correctOption) ? correctOption : 0,
      explanation: String(q?.explanation || ''),
      audio_script: String(q?.audio_script || ''),
    }
  })

  const invalid = normalized.find(q => (
    q.options.length !== 4
    || q.correct_option < 1
    || q.correct_option > 4
    || !q.question_text.trim()
    || !q.explanation.trim()
    || (section === 'listening' && !q.audio_script?.trim())
  ))

  if (invalid) {
    throw new Error(`AI tao cau ${invalid.question_number} chua dung format TOPIK. Vui long tao lai.`)
  }

  if (normalized.length < expectedCount) {
    throw new Error(`AI chi tao ${normalized.length}/${expectedCount} cau. Vui long tao lai de du de.`)
  }

  return normalized
    .slice(0, expectedCount)
    .map((q, index) => ({ ...q, question_number: index + 1 }))
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

  void prompt
  const raw = await callDeepSeek(buildOfficialTopikRules('reading', level), 8192)
  const json = extractJson(raw)
  const parsed = JSON.parse(json)

  return normalizeGeneratedQuestions(parsed, 'reading', TOPIK_EXAM_BLUEPRINT.reading.count)
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

  void prompt
  const raw = await callDeepSeek(buildOfficialTopikRules('listening', level), 8192)
  const json = extractJson(raw)
  const parsed = JSON.parse(json)

  return normalizeGeneratedQuestions(parsed, 'listening', TOPIK_EXAM_BLUEPRINT.listening.count)
}

