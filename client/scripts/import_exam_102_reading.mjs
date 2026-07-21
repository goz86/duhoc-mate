import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SCRIPT_DIR = path.join(ROOT, 'scripts')
const PUBLIC_DIR = path.join(ROOT, 'public')
const scriptRequire = createRequire(import.meta.url)
const { getOfficialAnswerKey } = scriptRequire('./topik_official_answer_keys.cjs')
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(arg => arg.startsWith('--') && arg.includes('='))
    .map(arg => {
      const index = arg.indexOf('=')
      return [arg.slice(2, index), arg.slice(index + 1)]
    })
)
const EXAM_NO = Number(args.exam || 102)
const SOURCE_DIR = args.source || 'C:/Users/Hhung/Downloads/102'
const sourceFiles = fs.existsSync(SOURCE_DIR) ? fs.readdirSync(SOURCE_DIR) : []
const READING_PDF = args.readingPdf || path.join(
  SOURCE_DIR,
  sourceFiles.find(name => name.includes(String(EXAM_NO)) && name.endsWith('.pdf') && name.includes('읽기')) || 'TOPIK 102 Đề Đọc.pdf'
)
const ANSWER_PDF = args.answerPdf || path.join(
  SOURCE_DIR,
  sourceFiles.find(name => name.includes(String(EXAM_NO)) && name.endsWith('.pdf') && name.includes('정답')) || 'TOPIK 102 Đáp.pdf'
)
const READING_DIR = path.join(PUBLIC_DIR, 'topik_exams', `ky_${EXAM_NO}`, 'reading')
const CLEAN_DIR = path.join(PUBLIC_DIR, 'topik_exams', `ky_${EXAM_NO}`, 'clean', 'reading')
const REVIEW_DIR = path.join(SCRIPT_DIR, 'crop_review', `topik${EXAM_NO}_reading_clean`)
const OCR_CACHE_PATH = path.join(SCRIPT_DIR, `ocr_cache_${EXAM_NO}_reading.json`)
const AI_CACHE_PATH = path.join(SCRIPT_DIR, `ai_parse_${EXAM_NO}_reading.json`)
const MAP_PATH = path.join(SCRIPT_DIR, `topik${EXAM_NO}_reading_clean_map.json`)
const PROGRESS_PATH = path.join(SCRIPT_DIR, `ingestion_progress_${EXAM_NO}.json`)
const TOOL_ROOT = process.env.TOPIK_PDF_TOOL_ROOT || 'C:/tmp/topik102-tools'
const APPLY = process.argv.includes('--apply')
const BASE_PAGE_WIDTH = 1786
const RENDER_WIDTH = BASE_PAGE_WIDTH

const OFFICIAL_READING_KEY = getOfficialAnswerKey(EXAM_NO, 'reading') || {
  1: 1, 2: 1, 3: 4, 4: 4, 5: 1, 6: 3, 7: 2, 8: 1, 9: 2, 10: 4,
  11: 2, 12: 1, 13: 1, 14: 2, 15: 1, 16: 2, 17: 3, 18: 1, 19: 1, 20: 4,
  21: 3, 22: 3, 23: 1, 24: 4, 25: 2, 26: 2, 27: 3, 28: 4, 29: 3, 30: 2,
  31: 4, 32: 1, 33: 3, 34: 4, 35: 3, 36: 3, 37: 4, 38: 4, 39: 3, 40: 2,
  41: 4, 42: 2, 43: 3, 44: 2, 45: 1, 46: 3, 47: 2, 48: 4, 49: 4, 50: 3,
}

