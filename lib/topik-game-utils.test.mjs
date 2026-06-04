import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildTopikQuestionOrder,
  canManageTopikRoomGame,
  shuffleTopikQuestionOptions,
} from '../server/topik-game-utils.mjs'

const questions = [
  { id: 'q1' },
  { id: 'q2' },
  { id: 'q3' },
  { id: 'q4' },
  { id: 'q5' },
]

test('buildTopikQuestionOrder shuffles each game start from the available pool', () => {
  const first = buildTopikQuestionOrder(questions, 3, () => 0.1)
  const second = buildTopikQuestionOrder(questions, 3, () => 0.9)

  assert.deepEqual(first, ['q2', 'q3', 'q4'])
  assert.deepEqual(second, ['q1', 'q2', 'q3'])
  assert.notDeepEqual(first, second)
})

test('buildTopikQuestionOrder clamps total rounds to available questions and ten rounds', () => {
  assert.deepEqual(buildTopikQuestionOrder(questions, 99, () => 0.5), ['q1', 'q4', 'q2', 'q5', 'q3'])
  assert.equal(buildTopikQuestionOrder(questions, 0, () => 0.5).length, 1)
})

test('canManageTopikRoomGame allows any active room member to drive shared room games', () => {
  assert.equal(canManageTopikRoomGame({ id: 'member-1' }), true)
  assert.equal(canManageTopikRoomGame(null), false)
})

test('shuffleTopikQuestionOptions randomizes answers while keeping the correct index aligned', () => {
  const question = {
    id: 'q-answer-order',
    prompt: 'Pick the correct answer',
    options: ['correct', 'wrong one', 'wrong two', 'wrong three'],
    answerIndex: 0,
  }

  const shuffled = shuffleTopikQuestionOptions(question, () => 0.1)

  assert.notDeepEqual(shuffled.options, question.options)
  assert.equal(shuffled.options[shuffled.answerIndex], 'correct')
  assert.deepEqual(question.options, ['correct', 'wrong one', 'wrong two', 'wrong three'])
})
