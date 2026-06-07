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
const qFilter = args.q
  ? new Set(String(args.q).split(',').map(value => Number(value.trim())).filter(Boolean))
  : null
const apply = Boolean(args.apply)

if (!examNo || !['reading', 'listening'].includes(section)) {
  console.error('Usage: node client/scripts/patch_topik_safe_explanations.cjs --exam=91 --section=reading|listening [--q=1,2] [--apply]')
  process.exit(1)
}

const manualExplanations = {
  '91:reading:1':
    'Dap an dung la 4: "등산한 적이 있다". Cum "오래전에" nghia la "tu lau truoc day", nen cau can dien mau V-(으)ㄴ 적이 있다 de dien ta trai nghiem da tung lam viec gi trong qua khu: "Toi da tung leo nui Seoraksan tu lau truoc day." Cac dap an 1, 2, 3 lan luot dien ta mong muon, su cho phep va suy doan, khong hop voi ngu canh trai nghiem qua khu.',
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
  url.searchParams.set('select', 'id,question_number,options,correct_option')
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

function safeExplanation(q, officialAnswer) {
  const manual = manualExplanations[`${examNo}:${section}:${q.question_number}`]
  if (manual) return manual
  const correctText = q.options?.[officialAnswer - 1] || ''
  return `Dap an dung theo answer key chinh thuc TOPIK la ${officialAnswer}: "${correctText}". Cau nay da duoc khoa lai theo dap an goc de tranh lech ket qua; phan giai thich chi tiet se duoc bo sung sau.`
}

async function main() {
  const env = readEnv()
  const officialKey = getOfficialAnswerKey(examNo, section)
  if (!officialKey) throw new Error(`No official answer key for exam ${examNo} ${section}`)
  const progress = readProgress()
  const examId = examIdFor(progress, section)
  if (!examId) throw new Error(`Missing ${section}_exam_id in ingestion_progress_${examNo}.json`)

  const questions = (await fetchQuestions(env, examId)).filter(q => !qFilter || qFilter.has(q.question_number))
  console.log(`[${section}] exam_id=${examId}; patching ${questions.length} safe explanation(s)${apply ? '' : ' (dry-run)'}`)
  for (const q of questions) {
    const officialAnswer = officialKey[q.question_number]
    if (!officialAnswer || Number(q.correct_option) !== Number(officialAnswer)) continue
    const explanation = safeExplanation(q, officialAnswer)
    console.log(`Q${q.question_number}: ${explanation}`)
    if (apply) await patchExplanation(env, q.id, explanation)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
