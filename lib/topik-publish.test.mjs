import test from 'node:test'
import assert from 'node:assert/strict'
import { publishTopikGrammarBundle } from '../server/topik-publish.mjs'

const validBundle = {
  pattern: {
    title: '-테스트 동안',
    formula: 'V-는 동안',
    meaning_vi: 'Trong khi làm gì đó.',
    meaning_en: 'While doing something.',
    examples: [
      { ko: '공부하는 동안 음악을 들어요.', vi: 'Trong khi học tôi nghe nhạc.' },
      { ko: '기다리는 동안 책을 읽었어요.', vi: 'Trong khi chờ tôi đọc sách.' },
      { ko: '먹는 동안 말하지 마세요.', vi: 'Đừng nói trong khi ăn.' },
    ],
    common_mistake: 'Không dùng sai với danh từ nếu chưa thêm 동안.',
    grammar_type: 'general',
  },
  questions: Array.from({ length: 15 }, (_, index) => ({
    usage: index < 10 ? 'practice' : 'game',
    category: 'grammar',
    game_types: index < 10 ? [] : ['grammar-race'],
    error_type: 'grammar_connector',
    prompt: `문제 ${index + 1}: 알맞은 표현을 고르세요.`,
    options: ['V-는 동안', 'V-기 전에', 'V-(으)면', 'V-도록'],
    answer_index: 0,
    explanation: 'V-는 동안은 어떤 행동이 계속되는 시간을 나타냅니다.',
    difficulty: 2,
  })),
}

test('publishes with the configured Supabase publish key when service role is absent', async () => {
  const calls = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    if (String(url).includes('topik_grammar_patterns?select=')) {
      return Response.json([])
    }
    if (String(url).includes('topik_grammar_patterns')) {
      return Response.json([{ id: 'ai-grammar-test' }], { status: 201 })
    }
    if (String(url).includes('topik_question_bank')) {
      return new Response(null, { status: 201 })
    }
    return new Response('unexpected url', { status: 500 })
  }

  try {
    const result = await publishTopikGrammarBundle({
      bundle: validBundle,
      level: 1,
      supabaseUrl: 'https://example.supabase.co',
      supabaseKey: 'anon-test-key',
    })

    assert.equal(result.level, 1)
    assert.equal(calls.length, 3)
    assert.equal(calls[0].options.headers.Authorization, 'Bearer anon-test-key')
  } finally {
    globalThis.fetch = originalFetch
  }
})