const QUESTION_PROMPTS = {
  1: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  2: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  3: '밑줄 친 부분과 의미가 가장 비슷한 것을 고르십시오.',
  4: '밑줄 친 부분과 의미가 가장 비슷한 것을 고르십시오.',
  5: '다음은 무엇에 대한 글인지 고르십시오.',
  6: '다음은 무엇에 대한 글인지 고르십시오.',
  7: '다음은 무엇에 대한 글인지 고르십시오.',
  8: '다음은 무엇에 대한 글인지 고르십시오.',
  9: '다음 글 또는 그래프의 내용과 같은 것을 고르십시오.',
  10: '다음 글 또는 그래프의 내용과 같은 것을 고르십시오.',
  11: '다음 글 또는 그래프의 내용과 같은 것을 고르십시오.',
  12: '다음 글 또는 그래프의 내용과 같은 것을 고르십시오.',
  13: '다음을 순서에 맞게 배열한 것을 고르십시오.',
  14: '다음을 순서에 맞게 배열한 것을 고르십시오.',
  15: '다음을 순서에 맞게 배열한 것을 고르십시오.',
  16: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  17: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  18: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  19: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  20: '윗글의 주제로 가장 알맞은 것을 고르십시오.',
  21: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  22: '윗글의 내용과 같은 것을 고르십시오.',
  23: "밑줄 친 부분에 나타난 '나'의 심정으로 가장 알맞은 것을 고르십시오.",
  24: '윗글의 내용과 같은 것을 고르십시오.',
  25: '다음 신문 기사의 제목을 가장 잘 설명한 것을 고르십시오.',
  26: '다음 신문 기사의 제목을 가장 잘 설명한 것을 고르십시오.',
  27: '다음 신문 기사의 제목을 가장 잘 설명한 것을 고르십시오.',
  28: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  29: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  30: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  31: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  32: '다음을 읽고 글의 내용과 같은 것을 고르십시오.',
  33: '다음을 읽고 글의 내용과 같은 것을 고르십시오.',
  34: '다음을 읽고 글의 내용과 같은 것을 고르십시오.',
  35: '다음을 읽고 글의 주제로 가장 알맞은 것을 고르십시오.',
  36: '다음을 읽고 글의 주제로 가장 알맞은 것을 고르십시오.',
  37: '다음을 읽고 글의 주제로 가장 알맞은 것을 고르십시오.',
  38: '다음을 읽고 글의 주제로 가장 알맞은 것을 고르십시오.',
  39: '주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.',
  40: '주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.',
  41: '주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.',
  42: "밑줄 친 부분에 나타난 '미연'의 심정으로 가장 알맞은 것을 고르십시오.",
  43: '윗글의 내용으로 알 수 있는 것을 고르십시오.',
  44: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  45: '윗글의 주제로 가장 알맞은 것을 고르십시오.',
  46: '윗글에 나타난 필자의 태도로 가장 알맞은 것을 고르십시오.',
  47: '윗글의 내용과 같은 것을 고르십시오.',
  48: '윗글을 쓴 목적으로 가장 알맞은 것을 고르십시오.',
  49: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  50: '윗글의 내용과 같은 것을 고르십시오.',
}

const RANGE_INSTRUCTIONS = [
  [1, 2, '[1~2] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.'],
  [3, 4, '[3~4] 밑줄 친 부분과 의미가 가장 비슷한 것을 고르십시오.'],
  [5, 8, '[5~8] 다음은 무엇에 대한 글인지 고르십시오.'],
  [9, 12, '[9~12] 다음 글 또는 그래프의 내용과 같은 것을 고르십시오.'],
  [13, 15, '[13~15] 다음을 순서에 맞게 배열한 것을 고르십시오.'],
  [16, 18, '[16~18] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.'],
  [19, 20, '[19~20] 다음을 읽고 물음에 답하십시오.'],
  [21, 22, '[21~22] 다음을 읽고 물음에 답하십시오.'],
  [23, 24, '[23~24] 다음을 읽고 물음에 답하십시오.'],
  [25, 27, '[25~27] 다음 신문 기사의 제목을 가장 잘 설명한 것을 고르십시오.'],
  [28, 31, '[28~31] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오.'],
  [32, 34, '[32~34] 다음을 읽고 글의 내용과 같은 것을 고르십시오.'],
  [35, 38, '[35~38] 다음을 읽고 글의 주제로 가장 알맞은 것을 고르십시오.'],
  [39, 41, '[39~41] 주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.'],
  [42, 43, '[42~43] 다음을 읽고 물음에 답하십시오.'],
  [44, 45, '[44~45] 다음을 읽고 물음에 답하십시오.'],
  [46, 47, '[46~47] 다음을 읽고 물음에 답하십시오.'],
  [48, 50, '[48~50] 다음을 읽고 물음에 답하십시오.'],
]

