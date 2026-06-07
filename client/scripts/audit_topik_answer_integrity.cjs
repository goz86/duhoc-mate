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
const section = String(args.section || 'all').trim()
const apply = Boolean(args.apply)

if (!examNo) {
  console.error('Usage: node client/scripts/audit_topik_answer_integrity.cjs --exam=91 --section=reading|listening|all [--apply]')
  process.exit(1)
}

if (!['all', 'reading', 'listening'].includes(section)) {
  console.error(`Invalid --section=${section}`)
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
  url.searchParams.set('select', 'id,question_number,options,correct_option,explanation')
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

async function patchQuestion(env, id, officialAnswer) {
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
    body: JSON.stringify({
      correct_option: officialAnswer,
      explanation: null,
    }),
  })
  if (!res.ok) throw new Error(`Patch question ${id} failed ${res.status}: ${await res.text()}`)
}

async function auditSection(env, progress, part) {
  const key = getOfficialAnswerKey(examNo, part)
  if (!key) throw new Error(`No official answer key for exam ${examNo} ${part}`)

  const examId = examIdFor(progress, part)
  if (!examId) throw new Error(`Missing ${part}_exam_id in ingestion_progress_${examNo}.json`)

  const questions = await fetchQuestions(env, examId)
  const mismatches = []

  for (const q of questions) {
    const official = key[q.question_number]
    if (!official) continue
    if (Number(q.correct_option) !== Number(official)) {
      mismatches.push({
        id: q.id,
        question_number: q.question_number,
        db_correct: q.correct_option,
        official_correct: official,
        db_option_text: q.options?.[Number(q.correct_option) - 1],
        official_option_text: q.options?.[Number(official) - 1],
      })
    }
  }

  console.log(`\n[${part}] exam_id=${examId}`)
  console.log(`Checked ${questions.length} questions. Mismatches: ${mismatches.length}`)
  for (const mismatch of mismatches) {
    console.log(
      `  Q${mismatch.question_number}: DB ${mismatch.db_correct} (${mismatch.db_option_text || 'n/a'}) -> official ${mismatch.official_correct} (${mismatch.official_option_text || 'n/a'})`
    )
  }

  if (apply) {
    for (const mismatch of mismatches) {
      await patchQuestion(env, mismatch.id, mismatch.official_correct)
      console.log(`  [PATCHED] Q${mismatch.question_number}`)
    }
  }

  return mismatches.length
}

async function main() {
  const env = readEnv()
  const progress = readProgress()
  const sections = section === 'all' ? ['reading', 'listening'] : [section]
  let total = 0
  for (const part of sections) {
    total += await auditSection(env, progress, part)
  }
  console.log(`\nTotal mismatches: ${total}${apply ? ' (patched)' : ' (dry-run)'}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
