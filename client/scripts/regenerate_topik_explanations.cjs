const fs = require('fs')
const path = require('path')
const { getOfficialAnswerKey } = require('./topik_official_answer_keys.cjs')

const args = Object.fromEntries(
  process.argv.slice(2).map(arg => {
    const [key, value = true] = arg.replace(/^--/, '').split('=')
    return [key, value]
  })
)

const examNo = String(args.exam || '').trim()
const section = String(args.section || '').trim()
const apply = Boolean(args.apply)
const qFilter = args.q
  ? new Set(
      String(args.q)
        .split(',')
        .map(value => Number(value.trim()))
        .filter(Boolean)
    )
  : null

if (!examNo || !['reading', 'listening'].includes(section)) {
  console.error('Usage: node client/scripts/regenerate_topik_explanations.cjs --exam=91 --section=reading|listening [--q=1,2] [--apply]')
  process.exit(1)
}

function readEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  const text = fs.readFileSync(envPath, 'utf8')
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter(line => line && !line.trim().startsWith('#') && line.includes('='))
      .map(line => {
        const index = line.indexOf('=')
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
      })
  )
}

function readProgress() {
  const progressPath = path.join(__dirname, `ingestion_progress_${examNo}.json`)
  return JSON.parse(fs.readFileSync(progressPath, 'utf8'))
}

function examIdFor(progress, part) {
  return progress[`${part}_exam_id`] || progress[part]?.exam_id || progress[part]?.id
}

async function fetchQuestions(env, examId) {
  const url = new URL(`${env.VITE_SUPABASE_URL}/rest/v1/topik_exam_questions`)
  url.searchParams.set('exam_id', `eq.${examId}`)
  url.searchParams.set('select', 'id,question_number,question_text,instructions,passage,options,correct_option,explanation')
  url.searchParams.set('order', 'question_number.asc')
  const res = await fetch(url, {
    headers: {
      apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`Fetch questions failed ${res.status}: ${await res.text()}`)
  return res.json()
}

function parseDeepSeekJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : text
  const first = body.indexOf('{')
  const last = body.lastIndexOf('}')
  if (first < 0 || last < first) throw new Error(`No JSON object in response: ${text.slice(0, 200)}`)
  return JSON.parse(body.slice(first, last + 1))
}

async function generateExplanation(env, q, officialAnswer) {
  const correctText = q.options?.[officialAnswer - 1] || ''
  const optionsText = (q.options || [])
    .map((option, index) => `${index + 1}. ${option}`)
    .join('\n')
  const prompt = [
    'Ban dang viet giai thich dap an cho de thi TOPIK.',
    'QUY TAC BAT BUOC:',
    `- Dap an dung chinh thuc la so ${officialAnswer}: "${correctText}".`,
    '- Khong duoc doi dap an, khong duoc de xuat dap an khac.',
    '- Chi giai thich bang tieng Viet vi sao dap an chinh thuc dung va vi sao cac lua chon khac khong phu hop.',
    '- Tra ve JSON duy nhat: {"explanation":"..."}',
    '',
    `So cau: ${q.question_number}`,
    `Huong dan: ${q.instructions || ''}`,
    `Cau hoi: ${q.question_text || ''}`,
    `Noi dung/ngu canh: ${q.passage || ''}`,
    `Lua chon:\n${optionsText}`,
  ].join('\n')

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.VITE_DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You write concise Vietnamese explanations for Korean TOPIK exam answers. Never override the official answer key.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 700,
    }),
  })

  if (!res.ok) throw new Error(`DeepSeek failed ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''
  const parsed = parseDeepSeekJson(content)
  return String(parsed.explanation || '').trim()
}

async function patchExplanation(env, id, explanation) {
  const url = new URL(`${env.VITE_SUPABASE_URL}/rest/v1/topik_exam_questions`)
  url.searchParams.set('id', `eq.${id}`)
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ explanation }),
  })
  if (!res.ok) throw new Error(`Patch explanation ${id} failed ${res.status}: ${await res.text()}`)
}

async function main() {
  const env = readEnv()
  const officialKey = getOfficialAnswerKey(examNo, section)
  if (!officialKey) throw new Error(`No official answer key for exam ${examNo} ${section}`)
  const progress = readProgress()
  const examId = examIdFor(progress, section)
  if (!examId) throw new Error(`Missing ${section}_exam_id in ingestion_progress_${examNo}.json`)

  const questions = (await fetchQuestions(env, examId)).filter(q => !qFilter || qFilter.has(q.question_number))
  console.log(`[${section}] exam_id=${examId}; regenerating ${questions.length} explanation(s)${apply ? '' : ' (dry-run)'}`)

  for (const q of questions) {
    const officialAnswer = officialKey[q.question_number]
    if (!officialAnswer) continue
    if (Number(q.correct_option) !== Number(officialAnswer)) {
      console.log(`Q${q.question_number}: skip, DB correct_option=${q.correct_option} but official=${officialAnswer}. Run audit --apply first.`)
      continue
    }

    const explanation = await generateExplanation(env, q, officialAnswer)
    console.log(`\nQ${q.question_number} official=${officialAnswer}`)
    console.log(explanation)

    if (apply) {
      await patchExplanation(env, q.id, explanation)
      console.log(`[PATCHED] Q${q.question_number}`)
    }
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