const OLD_READING_PROMPT_OVERRIDES = {
  44: '윗글의 주제로 가장 알맞은 것을 고르십시오.',
  45: '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.',
  46: '위 글에서 <보기>의 글이 들어가기에 가장 알맞은 곳을 고르십시오.',
  50: '밑줄 친 부분에 나타난 필자의 태도로 가장 알맞은 것을 고르십시오.',
}

const QUESTIONS_BY_PAGE = {
  5: [1, 2, 3, 4],
  6: [5, 6, 7, 8],
  7: [9, 10],
  8: [11, 12],
  9: [13, 14, 15],
  10: [16, 17, 18],
  11: [19, 20],
  12: [21, 22],
  13: [23, 24],
  14: [25, 26, 27],
  15: [28, 29],
  16: [30, 31],
  17: [32, 33],
  18: [34, 35],
  19: [36, 37],
  20: [38, 39],
  21: [40, 41],
  22: [42, 43],
  23: [44, 45],
  24: [46, 47],
  25: [48, 49, 50],
}

const CROP_X1 = 95
const CROP_X2 = 1565
const PAD_X = 26
const PAD_Y = 22
const JOIN_GAP = 22

const p = (page, y1, y2) => ({ page, y1, y2 })
const CROP_MANIFEST = {
  1: [p(5, 370, 620)], 2: [p(5, 650, 980)], 3: [p(5, 1030, 1460)], 4: [p(5, 1510, 1920)],
  5: [p(6, 300, 820)], 6: [p(6, 830, 1320)], 7: [p(6, 1310, 1700)], 8: [p(6, 1820, 2280)],
  9: [p(7, 300, 815)], 10: [p(7, 1260, 1930)], 11: [p(8, 300, 730)], 12: [p(8, 1110, 1530)],
  13: [p(9, 300, 670)], 14: [p(9, 930, 1260)], 15: [p(9, 1500, 1860)],
  16: [p(10, 300, 748)], 17: [p(10, 930, 1410)], 18: [p(10, 1540, 2065)],
  19: [p(11, 260, 805)], 20: [p(11, 260, 805)],
  21: [p(12, 300, 795), p(12, 815, 930)], 22: [p(12, 300, 795), p(12, 1300, 1390)],
  23: [p(13, 300, 1175), p(13, 1220, 1276)], 24: [p(13, 300, 1175), p(13, 1570, 1645)],
  25: [p(14, 300, 880)], 26: [p(14, 900, 1400)], 27: [p(14, 1420, 1950)],
  28: [p(15, 300, 740)], 29: [p(15, 1110, 1532)], 30: [p(16, 300, 740)], 31: [p(16, 1110, 1532)],
  32: [p(17, 300, 805)], 33: [p(17, 1170, 1660)], 34: [p(18, 300, 748)], 35: [p(18, 1210, 1686)],
  36: [p(19, 260, 666)], 37: [p(19, 1040, 1518)], 38: [p(20, 300, 805)],
  39: [p(20, 1310, 1535), p(20, 1550, 2000)], 40: [p(21, 270, 455), p(21, 470, 980)],
  41: [p(21, 1180, 1365), p(21, 1380, 1825)], 42: [p(22, 300, 1450)], 43: [p(22, 300, 1450)],
  44: [p(23, 300, 1060)], 45: [p(23, 300, 1060)], 46: [p(24, 300, 1135)], 47: [p(24, 300, 1135)],
  48: [p(25, 300, 1265)], 49: [p(25, 300, 1265)], 50: [p(25, 300, 1265)],
}

