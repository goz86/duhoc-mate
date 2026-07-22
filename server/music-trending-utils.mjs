const JUNK_KEYWORDS = [
  'game', 'gaming', 'minecraft', 'roblox', 'liên quân', 'pubg', 'fifa',
  'streamer', 'livestream', 'live stream', 'vlog', 'phim', 'hài', 'comedy',
  'hoạt hình', 'anime', 'tập ', 'preview', 'trailer', 'tin tức', 'news',
  'hướng dẫn', 'tutorial', 'reaction', 'đập hộp', 'review', 'troll', 'thách đấu',
  'study with me', 'study session', 'lofi', 'lo-fi', 'beats to relax', 'chill beats',
  'top bài hát', 'top 30', 'top 50', 'top 20', 'top 10', 'bảng xếp hạng', 'bxh',
  'tổng hợp', 'tuyển tập', 'hơn 50 bài', 'hơn 30 bài', 'tuần qua', 'nghe nhiều nhất',
  'bài hát hot nhất', 'nhạc trẻ tuần qua', 'mashup', 'nonstop'
]

const TRENDING_MUSIC_QUERIES = {
  vpop: [
    'nhạc việt vpop hot nhất hiện nay official mv',
    'vpop mới nhất hot nhất official music video',
    'nhạc trẻ việt nam mới nhất hiện nay',
    'nhạc hot tiktok việt nam vpop',
    'vpop 2026 official music video',
    'vietnamese pop trending official mv',
    'nhac tre vpop playlist official',
    'top vpop songs this week official',
  ],
  kpop: [
    'kpop trending music video official',
    'k-pop new music video hits official',
    'korean pop top hits official mv',
    'kpop comeback mới nhất hot nhất',
    'kpop girl group trending official mv',
    'kpop boy group trending official mv',
    'korean idol new song official mv',
    'kpop chart top songs official',
  ],
  vinahouse: [
    'vinahouse tik tok remix hot nhất',
    'nhạc vinahouse remix bass cực căng',
    'vinahouse bay phòng remix hot nhất',
    'vinahouse 2026 remix hot',
    'vinahouse non stop remix',
    'vinahouse dance remix hot tiktok',
    'nhac vinahouse remix moi nhat',
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

export const STATIC_TRENDING_FALLBACKS = {
  vpop: [
    { videoId: 'gTknW_o_1pU', title: 'Sơn Tùng M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU | OFFICIAL MUSIC VIDEO', author: 'Sơn Tùng M-TP Official', duration: '5:33', thumbnail: 'https://i.ytimg.com/vi/gTknW_o_1pU/hqdefault.jpg', views: 50000000 },
    { videoId: '3a5g2K4lX6g', title: 'Đức Phúc - CHĂM EM MỘT ĐỜI | OFFICIAL MUSIC VIDEO', author: 'Đức Phúc Official', duration: '4:15', thumbnail: 'https://i.ytimg.com/vi/3a5g2K4lX6g/hqdefault.jpg', views: 20000000 },
    { videoId: 'Wp9yP1O35n8', title: 'SOOBIN - LẮM TIỀN NHIỀU TIỀN | Official Music Video', author: 'SOOBIN', duration: '3:50', thumbnail: 'https://i.ytimg.com/vi/Wp9yP1O35n8/hqdefault.jpg', views: 30000000 },
    { videoId: '9o7L4s_m3z8', title: 'TÓC TIÊN - NGƯỜI CÒN THƯƠNG EM KHÔNG | Official Music Video', author: 'Tóc Tiên', duration: '4:55', thumbnail: 'https://i.ytimg.com/vi/9o7L4s_m3z8/hqdefault.jpg', views: 15000000 },
    { videoId: 'abPM8b567bE', title: 'Phương Ly - MẬT NGỌT | OFFICIAL MUSIC VIDEO', author: 'Phương Ly', duration: '3:45', thumbnail: 'https://i.ytimg.com/vi/abPM8b567bE/hqdefault.jpg', views: 18000000 },
    { videoId: 'L1v_3eU-uUQ', title: 'Hòa Minzy - Rời Bỏ | OFFICIAL MUSIC VIDEO', author: 'Hòa Minzy', duration: '4:40', thumbnail: 'https://i.ytimg.com/vi/L1v_3eU-uUQ/hqdefault.jpg', views: 90000000 },
    { videoId: '2J4tF8lJ_jM', title: 'Vũ. - BƯỚC QUA NHAU | Official Music Video', author: 'Vũ. Official', duration: '4:17', thumbnail: 'https://i.ytimg.com/vi/2J4tF8lJ_jM/hqdefault.jpg', views: 120000000 }
  ],
  kpop: [
    { videoId: 'BvJ4K3J_bU4', title: "RESCENE (리센느) 'Pretty Girl' Special Video", author: 'RESCENE', duration: '3:34', thumbnail: 'https://i.ytimg.com/vi/BvJ4K3J_bU4/hqdefault.jpg', views: 5000000 },
    { videoId: 'k8X-p4Vw770', title: "RESCENE (리센느) 'LOVE ATTACK' Official MV", author: 'RESCENE', duration: '3:18', thumbnail: 'https://i.ytimg.com/vi/k8X-p4Vw770/hqdefault.jpg', views: 8000000 },
    { videoId: '0m4Q_tG8_m0', title: '아이오아이 (I.O.I) - 갑자기 (Suddenly) MV', author: 'Stone Music Entertainment', duration: '3:30', thumbnail: 'https://i.ytimg.com/vi/0m4Q_tG8_m0/hqdefault.jpg', views: 12000000 },
    { videoId: '2b354_k2E9Q', title: "ILLIT (아일릿) 'Cherish (My Love)' Official MV", author: 'HYBE LABELS', duration: '3:02', thumbnail: 'https://i.ytimg.com/vi/2b354_k2E9Q/hqdefault.jpg', views: 35000000 },
    { videoId: 'pG6iaOMV46I', title: "aespa 에스파 'Whiplash' MV", author: 'SMTOWN', duration: '3:04', thumbnail: 'https://i.ytimg.com/vi/pG6iaOMV46I/hqdefault.jpg', views: 45000000 },
    { videoId: 'p0XFz9M9xGg', title: 'JENNIE - Mantra (Official Music Video)', author: 'Jennie', duration: '2:26', thumbnail: 'https://i.ytimg.com/vi/p0XFz9M9xGg/hqdefault.jpg', views: 90000000 },
    { videoId: 'ArmDp-zijuc', title: 'ROSÉ & Bruno Mars - APT. (Official Music Video)', author: 'ROSÉ', duration: '2:54', thumbnail: 'https://i.ytimg.com/vi/ArmDp-zijuc/hqdefault.jpg', views: 300000000 },
    { videoId: 'n4nEw6FpWw4', title: "IVE 아이브 'Supernova Love' MV", author: 'IVE', duration: '3:10', thumbnail: 'https://i.ytimg.com/vi/n4nEw6FpWw4/hqdefault.jpg', views: 25000000 },
    { videoId: 'JsOOis4bCZo', title: "BABYMONSTER - 'DRIP' M/V", author: 'YG ENTERTAINMENT', duration: '3:12', thumbnail: 'https://i.ytimg.com/vi/JsOOis4bCZo/hqdefault.jpg', views: 8000000 },
    { videoId: '9bZkp7q19f0', title: "PSY - 'GANGNAM STYLE' M/V", author: 'officialpsy', duration: '4:13', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg', views: 5000000000 }
  ],
  vinahouse: [
    { videoId: 'g8Jp37Y8g8k', title: 'Pháo - 2 Phút Hơn (KAIZ Remix)', author: 'KAIZ', duration: '3:05', thumbnail: 'https://i.ytimg.com/vi/g8Jp37Y8g8k/hqdefault.jpg', views: 300000000 },
    { videoId: '6S4B9lA89pE', title: 'Thiên Đàng - Wowy x JoliPoli (Vinahouse Remix)', author: 'Remix Official', duration: '4:20', thumbnail: 'https://i.ytimg.com/vi/6S4B9lA89pE/hqdefault.jpg', views: 15000000 },
    { videoId: 'j2_yXNfS_Ww', title: 'Phong Dạ Hành - Anh Rồng (Vinahouse Remix)', author: 'Vinahouse Club', duration: '5:10', thumbnail: 'https://i.ytimg.com/vi/j2_yXNfS_Ww/hqdefault.jpg', views: 25000000 },
    { videoId: 'R-2S1c_z1v4', title: 'Khuê Mộc Lan - Hương Ly x Jombie (Vinahouse Remix)', author: 'Hương Ly Official', duration: '4:15', thumbnail: 'https://i.ytimg.com/vi/R-2S1c_z1v4/hqdefault.jpg', views: 20000000 }
  ]
};
