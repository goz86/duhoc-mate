export function shuffleTopikQuestions(items, random = Math.random) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }
  return shuffled
}

export function buildTopikQuestionOrder(pool, requestedRounds, random = Math.random) {
  const questions = Array.isArray(pool) ? pool.filter(question => question?.id) : []
  if (!questions.length) return []
  const roundCount = Math.max(1, Math.min(Number(requestedRounds) || 1, 10, questions.length))
  return shuffleTopikQuestions(questions, random).slice(0, roundCount).map(question => question.id)
}

export function shuffleTopikQuestionOptions(question, random = Math.random) {
  if (!question || !Array.isArray(question.options)) return question

  const answerIndex = Number(question.answerIndex)
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= question.options.length) {
    return { ...question, options: [...question.options] }
  }

  const options = question.options.map((option, index) => ({ option, index }))
  const shuffled = shuffleTopikQuestions(options, random)

  return {
    ...question,
    options: shuffled.map(item => item.option),
    answerIndex: shuffled.findIndex(item => item.index === answerIndex),
  }
}

export function canManageTopikRoomGame(member) {
  return Boolean(member)
}