const OLD_CROP_MANIFEST = {
  1: [p(5, 395, 705)], 2: [p(5, 820, 1040)], 3: [p(5, 1240, 1510)], 4: [p(5, 1650, 1860)],
  5: [p(6, 285, 695)], 6: [p(6, 840, 1165)], 7: [p(6, 1320, 1665)], 8: [p(6, 1800, 2135)],
  9: [p(7, 300, 895)], 10: [p(7, 1320, 1955)],
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

function readEnv() {
  const envPath = path.join(ROOT, '.env')
  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter(line => line && !line.trim().startsWith('#') && line.includes('='))
      .map(line => {
        const index = line.indexOf('=')
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
      })
  )
}

function instructionFor(qNum) {
  const range = RANGE_INSTRUCTIONS.find(([from, to]) => qNum >= from && qNum <= to)
  return range?.[2] || ''
}

function questionPromptFor(qNum) {
  if (EXAM_NO <= 64 && OLD_READING_PROMPT_OVERRIDES[qNum]) {
    return OLD_READING_PROMPT_OVERRIDES[qNum]
  }
  return QUESTION_PROMPTS[qNum]
}

function normalizeOption(value) {
  return String(value || '')
    .replace(/^[\s\d①②③④⓵⓶⓷⓸㉠㉡㉢㉣lJ.,:;()]+/u, '')
    .replace(/\s+/g, ' ')
    .replace(/의학분만/g, '의학뿐만')
    .replace(/해서 전선/g, '해저 전선')
    .trim()
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function enhanceCanvasForExamText(canvas) {
  const ctx = canvas.getContext('2d')
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const src = image.data
  const contrast = 1.16

  for (let i = 0; i < src.length; i += 4) {
    src[i] = clampByte((src[i] - 128) * contrast + 128)
    src[i + 1] = clampByte((src[i + 1] - 128) * contrast + 128)
    src[i + 2] = clampByte((src[i + 2] - 128) * contrast + 128)
  }

  const original = new Uint8ClampedArray(src)
  const width = canvas.width
  const height = canvas.height
  const center = 1.55
  const side = -0.1375

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = (y * width + x) * 4
      for (let c = 0; c < 3; c += 1) {
        const value = original[i + c] * center
          + original[i - 4 + c] * side
          + original[i + 4 + c] * side
          + original[i - width * 4 + c] * side
          + original[i + width * 4 + c] * side
        src[i + c] = clampByte(value)
      }
    }
  }

  ctx.putImageData(image, 0, 0)
}

async function loadPdfTools() {
  const toolRequire = createRequire(path.join(TOOL_ROOT, 'package.json'))
  const pdfjs = await import(pathToFileURL(toolRequire.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href)
  const canvas = toolRequire('@napi-rs/canvas')
  return { pdfjs, ...canvas }
}

async function renderPdf(pdfPath, outDir, label) {
  const { pdfjs, createCanvas, loadImage } = await loadPdfTools()
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const doc = await pdfjs.getDocument({ data, disableWorker: true }).promise
  fs.mkdirSync(outDir, { recursive: true })

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const out = path.join(outDir, `page_${String(pageNumber).padStart(2, '0')}.jpg`)
    if (fs.existsSync(out)) {
      const existing = await loadImage(out)
      if (existing.width === RENDER_WIDTH) continue
    }
    const page = await doc.getPage(pageNumber)
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: RENDER_WIDTH / base.width })
    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height))
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    fs.writeFileSync(out, canvas.toBuffer('image/jpeg', 0.96))
    console.log(`[render:${label}] page ${pageNumber}/${doc.numPages} -> ${path.relative(ROOT, out)}`)
  }
}

async function ocrImage(env, imagePath, pageNumber, cache) {
  const cacheKey = `page_${String(pageNumber).padStart(2, '0')}`
  if (cache[cacheKey]?.parsedText) return cache[cacheKey].parsedText

  const form = new FormData()
  form.append('apikey', env.VITE_OCR_SPACE_API_KEY)
  form.append('language', 'kor')
  form.append('isOverlayRequired', 'true')
  form.append('scale', 'true')
  form.append('OCREngine', '2')
  form.append('file', new Blob([fs.readFileSync(imagePath)], { type: 'image/jpeg' }), path.basename(imagePath))

  const res = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok || data.IsErroredOnProcessing) {
    throw new Error(`OCR failed page ${pageNumber}: ${JSON.stringify(data.ErrorMessage || data)}`)
  }

  const parsedText = data.ParsedResults?.[0]?.ParsedText || ''
  cache[cacheKey] = { parsedText, raw: data }
  writeJson(OCR_CACHE_PATH, cache)
  console.log(`[ocr] page ${pageNumber}: ${parsedText.length} chars`)
  return parsedText
}

