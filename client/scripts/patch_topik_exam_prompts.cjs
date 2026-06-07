const fs = require('fs')
const path = require('path')

const args = Object.fromEntries(
  process.argv.slice(2).map(arg => {
    const [key, value = true] = arg.replace(/^--/, '').split('=')
    return [key, value]
  })
)

const examNo = String(args.exam || '').trim()
const section = String(args.section || 'all').trim()

if (!examNo) {
  console.error('Usage: node client/scripts/patch_topik_exam_prompts.cjs --exam=83 --section=all|reading|listening')
  process.exit(1)
}

if (!['all', 'reading', 'listening'].includes(section)) {
  console.error(`Invalid --section=${section}`)
  process.exit(1)
}

const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter(line => line && !line.trim().startsWith('#') && line.includes('='))
    .map(line => {
      const index = line.indexOf('=')
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
    })
)

const progressPath = path.join(__dirname, `ingestion_progress_${examNo}.json`)
const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'))

const headers = {
  apikey: env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

const readingPrompts = {
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

const listeningPrompts = {
  1: '다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오.',
  2: '다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오.',
  3: '다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오.',
  4: '다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.',
  5: '다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.',
  6: '다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.',
  7: '다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.',
  8: '다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오.',
  9: '다음을 듣고 여자가 이어서 할 행동으로 가장 알맞은 것을 고르십시오.',
  10: '다음을 듣고 여자가 이어서 할 행동으로 가장 알맞은 것을 고르십시오.',
  11: '다음을 듣고 여자가 이어서 할 행동으로 가장 알맞은 것을 고르십시오.',
  12: '다음을 듣고 여자가 이어서 할 행동으로 가장 알맞은 것을 고르십시오.',
  13: '다음을 듣고 들은 내용과 같은 것을 고르십시오.',
  14: '다음을 듣고 들은 내용과 같은 것을 고르십시오.',
  15: '다음을 듣고 들은 내용과 같은 것을 고르십시오.',
  16: '다음을 듣고 들은 내용과 같은 것을 고르십시오.',
  17: '다음을 듣고 남자의 중심 생각으로 가장 알맞은 것을 고르십시오.',
  18: '다음을 듣고 남자의 중심 생각으로 가장 알맞은 것을 고르십시오.',
  19: '다음을 듣고 남자의 중심 생각으로 가장 알맞은 것을 고르십시오.',
  20: '다음을 듣고 남자의 중심 생각으로 가장 알맞은 것을 고르십시오.',
  21: '남자의 중심 생각으로 가장 알맞은 것을 고르십시오.',
  22: '들은 내용과 같은 것을 고르십시오.',
  23: '남자가 무엇을 하고 있는지 고르십시오.',
  24: '들은 내용과 같은 것을 고르십시오.',
  25: '남자의 중심 생각으로 가장 알맞은 것을 고르십시오.',
  26: '들은 내용과 같은 것을 고르십시오.',
  27: '남자가 말하는 의도로 알맞은 것을 고르십시오.',
  28: '들은 내용과 같은 것을 고르십시오.',
  29: '남자가 누구인지 고르십시오.',
  30: '들은 내용과 같은 것을 고르십시오.',
  31: '남자의 중심 생각으로 가장 알맞은 것을 고르십시오.',
  32: '남자의 태도로 가장 알맞은 것을 고르십시오.',
  33: '무엇에 대한 내용인지 알맞은 것을 고르십시오.',
  34: '들은 내용과 같은 것을 고르십시오.',
  35: '남자가 무엇을 하고 있는지 고르십시오.',
  36: '들은 내용과 같은 것을 고르십시오.',
  37: '여자의 중심 생각으로 가장 알맞은 것을 고르십시오.',
  38: '들은 내용과 같은 것을 고르십시오.',
  39: '이 대화 전의 내용으로 가장 알맞은 것을 고르십시오.',
  40: '들은 내용과 같은 것을 고르십시오.',
  41: '이 강연의 중심 내용으로 가장 알맞은 것을 고르십시오.',
  42: '들은 내용과 같은 것을 고르십시오.',
  43: '무엇에 대한 내용인지 알맞은 것을 고르십시오.',
  // Q44 is intentionally skipped: it depends on the listening passage topic.
  45: '들은 내용과 같은 것을 고르십시오.',
  46: '여자가 말하는 방식으로 알맞은 것을 고르십시오.',
  47: '들은 내용과 같은 것을 고르십시오.',
  48: '남자의 태도로 알맞은 것을 고르십시오.',
  49: '들은 내용과 같은 것을 고르십시오.',
  50: '남자의 태도로 알맞은 것을 고르십시오.',
}

const readingRanges = [
  [1, 2, '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.'],
  [3, 4, '밑줄 친 부분과 의미가 가장 비슷한 것을 고르십시오.'],
  [5, 8, '다음은 무엇에 대한 글인지 고르십시오.'],
  [9, 12, '다음 글 또는 그래프의 내용과 같은 것을 고르십시오.'],
  [13, 15, '다음을 순서에 맞게 배열한 것을 고르십시오.'],
  [16, 18, '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.'],
  [19, 24, '다음을 읽고 물음에 답하십시오.'],
  [25, 27, '다음 신문 기사의 제목을 가장 잘 설명한 것을 고르십시오.'],
  [28, 31, '( )에 들어갈 말로 가장 알맞은 것을 고르십시오.'],
  [32, 34, '다음을 읽고 글의 내용과 같은 것을 고르십시오.'],
  [35, 38, '다음을 읽고 글의 주제로 가장 알맞은 것을 고르십시오.'],
  [39, 41, '주어진 문장이 들어갈 곳으로 가장 알맞은 것을 고르십시오.'],
  [42, 50, '다음을 읽고 물음에 답하십시오.'],
]

const listeningRanges = [
  [1, 3, '다음을 듣고 가장 알맞은 그림 또는 그래프를 고르십시오. (각 2점)'],
  [4, 8, '다음을 듣고 이어질 수 있는 말로 가장 알맞은 것을 고르십시오. (각 2점)'],
  [9, 12, '다음을 듣고 여자가 이어서 할 행동으로 가장 알맞은 것을 고르십시오. (각 2점)'],
  [13, 16, '다음을 듣고 들은 내용과 같은 것을 고르십시오. (각 2점)'],
  [17, 20, '다음을 듣고 남자의 중심 생각으로 가장 알맞은 것을 고르십시오. (각 2점)'],
  [21, 50, '다음을 듣고 물음에 답하십시오. (각 2점)'],
]

function getRangeInstruction(questionNumber, ranges) {
  const match = ranges.find(([start, end]) => questionNumber >= start && questionNumber <= end)
  return match ? match[2] : ''
}

async function patchQuestion(examId, questionNumber, payload, label) {
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/topik_exam_questions?exam_id=eq.${examId}&question_number=eq.${questionNumber}`
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`${label} Q${questionNumber}: ${response.status} ${await response.text()}`)
  }

  const rows = await response.json()
  console.log(`[OK] ${label} Q${questionNumber}: ${rows[0]?.question_text}`)
}

async function patchReading() {
  if (!progress.reading_exam_id) throw new Error(`Missing reading_exam_id in ${progressPath}`)

  for (const [questionNumber, text] of Object.entries(readingPrompts)) {
    const qNum = Number(questionNumber)
    await patchQuestion(progress.reading_exam_id, qNum, {
      instructions: getRangeInstruction(qNum, readingRanges),
      question_text: text,
    }, 'Reading')
  }
}

async function patchListening() {
  if (!progress.listening_exam_id) throw new Error(`Missing listening_exam_id in ${progressPath}`)

  for (const [questionNumber, text] of Object.entries(listeningPrompts)) {
    const qNum = Number(questionNumber)
    await patchQuestion(progress.listening_exam_id, qNum, {
      instructions: getRangeInstruction(qNum, listeningRanges),
      question_text: text,
    }, 'Listening')
  }

  await patchQuestion(progress.listening_exam_id, 44, {
    instructions: getRangeInstruction(44, listeningRanges),
  }, 'Listening')
  console.log('[SKIP] Listening Q44 question_text preserved from AI/OCR because it depends on passage topic.')
}

async function main() {
  if (section === 'all' || section === 'reading') await patchReading()
  if (section === 'all' || section === 'listening') await patchListening()
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
