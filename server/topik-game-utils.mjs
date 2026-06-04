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

export function canManageTopikRoomGame(member) {
  return Boolean(member)
}
