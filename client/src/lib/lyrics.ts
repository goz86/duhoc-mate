export interface LyricLine {
  time: number;
  text: string;
}

export interface LyricsSearchTrack {
  trackName?: string;
  name?: string;
  artistName?: string;
  plainLyrics?: string;
  syncedLyrics?: string;
}

const VIDEO_NOISE_PATTERN = /\b(official|official mv|official video|music video|mv|lyrics?|lyric video|audio|the album|album|visualizer|vietsub|karaoke|hd|4k)\b/gi;
const STOP_WORDS = new Set(['official', 'video', 'music', 'lyrics', 'lyric', 'audio', 'album', 'the', 'ft', 'feat', 'featuring', 'mv', 'hd']);

export const parseSyncedLyrics = (value?: string): LyricLine[] => {
  if (!value) return [];
  return value
    .split('\n')
    .map((line) => {
      const match = line.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/);
      if (!match) return null;
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fraction = Number((match[3] || '0').padEnd(3, '0'));
      return {
        time: minutes * 60 + seconds + fraction / 1000,
        text: match[4].trim(),
      };
    })
    .filter((line): line is LyricLine => !!line && !!line.text);
};

export const createEstimatedLyrics = (value: string, duration: number): LyricLine[] => {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const safeDuration = duration > 40 ? duration : 240;
  const startAt = Math.min(12, safeDuration * 0.08);
  const endAt = Math.max(startAt + lines.length * 2.4, safeDuration - 8);
  const step = lines.length > 1 ? (endAt - startAt) / (lines.length - 1) : 0;

  return lines.map((text, index) => ({
    text,
    time: startAt + step * index,
  }));
};

export const getOffsetForLyricAnchor = ({
  playbackTime,
  lyricTime,
  minOffset = -60,
  maxOffset = 60,
}: {
  playbackTime: number;
  lyricTime: number;
  minOffset?: number;
  maxOffset?: number;
}) => {
  const rawOffset = Number((playbackTime - lyricTime).toFixed(1));
  return Math.max(minOffset, Math.min(maxOffset, rawOffset));
};

const unique = (values: string[]) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const normalizeForMatch = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const stripVideoNoise = (value: string) =>
  value
    .replace(/\(.*?\)/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(VIDEO_NOISE_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getMeaningfulTokens = (value: string) =>
  normalizeForMatch(stripVideoNoise(value))
    .split(' ')
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

export const getLyricsSearchCandidates = (title: string) => {
  const cleaned = stripVideoNoise(title);
  const candidates = [cleaned];

  const dashParts = cleaned.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  if (dashParts.length >= 2) {
    const artist = dashParts[0];
    const song = dashParts.slice(1).join(' - ');
    candidates.push(`${song} ${artist}`, song);
  }

  const pipeParts = cleaned.split(/\s*\|\s*/).map((part) => part.trim()).filter(Boolean);
  if (pipeParts.length >= 2) {
    candidates.push(pipeParts.join(' '), `${pipeParts[0]} ${pipeParts[pipeParts.length - 1]}`, pipeParts[0]);
  }

  candidates.push(cleaned.replace(/\b(ft\.?|feat\.?|featuring)\b/gi, ' '));
  return unique(candidates);
};

const scoreTrackMatch = (track: LyricsSearchTrack, title: string) => {
  const sourceTokens = getMeaningfulTokens(title);
  const sourceText = normalizeForMatch(sourceTokens.join(' '));
  const trackName = normalizeForMatch(track.trackName || track.name || '');
  const artistName = normalizeForMatch(track.artistName || '');
  const trackText = normalizeForMatch(`${trackName} ${artistName}`);

  if (!trackName && !artistName) return 0;

  let score = 0;
  for (const token of sourceTokens) {
    if (trackText.includes(token)) score += 1;
  }

  if (trackName && sourceText.includes(trackName)) score += 8;

  const artistTokens = artistName.split(' ').filter((token) => token.length > 1);
  for (const token of artistTokens) {
    if (sourceText.includes(token)) score += 1.5;
  }

  return score;
};

// Ký tự Hangul (âm tiết + jamo) để nhận biết lời bài hát tiếng Hàn.
const HANGUL_PATTERN = /[가-힣ᄀ-ᇿ㄰-㆏]/g;

const countHangul = (value = '') => (value.match(HANGUL_PATTERN) || []).length;

const trackHangulCount = (track: LyricsSearchTrack) =>
  countHangul(track.syncedLyrics || track.plainLyrics || '');

export const findBestLyricsTrack = <T extends LyricsSearchTrack>(tracks: T[], title: string): T | null => {
  const ranked = tracks
    .map((track) => ({ track, score: scoreTrackMatch(track, title) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 5) return null;

  // Nếu bản khớp tốt nhất KHÔNG phải lời tiếng Hàn (vd bản romanized/dịch),
  // ưu tiên bản tiếng Hàn (Hangul) của cùng bài — điểm khớp gần tương đương.
  // An toàn với bài không phải tiếng Hàn vì các bản đó có 0 ký tự Hangul.
  if (trackHangulCount(best.track) < 8) {
    const hangulAlt = ranked.find(
      (item) => item.score >= best.score - 2 && trackHangulCount(item.track) >= 8,
    );
    if (hangulAlt) return hangulAlt.track;
  }

  return best.track;
};
