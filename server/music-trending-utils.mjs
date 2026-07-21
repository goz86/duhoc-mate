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
    { videoId: 'zoEtcR5EW08', title: 'Sơn Tùng M-TP - Chúng Ta Của Tương Lai', author: 'Sơn Tùng M-TP Official', duration: '4:09', thumbnail: 'https://img.youtube.com/vi/zoEtcR5EW08/mqdefault.jpg', views: 50000000 },
    { videoId: 'xypzmu5mMPY', title: 'Sơn Tùng M-TP - Muộn Rồi Mà Sao Còn', author: 'Sơn Tùng M-TP Official', duration: '4:35', thumbnail: 'https://img.youtube.com/vi/xypzmu5mMPY/mqdefault.jpg', views: 180000000 },
    { videoId: 'UVbv-PJXm14', title: 'Đen - Mang Tiền Về Cho Mẹ ft. Nguyên Thảo', author: 'Đen Vâu Official', duration: '6:43', thumbnail: 'https://img.youtube.com/vi/UVbv-PJXm14/mqdefault.jpg', views: 110000000 },
    { videoId: 'n5l74s26Dks', title: 'Hoàng Thùy Linh - See Tình', author: 'Hoàng Thùy Linh', duration: '3:05', thumbnail: 'https://img.youtube.com/vi/n5l74s26Dks/mqdefault.jpg', views: 60000000 },
    { videoId: 'ZbR6dYkqorI', title: 'Double2T x Masew - À Lôi', author: 'Masew', duration: '3:18', thumbnail: 'https://img.youtube.com/vi/ZbR6dYkqorI/mqdefault.jpg', views: 40000000 },
    { videoId: 'L_TqjWbS8Qc', title: 'HIEUTHUHAI - Ngủ Một Mình ft. Negav', author: 'HIEUTHUHAI', duration: '3:46', thumbnail: 'https://img.youtube.com/vi/L_TqjWbS8Qc/mqdefault.jpg', views: 70000000 },
    { videoId: 'dz6xe0xXqYE', title: 'RPT MCK - Anh Đã Ổn Hơn', author: 'MCK', duration: '3:20', thumbnail: 'https://img.youtube.com/vi/dz6xe0xXqYE/mqdefault.jpg', views: 30000000 },
    { videoId: 'kYJzX2eU2XQ', title: 'Phan Mạnh Quỳnh - Có Chàng Trai Viết Lên Cây', author: 'Phan Mạnh Quỳnh Official', duration: '5:02', thumbnail: 'https://img.youtube.com/vi/kYJzX2eU2XQ/mqdefault.jpg', views: 90000000 },
    { videoId: 'kRvYqzCJ4vw', title: 'Vũ. - Lạ Lùng', author: 'Vũ.', duration: '4:21', thumbnail: 'https://img.youtube.com/vi/kRvYqzCJ4vw/mqdefault.jpg', views: 120000000 }
  ],
  kpop: [
    { videoId: 'gdZLi9oWNZg', title: 'BTS - Dynamite', author: 'HYBE LABELS', duration: '3:43', thumbnail: 'https://img.youtube.com/vi/gdZLi9oWNZg/mqdefault.jpg', views: 1800000000 },
    { videoId: 'gQlMMD8auMs', title: 'BLACKPINK - Pink Venom', author: 'BLACKPINK', duration: '3:13', thumbnail: 'https://img.youtube.com/vi/gQlMMD8auMs/mqdefault.jpg', views: 800000000 },
    { videoId: 'sVTy_wkv5mc', title: 'NewJeans - OMG', author: 'HYBE LABELS', duration: '6:33', thumbnail: 'https://img.youtube.com/vi/sVTy_wkv5mc/mqdefault.jpg', views: 150000000 },
    { videoId: '11cta61g08Q', title: 'NewJeans - Hype Boy', author: 'HYBE LABELS', duration: '2:59', thumbnail: 'https://img.youtube.com/vi/11cta61g08Q/mqdefault.jpg', views: 180000000 },
    { videoId: 'F0B7HGP8mE4', title: 'IVE - LOVE DIVE', author: 'STARSHIP entertainment', duration: '2:58', thumbnail: 'https://img.youtube.com/vi/F0B7HGP8mE4/mqdefault.jpg', views: 250000000 },
    { videoId: 'Qc7_zRmbMSU', title: 'FIFTY FIFTY - Cupid', author: 'FIFTY FIFTY', duration: '3:05', thumbnail: 'https://img.youtube.com/vi/Qc7_zRmbMSU/mqdefault.jpg', views: 160000000 },
    { videoId: 'UBURTjK3kcA', title: 'LE SSERAFIM - UNFORGIVEN (feat. Nile Rodgers)', author: 'HYBE LABELS', duration: '4:21', thumbnail: 'https://img.youtube.com/vi/UBURTjK3kcA/mqdefault.jpg', views: 110000000 },
    { videoId: 'ioNng23DkIM', title: 'BLACKPINK - How You Like That', author: 'BLACKPINK', duration: '3:03', thumbnail: 'https://img.youtube.com/vi/ioNng23DkIM/mqdefault.jpg', views: 1200000000 }
  ],
  vinahouse: [
    { videoId: 'g8Jp37Y8g8k', title: 'Pháo - 2 Phút Hơn (KAIZ Remix)', author: 'KAIZ', duration: '3:05', thumbnail: 'https://img.youtube.com/vi/g8Jp37Y8g8k/mqdefault.jpg', views: 300000000 },
    { videoId: '6S4B9lA89pE', title: 'Thiên Đàng - Wowy x JoliPoli (Vinahouse Remix)', author: 'Remix Official', duration: '4:20', thumbnail: 'https://img.youtube.com/vi/6S4B9lA89pE/mqdefault.jpg', views: 15000000 },
    { videoId: 'j2_yXNfS_Ww', title: 'Phong Dạ Hành - Anh Rồng (Vinahouse Remix)', author: 'Vinahouse Club', duration: '5:10', thumbnail: 'https://img.youtube.com/vi/j2_yXNfS_Ww/mqdefault.jpg', views: 25000000 },
    { videoId: 'R-2S1c_z1v4', title: 'Khuê Mộc Lan - Hương Ly x Jombie (Vinahouse Remix)', author: 'Hương Ly Official', duration: '4:15', thumbnail: 'https://img.youtube.com/vi/R-2S1c_z1v4/mqdefault.jpg', views: 20000000 }
  ]
}
