import { afterEach, describe, expect, it, vi } from 'vitest'
import { publishGrammarBundleDirect } from './topikContentStorage'

describe('publishGrammarBundleDirect', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses text response details when the API returns a non-JSON error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Payload too large', { status: 413 })))

    await expect(publishGrammarBundleDirect(1, {} as any)).rejects.toThrow('Payload too large')
  })
})
