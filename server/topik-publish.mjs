timport { createHash } from 'node:crypto'

const GAME_TYPES = new Set(['grammar-race', 'topik-master', 'sentence-build', 'vocab-speed'])
const CATEGORIES = new Set(['grammar', 'vocabulary', 'reading', 'sentence'])
const ERROR_TYPES = new Set(['vocabulary', 'grammar_connector', 'honorific', 'reading', 'similar_meaning'])

export class TopikPublishError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'TopikPublishError'
    this.status = status
  }
}

function normalizeText(value) {
  return String(value || '').trim()
}

function duplicateKey(value) {
  return normalizeText(value).replace(/\s+/g, '').toLowerCase()
}

function stablePatternId(formula) {
  const digest = createHash('sha256').update(duplicateKey(formula)).digest('hex').slice(0, 20)
  return `ai-grammar-${digest}`
}

function validateBundle(bundle, level) {
  const errors = []
  const pattern = bundle?.pattern || {}
  const questions = Array.isArray(bundle?.questions) ? bundle.questions : []
  const practiceCount = questions.filter(question => question?.usage === 'practice').length
  const gameCount = questions.filter(question => question?.usage === 'game').length

  if (!Number.isInteger(level) || level < 1 || level > 6) errors.push('Cap TOPIK khong hop le.')
  if (!normalizeText(pattern.title) || !normalizeText(pattern.formula) || !normalizeText(pattern.meaning_vi)) {
    errors.push('Thieu ten, cong thuc hoac nghia tieng Viet.')
  }
  if (
    normalizeText(pattern.title).length > 160
    || normalizeText(pattern.formula).length > 240
    || normalizeText(pattern.meaning_vi).length > 2_000
    || normalizeText(pattern.meaning_en).length > 2_000
  ) {
    errors.push('Noi dung mau ngu phap vuot qua gioi han cho phep.')
  }
  if (!Array.isArray(pattern.examples) || pattern.examples.filter(item => normalizeText(item?.ko) && normalizeText(item?.vi)).length < 3) {
    errors.push('Can it nhat 3 vi du Han - Viet.')
  }
  if (practiceCount !== 10 || gameCount !== 5 || questions.length !== 15) {
    errors.push('Bo ngu phap phai co dung 10 cau luyen tap va 5 cau game.')
  }

  questions.forEach((question, index) => {
    const options = Array.isArray(question?.options) ? question.options.map(normalizeText) : []
    const answerIndex = Number(question?.answer_index)
    if (!normalizeText(question?.prompt) || !normalizeText(question?.explanation)) {
      errors.push(`Cau ${index + 1} thieu de hoac giai thich.`)
    }
    if (normalizeText(question?.prompt).length > 2_000 || normalizeText(question?.explanation).length > 3_000) {
      errors.push(`Cau ${index + 1} vuot qua gioi han noi dung.`)
    }
    if (options.length !== 4 || options.some(option => !option || option.length > 500) || new Set(options).size !== 4) {
      errors.push(`Cau ${index + 1} phai co 4 lua chon khac nhau.`)
    }
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
      errors.push(`Cau ${index + 1} co dap an khong hop le.`)
    }
    if (question?.usage === 'game' && (!Array.isArray(question?.game_types) || !question.game_types.some(type => GAME_TYPES.has(type)))) {
      errors.push(`Cau game ${index + 1} thieu loai game.`)
    }
  })

  return { valid: errors.length === 0, errors: [...new Set(errors)], practiceCount, gameCount }
}

function headers(key, prefer = '') {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  }
}

async function readResponseError(response) {
  const text = await response.text()
  try {
    return JSON.parse(text)?.message || text
  } catch {
    return text
  }
}