async function parseOptionsViaAi(env, pageNumber, expectedQuestions, ocrText, aiCache) {
  const cacheKey = `page_${String(pageNumber).padStart(2, '0')}`
  if (aiCache[cacheKey]?.questions) return aiCache[cacheKey].questions

  const prompt = [
    'Bạn là bộ parser OCR cho đề TOPIK II Reading.',
    'Nhiệm vụ: trích xuất lựa chọn đáp án của đúng các câu được yêu cầu.',
    'QUY TẮC BẮT BUỘC:',
    '1. Giữ nguyên thứ tự lựa chọn theo ảnh/PDF: ①, ②, ③, ④. Không đổi vị trí theo đáp án đúng.',
    '2. Làm sạch lỗi OCR của ký hiệu lựa chọn như 1, l, J thành ①/②/③/④ nếu rõ ngữ cảnh.',
    '3. Mỗi câu phải có đúng 4 options, không kèm ký hiệu ①②③④ trong text.',
    '4. Không tự chọn đáp án đúng, không viết giải thích.',
    `Câu cần trích: ${expectedQuestions.join(', ')}`,
    'Trả JSON duy nhất dạng:',
    '{"questions":[{"question_number":1,"options":["...","...","...","..."]}]}',
    '',
    'OCR text:',
    ocrText,
  ].join('\n')

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.VITE_DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      console.log(`[ai] page ${pageNumber} attempt ${attempt} failed: ${res.status} ${await res.text()}`)
      continue
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    try {
      const parsed = JSON.parse(content)
      const questions = Array.isArray(parsed.questions) ? parsed.questions : []
      const byNumber = new Map(questions.map(q => [Number(q.question_number), q]))
      const normalized = expectedQuestions.map(qNum => {
        if ((qNum >= 39 && qNum <= 41) || (EXAM_NO <= 64 && qNum === 46)) {
          return { question_number: qNum, options: ['㉠', '㉡', '㉢', '㉣'] }
        }
        const q = byNumber.get(qNum)
        const options = Array.isArray(q?.options) ? q.options.map(normalizeOption).filter(Boolean) : []
        if (options.length !== 4) {
          throw new Error(`Q${qNum} expected 4 options, got ${options.length}`)
        }
        return { question_number: qNum, options }
      })
      aiCache[cacheKey] = { questions: normalized }
      writeJson(AI_CACHE_PATH, aiCache)
      console.log(`[ai] page ${pageNumber}: Q${expectedQuestions.join(',')}`)
      return normalized
    } catch (error) {
      console.log(`[ai] page ${pageNumber} attempt ${attempt} parse failed: ${error.message}`)
      console.log(content.slice(0, 800))
    }
  }

  throw new Error(`AI parse failed page ${pageNumber}`)
}

