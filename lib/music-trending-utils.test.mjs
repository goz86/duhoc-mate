import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  filterMusicVideo,
  getFallbackMusicSearchQuery,
  getTrendingMusicQueries,
} from '../server/music-trending-utils.mjs'

test('getTrendingMusicQueries keeps V-Pop and K-Pop searches separate', () => {
  const vpopQueries = getTrendingMusicQueries('vpop').join(' ').toLowerCase()
  const kpopQueries = getTrendingMusicQueries('kpop').join(' ').toLowerCase()

  assert.match(vpopQueries, /vpop|nhạc việt|nhạc trẻ/)
  assert.doesNotMatch(vpopQueries, /kpop|k-pop|hàn/)

  assert.match(kpopQueries, /kpop|k-pop|korean/)
  assert.doesNotMatch(kpopQueries, /vpop|nhạc việt|nhạc trẻ/)
})

test('filterMusicVideo rejects generic study and lofi results for trending artist tabs', () => {
  assert.equal(filterMusicVideo({
    title: 'Study With Me 📖',
    author: 'Study channel',
    duration: '4:20',
  }, 'vpop'), false)

  assert.equal(filterMusicVideo({
    title: 'Lofi Girl - beats to relax/study to 🌙',
    author: 'Lofi Girl',
    duration: '3:30',
  }, 'kpop'), false)
})

test('getFallbackMusicSearchQuery returns category-specific search text', () => {
  assert.match(getFallbackMusicSearchQuery('vpop'), /vpop|nhạc việt|nhạc trẻ/i)
  assert.match(getFallbackMusicSearchQuery('kpop'), /kpop|k-pop|korean/i)
  assert.match(getFallbackMusicSearchQuery('vinahouse'), /vinahouse/i)
})