export async function publishTopikGrammarBundle({ bundle, level, supabaseUrl, serviceRoleKey, supabaseKey }) {
  const publishKey = serviceRoleKey || supabaseKey
  if (!supabaseUrl || !publishKey) {
    throw new TopikPublishError('Server chua cau hinh Supabase publish key.', 503)
  }

  const validation = validateBundle(bundle, level)
  if (!validation.valid) throw new TopikPublishError(validation.errors.slice(0, 5).join(' '))

  const baseUrl = supabaseUrl.replace(/\/$/, '')
  const existingResponse = await fetch(
    `${baseUrl}/rest/v1/topik_grammar_patterns?select=id,title,formula&limit=5000`,
    { headers: headers(publishKey) }
  )
  if (!existingResponse.ok) {
    throw new TopikPublishError(`Khong the kiem tra kho ngu phap: ${await readResponseError(existingResponse)}`, 502)
  }

  const existing = await existingResponse.json()
  const titleKey = duplicateKey(bundle.pattern.title)
  const formulaKey = duplicateKey(bundle.pattern.formula)
  const duplicate = (Array.isArray(existing) ? existing : []).find(row =>
    duplicateKey(row.title) === titleKey || duplicateKey(row.formula) === formulaKey
  )
  if (duplicate) throw new TopikPublishError(`Mau ngu phap da ton tai trong kho: ${duplicate.title}.`, 409)

  const patternId = stablePatternId(bundle.pattern.formula)
  const pattern = bundle.pattern
  const grammarRow = {
    id: patternId,
    level,
    title: normalizeText(pattern.title),
    formula: normalizeText(pattern.formula),
    meaning_vi: normalizeText(pattern.meaning_vi),
    meaning_en: normalizeText(pattern.meaning_en),
    examples: pattern.examples,
    common_mistake: normalizeText(pattern.common_mistake),
    grammar_type: normalizeText(pattern.grammar_type) || 'general',
    tags: Array.isArray(pattern.tags) ? pattern.tags.map(normalizeText).filter(Boolean) : [],
    similar_patterns: Array.isArray(pattern.similar_patterns) ? pattern.similar_patterns.map(normalizeText).filter(Boolean) : [],
    contrast_notes: normalizeText(pattern.contrast_notes),
    prerequisites: Array.isArray(pattern.prerequisites) ? pattern.prerequisites.map(normalizeText).filter(Boolean) : [],
    ai_model: 'deepseek-chat',
    ai_prompt_version: 'grammar-v2-direct-publish',
    source: 'ai-direct',
    status: 'published',
    quality_score: 7,
  }
  const questionRows = bundle.questions.map((question, index) => ({
    id: `${patternId}-q${String(index + 1).padStart(2, '0')}`,
    level,
    category: CATEGORIES.has(question.category) ? question.category : 'grammar',
    game_types: question.usage === 'game'
      ? question.game_types.filter(type => GAME_TYPES.has(type))
      : [],
    error_type: ERROR_TYPES.has(question.error_type) ? question.error_type : 'grammar_connector',
    pattern_id: patternId,
    prompt: normalizeText(question.prompt),
    options: question.options.map(normalizeText),
    answer_index: Number(question.answer_index),
    explanation: normalizeText(question.explanation),
    difficulty: Math.max(1, Math.min(5, Number(question.difficulty) || 3)),
    source: 'ai-direct',
    status: 'published',
    quality_score: 7,
  }))

  const grammarResponse = await fetch(`${baseUrl}/rest/v1/topik_grammar_patterns`, {
    method: 'POST',
    headers: headers(publishKey, 'return=representation'),
    body: JSON.stringify(grammarRow),
  })
  if (!grammarResponse.ok) {
    const errorMessage = await readResponseError(grammarResponse)
    const status = grammarResponse.status === 409 ? 409 : 502
    const message = status === 409 ? 'Mau ngu phap da ton tai trong kho.' : `Khong the luu mau ngu phap: ${errorMessage}`
    throw new TopikPublishError(message, status)
  }

  const questionsResponse = await fetch(`${baseUrl}/rest/v1/topik_question_bank`, {
    method: 'POST',
    headers: headers(publishKey, 'return=minimal'),
    body: JSON.stringify(questionRows),
  })
  if (!questionsResponse.ok) {
    await fetch(`${baseUrl}/rest/v1/topik_grammar_patterns?id=eq.${encodeURIComponent(patternId)}`, {
      method: 'DELETE',
      headers: headers(publishKey),
    })
    throw new TopikPublishError(`Khong the luu cau hoi: ${await readResponseError(questionsResponse)}`, 502)
  }

  return {
    id: patternId,
    title: grammarRow.title,
    level,
    practiceCount: validation.practiceCount,
    gameCount: validation.gameCount,
  }
}
