import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter(line => line.includes('=') && !line.trim().startsWith('#'))
    .map(line => {
      const index = line.indexOf('=')
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
    })
)

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
const examId = '3ef491eb-1ed9-48cc-971d-0014f74634d0'

const fixes = new Map([
  [2, ['오곤 한다', '온 모양이다', '오는 편이다', '온 적이 있다']],
  [3, ['들리다가', '들리더라도', '들릴 정도로', '들릴 때까지']],
  [4, ['꾸밀 만하다', '꾸미기가 쉽다', '꾸밀 수도 있다', '꾸미기에 달려 있다']],
  [13, ['(나)-(가)-(다)-(라)', '(나)-(라)-(가)-(다)', '(다)-(가)-(라)-(나)', '(다)-(나)-(라)-(가)']],
  [14, ['(나)-(가)-(라)-(다)', '(나)-(다)-(가)-(라)', '(다)-(라)-(가)-(나)', '(다)-(나)-(라)-(가)']],
  [15, ['(가)-(다)-(나)-(라)', '(가)-(라)-(나)-(다)', '(라)-(다)-(나)-(가)', '(라)-(가)-(다)-(나)']],
  [16, ['소리 크기를 높여', '단독 형태로 분리해', '다양한 물건에 붙여', '특수한 영역을 제한해']],
  [17, ['두께를 자율적으로', '디자인을 신중하게', '이용 범위를 확실히', '발급 방식을 구체적으로']],
  [18, ['살던 텃새가 줄어든', '한국의 텃새가 사라진', '일본의 텃새가 관찰된', '부상당한 텃새가 보호된']],
  [42, ['후회스럽다', '의심스럽다', '실망스럽다', '짜증스럽다']],
])

const qNums = [...fixes.keys()]
const { data: rows, error } = await supabase
  .from('topik_exam_questions')
  .select('id,question_number,options,correct_option')
  .eq('exam_id', examId)
  .in('question_number', qNums)
  .order('question_number')

if (error) throw error

for (const row of rows) {
  const next = fixes.get(row.question_number)
  const changed = JSON.stringify(row.options) !== JSON.stringify(next)
  console.log(`Q${row.question_number}: ${changed ? 'UPDATE' : 'OK'} correct=${row.correct_option}`)

  if (changed) {
    console.log('  old:', row.options)
    console.log('  new:', next)
    const { error: updateError } = await supabase
      .from('topik_exam_questions')
      .update({ options: next })
      .eq('id', row.id)

    if (updateError) throw updateError
  }
}

const { data: verify, error: verifyError } = await supabase
  .from('topik_exam_questions')
  .select('question_number,options,correct_option')
  .eq('exam_id', examId)
  .in('question_number', qNums)
  .order('question_number')

if (verifyError) throw verifyError

console.log('VERIFY')
for (const row of verify) {
  console.log(`Q${row.question_number}: #${row.correct_option} = ${row.options[row.correct_option - 1]}`)
}
