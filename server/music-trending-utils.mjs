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
    // --- Trending chung ---
    'nhạc việt vpop hot nhất hiện nay official mv',
    'vpop mới nhất hot nhất official music video',
    'nhạc trẻ việt nam mới nhất hiện nay',
    'nhạc hot tiktok việt nam vpop',
    'vpop 2026 official music video',
    'vietnamese pop trending official mv',
    'nhac tre vpop playlist official',
    'top vpop songs this week official',
    'nhạc trẻ hay nhất 2025 official mv',
    'nhạc việt nam mới ra official',
    'ca khúc hit vpop triệu views',
    // --- Ca sĩ nam ---
    'Sơn Tùng MTP official music video',
    'HIEUTHUHAI official music video',
    'Jack J97 official music video',
    'Đức Phúc official music video',
    'SOOBIN official music video',
    'Phan Mạnh Quỳnh official music video',
    'Đen Vâu official music video',
    'Erik official music video',
    'Noo Phước Thịnh official music video',
    'Trúc Nhân official music video',
    'Kay Trần official music video',
    'Karik official music video',
    'Binz official music video',
    'RPT MCK official music video',
    'MONO official music video',
    'Quang Hùng MasterD official music video',
    'Vũ Cát Tường official music video',
    'Trịnh Thăng Bình official music video',
    'Justatee official music video',
    'Wren Evans official music video',
    // --- Ca sĩ nữ ---
    'Hòa Minzy official music video',
    'Hoàng Thùy Linh official music video',
    'Tóc Tiên official music video',
    'Bích Phương official music video',
    'AMEE official music video',
    'Phương Ly official music video',
    'MIN official music video',
    'Chi Pu official music video',
    'Mỹ Tâm official music video',
    'Hương Tràm official music video',
    'Bảo Anh official music video',
    'Văn Mai Hương official music video',
    'Tlinh official music video',
    'Orange official music video ca sĩ',
    'Han Sara official music video',
    'GREY D official music video',
    'Vũ. ca sĩ official music video',
    'Thùy Chi official music video',
    'LyLy official music video',
    'Hoàng Dũng official music video',
    'Hà Anh Tuấn official music video',
  ],
  kpop: [
    // --- Trending chung ---
    'kpop trending music video official',
    'k-pop new music video hits official',
    'korean pop top hits official mv',
    'kpop comeback mới nhất hot nhất',
    'kpop girl group trending official mv',
    'kpop boy group trending official mv',
    'korean idol new song official mv',
    'kpop chart top songs official',
    'kpop 2026 official music video',
    'kpop best songs official mv',
    'korean music hot trending MV',
    // --- Girl Groups ---
    'BLACKPINK official music video',
    'aespa official music video',
    'NewJeans official music video',
    'IVE official music video',
    'TWICE official music video',
    'LE SSERAFIM official music video',
    'ITZY official music video',
    'Red Velvet official music video',
    'MAMAMOO official music video',
    'NMIXX official music video',
    'STAYC official music video',
    'Kep1er official music video',
    'VIVIZ official music video',
    'OH MY GIRL official music video',
    'fromis_9 official music video',
    'BABYMONSTER official music video',
    'ILLIT official music video',
    'KISS OF LIFE official music video',
    'tripleS official music video',
    '(G)I-DLE official music video',
    // --- Boy Groups ---
    'BTS official music video',
    'Stray Kids official music video',
    'SEVENTEEN official music video',
    'EXO official music video',
    'TXT official music video',
    'ENHYPEN official music video',
    'ATEEZ official music video',
    'NCT DREAM official music video',
    'NCT 127 official music video',
    'TREASURE official music video',
    'THE BOYZ official music video',
    'MONSTA X official music video',
    'GOT7 official music video',
    'ASTRO official music video',
    'RIIZE official music video',
    'ZEROBASEONE official music video',
    'BOYNEXTDOOR official music video',
    // --- Solo ---
    'ROSÉ solo official music video',
    'JENNIE solo official music video',
    'LISA solo official music video',
    'JUNGKOOK solo official music video',
    'IU official music video',
    'Taeyeon official music video',
    'Sunmi official music video',
    'Chungha official music video',
    'PSY official music video',
    'Zico official music video',
    'Jay Park official music video',
    'BIBI official music video',
    'DEAN official music video',
    'Crush official music video',
  ],
  vinahouse: [
    'vinahouse tik tok remix hot nhất',
    'nhạc vinahouse remix bass cực căng',
    'vinahouse bay phòng remix hot nhất',
    'vinahouse 2026 remix hot',
    'vinahouse non stop remix',
    'vinahouse dance remix hot tiktok',
    'nhac vinahouse remix moi nhat',
    'nhạc trẻ remix vinahouse 2026',
    'EDM việt nam remix hot',
    'việt mix bass cực căng',
    'nhạc sàn vinahouse hay nhất',
    'dj vinahouse remix hot trend',
    'nhạc remix việt nam hay nhất 2025',
    'deep house việt nam remix',
    'nhạc trẻ remix bass boosted',
    'DJ TiLo remix vinahouse',
    'DJ Mie remix hot',
    'vinahouse underground remix',
    'nhạc bay phòng 2026 mới nhất',
    'EDM TikTok Việt Nam hot nhất',
    'future bass remix việt nam',
    'tropical house việt nam remix',
    'bass house remix tiktok hot',
    'nhạc trẻ remix hay nhất mọi thời đại',
    'bounce remix việt nam hot trend',
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
    { videoId: 'abPmZCZZrFA', title: 'SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU | OFFICIAL MUSIC VIDEO', author: 'Sơn Tùng M-TP Official', duration: '5:33', thumbnail: 'https://img.youtube.com/vi/abPmZCZZrFA/hqdefault.jpg', views: 50000000 },
    { videoId: 'WP9j_S955UE', title: 'Đức Phúc - Hơn Cả Hạnh Phúc (Official Music Video)', author: 'ĐỨC PHÚC OFFICIAL', duration: '4:15', thumbnail: 'https://img.youtube.com/vi/WP9j_S955UE/hqdefault.jpg', views: 20000000 },
    { videoId: 'OZmK0YuSmXU', title: "SOOBIN - Dancing In The Dark | 'BẬT NÓ LÊN' Album", author: 'SOOBIN Official', duration: '3:50', thumbnail: 'https://img.youtube.com/vi/OZmK0YuSmXU/hqdefault.jpg', views: 30000000 },
    { videoId: 'tMOQ_lII7Ao', title: 'TÓC TIÊN | Người Còn Thương Em Không | OFFICIAL MV', author: 'Tóc Tiên', duration: '4:55', thumbnail: 'https://img.youtube.com/vi/tMOQ_lII7Ao/hqdefault.jpg', views: 15000000 },
    { videoId: '3bJkVSMs4dw', title: 'Anh Là Ai - Phương Ly | Official Music Video', author: 'Phuong Ly Official', duration: '3:45', thumbnail: 'https://img.youtube.com/vi/3bJkVSMs4dw/hqdefault.jpg', views: 18000000 },
    { videoId: 'zQwKxVCR1y8', title: 'Rời Bỏ - Official Music Video | Hòa Minzy', author: 'Hòa Minzy', duration: '4:40', thumbnail: 'https://img.youtube.com/vi/zQwKxVCR1y8/hqdefault.jpg', views: 90000000 },
    { videoId: 'ixdSsW5n2rI', title: 'BƯỚC QUA NHAU (Walking Past Each Other) / Vũ. (Official MV)', author: 'Vũ Official', duration: '4:17', thumbnail: 'https://img.youtube.com/vi/ixdSsW5n2rI/hqdefault.jpg', views: 120000000 },
    { videoId: '8sVtL0o-v7U', title: 'HIEUTHUHAI - Người Im Lặng Gặp Người Hay Nói', author: 'HIEUTHUHAI', duration: '4:00', thumbnail: 'https://img.youtube.com/vi/8sVtL0o-v7U/hqdefault.jpg', views: 40000000 },
    { videoId: '4tYuIU7pLmI', title: 'JACK - J97 | NGÔI SAO CÔ ĐƠN | OFFICIAL MUSIC VIDEO', author: 'J97', duration: '4:30', thumbnail: 'https://img.youtube.com/vi/4tYuIU7pLmI/hqdefault.jpg', views: 80000000 },
    { videoId: 'T1xzr_iEy_I', title: 'Hoàng Thùy Linh - Duyên Âm (Love of Ghost) | Official Music Video', author: 'Hoàng Thùy Linh', duration: '3:55', thumbnail: 'https://img.youtube.com/vi/T1xzr_iEy_I/hqdefault.jpg', views: 25000000 }
  ],
  kpop: [
    { videoId: 'ioNng23DkIM', title: "BLACKPINK - 'How You Like That' M/V", author: 'BLACKPINK', duration: '3:04', thumbnail: 'https://img.youtube.com/vi/ioNng23DkIM/hqdefault.jpg', views: 1200000000 },
    { videoId: 'gdZLi9oWNZg', title: "BTS (방탄소년단) 'Dynamite' Official MV", author: 'HYBE LABELS', duration: '3:44', thumbnail: 'https://img.youtube.com/vi/gdZLi9oWNZg/hqdefault.jpg', views: 1900000000 },
    { videoId: '3ymwOvzhwHs', title: 'TWICE "Feel Special" M/V', author: 'JYP Entertainment', duration: '3:41', thumbnail: 'https://img.youtube.com/vi/3ymwOvzhwHs/hqdefault.jpg', views: 500000000 },
    { videoId: 'phuiiNCxRMg', title: "aespa 에스파 'Supernova' MV", author: 'SMTOWN', duration: '3:14', thumbnail: 'https://img.youtube.com/vi/phuiiNCxRMg/hqdefault.jpg', views: 300000000 },
    { videoId: '9wUKhEgnllc', title: "NewJeans (뉴진스) 'Hype Boy' Official MV", author: 'HYBE LABELS', duration: '3:07', thumbnail: 'https://img.youtube.com/vi/9wUKhEgnllc/hqdefault.jpg', views: 400000000 },
    { videoId: 'Y8JFxS1HlDo', title: "IVE 아이브 'LOVE DIVE' MV", author: 'STARSHIP', duration: '2:59', thumbnail: 'https://img.youtube.com/vi/Y8JFxS1HlDo/hqdefault.jpg', views: 350000000 },
    { videoId: '4vbDFu0PUew', title: 'LE SSERAFIM FEARLESS OFFICIAL M/V', author: 'HYBE LABELS', duration: '3:03', thumbnail: 'https://img.youtube.com/vi/4vbDFu0PUew/hqdefault.jpg', views: 250000000 },
    { videoId: 'ekr2nIex040', title: 'ROSÉ & Bruno Mars - APT. (Official Music Video)', author: 'ROSÉ', duration: '2:54', thumbnail: 'https://img.youtube.com/vi/ekr2nIex040/hqdefault.jpg', views: 800000000 },
    { videoId: 'TQTlCHxyuu8', title: 'Stray Kids "神메뉴(God\'s Menu)" M/V', author: 'JYP Entertainment', duration: '3:07', thumbnail: 'https://img.youtube.com/vi/TQTlCHxyuu8/hqdefault.jpg', views: 600000000 },
    { videoId: '-GQg25oP0S4', title: "SEVENTEEN (세븐틴) '손오공' Official MV", author: 'HYBE LABELS', duration: '3:33', thumbnail: 'https://img.youtube.com/vi/-GQg25oP0S4/hqdefault.jpg', views: 100000000 }
  ],
  vinahouse: [
    { videoId: 'mw7Y0jQ8_BU', title: 'Pháo - 2 Phút Hơn (KAIZ Remix) [Official Music Video]', author: "Spinnin' Records", duration: '3:11', thumbnail: 'https://img.youtube.com/vi/mw7Y0jQ8_BU/hqdefault.jpg', views: 300000000 },
    { videoId: 'npp1AN65WGM', title: 'Để Mị Nói Cho Mà Nghe - Hoàng Thuỳ Linh (Shrimp Mix)', author: 'DZUS Records', duration: '3:08', thumbnail: 'https://img.youtube.com/vi/npp1AN65WGM/hqdefault.jpg', views: 15000000 },
    { videoId: '8bG6ElvGRdk', title: 'Hoàng Thuỳ Linh - See Tình | Remix Version', author: 'Hoàng Thùy Linh', duration: '2:51', thumbnail: 'https://img.youtube.com/vi/8bG6ElvGRdk/hqdefault.jpg', views: 25000000 },
    { videoId: '9bZkp7q19f0', title: "PSY - GANGNAM STYLE(강남스타일) M/V", author: 'officialpsy', duration: '4:13', thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg', views: 5000000000 }
  ]
};

