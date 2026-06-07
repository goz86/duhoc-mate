# TOPIK Answer Key Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đảm bảo toàn bộ đề TOPIK dùng đáp án đúng theo answer key chính thức, không để AI/explanation làm lệch `correct_option`.

**Architecture:** Tách answer key chính thức thành nguồn dữ liệu bất biến, audit toàn bộ DB theo từng đề, rồi regenerate explanation dựa trên đáp án đã khóa. UI chỉ hiển thị explanation nếu nó khớp với đáp án đúng hiện tại.

**Tech Stack:** Node scripts, Supabase REST, React/TypeScript, existing TOPIK CBT tables.

---

## Root Cause

Lỗi trong ảnh cho thấy câu Reading 91 Q1 có answer key chính thức là `④`, nhưng DB/UI đang đánh dấu `③` là đúng và explanation cũng giải thích theo `③`. Đây là lỗi nghiêm trọng vì dữ liệu đúng đã bị AI hoặc script sửa option ghi đè.

Nguyên tắc mới:

1. `correct_option` chỉ được lấy từ answer key chính thức.
2. Script sort option chỉ được đổi thứ tự options và tính lại vị trí của đáp án đúng bằng text của đáp án chính thức, không hỏi AI chọn đáp án.
3. AI chỉ được sinh `explanation` sau khi `correct_option` đã khóa.
4. Nếu explanation nhắc đến đáp án khác `correct_option`, UI không nên hiển thị explanation đó cho đến khi được regenerate.

## File Structure

- Create: `client/scripts/topik_official_answer_keys.cjs`
  - Lưu answer key chính thức cho từng kỳ đã import: 83, 91, 96.
  - Export `getOfficialAnswerKey(examNo, section)`.

- Create: `client/scripts/audit_topik_answer_integrity.cjs`
  - Đọc DB theo `ingestion_progress_XX.json`.
  - So sánh `correct_option` với answer key chính thức.
  - In report mismatches, optional `--apply` để patch.

- Create: `client/scripts/regenerate_topik_explanations.cjs`
  - Regenerate explanation bằng DeepSeek sau khi `correct_option` đã đúng.
  - Prompt bắt buộc nói rõ đáp án đúng là số nào và text nào.
  - Không cho AI đổi đáp án.

- Modify: `client/scripts/fix_options_91.py`
  - Loại bỏ hoặc vô hiệu hóa nhánh AI verification có quyền đổi `correct_option`.
  - Sau khi sort options, tính `correct_option` từ official answer text.

- Modify: `client/scripts/fix_scrambled_options.py`
  - Áp dụng cùng luật: không AI-select đáp án.

- Modify: `client/scripts/fix_listening_83_options.py`
  - Áp dụng cùng luật cho Listening.

- Modify: `client/src/components/TopikExam.tsx`
  - Ở result mode, nếu explanation có dấu hiệu mâu thuẫn với đáp án đúng, hiển thị cảnh báo thay vì explanation cũ.

- Modify: `.agents/skills/ingesting-topik-full-pdf/SKILL.md`
  - Ghi luật bắt buộc: answer key chính thức là nguồn chân lý; AI không bao giờ được đổi đáp án.

---

### Task 1: Add Official Answer Key Registry

**Files:**
- Create: `client/scripts/topik_official_answer_keys.cjs`

- [ ] **Step 1: Create answer key module**

Create `client/scripts/topik_official_answer_keys.cjs`:

```js
const ANSWER_KEYS = {
  91: {
    reading: {
      1: 4, 2: 4, 3: 1, 4: 4, 5: 2,
      6: 3, 7: 1, 8: 1, 9: 4, 10: 2,
      11: 3, 12: 2, 13: 2, 14: 3, 15: 2,
      16: 1, 17: 3, 18: 1, 19: 3, 20: 1,
      21: 3, 22: 4, 23: 1, 24: 4, 25: 1,
      26: 3, 27: 1, 28: 1, 29: 2, 30: 3,
      31: 3, 32: 4, 33: 2, 34: 2, 35: 4,
      36: 4, 37: 1, 38: 4, 39: 1, 40: 3,
      41: 3, 42: 2, 43: 1, 44: 3, 45: 4,
      46: 2, 47: 2, 48: 4, 49: 2, 50: 4,
    },
  },
}

function getOfficialAnswerKey(examNo, section) {
  const key = ANSWER_KEYS[String(examNo)] || ANSWER_KEYS[Number(examNo)]
  if (!key || !key[section]) {
    throw new Error(`Missing official answer key for TOPIK ${examNo} ${section}`)
  }
  return key[section]
}

module.exports = {
  ANSWER_KEYS,
  getOfficialAnswerKey,
}
```