async function cropCleanImages() {
  const { createCanvas, loadImage } = await loadPdfTools()
  fs.mkdirSync(CLEAN_DIR, { recursive: true })
  fs.mkdirSync(REVIEW_DIR, { recursive: true })

  const sourceCache = new Map()
  async function source(page) {
    if (!sourceCache.has(page)) {
      sourceCache.set(page, await loadImage(path.join(READING_DIR, `page_${String(page).padStart(2, '0')}.jpg`)))
    }
    return sourceCache.get(page)
  }

  const mapping = {
    session: EXAM_NO,
    section: 'reading',
    source: `client/public/topik_exams/ky_${EXAM_NO}/reading/page_XX.jpg`,
    outputDir: `/topik_exams/ky_${EXAM_NO}/clean/reading`,
    questions: {},
  }

  for (let qNum = 1; qNum <= 50; qNum += 1) {
    const pieces = (EXAM_NO <= 64 && OLD_CROP_MANIFEST[qNum]) || CROP_MANIFEST[qNum]
    const firstImage = await source(pieces[0].page)
    const scale = firstImage.width / BASE_PAGE_WIDTH
    const cropX1 = Math.round(CROP_X1 * scale)
    const cropX2 = Math.round(CROP_X2 * scale)
    const padX = Math.round(PAD_X * scale)
    const padY = Math.round(PAD_Y * scale)
    const joinGap = Math.round(JOIN_GAP * scale)
    const partWidth = cropX2 - cropX1
    const scaledPieces = pieces.map(piece => ({
      page: piece.page,
      y1: Math.round(piece.y1 * scale),
      y2: Math.round(piece.y2 * scale),
    }))
    const partHeights = scaledPieces.map(piece => piece.y2 - piece.y1)
    const width = partWidth + padX * 2
    const height = partHeights.reduce((sum, h) => sum + h, 0) + joinGap * (scaledPieces.length - 1) + padY * 2
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    let y = padY
    for (const piece of scaledPieces) {
      const img = await source(piece.page)
      const partHeight = piece.y2 - piece.y1
      ctx.drawImage(img, cropX1, piece.y1, partWidth, partHeight, padX, y, partWidth, partHeight)
      y += partHeight + joinGap
    }

    const outName = `q${String(qNum).padStart(3, '0')}.png`
    const outPath = path.join(CLEAN_DIR, outName)
    enhanceCanvasForExamText(canvas)
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'))
    mapping.questions[String(qNum)] = {
      image: `/topik_exams/ky_${EXAM_NO}/clean/reading/${outName}`,
      pieces,
      size: { width, height },
    }
  }

  writeJson(MAP_PATH, mapping)
  await createContactSheet(mapping)
  console.log(`[crop] wrote ${path.relative(ROOT, MAP_PATH)}`)
}

async function createContactSheet(mapping) {
  const { createCanvas, loadImage } = await loadPdfTools()
  const cellW = 320
  const cellH = 260
  const cols = 5
  const rows = 10
  const canvas = createCanvas(cols * cellW, rows * cellH)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#f6f1eb'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let qNum = 1; qNum <= 50; qNum += 1) {
    const img = await loadImage(path.join(CLEAN_DIR, `q${String(qNum).padStart(3, '0')}.png`))
    const col = (qNum - 1) % cols
    const row = Math.floor((qNum - 1) / cols)
    const x = col * cellW
    const y = row * cellH
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x + 8, y + 28, cellW - 16, cellH - 36)
    const scale = Math.min((cellW - 24) / img.width, (cellH - 52) / img.height)
    const w = img.width * scale
    const h = img.height * scale
    ctx.drawImage(img, x + (cellW - w) / 2, y + 34, w, h)
    ctx.fillStyle = '#3b2f2a'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText(`Q${qNum}`, x + 12, y + 22)
  }

  fs.writeFileSync(path.join(REVIEW_DIR, 'contact_sheet.jpg'), canvas.toBuffer('image/jpeg', 0.9))
}

async function buildQuestionRecords(env) {
  const ocrCache = readJson(OCR_CACHE_PATH, {})
  const aiCache = readJson(AI_CACHE_PATH, {})
  const parsed = []

  for (const [pageText, expected] of Object.entries(QUESTIONS_BY_PAGE)) {
    const pageNumber = Number(pageText)
    const imagePath = path.join(READING_DIR, `page_${String(pageNumber).padStart(2, '0')}.jpg`)
    const ocrText = await ocrImage(env, imagePath, pageNumber, ocrCache)
    const pageQuestions = await parseOptionsViaAi(env, pageNumber, expected, ocrText, aiCache)
    parsed.push(...pageQuestions)
  }

  const byNumber = new Map(parsed.map(q => [q.question_number, q]))
  const records = []
  for (let qNum = 1; qNum <= 50; qNum += 1) {
    const parsedQuestion = byNumber.get(qNum)
    if (!parsedQuestion) throw new Error(`Missing Q${qNum}`)
    const options = ((qNum >= 39 && qNum <= 41) || (EXAM_NO <= 64 && qNum === 46))
      ? ['㉠', '㉡', '㉢', '㉣']
      : parsedQuestion.options.map(normalizeOption)
    records.push({
      question_number: qNum,
      question_type: qNum <= 4 ? 'grammar' : 'reading',
      instructions: instructionFor(qNum),
      passage: null,
      question_text: questionPromptFor(qNum),
      options,
      correct_option: OFFICIAL_READING_KEY[qNum],
      explanation: `Đáp án chính thức: ${OFFICIAL_READING_KEY[qNum]}.`,
      audio_script: `/topik_exams/ky_${EXAM_NO}/clean/reading/q${String(qNum).padStart(3, '0')}.png`,
    })
  }
  return records
}

