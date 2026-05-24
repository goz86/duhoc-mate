import assert from 'node:assert/strict';
import { findBestLyricsTrack, getLyricsSearchCandidates } from '../src/lib/lyrics.ts';

const videoTitle = 'MIN - Có Em Chờ ft. Mr A (Official MV)';

const wrongEnglishTrack = {
  trackName: 'Internet Money',
  artistName: 'Nick Mira',
  plainLyrics: "Internet money, bitch\nHahahaha, Nick, you're stupid",
  syncedLyrics: '',
};

const correctVietnameseTrack = {
  trackName: 'Có Em Chờ',
  artistName: 'MIN ft. Mr. A',
  plainLyrics: 'Từ lần đầu tiên ta đi bên nhau em đã biết tim mình đánh rơi rồi',
  syncedLyrics: '[00:16.00]Từ lần đầu tiên ta đi bên nhau em đã biết tim mình đánh rơi rồi',
};

const candidates = getLyricsSearchCandidates(videoTitle);
assert.ok(candidates.includes('MIN - Có Em Chờ ft. Mr A'));
assert.ok(candidates.some((candidate) => candidate.includes('Có Em Chờ') && candidate.includes('MIN')));

assert.equal(
  findBestLyricsTrack([wrongEnglishTrack], videoTitle),
  null,
  'unrelated English result must be rejected'
);

assert.deepEqual(
  findBestLyricsTrack([wrongEnglishTrack, correctVietnameseTrack], videoTitle),
  correctVietnameseTrack,
  'Vietnamese track should beat unrelated English result'
);

console.log('lyrics matching tests passed');