- [ ] **Step 2: Run syntax check**

Run:

```powershell
node --check client\scripts\topik_official_answer_keys.cjs
```

Expected: no output and exit code `0`.

- [ ] **Step 3: Add 83 and 96 keys**

Add `83.reading`, `83.listening`, `96.reading`, `96.listening` from the official PDFs already used during import. If a key is not available yet, do not invent it. Leave only verified keys and make the audit fail loudly for missing keys.

---

### Task 2: Build Answer Integrity Audit Script

**Files:**
- Create: `client/scripts/audit_topik_answer_integrity.cjs`

- [ ] **Step 1: Create audit script**

Create `client/scripts/audit_topik_answer_integrity.cjs`:

```js
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
const section = String(args.section || 'reading').trim()
const apply = Boolean(args.apply)

if (!examNo || !['reading', 'listening'].includes(section)) {
  console.error('Usage: node client/scripts/audit_topik_answer_integrity.cjs --exam=91 --section=reading [--apply]')
  process.exit(1)
}

const clientDir = path.join(__dirname, '..')
const envText = fs.readFileSync(path.join(clientDir, '.env'), 'utf8')
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter(line => line && !line.trim().startsWith('#') && line.includes('='))
    .map(line => {
      const index = line.indexOf('=')
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
    })
)

const progress = JSON.parse(
  fs.readFileSync(path.join(__dirname, `ingestion_progress_${examNo}.json`), 'utf8')
)

const examId = progress[`${section}_exam_id`]
if (!examId) throw new Error(`Missing ${section}_exam_id for exam ${examNo}`)

const official = getOfficialAnswerKey(examNo, section)

const headers = {
  apikey: env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function fetchQuestions() {
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/topik_exam_questions?exam_id=eq.${examId}&select=id,question_number,options,correct_option,explanation&order=question_number.asc`
  const response = await fetch(url, { headers })
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