async function getOrCreateExam(env) {
  const title = `Đề thi chính thức TOPIK II Đọc - Kỳ ${EXAM_NO}`
  const query = new URL(`${env.VITE_SUPABASE_URL}/rest/v1/topik_exams`)
  query.searchParams.set('title', `eq.${title}`)
  query.searchParams.set('select', 'id,title')
  const headers = {
    apikey: env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  }

  const existingRes = await fetch(query, { headers })
  if (!existingRes.ok) throw new Error(`Find exam failed: ${existingRes.status} ${await existingRes.text()}`)
  const existing = await existingRes.json()
  if (existing[0]?.id) return existing[0].id

  const createRes = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/topik_exams`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      title,
      category: 'reading',
      level: 2,
      created_by: 'system_pdf_import',
    }),
  })
  if (!createRes.ok) throw new Error(`Create exam failed: ${createRes.status} ${await createRes.text()}`)
  const created = await createRes.json()
  return created[0].id
}

async function replaceQuestions(env, examId, records) {
  const headers = {
    apikey: env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  }

  const deleteUrl = new URL(`${env.VITE_SUPABASE_URL}/rest/v1/topik_exam_questions`)
  deleteUrl.searchParams.set('exam_id', `eq.${examId}`)
  const deleteRes = await fetch(deleteUrl, { method: 'DELETE', headers })
  if (!deleteRes.ok) throw new Error(`Delete old questions failed: ${deleteRes.status} ${await deleteRes.text()}`)

  const insertRows = records.map(record => ({ ...record, exam_id: examId }))
  const insertRes = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/topik_exam_questions`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(insertRows),
  })
  if (!insertRes.ok) throw new Error(`Insert questions failed: ${insertRes.status} ${await insertRes.text()}`)
}

async function main() {
  if (!fs.existsSync(READING_PDF)) throw new Error(`Missing ${READING_PDF}`)
  if (!fs.existsSync(ANSWER_PDF)) throw new Error(`Missing ${ANSWER_PDF}`)
  if (!fs.existsSync(path.join(TOOL_ROOT, 'node_modules'))) {
    throw new Error(`Missing PDF tool node_modules at ${TOOL_ROOT}. Run npm install pdfjs-dist @napi-rs/canvas there.`)
  }

  const env = readEnv()
  await renderPdf(READING_PDF, READING_DIR, 'reading')
  await cropCleanImages()
  const records = await buildQuestionRecords(env)

  console.log(`[validate] records=${records.length}, badOptions=${records.filter(q => q.options.length !== 4).length}`)
  for (const record of records) {
    console.log(`Q${String(record.question_number).padStart(2, '0')} correct=${record.correct_option} options=${record.options.join(' | ')}`)
  }

  if (!APPLY) {
    console.log('[dry-run] Add --apply to write Supabase.')
    return
  }

  const examId = await getOrCreateExam(env)
  await replaceQuestions(env, examId, records)
  writeJson(PROGRESS_PATH, {
    reading_exam_id: examId,
    listening_exam_id: null,
    imported_reading_pages: Object.keys(QUESTIONS_BY_PAGE).map(Number),
    imported_listening_pages: [],
  })
  console.log(`[db] imported TOPIK ${EXAM_NO} reading exam_id=${examId}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
