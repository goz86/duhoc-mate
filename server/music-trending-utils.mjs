const JUNK_KEYWORDS = [
  'game', 'gaming', 'minecraft', 'roblox', 'liên quân', 'pubg', 'fifa',
  'streamer', 'livestream', 'live stream', 'vlog', 'phim', 'hài', 'comedy',
  'hoạt hình', 'anime', 'tập ', 'preview', 'trailer', 'tin tức', 'news',
  'hướng dẫn', 'tutorial', 'reaction', 'đập hộp', 'review', 'troll', 'thách đấu',
  'study with me', 'study session', 'lofi', 'lo-fi', 'beats to relax', 'chill beats',
]

const TRENDING_MUSIC_QUERIES = {
  vpop: [
    'nhạc việt vpop hot nhất hiện nay official mv',
    'vpop mới nhất hot nhất official music video',
    'nhạc trẻ việt nam mới nhất hiện nay',
    'nhạc hot tiktok việt nam vpop',
  ],
  kpop: [
    'kpop trending music video official',
    'k-pop new music video hits official',
    'korean pop top hits official mv',
    'kpop comeback mới nhất hot nhất',
  ],
  vinahouse: [
    'vinahouse tik tok remix hot nhất',
    'nhạc vinahouse remix bass cực căng',
    'vinahouse bay phòng remix hot nhất',
  ],
}

const FALLBACK_MUSIC_SEARCH_QUERIES = {
  vpop: 'nhạc việt vpop hot nhất hiện nay official mv',
  kpop: 'kpop trending music video official korean pop',
  vinahouse: 'vinahouse tik tok remix hot nhất',
}

export function getTrendingMusicQueries(type = 'vpop') {
  return TRENDING_MUSIC_QUERIES[type] || TRENDING_MUSIC_QUERIES.vpop
}

export function getFallbackMusicSearchQuery(type = 'vpop') {
  return FALLBACK_MUSIC_SEARCH_QUERIES[type] || FALLBACK_MUSIC_SEARCH_QUERIES.vpop
}

export function getMusicDurationSeconds(video) {
  if (typeof video?.seconds === 'number') return video.seconds
  if (typeof video?.lengthSeconds === 'number') return video.lengthSeconds
  if (typeof video?.duration?.seconds === 'number') return video.duration.seconds
  if (typeof video?.duration === 'number') return video.duration

  if (typeof video?.duration === 'string') {
    const parts = video.duration.split(':').map(Number)
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 1 && !Number.isNaN(parts[0])) return parts[0]
  }

  return 0
}

export function filterMusicVideo(video, type = 'vpop') {
  const title = (video?.title || '').toLowerCase()
  const author = (typeof video?.author === 'string'
    ? video.author
    : (video?.author?.name || String(video?.author || ''))).toLowerCase()

  if (JUNK_KEYWORDS.some(keyword => title.includes(keyword) || author.includes(keyword))) {
    return false
  }

  const durationSecs = getMusicDurationSeconds(video)
  if (type === 'vinahouse') {
    return durationSecs >= 180 && durationSecs <= 7200
  }

  return durationSecs >= 90 && durationSecs <= 600
}