async function patchQuestion(row, correctOption) {
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/topik_exam_questions?id=eq.${row.id}`
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      correct_option: correctOption,
      explanation: null,
    }),
  })
  if (!response.ok) throw new Error(await response.text())
}

async function main() {
  const rows = await fetchQuestions()
  const mismatches = []

  for (const row of rows) {
    const expected = official[row.question_number]
    if (!expected) {
      mismatches.push({ q: row.question_number, reason: 'missing official key' })
      continue
    }

    if (row.correct_option !== expected) {
      mismatches.push({
        q: row.question_number,
        db: row.correct_option,
        official: expected,
        dbText: row.options?.[row.correct_option - 1],
        officialText: row.options?.[expected - 1],
      })

      if (apply) {
        await patchQuestion(row, expected)
      }
    }
  }

  console.log(JSON.stringify({
    examNo,
    section,
    apply,
    checked: rows.length,
    mismatchCount: mismatches.length,
    mismatches,
  }, null, 2))

  if (mismatches.length > 0 && !apply) process.exitCode = 2
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
```

- [ ] **Step 2: Run dry audit for TOPIK 91 Reading**

Run:

```powershell
node client\scripts\audit_topik_answer_integrity.cjs --exam=91 --section=reading
```

Expected: Q1 appears with `db: 3`, `official: 4`.

- [ ] **Step 3: Apply official key corrections**

Run:

```powershell
node client\scripts\audit_topik_answer_integrity.cjs --exam=91 --section=reading --apply
```

Expected: mismatched rows are patched to official `correct_option`; `explanation` is set to `null` for patched rows.

- [ ] **Step 4: Re-run audit**

Run:

```powershell
node client\scripts\audit_topik_answer_integrity.cjs --exam=91 --section=reading
```

Expected:

```json
{
  "mismatchCount": 0
}
```

---

### Task 3: Regenerate Explanations From Locked Correct Answers

**Files:**
- Create: `client/scripts/regenerate_topik_explanations.cjs`

- [ ] **Step 1: Create regenerate script**

Create `client/scripts/regenerate_topik_explanations.cjs`:

```js
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
const section = String(args.section || 'reading').trim()
const targetQ = args.q ? Number(args.q) : null
const apply = Boolean(args.apply)

if (!examNo || !['reading', 'listening'].includes(section)) {
  console.error('Usage: node client/scripts/regenerate_topik_explanations.cjs --exam=91 --section=reading [--q=1] [--apply]')
  process.exit(1)
}

const clientDir = path.join(__dirname, '..')
const envText = fs.readFileSync(path.join(clientDir, '.env'), 'utf8')
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter(line => line && !line.trim().startsWith('#') && line.includes('='))
    .map(line => {
      const index = line.indexOf('=')
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
    })
)

const progress = JSON.parse(
  fs.readFileSync(path.join(__dirname, `ingestion_progress_${examNo}.json`), 'utf8')
)
const examId = progress[`${section}_exam_id`]
const official = getOfficialAnswerKey(examNo, section)

const headers = {
  apikey: env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function fetchQuestions() {
  const qFilter = targetQ ? `&question_number=eq.${targetQ}` : ''
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/topik_exam_questions?exam_id=eq.${examId}${qFilter}&select=id,question_number,instructions,question_text,passage,options,correct_option&order=question_number.asc`
  const response = await fetch(url, { headers })
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

async function explain(row) {
  const officialCorrect = official[row.question_number]
  if (row.correct_option !== officialCorrect) {
    throw new Error(`Q${row.question_number} correct_option=${row.correct_option} but official=${officialCorrect}`)
  }

  const correctText = row.options[row.correct_option - 1]
  const prompt = [
    'Bạn là giáo viên TOPIK II.',
    'Chỉ giải thích vì sao đáp án chính thức dưới đây đúng.',
    'Không được đổi đáp án, không được nói đáp án khác đúng hơn.',
    '',
    `Câu số: ${row.question_number}`,
    `Yêu cầu: ${row.instructions || row.question_text}`,
    `Câu hỏi: ${row.question_text}`,
    `Đoạn văn/audio text nếu có: ${row.passage || ''}`,
    `Các lựa chọn:`,
    ...row.options.map((opt, idx) => `${idx + 1}. ${opt}`),
    `Đáp án chính thức: ${row.correct_option}. ${correctText}`,
    '',
    'Viết giải thích ngắn bằng tiếng Việt, bắt đầu bằng: "Đáp án đúng là ...".',
  ].join('\n')

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.VITE_DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    }),
  })

  if (!response.ok) throw new Error(await response.text())
  const json = await response.json()
  return json.choices[0].message.content.trim()
}

async function patchExplanation(row, explanation) {
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/topik_exam_questions?id=eq.${row.id}`
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ explanation }),
  })
  if (!response.ok) throw new Error(await response.text())
}

async function main() {
  const rows = await fetchQuestions()
  for (const row of rows) {
    const explanation = await explain(row)
    console.log(`Q${row.question_number}: ${explanation}`)
    if (apply) await patchExplanation(row, explanation)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
```

- [ ] **Step 2: Regenerate Q1 explanation**

Run:

```powershell
node client\scripts\regenerate_topik_explanations.cjs --exam=91 --section=reading --q=1 --apply
```

Expected: explanation mentions `④ 등산한 적이 있다`, not `③ 등산할 것 같다`.

---

### Task 4: Remove AI Authority Over Correct Answers

**Files:**
- Modify: `client/scripts/fix_options_91.py`
- Modify: `client/scripts/fix_scrambled_options.py`
- Modify: `client/scripts/fix_listening_83_options.py`

- [ ] **Step 1: Search for AI correct answer mutation**

Run:

```powershell
rg -n "ai_verify_correct_option|correct_index|correct_option.*AI|AI verification" client\scripts
```

Expected: find all places where AI can set or verify `correct_option`.

- [ ] **Step 2: Change behavior**

For each script:

```python
# Old forbidden behavior:
ai_ver = ai_verify_correct_option(...)
correct_index = int(ai_ver.get("correct_index", current_correct))

# New required behavior:
official_correct_index = official_answer_key[q_num]
correct_index = official_correct_index
```

If the script reorders `options`, compute:

```python
official_correct_text = current_options[official_answer_key[q_num] - 1]
correct_index = sorted_options.index(official_correct_text) + 1
```

If `official_correct_text` is not found exactly, stop and report the question for manual patch. Do not ask AI.

- [ ] **Step 3: Add hard failure**

When official key is missing:

```python
raise RuntimeError(f"Missing official answer key for Q{q_num}; refusing to patch correct_option")
```

Expected: scripts cannot silently choose answers.

---

### Task 5: UI Guard For Stale Explanations

**Files:**
- Modify: `client/src/components/TopikExam.tsx`

- [ ] **Step 1: Add explanation sanity helper**

Add near `getQuestionInstruction`:

```ts
function explanationMentionsWrongOption(explanation: string | null | undefined, correctOption: number) {
  if (!explanation) return false
  const wrongMarkers = ['①', '②', '③', '④'].filter((_, idx) => idx + 1 !== correctOption)
  return wrongMarkers.some(marker => explanation.includes(marker))
}
```

- [ ] **Step 2: Hide suspect explanation**

Replace explanation render condition:

```tsx
{isFinished && questions[activeQuestionIdx].explanation && (
```

with:

```tsx
{isFinished
  && questions[activeQuestionIdx].explanation
  && !explanationMentionsWrongOption(
    questions[activeQuestionIdx].explanation,
    questions[activeQuestionIdx].correct_option
  )
  && (
```

- [ ] **Step 3: Show warning when hidden**

Add a warning block:

```tsx
{isFinished
  && questions[activeQuestionIdx].explanation
  && explanationMentionsWrongOption(
    questions[activeQuestionIdx].explanation,
    questions[activeQuestionIdx].correct_option
  )
  && (
    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold">
      Giải thích cũ có dấu hiệu lệch với đáp án chính thức, nên hệ thống đã ẩn phần này. Vui lòng regenerate explanation.
    </div>
  )}
```

Expected: stale explanation cannot mislead learners while DB is being repaired.

---

### Task 6: Update Skill Rules

**Files:**
- Modify: `.agents/skills/ingesting-topik-full-pdf/SKILL.md`

- [ ] **Step 1: Add answer integrity rules**

Add to Critical Rules:

```markdown
* > [!IMPORTANT]
  > **Official answer key is the only source of truth:** `correct_option` must come from the official TOPIK answer key. AI must never choose, verify, or override the correct answer.
* > [!IMPORTANT]
  > **Explanation is downstream:** Generate explanation only after `correct_option` has been audited against the official key. If `correct_option` changes, clear or regenerate `explanation`.
* > [!IMPORTANT]
  > **Run answer audit after every import/options repair:** `node client\scripts\audit_topik_answer_integrity.cjs --exam=XX --section=reading` and the same for listening when the official key is available.
```

---

### Task 7: Verification

**Files:**
- Test only.

- [ ] **Step 1: Verify TOPIK 91 Reading Q1**

Run audit:

```powershell
node client\scripts\audit_topik_answer_integrity.cjs --exam=91 --section=reading
```

Expected:

```json
"mismatchCount": 0
```

- [ ] **Step 2: Query Q1**

Run a one-off Supabase query or existing query script to confirm:

```text
Q1 correct_option = 4
Q1 options[3] = 등산한 적이 있다
Q1 explanation mentions ④ or "등산한 적이 있다"
Q1 explanation does not say ③ is correct
```

- [ ] **Step 3: Typecheck UI**

Run:

```powershell
npx.cmd tsc -b
```

Expected: exit code `0`.

- [ ] **Step 4: Manual UI check**

Open TOPIK 91 Reading Q1 result mode.

Expected:

```text
④ 등산한 적이 있다 is green/correct.
③ 등산할 것 같다 is red/wrong if selected.
Explanation supports ④, not ③.
```

---

## Execution Notes

- Do not commit unless the user explicitly asks.
- If any official answer key is missing, stop and ask for that key/PDF. Do not fill from AI.
- Existing wrong explanations should be treated as contaminated data and cleared/regenerated.

