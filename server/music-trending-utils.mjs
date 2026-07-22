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

const NON_MUSIC_JUNK_KEYWORDS = [
  'game', 'gaming', 'minecraft', 'roblox', 'liên quân', 'pubg', 'fifa',
  'streamer', 'livestream', 'live stream', 'vlog', 'phim', 'hài', 'comedy',
  'hoạt hình', 'anime', 'tập ', 'preview', 'trailer', 'tin tức', 'news',
  'hướng dẫn', 'tutorial', 'reaction', 'đập hộp', 'review', 'troll', 'thách đấu'
]

export function filterMusicVideo(video, type = 'vpop') {
  const title = (video?.title || '').toLowerCase()
  const author = (typeof video?.author === 'string'
    ? video.author
    : (video?.author?.name || String(video?.author || ''))).toLowerCase()

  if (type === 'vinahouse') {
    if (NON_MUSIC_JUNK_KEYWORDS.some(keyword => title.includes(keyword) || author.includes(keyword))) {
      return false
    }
    const durationSecs = getMusicDurationSeconds(video)
    return durationSecs >= 120 && durationSecs <= 10800
  }

  if (JUNK_KEYWORDS.some(keyword => title.includes(keyword) || author.includes(keyword))) {
    return false
  }

  const durationSecs = getMusicDurationSeconds(video)
  return durationSecs >= 90 && durationSecs <= 600
}

export const STATIC_TRENDING_FALLBACKS = {
  "vpop": [
    {
      "videoId": "uUQG8sk7cLs",
      "title": "Kẻ Say Tình 2 - Quốc Thiên",
      "author": "Quốc Thiên Official",
      "duration": "4:10",
      "thumbnail": "https://img.youtube.com/vi/uUQG8sk7cLs/hqdefault.jpg",
      "views": 4001071
    },
    {
      "videoId": "nbDKkO1pobM",
      "title": "Cơm Áo Gạo Tiền - Tuấn Phong, Tiến Nguyễn",
      "author": "Tuấn Phong",
      "duration": "3:17",
      "thumbnail": "https://img.youtube.com/vi/nbDKkO1pobM/hqdefault.jpg",
      "views": 137817
    },
    {
      "videoId": "iKLrfxGwfys",
      "title": "Sau Này Em Cưới Ai Rồi (Official) (Ver Kiều Chi) - Kiều Chi",
      "author": "Kiều Chi",
      "duration": "5:37",
      "thumbnail": "https://img.youtube.com/vi/iKLrfxGwfys/hqdefault.jpg",
      "views": 18223257
    },
    {
      "videoId": "O5iDDoD4ZGw",
      "title": "Đáng Ra Anh Không Nên - Đạt G, B Ray, Masew, KHÁNH",
      "author": "DatG Music and 3 more",
      "duration": "3:57",
      "thumbnail": "https://img.youtube.com/vi/O5iDDoD4ZGw/hqdefault.jpg",
      "views": 1027866
    },
    {
      "videoId": "4jjOH2FR6-E",
      "title": "xương rồng (intro) - Dangrangto, DONAL",
      "author": "Dangrangto",
      "duration": "4:14",
      "thumbnail": "https://img.youtube.com/vi/4jjOH2FR6-E/hqdefault.jpg",
      "views": 10707928
    },
    {
      "videoId": "Y5VoCfbB6As",
      "title": "Váy Cưới - ERIK, Kai Đinh",
      "author": "ERIK Official",
      "duration": "3:44",
      "thumbnail": "https://img.youtube.com/vi/Y5VoCfbB6As/hqdefault.jpg",
      "views": 3868009
    },
    {
      "videoId": "qfV4kQOvQxM",
      "title": "Em Vá Đời Anh - Đặng Thiên Chí",
      "author": "Thiên Chí Official",
      "duration": "4:45",
      "thumbnail": "https://img.youtube.com/vi/qfV4kQOvQxM/hqdefault.jpg",
      "views": 1020845
    },
    {
      "videoId": "y0flhrMOOeo",
      "title": "Chữ Vấn Chữ Vương - Chân Caca",
      "author": "Chân CaCa Official",
      "duration": "4:49",
      "thumbnail": "https://img.youtube.com/vi/y0flhrMOOeo/hqdefault.jpg",
      "views": 322482
    },
    {
      "videoId": "9bdCgrrBUWE",
      "title": "Thiệp Hồng Chung Tên - Út Nhị Mino, Hào JK",
      "author": "Út Nhị Mino Official",
      "duration": "3:51",
      "thumbnail": "https://img.youtube.com/vi/9bdCgrrBUWE/hqdefault.jpg",
      "views": 3532602
    },
    {
      "videoId": "hzUG1erf3Yw",
      "title": "Xin Đừng Rời Xa Anh - Lê Gia Bảo",
      "author": "Lê Gia Bảo",
      "duration": "4:57",
      "thumbnail": "https://img.youtube.com/vi/hzUG1erf3Yw/hqdefault.jpg",
      "views": 643355
    },
    {
      "videoId": "ScUCFY5qtGw",
      "title": "Vẫn Cô Gái Ấy - Trịnh Đình Quang",
      "author": "NhacPro Tube",
      "duration": "6:16",
      "thumbnail": "https://img.youtube.com/vi/ScUCFY5qtGw/hqdefault.jpg",
      "views": 2677026
    },
    {
      "videoId": "r0uH9lOqPZI",
      "title": "Bên Ấy Em Có Ai Rồi - Châu Khải Phong, TVk, 93NewG",
      "author": "Châu Khải Phong",
      "duration": "5:12",
      "thumbnail": "https://img.youtube.com/vi/r0uH9lOqPZI/hqdefault.jpg",
      "views": 14137237
    },
    {
      "videoId": "gMbRy8U5cqg",
      "title": "Nói Buông Là Buông - Đình Dũng",
      "author": "Đình Dũng Official",
      "duration": "4:57",
      "thumbnail": "https://img.youtube.com/vi/gMbRy8U5cqg/hqdefault.jpg",
      "views": 837144
    },
    {
      "videoId": "xnd6ZLv7oIY",
      "title": "Em Bán Đi Hết Chân Tình - Jin Tuấn Nam",
      "author": "Nguyễn Mạnh official ",
      "duration": "5:13",
      "thumbnail": "https://img.youtube.com/vi/xnd6ZLv7oIY/hqdefault.jpg",
      "views": 98195
    },
    {
      "videoId": "fSPKl32PfxM",
      "title": "Thương Lấy Phận Mình - Thái Học",
      "author": "Nguyễn Thái Học Official",
      "duration": "5:38",
      "thumbnail": "https://img.youtube.com/vi/fSPKl32PfxM/hqdefault.jpg",
      "views": 4100199
    },
    {
      "videoId": "V9PVRfjEBTI",
      "title": "Billie Eilish - BIRDS OF A FEATHER (Official Music Video)",
      "author": "Billie Eilish",
      "duration": "3:51",
      "thumbnail": "https://img.youtube.com/vi/V9PVRfjEBTI/hqdefault.jpg",
      "views": 890281303
    },
    {
      "videoId": "eVli-tstM5E",
      "title": "Sabrina Carpenter - Espresso",
      "author": "Sabrina Carpenter",
      "duration": "3:21",
      "thumbnail": "https://img.youtube.com/vi/eVli-tstM5E/hqdefault.jpg",
      "views": 643400542
    },
    {
      "videoId": "j8U06veqxdU",
      "title": "SÓNG GIÓ | ICM x JACK | OFFICIAL MUSIC VIDEO",
      "author": "ICM Entertainment",
      "duration": "5:51",
      "thumbnail": "https://img.youtube.com/vi/j8U06veqxdU/hqdefault.jpg",
      "views": 477899810
    },
    {
      "videoId": "FN7ALfpGxiI",
      "title": "NƠI NÀY CÓ ANH | OFFICIAL MUSIC VIDEO | SƠN TÙNG M-TP",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:39",
      "thumbnail": "https://img.youtube.com/vi/FN7ALfpGxiI/hqdefault.jpg",
      "views": 454200799
    },
    {
      "videoId": "WX7dUj14Z00",
      "title": "BẠC PHẬN | ICM x JACK | OFFICIAL MV",
      "author": "ICM Entertainment",
      "duration": "4:17",
      "thumbnail": "https://img.youtube.com/vi/WX7dUj14Z00/hqdefault.jpg",
      "views": 433009938
    },
    {
      "videoId": "cBClD7jylos",
      "title": "EM GÌ ƠI | ICM x JACK | OFFICIAL MUSIC VIDEO",
      "author": "ICM Entertainment",
      "duration": "4:47",
      "thumbnail": "https://img.youtube.com/vi/cBClD7jylos/hqdefault.jpg",
      "views": 376988262
    },
    {
      "videoId": "CL13X-8o4h0",
      "title": "BẮC BLING (BẮC NINH) | OFFICIAL MV | HOÀ MINZY ft NS XUÂN HINH x MASEW x TUẤN CRY",
      "author": "Hòa Minzy",
      "duration": "4:19",
      "thumbnail": "https://img.youtube.com/vi/CL13X-8o4h0/hqdefault.jpg",
      "views": 319489350
    },
    {
      "videoId": "knW7-x7Y7RE",
      "title": "SƠN TÙNG M-TP | HÃY TRAO CHO ANH ft. Snoop Dogg | Official MV",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:23",
      "thumbnail": "https://img.youtube.com/vi/knW7-x7Y7RE/hqdefault.jpg",
      "views": 311737771
    },
    {
      "videoId": "HXkh7EOqcQ4",
      "title": "THẰNG ĐIÊN | JUSTATEE x PHƯƠNG LY | OFFICIAL MV",
      "author": "JustaTeeMusic",
      "duration": "4:47",
      "thumbnail": "https://img.youtube.com/vi/HXkh7EOqcQ4/hqdefault.jpg",
      "views": 305686819
    },
    {
      "videoId": "Llw9Q6akRo4",
      "title": "LẠC TRÔI | OFFICIAL MUSIC VIDEO | SƠN TÙNG M-TP",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:33",
      "thumbnail": "https://img.youtube.com/vi/Llw9Q6akRo4/hqdefault.jpg",
      "views": 287347725
    },
    {
      "videoId": "qGRU3sRbaYw",
      "title": "Chúng Ta Không Thuộc Về Nhau | Official Music Video | Sơn Tùng M-TP",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:03",
      "thumbnail": "https://img.youtube.com/vi/qGRU3sRbaYw/hqdefault.jpg",
      "views": 248886113
    },
    {
      "videoId": "Bhg-Gw953b0",
      "title": "Jack | Camellia | Official Music Video",
      "author": "J97",
      "duration": "4:13",
      "thumbnail": "https://img.youtube.com/vi/Bhg-Gw953b0/hqdefault.jpg",
      "views": 227866389
    },
    {
      "videoId": "JAhdeizXpaQ",
      "title": "Hoàng Thuỳ Linh - Để Mị Nói Cho Mà Nghe (Let Mi tell) | Official Music Video",
      "author": "Hoàng Thùy Linh",
      "duration": "4:42",
      "thumbnail": "https://img.youtube.com/vi/JAhdeizXpaQ/hqdefault.jpg",
      "views": 198130985
    },
    {
      "videoId": "abPmZCZZrFA",
      "title": "SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU | OFFICIAL MUSIC VIDEO",
      "author": "Sơn Tùng M-TP Official",
      "duration": "5:26",
      "thumbnail": "https://img.youtube.com/vi/abPmZCZZrFA/hqdefault.jpg",
      "views": 180200897
    },
    {
      "videoId": "vjZsxtlJ-_M",
      "title": "JACK - Being A Boy Official MV | J97",
      "author": "J97",
      "duration": "3:57",
      "thumbnail": "https://img.youtube.com/vi/vjZsxtlJ-_M/hqdefault.jpg",
      "views": 178437312
    },
    {
      "videoId": "LCyo565N_5w",
      "title": "Buông Đôi Tay Nhau Ra | OFFICIAL MUSIC VIDEO | Sơn Tùng M-TP",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:50",
      "thumbnail": "https://img.youtube.com/vi/LCyo565N_5w/hqdefault.jpg",
      "views": 176795783
    },
    {
      "videoId": "4CCGI83vOVo",
      "title": "Jack | Fireflies | Official Music Video",
      "author": "J97",
      "duration": "6:22",
      "thumbnail": "https://img.youtube.com/vi/4CCGI83vOVo/hqdefault.jpg",
      "views": 170399330
    },
    {
      "videoId": "DZDYZ9nRHfU",
      "title": "Đức Phúc - Hết Thương Cạn Nhớ (Official Music Video)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "6:22",
      "thumbnail": "https://img.youtube.com/vi/DZDYZ9nRHfU/hqdefault.jpg",
      "views": 167773823
    },
    {
      "videoId": "32sYGCOYJUM",
      "title": "CHẠY NGAY ĐI | RUN NOW | SƠN TÙNG M-TP | Official Music Video",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:34",
      "thumbnail": "https://img.youtube.com/vi/32sYGCOYJUM/hqdefault.jpg",
      "views": 165392098
    },
    {
      "videoId": "1seYuaWehxY",
      "title": "Làm gì phải Hốt - JustaTee x Hoàng Thùy Linh x Đen | Official Music Video",
      "author": "JustaTeeMusic",
      "duration": "3:42",
      "thumbnail": "https://img.youtube.com/vi/1seYuaWehxY/hqdefault.jpg",
      "views": 141958805
    },
    {
      "videoId": "xiZUf98A1Ts",
      "title": "Tyla - CHANEL (Official Music Video)",
      "author": "Tyla",
      "duration": "3:10",
      "thumbnail": "https://img.youtube.com/vi/xiZUf98A1Ts/hqdefault.jpg",
      "views": 140354326
    },
    {
      "videoId": "F5tS5m86bOI",
      "title": "LẠ LÙNG (Strange) / Vũ. (Original)",
      "author": "Vũ Official",
      "duration": "4:22",
      "thumbnail": "https://img.youtube.com/vi/F5tS5m86bOI/hqdefault.jpg",
      "views": 138764980
    },
    {
      "videoId": "X7sSE3yCNLI",
      "title": "Soobin Hoàng Sơn - Anh Đã Quen Với Cô Đơn (I've Been Used To Be Lonely) | Official Music Video 4K",
      "author": "SOOBIN Official",
      "duration": "4:29",
      "thumbnail": "https://img.youtube.com/vi/X7sSE3yCNLI/hqdefault.jpg",
      "views": 135169766
    },
    {
      "videoId": "__kGJZ-kPno",
      "title": "Đức Phúc - Hơn Cả Yêu (Official Music Video)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "5:43",
      "thumbnail": "https://img.youtube.com/vi/__kGJZ-kPno/hqdefault.jpg",
      "views": 129089718
    },
    {
      "videoId": "t0WFOnwp3MM",
      "title": "Mặt Trời Của Em - Official MV | Phương Ly ft JustaTee",
      "author": "Phuong Ly Official",
      "duration": "5:04",
      "thumbnail": "https://img.youtube.com/vi/t0WFOnwp3MM/hqdefault.jpg",
      "views": 122764300
    },
    {
      "videoId": "neCmEbI2VWg",
      "title": "Tóc Tiên - CÓ AI THƯƠNG EM NHƯ ANH (#CATENA) ft. Touliver (Official MV)",
      "author": "Tóc Tiên",
      "duration": "4:30",
      "thumbnail": "https://img.youtube.com/vi/neCmEbI2VWg/hqdefault.jpg",
      "views": 105979911
    },
    {
      "videoId": "GQ4F9k4USfA",
      "title": "Nước Mắt Em Lau Bằng Tình Yêu Mới - Da LAB ft. Tóc Tiên (Official MV)",
      "author": "Da LAB Official",
      "duration": "5:46",
      "thumbnail": "https://img.youtube.com/vi/GQ4F9k4USfA/hqdefault.jpg",
      "views": 104905358
    },
    {
      "videoId": "sJt_i0hOugA",
      "title": "HIEUTHUHAI - Exit Sign (prod. by Kewtiie) ft. marzuz [Official Lyric Video]",
      "author": "HIEUTHUHAI",
      "duration": "3:22",
      "thumbnail": "https://img.youtube.com/vi/sJt_i0hOugA/hqdefault.jpg",
      "views": 101369572
    },
    {
      "videoId": "02ODKglDVQs",
      "title": "Vì Anh Đâu Có Biết - Madihu (Feat. Vũ.) | Official MV",
      "author": "Madihu",
      "duration": "4:21",
      "thumbnail": "https://img.youtube.com/vi/02ODKglDVQs/hqdefault.jpg",
      "views": 94608526
    },
    {
      "videoId": "oiikgEzTotg",
      "title": "Đức Phúc - Ta Còn Yêu Nhau (Official Music Video)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "5:43",
      "thumbnail": "https://img.youtube.com/vi/oiikgEzTotg/hqdefault.jpg",
      "views": 90731935
    },
    {
      "videoId": "zoEtcR5EW08",
      "title": "SƠN TÙNG M-TP | CHÚNG TA CỦA TƯƠNG LAI | OFFICIAL MUSIC VIDEO",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:37",
      "thumbnail": "https://img.youtube.com/vi/zoEtcR5EW08/hqdefault.jpg",
      "views": 90443260
    },
    {
      "videoId": "f9P7_qWrf38",
      "title": "bình yên / Vũ. ft. Binz (Official MV) từ Album \"Bảo Tàng Của Nuối Tiếc\"",
      "author": "Vũ Official",
      "duration": "3:23",
      "thumbnail": "https://img.youtube.com/vi/f9P7_qWrf38/hqdefault.jpg",
      "views": 89666868
    },
    {
      "videoId": "1OJQdxT6WHE",
      "title": "hieuthuhai - ngủ một mình (tình rất tình) ft. negav (prod. by kewtiie)",
      "author": "HIEUTHUHAI",
      "duration": "3:26",
      "thumbnail": "https://img.youtube.com/vi/1OJQdxT6WHE/hqdefault.jpg",
      "views": 84593783
    },
    {
      "videoId": "IOe0tNoUGv8",
      "title": "Đức Phúc - Em Đồng Ý (I Do) (feat. 911 & Khắc Hưng) (Official Music Video) | Valentine 2023",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "3:42",
      "thumbnail": "https://img.youtube.com/vi/IOe0tNoUGv8/hqdefault.jpg",
      "views": 84201037
    },
    {
      "videoId": "n6Pnzi6r9NU",
      "title": "BƯỚC QUA MÙA CÔ ĐƠN (Walking Through the Lonely Season) / Vũ. (Official MV)",
      "author": "Vũ Official",
      "duration": "5:43",
      "thumbnail": "https://img.youtube.com/vi/n6Pnzi6r9NU/hqdefault.jpg",
      "views": 84092835
    },
    {
      "videoId": "bA1MhSK8wBE",
      "title": "Hoàng Thùy Linh - Kẻ Cắp Gặp Bà Già (Diamond Cut Diamond)| Official Music Video",
      "author": "Hoàng Thùy Linh",
      "duration": "4:30",
      "thumbnail": "https://img.youtube.com/vi/bA1MhSK8wBE/hqdefault.jpg",
      "views": 82191754
    },
    {
      "videoId": "BkBqYlLjIeA",
      "title": "Tóc Tiên - Em Không Là Duy Nhất | Official Music Video",
      "author": "Tóc Tiên",
      "duration": "4:50",
      "thumbnail": "https://img.youtube.com/vi/BkBqYlLjIeA/hqdefault.jpg",
      "views": 80391970
    },
    {
      "videoId": "Vmh_LWV0KEc",
      "title": "Nàng Tiên Cá (NTC) - Hòa Minzy x Châu Đăng Khoa  | Official Music Video",
      "author": "Hòa Minzy",
      "duration": "4:15",
      "thumbnail": "https://img.youtube.com/vi/Vmh_LWV0KEc/hqdefault.jpg",
      "views": 79411951
    },
    {
      "videoId": "h6RONxjPBf4",
      "title": "NHỮNG LỜI HỨA BỎ QUÊN (Forgotten Promises) / VŨ. x DEAR JANE (Official MV)",
      "author": "Vũ Official",
      "duration": "4:19",
      "thumbnail": "https://img.youtube.com/vi/h6RONxjPBf4/hqdefault.jpg",
      "views": 77688527
    },
    {
      "videoId": "zQwKxVCR1y8",
      "title": "Rời Bỏ - Official Music Video | Hòa Minzy",
      "author": "Hòa Minzy",
      "duration": "8:40",
      "thumbnail": "https://img.youtube.com/vi/zQwKxVCR1y8/hqdefault.jpg",
      "views": 76851791
    },
    {
      "videoId": "0yHtYPeK2Jg",
      "title": "Thị Mầu - Hòa Minzy x Masew | Official Music Video",
      "author": "Hòa Minzy",
      "duration": "4:12",
      "thumbnail": "https://img.youtube.com/vi/0yHtYPeK2Jg/hqdefault.jpg",
      "views": 74617944
    },
    {
      "videoId": "gJHSDZfJrRY",
      "title": "Hoàng Thuỳ Linh - See Tình | Official Music Video",
      "author": "Hoàng Thùy Linh",
      "duration": "3:57",
      "thumbnail": "https://img.youtube.com/vi/gJHSDZfJrRY/hqdefault.jpg",
      "views": 74343420
    },
    {
      "videoId": "rIXhXaQ8tiM",
      "title": "Đức Phúc - Ngày Đầu Tiên (Official Music Video) | Valentine 2022",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "5:40",
      "thumbnail": "https://img.youtube.com/vi/rIXhXaQ8tiM/hqdefault.jpg",
      "views": 74336904
    },
    {
      "videoId": "Q6ZNsHvspEg",
      "title": "Hoàng Thuỳ Linh & ĐEN - Gieo Quẻ (Casting Coins) | Official Music Video",
      "author": "Hoàng Thùy Linh",
      "duration": "4:20",
      "thumbnail": "https://img.youtube.com/vi/Q6ZNsHvspEg/hqdefault.jpg",
      "views": 71574461
    },
    {
      "videoId": "d44UTUSTYKU",
      "title": "SOOBIN X SLIMV - THE PLAYAH (Special Performance / Official Music Video)",
      "author": "SOOBIN Official",
      "duration": "8:27",
      "thumbnail": "https://img.youtube.com/vi/d44UTUSTYKU/hqdefault.jpg",
      "views": 71564399
    },
    {
      "videoId": "i0nd3NPJ4MI",
      "title": "HIEUTHUHAI - Không Thể Say (prod. by Kewtiie) l Official Video",
      "author": "HIEUTHUHAI",
      "duration": "4:21",
      "thumbnail": "https://img.youtube.com/vi/i0nd3NPJ4MI/hqdefault.jpg",
      "views": 67207252
    },
    {
      "videoId": "_VGm6brq1aI",
      "title": "Đức Phúc - Yêu Được Không (feat. ViruSs) (Official Music Video)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "5:32",
      "thumbnail": "https://img.youtube.com/vi/_VGm6brq1aI/hqdefault.jpg",
      "views": 64937376
    },
    {
      "videoId": "T1xzr_iEy_I",
      "title": "Hoàng Thùy Linh - Duyên Âm (Love of Ghost) | Official Music Video",
      "author": "Hoàng Thùy Linh",
      "duration": "3:59",
      "thumbnail": "https://img.youtube.com/vi/T1xzr_iEy_I/hqdefault.jpg",
      "views": 63936576
    },
    {
      "videoId": "VHjMJeLsI0o",
      "title": "Bật Tình Yêu Lên - Hòa Minzy x Tăng Duy Tân | MV Lyrics",
      "author": "Hòa Minzy",
      "duration": "3:40",
      "thumbnail": "https://img.youtube.com/vi/VHjMJeLsI0o/hqdefault.jpg",
      "views": 63275035
    },
    {
      "videoId": "NLBTbCfR-Fg",
      "title": "ĐÔNG KIẾM EM (Finding You In Winter) / Vũ. (Original)",
      "author": "Vũ Official",
      "duration": "4:07",
      "thumbnail": "https://img.youtube.com/vi/NLBTbCfR-Fg/hqdefault.jpg",
      "views": 63114497
    },
    {
      "videoId": "q2YUtZum9wc",
      "title": "ANH LÀ NGOẠI LỆ CỦA EM - PHƯƠNG LY | OFFICIAL MV",
      "author": "Phuong Ly Official",
      "duration": "3:39",
      "thumbnail": "https://img.youtube.com/vi/q2YUtZum9wc/hqdefault.jpg",
      "views": 62362291
    },
    {
      "videoId": "vCIc1g_4JWM",
      "title": "Phía Sau Một Cô Gái - Soobin Hoàng Sơn (Official Music Video 4K)",
      "author": "SOOBIN Official",
      "duration": "5:30",
      "thumbnail": "https://img.youtube.com/vi/vCIc1g_4JWM/hqdefault.jpg",
      "views": 61037176
    },
    {
      "videoId": "PdbsnGuduvo",
      "title": "Sơn Tùng M-TP - Chắc Ai Đó Sẽ Về",
      "author": "Sơn Tùng M-TP Official",
      "duration": "5:15",
      "thumbnail": "https://img.youtube.com/vi/PdbsnGuduvo/hqdefault.jpg",
      "views": 61005942
    },
    {
      "videoId": "fArpx8TRWU8",
      "title": "[OFFICIAL MV] VỀ BÊN ANH - Jack (G5R)",
      "author": "G5R SQUAD Official",
      "duration": "4:21",
      "thumbnail": "https://img.youtube.com/vi/fArpx8TRWU8/hqdefault.jpg",
      "views": 59495342
    },
    {
      "videoId": "WCm2elbTEZQ",
      "title": "MONO - 'Chăm Hoa' (Official Music Video)",
      "author": "Mono Official",
      "duration": "4:20",
      "thumbnail": "https://img.youtube.com/vi/WCm2elbTEZQ/hqdefault.jpg",
      "views": 57987734
    },
    {
      "videoId": "PR_yVho1Txc",
      "title": "MISSING YOU - PHƯƠNG LY x TINLE (Official MV)",
      "author": "Phuong Ly Official",
      "duration": "4:13",
      "thumbnail": "https://img.youtube.com/vi/PR_yVho1Txc/hqdefault.jpg",
      "views": 57030499
    },
    {
      "videoId": "bTFoZBIIu4E",
      "title": "Jack | LAYLALAY | Official Music Video",
      "author": "J97",
      "duration": "4:56",
      "thumbnail": "https://img.youtube.com/vi/bTFoZBIIu4E/hqdefault.jpg",
      "views": 56785845
    },
    {
      "videoId": "gZKkD3edFaE",
      "title": "HOA VÔ SẮC | ICM x JACK | OFFICIAL MUSIC VIDEO",
      "author": "ICM Entertainment",
      "duration": "5:18",
      "thumbnail": "https://img.youtube.com/vi/gZKkD3edFaE/hqdefault.jpg",
      "views": 56041441
    },
    {
      "videoId": "dLmczwDCEZI",
      "title": "HURRYKNG, HIEUTHUHAI, MANBO | Hẹn Gặp Em Dưới Ánh Trăng | Official Video",
      "author": "GERDNANG",
      "duration": "3:52",
      "thumbnail": "https://img.youtube.com/vi/dLmczwDCEZI/hqdefault.jpg",
      "views": 55755453
    },
    {
      "videoId": "red9YvYlPWg",
      "title": "Jack - J97 | In The End | Special Stage Video",
      "author": "J97",
      "duration": "3:41",
      "thumbnail": "https://img.youtube.com/vi/red9YvYlPWg/hqdefault.jpg",
      "views": 55333341
    },
    {
      "videoId": "VCYJckDc_fw",
      "title": "Đức Phúc - Còn Yêu, Đâu Ai Rời Đi (Official Music Video)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "5:41",
      "thumbnail": "https://img.youtube.com/vi/VCYJckDc_fw/hqdefault.jpg",
      "views": 53234889
    },
    {
      "videoId": "SZpiiixlHWY",
      "title": "Tyla - IS IT (Official Music Video)",
      "author": "Tyla",
      "duration": "2:41",
      "thumbnail": "https://img.youtube.com/vi/SZpiiixlHWY/hqdefault.jpg",
      "views": 52678139
    },
    {
      "videoId": "3bJkVSMs4dw",
      "title": "Anh Là Ai - Phương Ly | Official Music Video",
      "author": "Phuong Ly Official",
      "duration": "4:42",
      "thumbnail": "https://img.youtube.com/vi/3bJkVSMs4dw/hqdefault.jpg",
      "views": 51038762
    },
    {
      "videoId": "A2OtU0HOzJY",
      "title": "JUSTATEE X PHƯƠNG LY | THEO ANH KHÔNG? | OFFICIAL MV",
      "author": "Trà TEA+ Plus",
      "duration": "2:16",
      "thumbnail": "https://img.youtube.com/vi/A2OtU0HOzJY/hqdefault.jpg",
      "views": 50885401
    },
    {
      "videoId": "U3ucpVlaeK8",
      "title": "Hoàng Thùy Linh - Bánh Trôi Nước (Woman)",
      "author": "Hoàng Thùy Linh",
      "duration": "4:32",
      "thumbnail": "https://img.youtube.com/vi/U3ucpVlaeK8/hqdefault.jpg",
      "views": 50862520
    },
    {
      "videoId": "Rz4FbACtfd0",
      "title": "TÓC TIÊN - VŨ ĐIỆU CỒNG CHIÊNG ft.TeamV (OFFICIAL MV)",
      "author": "Tóc Tiên",
      "duration": "5:55",
      "thumbnail": "https://img.youtube.com/vi/Rz4FbACtfd0/hqdefault.jpg",
      "views": 49516609
    },
    {
      "videoId": "ayJY9ieBuEU",
      "title": "KHÔNG THỂ CÙNG NHAU SUỐT KIẾP - HOÀ MINZY (ft. MR. SIRO) | OFFICIAL MUSIC VIDEO",
      "author": "Hòa Minzy",
      "duration": "8:56",
      "thumbnail": "https://img.youtube.com/vi/ayJY9ieBuEU/hqdefault.jpg",
      "views": 48801763
    },
    {
      "videoId": "4tYuIU7pLmI",
      "title": "JACK - J97 | NGÔI SAO CÔ ĐƠN | OFFICIAL MUSIC VIDEO",
      "author": "J97",
      "duration": "5:46",
      "thumbnail": "https://img.youtube.com/vi/4tYuIU7pLmI/hqdefault.jpg",
      "views": 44964970
    },
    {
      "videoId": "PP_Fu65IqNc",
      "title": "Đức Phúc - Người Ơi Người Ở Đừng Về (feat. Suboi) (Official Music Video)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "4:29",
      "thumbnail": "https://img.youtube.com/vi/PP_Fu65IqNc/hqdefault.jpg",
      "views": 44921026
    },
    {
      "videoId": "OrDB4jpA1g8",
      "title": "JACK - J97 | Thien Ly Oi | Official Music Video",
      "author": "J97",
      "duration": "5:09",
      "thumbnail": "https://img.youtube.com/vi/OrDB4jpA1g8/hqdefault.jpg",
      "views": 43687464
    },
    {
      "videoId": "yHikkFeIHNA",
      "title": "NỖI ĐAU GIỮA HÒA BÌNH - HÒA MINZY x NGUYỄN VĂN CHUNG | OFFICIAL MUSIC VIDEO",
      "author": "Hòa Minzy",
      "duration": "7:34",
      "thumbnail": "https://img.youtube.com/vi/yHikkFeIHNA/hqdefault.jpg",
      "views": 41914271
    },
    {
      "videoId": "OZmK0YuSmXU",
      "title": "SOOBIN - Dancing In The Dark | 'BẬT NÓ LÊN' Album (Official MV)",
      "author": "SOOBIN Official",
      "duration": "4:39",
      "thumbnail": "https://img.youtube.com/vi/OZmK0YuSmXU/hqdefault.jpg",
      "views": 41392412
    },
    {
      "videoId": "SeWt7IpZ0CA",
      "title": "SOOBIN - giá như | 'BẬT NÓ LÊN' Album (Official MV)",
      "author": "SOOBIN Official",
      "duration": "5:10",
      "thumbnail": "https://img.youtube.com/vi/SeWt7IpZ0CA/hqdefault.jpg",
      "views": 41384027
    },
    {
      "videoId": "8sVtL0o-v7U",
      "title": "Người Im Lặng Gặp Người Hay Nói - HIEUTHUHAI",
      "author": "HIEUTHUHAI",
      "duration": "5:23",
      "thumbnail": "https://img.youtube.com/vi/8sVtL0o-v7U/hqdefault.jpg",
      "views": 40254948
    },
    {
      "videoId": "2YoIKPOUwIM",
      "title": "Đức Phúc - Mùa Hè Tuyệt Vời (feat. Tăng Duy Tân) (Official Music Video)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "3:48",
      "thumbnail": "https://img.youtube.com/vi/2YoIKPOUwIM/hqdefault.jpg",
      "views": 39797951
    },
    {
      "videoId": "hYYMF3VtOjE",
      "title": "Chạy Khỏi Thế Giới Này - Da LAB ft. Phương Ly (Official Music Video)",
      "author": "Da LAB Official",
      "duration": "4:44",
      "thumbnail": "https://img.youtube.com/vi/hYYMF3VtOjE/hqdefault.jpg",
      "views": 39771767
    },
    {
      "videoId": "SlQR9iu09bQ",
      "title": "SON TUNG M-TP x TYGA | COME MY WAY | OFFICIAL MUSIC VIDEO",
      "author": "Sơn Tùng M-TP Official and Tyga",
      "duration": "3:55",
      "thumbnail": "https://img.youtube.com/vi/SlQR9iu09bQ/hqdefault.jpg",
      "views": 39519784
    },
    {
      "videoId": "LxNzRN8EMcw",
      "title": "Hoàng Thuỳ Linh - BO XÌ BO (PAUSE PAUSE) | Official Music Video",
      "author": "Hoàng Thùy Linh",
      "duration": "3:37",
      "thumbnail": "https://img.youtube.com/vi/LxNzRN8EMcw/hqdefault.jpg",
      "views": 38381510
    },
    {
      "videoId": "ixdSsW5n2rI",
      "title": "BƯỚC QUA NHAU (Walking Past Each Other) / Vũ. (Official MV)",
      "author": "Vũ Official",
      "duration": "5:37",
      "thumbnail": "https://img.youtube.com/vi/ixdSsW5n2rI/hqdefault.jpg",
      "views": 38030390
    },
    {
      "videoId": "TTwlhJzXHo4",
      "title": "HIEUTHUHAI - Vệ Tinh ft. Hoàng Tôn (prod. by Kewtiie) | OFFICIAL MV",
      "author": "HIEUTHUHAI",
      "duration": "4:01",
      "thumbnail": "https://img.youtube.com/vi/TTwlhJzXHo4/hqdefault.jpg",
      "views": 37469029
    },
    {
      "videoId": "vaGf8fmtBr4",
      "title": "Maroon 5, LISA - Priceless",
      "author": "Maroon 5",
      "duration": "2:52",
      "thumbnail": "https://img.youtube.com/vi/vaGf8fmtBr4/hqdefault.jpg",
      "views": 37372861
    },
    {
      "videoId": "OqdA6DKV1Fs",
      "title": "THICHTHICH - PHƯƠNG LY | OFFICIAL MV",
      "author": "Phuong Ly Official",
      "duration": "4:26",
      "thumbnail": "https://img.youtube.com/vi/OqdA6DKV1Fs/hqdefault.jpg",
      "views": 35542618
    },
    {
      "videoId": "_r2CjzHXUWQ",
      "title": "Nhạc Tết 2025 | Hoà Minzy x Bùi Công Nam x StillaD - KIÊN TRÌ LÀ DÌ THÀNH CÔNG (Official MV)",
      "author": "Hòa Minzy",
      "duration": "4:21",
      "thumbnail": "https://img.youtube.com/vi/_r2CjzHXUWQ/hqdefault.jpg",
      "views": 33748969
    },
    {
      "videoId": "AfNbehFKJ7o",
      "title": "Đức Phúc - Ngày Đầu Tiên (Dance Performance)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "3:34",
      "thumbnail": "https://img.youtube.com/vi/AfNbehFKJ7o/hqdefault.jpg",
      "views": 32105087
    },
    {
      "videoId": "zaYS8tiD0Og",
      "title": "HIEUTHUHAI - Crocodile Tears (prod. by Kewtiie) l Official Music Video",
      "author": "HIEUTHUHAI",
      "duration": "3:33",
      "thumbnail": "https://img.youtube.com/vi/zaYS8tiD0Og/hqdefault.jpg",
      "views": 30166591
    },
    {
      "videoId": "ZnRgYm4t_14",
      "title": "Đức Phúc - Ngày Đầu Sau Chia Tay (feat. Thùy Tiên & Khắc Hưng) (Official Music Video)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "5:34",
      "thumbnail": "https://img.youtube.com/vi/ZnRgYm4t_14/hqdefault.jpg",
      "views": 28553142
    },
    {
      "videoId": "JHSRTU31T14",
      "title": "SƠN TÙNG M-TP | THERE’S NO ONE AT ALL (ANOTHER VERSION) | OFFICIAL MUSIC VIDEO",
      "author": "Sơn Tùng M-TP Official",
      "duration": "3:42",
      "thumbnail": "https://img.youtube.com/vi/JHSRTU31T14/hqdefault.jpg",
      "views": 26108476
    },
    {
      "videoId": "mf4upAPwHEo",
      "title": "Lukas Graham - Happy For You (feat. Vũ.) Performance Video",
      "author": "Vũ Official",
      "duration": "3:48",
      "thumbnail": "https://img.youtube.com/vi/mf4upAPwHEo/hqdefault.jpg",
      "views": 24813492
    },
    {
      "videoId": "8UwKhtdB3sQ",
      "title": "Kén Cá Chọn Canh - Hòa Minzy x Tuấn Cry x Masew | Official Music Video (Genshin Impact)",
      "author": "Hòa Minzy",
      "duration": "3:35",
      "thumbnail": "https://img.youtube.com/vi/8UwKhtdB3sQ/hqdefault.jpg",
      "views": 24396709
    },
    {
      "videoId": "zbzlNsSXq5o",
      "title": "HOÀ MINZY - CHẤP NHẬN ( RỜI BỎ 2 ) | OFFICIAL MUSIC VIDEO ( 4K )",
      "author": "Hòa Minzy",
      "duration": "7:58",
      "thumbnail": "https://img.youtube.com/vi/zbzlNsSXq5o/hqdefault.jpg",
      "views": 24393615
    },
    {
      "videoId": "sZuix0W7xKY",
      "title": "Hoàng Thùy Linh - Em Đây Chẳng Phải Thúy Kiều (I Am Not Thuy Kieu) | Official Lyrics Video",
      "author": "Hoàng Thùy Linh",
      "duration": "3:33",
      "thumbnail": "https://img.youtube.com/vi/sZuix0W7xKY/hqdefault.jpg",
      "views": 22144154
    },
    {
      "videoId": "ZvbwY5qUYnc",
      "title": "Đức Phúc - Chăm Em Một Đời (feat. Kai Đinh & Kewtiie) (Official Music Video) | Valentine 2026",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "4:08",
      "thumbnail": "https://img.youtube.com/vi/ZvbwY5qUYnc/hqdefault.jpg",
      "views": 21455088
    },
    {
      "videoId": "mlFiwKicz7I",
      "title": "BINZ x PHUONG LY - SO CLOSE [ OFFICIAL MV ]",
      "author": "SpaceSpeakers Label",
      "duration": "3:44",
      "thumbnail": "https://img.youtube.com/vi/mlFiwKicz7I/hqdefault.jpg",
      "views": 20001134
    },
    {
      "videoId": "sG9JhIRuTkA",
      "title": "SOOBIN - THÁNG NĂM (Official Music Video)",
      "author": "SOOBIN Official",
      "duration": "3:57",
      "thumbnail": "https://img.youtube.com/vi/sG9JhIRuTkA/hqdefault.jpg",
      "views": 19886512
    },
    {
      "videoId": "D9VFjACfeQM",
      "title": "HIEUTHUHAI, HURRYKNG, MANBO | 1-800-LOVE | Official Video",
      "author": "GERDNANG",
      "duration": "4:36",
      "thumbnail": "https://img.youtube.com/vi/D9VFjACfeQM/hqdefault.jpg",
      "views": 19764067
    },
    {
      "videoId": "oV7qaHKPoK0",
      "title": "SOOBIN, tlinh - Ai Mà Biết Được (ft. Touliver) | 'BẬT NÓ LÊN' Album (Official MV)",
      "author": "SOOBIN Official",
      "duration": "4:17",
      "thumbnail": "https://img.youtube.com/vi/oV7qaHKPoK0/hqdefault.jpg",
      "views": 17019375
    },
    {
      "videoId": "6jEw-WCjMCk",
      "title": "TÚI 3 GANG – PHƯƠNG LY x RHYMASTIC |Official Music Video",
      "author": "Phuong Ly Official",
      "duration": "3:38",
      "thumbnail": "https://img.youtube.com/vi/6jEw-WCjMCk/hqdefault.jpg",
      "views": 16676110
    },
    {
      "videoId": "IuO64sifh9o",
      "title": "Jack - J97 | Trịnh Gia | Special Stage Video",
      "author": "J97",
      "duration": "3:16",
      "thumbnail": "https://img.youtube.com/vi/IuO64sifh9o/hqdefault.jpg",
      "views": 16622862
    },
    {
      "videoId": "nIl_gX9W5qQ",
      "title": "Vũ - Mùa Hè Của Em (Her Summer) / OFFICIAL MV",
      "author": "Vũ Official",
      "duration": "4:18",
      "thumbnail": "https://img.youtube.com/vi/nIl_gX9W5qQ/hqdefault.jpg",
      "views": 16440411
    },
    {
      "videoId": "STjzkjnLlZ4",
      "title": "hieuthuhai - ngủ một mình ft. negav (prod. by kewtiie) | official mv",
      "author": "HIEUTHUHAI",
      "duration": "3:41",
      "thumbnail": "https://img.youtube.com/vi/STjzkjnLlZ4/hqdefault.jpg",
      "views": 15633035
    },
    {
      "videoId": "BGSMfgcC6tI",
      "title": "Hoàng Thùy Linh - Tứ Phủ (feat. Hồ Hoài Anh & TripleD) | Official Music Video",
      "author": "Hoàng Thùy Linh",
      "duration": "4:30",
      "thumbnail": "https://img.youtube.com/vi/BGSMfgcC6tI/hqdefault.jpg",
      "views": 14364102
    },
    {
      "videoId": "MnzdvcJsp18",
      "title": "JACK - J97 | CHUNG TA ROI SE HANH PHUC Happiness Awaits Us In The End | Official Music Video",
      "author": "J97",
      "duration": "3:59",
      "thumbnail": "https://img.youtube.com/vi/MnzdvcJsp18/hqdefault.jpg",
      "views": 14329792
    },
    {
      "videoId": "7poGT0d8Eeo",
      "title": "Hoàng Thùy Linh - I'm Gonna Break",
      "author": "Hoàng Thùy Linh",
      "duration": "6:41",
      "thumbnail": "https://img.youtube.com/vi/7poGT0d8Eeo/hqdefault.jpg",
      "views": 14218552
    },
    {
      "videoId": "kMJ2j0t2icE",
      "title": "NGÀY TẬN THẾ - TÓC TIÊN x EMCEE L (DALAB) x TOULIVER x TINLE | Official MV",
      "author": "Tóc Tiên",
      "duration": "4:36",
      "thumbnail": "https://img.youtube.com/vi/kMJ2j0t2icE/hqdefault.jpg",
      "views": 13640031
    },
    {
      "videoId": "YkrWCMe0Pu4",
      "title": "PHƯƠNG LY X RHYMASTIC X TOULIVER - ĐÂU CHỊU NGỒI YÊN [OFFICIAL MV]",
      "author": "SpaceSpeakers Label",
      "duration": "4:09",
      "thumbnail": "https://img.youtube.com/vi/YkrWCMe0Pu4/hqdefault.jpg",
      "views": 13259712
    },
    {
      "videoId": "ALzPt-7pEOc",
      "title": "Rời Bỏ - Hòa Minzy | Official Lyrics Video",
      "author": "Hòa Minzy",
      "duration": "4:38",
      "thumbnail": "https://img.youtube.com/vi/ALzPt-7pEOc/hqdefault.jpg",
      "views": 13059631
    },
    {
      "videoId": "7u5hjUsJBXA",
      "title": "Hoàng Thuỳ Linh & Kingsport - Ngồi Trên Ngai (Official Music Video)",
      "author": "Hoàng Thùy Linh",
      "duration": "2:39",
      "thumbnail": "https://img.youtube.com/vi/7u5hjUsJBXA/hqdefault.jpg",
      "views": 12350612
    },
    {
      "videoId": "mA-UxOle3YQ",
      "title": "JACK - J97 | XÓA TÊN ANH ĐI | Official Music Video | [Album26]",
      "author": "J97",
      "duration": "5:24",
      "thumbnail": "https://img.youtube.com/vi/mA-UxOle3YQ/hqdefault.jpg",
      "views": 12227360
    },
    {
      "videoId": "O8MnTgASxJ4",
      "title": "Hoàng Thùy Linh x DTAP x RTEE x Prudential - Khi Tình Yêu Đủ Lớn (Once Love Fulfill)",
      "author": "Hoàng Thùy Linh",
      "duration": "4:25",
      "thumbnail": "https://img.youtube.com/vi/O8MnTgASxJ4/hqdefault.jpg",
      "views": 11819689
    },
    {
      "videoId": "e5Td3zrVdX4",
      "title": "Nếu Những Tiếc Nuối / Vũ. (Official MV) từ Album \"Bảo Tàng Của Nuối Tiếc\"",
      "author": "Vũ Official",
      "duration": "4:34",
      "thumbnail": "https://img.youtube.com/vi/e5Td3zrVdX4/hqdefault.jpg",
      "views": 11764715
    },
    {
      "videoId": "o-2yt0ZZZ6o",
      "title": "Không Yêu Em Thì Yêu Ai? / Vũ. ft. Low G (từ Album \"Bảo Tàng Của Nuối Tiếc\")",
      "author": "Vũ Official",
      "duration": "3:53",
      "thumbnail": "https://img.youtube.com/vi/o-2yt0ZZZ6o/hqdefault.jpg",
      "views": 11667049
    },
    {
      "videoId": "LgmQmKNIDj0",
      "title": "JACK - J97 | LIỄU THANH YÊN | Live performance show",
      "author": "J97",
      "duration": "2:46",
      "thumbnail": "https://img.youtube.com/vi/LgmQmKNIDj0/hqdefault.jpg",
      "views": 10839327
    },
    {
      "videoId": "aEAbCjFPtjY",
      "title": "HIEUTHUHAI x PHƯƠNG LY - Xoay Một Vòng (prod. by Kewtiie) l Official Music Video",
      "author": "HIEUTHUHAI",
      "duration": "2:56",
      "thumbnail": "https://img.youtube.com/vi/aEAbCjFPtjY/hqdefault.jpg",
      "views": 10739948
    },
    {
      "videoId": "iy53wPnNCYU",
      "title": "Đi Để Trở Về - Soobin Hoàng Sơn | Official Music Video",
      "author": "SOOBIN Official",
      "duration": "3:50",
      "thumbnail": "https://img.youtube.com/vi/iy53wPnNCYU/hqdefault.jpg",
      "views": 10269012
    },
    {
      "videoId": "FNarFvyTx9Q",
      "title": "JACK - J97 | TỪ NƠI TÔI SINH RA | Official Video | Huge respect from Vietnam",
      "author": "J97",
      "duration": "3:52",
      "thumbnail": "https://img.youtube.com/vi/FNarFvyTx9Q/hqdefault.jpg",
      "views": 10258991
    },
    {
      "videoId": "FikdKWos-NQ",
      "title": "Mục Hạ Vô Nhân (Official MV) | SOOBIN - Binz - NSND Huỳnh Tú",
      "author": "SOOBIN Official",
      "duration": "5:55",
      "thumbnail": "https://img.youtube.com/vi/FikdKWos-NQ/hqdefault.jpg",
      "views": 10205036
    },
    {
      "videoId": "lxBC4SYjb2I",
      "title": "CÔ TA (HER) / Vũ. (Official MV)",
      "author": "Vũ Official",
      "duration": "3:46",
      "thumbnail": "https://img.youtube.com/vi/lxBC4SYjb2I/hqdefault.jpg",
      "views": 10077799
    },
    {
      "videoId": "bmAAIEtu39o",
      "title": "NẾP NHÀ - HÒA MINZY x OBITO x HỨA KIM TUYỀN | OFFICIAL MV",
      "author": "Hòa Minzy",
      "duration": "4:48",
      "thumbnail": "https://img.youtube.com/vi/bmAAIEtu39o/hqdefault.jpg",
      "views": 9551159
    },
    {
      "videoId": "QFHvfQDgRFA",
      "title": "SOOBIN - TRÒ CHƠI (Official Music Video)",
      "author": "SOOBIN Official",
      "duration": "3:28",
      "thumbnail": "https://img.youtube.com/vi/QFHvfQDgRFA/hqdefault.jpg",
      "views": 9449580
    },
    {
      "videoId": "bfKKVGYMKgs",
      "title": "HIEUTHUHAI - Giờ Thì Ai Cười (prod. by Kewtiie) l Official Video",
      "author": "HIEUTHUHAI",
      "duration": "3:45",
      "thumbnail": "https://img.youtube.com/vi/bfKKVGYMKgs/hqdefault.jpg",
      "views": 9379128
    },
    {
      "videoId": "cf4_FMcM-uA",
      "title": "HÔM NAY TÔI CÔ ĐƠN QUÁ [OFFICIAL MV] | TÓC TIÊN FT RHYMASTIC",
      "author": "Tóc Tiên",
      "duration": "4:22",
      "thumbnail": "https://img.youtube.com/vi/cf4_FMcM-uA/hqdefault.jpg",
      "views": 9146480
    },
    {
      "videoId": "I49Ul7ttrxE",
      "title": "Đức Phúc - Quá Khứ Đôi, Hiện Tại Đơn (Official Music Video)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "6:44",
      "thumbnail": "https://img.youtube.com/vi/I49Ul7ttrxE/hqdefault.jpg",
      "views": 8792895
    },
    {
      "videoId": "2w8yzyzFDao",
      "title": "TÓC TIÊN x MEW AMAZING | \"906090\" | OFFICIAL MV",
      "author": "Tóc Tiên",
      "duration": "4:06",
      "thumbnail": "https://img.youtube.com/vi/2w8yzyzFDao/hqdefault.jpg",
      "views": 8570803
    },
    {
      "videoId": "aNLmz22WrOQ",
      "title": "SOOBIN HOÀNG SƠN | I KNOW YOU KNOW | Official MV",
      "author": "SOOBIN Official",
      "duration": "4:58",
      "thumbnail": "https://img.youtube.com/vi/aNLmz22WrOQ/hqdefault.jpg",
      "views": 8533562
    },
    {
      "videoId": "ngbqjNPSMQk",
      "title": "Vũ. feat. Hà Anh Tuấn - Dành Hết Xuân Thì Để Chờ Nhau (Official MV)",
      "author": "Vũ Official",
      "duration": "5:54",
      "thumbnail": "https://img.youtube.com/vi/ngbqjNPSMQk/hqdefault.jpg",
      "views": 8228757
    },
    {
      "videoId": "iarkUNi1L1c",
      "title": "Đắng Cay Nhân Gian - Vương Lâm",
      "author": "Chi lâm official",
      "duration": "4:46",
      "thumbnail": "https://img.youtube.com/vi/iarkUNi1L1c/hqdefault.jpg",
      "views": 8078155
    },
    {
      "videoId": "2cBuk4B8yFQ",
      "title": "Trạng Thái Mộng Mơ - Đỗ Hoàng Long",
      "author": "Đỗ Hoàng Long",
      "duration": "5:42",
      "thumbnail": "https://img.youtube.com/vi/2cBuk4B8yFQ/hqdefault.jpg",
      "views": 8069835
    },
    {
      "videoId": "aSgtdyXqze4",
      "title": "TÓC TIÊN | TỪ NHỮNG THÓI QUEN | OFFICIAL MV",
      "author": "Tóc Tiên",
      "duration": "4:21",
      "thumbnail": "https://img.youtube.com/vi/aSgtdyXqze4/hqdefault.jpg",
      "views": 7745065
    },
    {
      "videoId": "EvhS_STJPKY",
      "title": "Hoàng Thùy Linh - Lắm Mối Tối Ngồi Không (Run After Two Hares, Catch Nones) | Official Lyrics Video",
      "author": "Hoàng Thùy Linh",
      "duration": "3:13",
      "thumbnail": "https://img.youtube.com/vi/EvhS_STJPKY/hqdefault.jpg",
      "views": 7149638
    },
    {
      "videoId": "Sgnvq0fhGHA",
      "title": "Đức Phúc - Đi Chùa Cầu Duyên (Official Music Video) | Valentine 2024",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "3:59",
      "thumbnail": "https://img.youtube.com/vi/Sgnvq0fhGHA/hqdefault.jpg",
      "views": 6719811
    },
    {
      "videoId": "aEHSS6Q94S4",
      "title": "SOOBIN X BINZ - BEAUTIFUL MONSTER | Official MV",
      "author": "SOOBIN Official",
      "duration": "4:17",
      "thumbnail": "https://img.youtube.com/vi/aEHSS6Q94S4/hqdefault.jpg",
      "views": 6649205
    },
    {
      "videoId": "WcdVPbfF__8",
      "title": "Nhường Lại Nỗi Đau - Ngân Ngân",
      "author": "Ngân Ngân Official and 2 more",
      "duration": "3:32",
      "thumbnail": "https://img.youtube.com/vi/WcdVPbfF__8/hqdefault.jpg",
      "views": 6583228
    },
    {
      "videoId": "lomg3JLjIQc",
      "title": "SOOBIN's 숲 (Original Song: 최유리) - TXT (투모로우바이투게더)",
      "author": "TOMORROW X TOGETHER OFFICIAL",
      "duration": "3:53",
      "thumbnail": "https://img.youtube.com/vi/lomg3JLjIQc/hqdefault.jpg",
      "views": 6467762
    },
    {
      "videoId": "sVmgsS8_fc8",
      "title": "Vũ. - Phút Ban Đầu (First Moment - The Original 2014 Version) Lyrics Video",
      "author": "Vũ Official",
      "duration": "4:01",
      "thumbnail": "https://img.youtube.com/vi/sVmgsS8_fc8/hqdefault.jpg",
      "views": 6310380
    },
    {
      "videoId": "NpI4TSgBVTw",
      "title": "HIEUTHUHAI - Mong Năm Mới Trải Hoa (prod. by Kewtiie) I Official Music Video",
      "author": "HIEUTHUHAI",
      "duration": "3:06",
      "thumbnail": "https://img.youtube.com/vi/NpI4TSgBVTw/hqdefault.jpg",
      "views": 6238703
    },
    {
      "videoId": "tIevzRhfkMg",
      "title": "Tóc Tiên - BIG GIRLS DON'T CRY - TLVR RMX (Official MV)",
      "author": "Tóc Tiên",
      "duration": "4:18",
      "thumbnail": "https://img.youtube.com/vi/tIevzRhfkMg/hqdefault.jpg",
      "views": 6072316
    },
    {
      "videoId": "Ta1aWgm6Fd8",
      "title": "VỖ TAY - Phương Ly như nàng công chúa cổ động tinh thần | Em Xinh Say Hi [Performance]",
      "author": "Vie Channel - MUSIC",
      "duration": "5:20",
      "thumbnail": "https://img.youtube.com/vi/Ta1aWgm6Fd8/hqdefault.jpg",
      "views": 5764806
    },
    {
      "videoId": "OS7gDIHU7ms",
      "title": "TÓC TIÊN | EM ĐÃ CÓ NGƯỜI MỚI | OFFICIAL MV",
      "author": "Tóc Tiên",
      "duration": "3:45",
      "thumbnail": "https://img.youtube.com/vi/OS7gDIHU7ms/hqdefault.jpg",
      "views": 5717663
    },
    {
      "videoId": "42fX4KKYNjQ",
      "title": "CHẬM LẠI (slow down) / Vũ. (Official MV)",
      "author": "Vũ Official",
      "duration": "4:13",
      "thumbnail": "https://img.youtube.com/vi/42fX4KKYNjQ/hqdefault.jpg",
      "views": 5706948
    },
    {
      "videoId": "NdHSOup5mZM",
      "title": "Vũ - Một Giấc Mơ (A Dream) ft. Kimmese / OFFICIAL MV",
      "author": "Vũ Official",
      "duration": "3:49",
      "thumbnail": "https://img.youtube.com/vi/NdHSOup5mZM/hqdefault.jpg",
      "views": 5449126
    },
    {
      "videoId": "BdS6cGtA-q4",
      "title": "TÓC TIÊN | Thì Em Vẫn ThẾ | Official Music Video",
      "author": "Tóc Tiên",
      "duration": "4:32",
      "thumbnail": "https://img.youtube.com/vi/BdS6cGtA-q4/hqdefault.jpg",
      "views": 4906774
    },
    {
      "videoId": "dytPiW3fef0",
      "title": "HIEUTHUHAI - Chờ Tới Khi Anh Về ft. Hoàng Tôn (prod. by Kewtiie) | Official Lyric Video",
      "author": "HIEUTHUHAI",
      "duration": "3:34",
      "thumbnail": "https://img.youtube.com/vi/dytPiW3fef0/hqdefault.jpg",
      "views": 4737101
    },
    {
      "videoId": "o9thOizwRW4",
      "title": "수빈 (SOOBIN) 'Sunday Driver' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:07",
      "thumbnail": "https://img.youtube.com/vi/o9thOizwRW4/hqdefault.jpg",
      "views": 4624898
    },
    {
      "videoId": "crPfK9EDAKc",
      "title": "Hóa Giải Bằng Nước Mắt - Cao Thái Sơn, Lê Chí Trung",
      "author": "Cao Thái Sơn",
      "duration": "5:07",
      "thumbnail": "https://img.youtube.com/vi/crPfK9EDAKc/hqdefault.jpg",
      "views": 4578134
    },
    {
      "videoId": "Evb0k0Oak58",
      "title": "Hoàng Thuỳ Linh, Đen - Miền Đất Hứa (Official Music Video)",
      "author": "Hoàng Thùy Linh",
      "duration": "4:09",
      "thumbnail": "https://img.youtube.com/vi/Evb0k0Oak58/hqdefault.jpg",
      "views": 4454795
    },
    {
      "videoId": "suHyMFtWtFw",
      "title": "Thư Chưa Gửi Anh | OFFICIAL MV | Hòa Minzy",
      "author": "Hòa Minzy",
      "duration": "7:17",
      "thumbnail": "https://img.youtube.com/vi/suHyMFtWtFw/hqdefault.jpg",
      "views": 4212774
    },
    {
      "videoId": "bySiboHg4xI",
      "title": "Đức Phúc (Việt Nam 🇻🇳) - Phù Đổng Thiên Vương (Official Live Stage) | Winner of the Intervision 2025",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "3:47",
      "thumbnail": "https://img.youtube.com/vi/bySiboHg4xI/hqdefault.jpg",
      "views": 4043460
    },
    {
      "videoId": "dOZ1gK5YFBI",
      "title": "ĐÃ ĐẾN LÚC | Soobin Hoàng Sơn x Slim V [Official MV]",
      "author": "SOOBIN Official",
      "duration": "4:29",
      "thumbnail": "https://img.youtube.com/vi/dOZ1gK5YFBI/hqdefault.jpg",
      "views": 3967552
    },
    {
      "videoId": "tMOQ_lII7Ao",
      "title": "TÓC TIÊN | người  còn  thương  em  không | OFFICIAL MV",
      "author": "Tóc Tiên",
      "duration": "4:55",
      "thumbnail": "https://img.youtube.com/vi/tMOQ_lII7Ao/hqdefault.jpg",
      "views": 3926333
    },
    {
      "videoId": "yuuWdm5tBD0",
      "title": "SON TUNG M-TP | COME MY WAY (softer version) | OFFICIAL MUSIC VIDEO",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:13",
      "thumbnail": "https://img.youtube.com/vi/yuuWdm5tBD0/hqdefault.jpg",
      "views": 3809999
    },
    {
      "videoId": "Vt4kAu-ziRY",
      "title": "Em Của Ngày Hôm Qua - Sơn Tùng MTP [OFFICIAL MV]",
      "author": "Sơn Tùng M-TP",
      "duration": "4:55",
      "thumbnail": "https://img.youtube.com/vi/Vt4kAu-ziRY/hqdefault.jpg",
      "views": 3803495
    },
    {
      "videoId": "awB3lac_L10",
      "title": "TÓC TIÊN | MÌNH YÊU ĐẾN ĐÂY THÔI | OFFICIAL MV",
      "author": "Tóc Tiên",
      "duration": "5:05",
      "thumbnail": "https://img.youtube.com/vi/awB3lac_L10/hqdefault.jpg",
      "views": 3542207
    },
    {
      "videoId": "umMQf9spwMw",
      "title": "HIEUTHUHAI - Người Im Lặng Gặp Người Hay Nói (prod. by Kewtiie) | Official Lyric Video",
      "author": "HIEUTHUHAI",
      "duration": "4:16",
      "thumbnail": "https://img.youtube.com/vi/umMQf9spwMw/hqdefault.jpg",
      "views": 3367262
    },
    {
      "videoId": "d3hXxAAuP2U",
      "title": "PHƯƠNG LY - VỖ TAY (EM THÂN YÊU EM GIỎI QUÁ ĐI VERSION) | OFFICIAL MUSIC VIDEO",
      "author": "Phuong Ly Official",
      "duration": "4:37",
      "thumbnail": "https://img.youtube.com/vi/d3hXxAAuP2U/hqdefault.jpg",
      "views": 3280419
    },
    {
      "videoId": "bbparYMZ1tg",
      "title": "Hoàng Thùy Linh - Kẽo Cà Kẽo Kẹt (The Creeking) | Official Lyrics Video",
      "author": "Hoàng Thùy Linh",
      "duration": "3:19",
      "thumbnail": "https://img.youtube.com/vi/bbparYMZ1tg/hqdefault.jpg",
      "views": 3277406
    },
    {
      "videoId": "8mMADtcLHrc",
      "title": "Đã Từng Là / Vũ. (Official MV)",
      "author": "Vũ Official",
      "duration": "4:27",
      "thumbnail": "https://img.youtube.com/vi/8mMADtcLHrc/hqdefault.jpg",
      "views": 3274238
    },
    {
      "videoId": "Wxl0SVqvfqE",
      "title": "NGƯỜI VIỆT MÌNH THƯƠNG NHAU - Cẩm Ly x Hòa Minzy x Châu Đăng Khoa / Official MV / Gala Nhạc Việt",
      "author": "Gala Nhạc Việt and 4 more",
      "duration": "3:45",
      "thumbnail": "https://img.youtube.com/vi/Wxl0SVqvfqE/hqdefault.jpg",
      "views": 3156241
    },
    {
      "videoId": "W7rindfYUHk",
      "title": "Số 1 Thế Giới - Phát Huy T4",
      "author": "Phát Huy T4",
      "duration": "3:28",
      "thumbnail": "https://img.youtube.com/vi/W7rindfYUHk/hqdefault.jpg",
      "views": 2849974
    },
    {
      "videoId": "qputYVzxMCk",
      "title": "HIEUTHUHAI x Trang Hý - Thế Mới Ngon (Official MV)",
      "author": "Pizza Hut Việt Nam",
      "duration": "1:37",
      "thumbnail": "https://img.youtube.com/vi/qputYVzxMCk/hqdefault.jpg",
      "views": 2820792
    },
    {
      "videoId": "xmMOQW3tWOU",
      "title": "TÓC TIÊN x TLINH | LIKE THIS LIKE THAT | OFFICIAL MV",
      "author": "Tóc Tiên",
      "duration": "3:52",
      "thumbnail": "https://img.youtube.com/vi/xmMOQW3tWOU/hqdefault.jpg",
      "views": 2687970
    },
    {
      "videoId": "Cmz5f3Sock4",
      "title": "HIEUTHUHAI - Hết Yêu (prod. by Kewtiie) | Official Lyric Video",
      "author": "HIEUTHUHAI",
      "duration": "4:02",
      "thumbnail": "https://img.youtube.com/vi/Cmz5f3Sock4/hqdefault.jpg",
      "views": 2634148
    },
    {
      "videoId": "5y0609JR34A",
      "title": "Vô Giá - Minh Vương M4U, H2O Music",
      "author": "Minh Vương M4U",
      "duration": "3:43",
      "thumbnail": "https://img.youtube.com/vi/5y0609JR34A/hqdefault.jpg",
      "views": 2632185
    },
    {
      "videoId": "3Uj0tBjn36I",
      "title": "Jack - J97 | Hoa Diên Vĩ | Live Performance",
      "author": "J97 Promotion",
      "duration": "3:17",
      "thumbnail": "https://img.youtube.com/vi/3Uj0tBjn36I/hqdefault.jpg",
      "views": 2510850
    },
    {
      "videoId": "HFFaznLry5Q",
      "title": "Khó Gần Dễ Xa - Thanh Hưng",
      "author": "Thanh Hưng Official",
      "duration": "5:17",
      "thumbnail": "https://img.youtube.com/vi/HFFaznLry5Q/hqdefault.jpg",
      "views": 2413578
    },
    {
      "videoId": "PbGFo979Fs8",
      "title": "Tóc Tiên - Walk Away (Hãy Bước Đi) | Official Music Video",
      "author": "Tóc Tiên",
      "duration": "3:24",
      "thumbnail": "https://img.youtube.com/vi/PbGFo979Fs8/hqdefault.jpg",
      "views": 2297758
    },
    {
      "videoId": "gf1p0ASBVNA",
      "title": "SOOBIN's 나의 봄의 이유 (Original Song: Paul Kim) - TXT (투모로우바이투게더)",
      "author": "TOMORROW X TOGETHER OFFICIAL",
      "duration": "3:21",
      "thumbnail": "https://img.youtube.com/vi/gf1p0ASBVNA/hqdefault.jpg",
      "views": 2270753
    },
    {
      "videoId": "NjRfSEf8h9o",
      "title": "TÓC TIÊN - D.C.M.A feat Big Daddy & Andree (Official MV)",
      "author": "Tóc Tiên",
      "duration": "6:17",
      "thumbnail": "https://img.youtube.com/vi/NjRfSEf8h9o/hqdefault.jpg",
      "views": 2113891
    },
    {
      "videoId": "XfNnJLoie9Q",
      "title": "Đức Phúc - Nam Sinh Nữ Sinh (Em Gái Mưa OST) (Official Music Video)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "6:17",
      "thumbnail": "https://img.youtube.com/vi/XfNnJLoie9Q/hqdefault.jpg",
      "views": 2007485
    },
    {
      "videoId": "HIb-iZfIOeU",
      "title": "TOP 10 NHẠC TRẺ VIỆT ĐƯỢC XEM NHIỀU NHẤT YOUTUBE TRONG 10 NĂM QUA | 2014 - 2023 VPOP",
      "author": "Bảng Xếp Hạng Âm Nhạc",
      "duration": "9:45",
      "thumbnail": "https://img.youtube.com/vi/HIb-iZfIOeU/hqdefault.jpg",
      "views": 1988530
    },
    {
      "videoId": "etcB1YkDWIM",
      "title": "Tóc Tiên - I'm In Love - Phụ nữ là để yêu (Official MV)",
      "author": "Tóc Tiên",
      "duration": "4:14",
      "thumbnail": "https://img.youtube.com/vi/etcB1YkDWIM/hqdefault.jpg",
      "views": 1962163
    },
    {
      "videoId": "RkgqKIjnpGs",
      "title": "HIEUTHUHAI - Anh Nên Đi Khỏi Đây (prod. by Kewtiie) | Official Lyric Video",
      "author": "HIEUTHUHAI",
      "duration": "3:20",
      "thumbnail": "https://img.youtube.com/vi/RkgqKIjnpGs/hqdefault.jpg",
      "views": 1883653
    },
    {
      "videoId": "h41MsBK6ERY",
      "title": "Mặt Trời Của Em - Phương Ly  x Trọng Nhân x JustaTee (Bếp Núc Version)",
      "author": "Phuong Ly Official",
      "duration": "4:09",
      "thumbnail": "https://img.youtube.com/vi/h41MsBK6ERY/hqdefault.jpg",
      "views": 1837999
    },
    {
      "videoId": "8iX5XtfqwHU",
      "title": "LITTLE LOVE (BUT NO LIMIT) - PHƯƠNG LY | OFFICIAL MUSIC VIDEO",
      "author": "Phuong Ly Official",
      "duration": "4:12",
      "thumbnail": "https://img.youtube.com/vi/8iX5XtfqwHU/hqdefault.jpg",
      "views": 1821487
    },
    {
      "videoId": "7spBkzzFUto",
      "title": "TỰ NHIÊN BUỒN (FULL MV) | HÒA MINZY",
      "author": "Hòa Minzy",
      "duration": "4:27",
      "thumbnail": "https://img.youtube.com/vi/7spBkzzFUto/hqdefault.jpg",
      "views": 1652219
    },
    {
      "videoId": "IlKDjFa85Qc",
      "title": "SOOBIN - SUNSET IN THE CITY | Official MV",
      "author": "SOOBIN Official",
      "duration": "4:20",
      "thumbnail": "https://img.youtube.com/vi/IlKDjFa85Qc/hqdefault.jpg",
      "views": 1533755
    },
    {
      "videoId": "F6PJlR5aGhI",
      "title": "Nam Chính - Châu Khải Phong, PoorBoy, 93NewG",
      "author": "Châu Khải Phong",
      "duration": "4:28",
      "thumbnail": "https://img.youtube.com/vi/F6PJlR5aGhI/hqdefault.jpg",
      "views": 1504742
    },
    {
      "videoId": "XV9zTJLbmFw",
      "title": "Hôn Lễ Của Em - Trọng Nhân, Tiểu Mỹ",
      "author": "Tiểu Mỹ Official",
      "duration": "4:34",
      "thumbnail": "https://img.youtube.com/vi/XV9zTJLbmFw/hqdefault.jpg",
      "views": 1453372
    },
    {
      "videoId": "QQDsJx1W-Ng",
      "title": "SOOBIN x SlimV x Rhymastic - Tự Yours (Official MV)",
      "author": "SOOBIN Official",
      "duration": "4:13",
      "thumbnail": "https://img.youtube.com/vi/QQDsJx1W-Ng/hqdefault.jpg",
      "views": 1448083
    },
    {
      "videoId": "JgBrEseFEoU",
      "title": "It's A New Dawn - SOOBIN x HÀNH TRÌNH AFK (Official MV)",
      "author": "SOOBIN Official",
      "duration": "3:47",
      "thumbnail": "https://img.youtube.com/vi/JgBrEseFEoU/hqdefault.jpg",
      "views": 1298652
    },
    {
      "videoId": "bqDmW2XS0S4",
      "title": "TÓC TIÊN | TRÊN CHUYẾN XE LÊN ĐÀ LẠT CHIỀU NAY | OFFICIAL MV",
      "author": "Tóc Tiên",
      "duration": "3:59",
      "thumbnail": "https://img.youtube.com/vi/bqDmW2XS0S4/hqdefault.jpg",
      "views": 1256707
    },
    {
      "videoId": "OJjygHoH7zc",
      "title": "Kẻ Dư Thừa - Khang Việt",
      "author": "Khang Việt",
      "duration": "5:23",
      "thumbnail": "https://img.youtube.com/vi/OJjygHoH7zc/hqdefault.jpg",
      "views": 1229944
    },
    {
      "videoId": "KnH8CUdI6_0",
      "title": "Hoàng Thùy Linh - Fall In Love (feat. Kimmese) | Official Music Video",
      "author": "Hoàng Thùy Linh",
      "duration": "3:58",
      "thumbnail": "https://img.youtube.com/vi/KnH8CUdI6_0/hqdefault.jpg",
      "views": 1207695
    },
    {
      "videoId": "h4WX3B3hj4k",
      "title": "MUỘN PHIỀN – PHƯƠNG LY ft. LOW G | OFFICIAL MV",
      "author": "Phuong Ly Official",
      "duration": "3:40",
      "thumbnail": "https://img.youtube.com/vi/h4WX3B3hj4k/hqdefault.jpg",
      "views": 1160514
    },
    {
      "videoId": "UlVp3okEBXM",
      "title": "VIET-POP 2025 | HƠN 50 BÀI HÁT VIỆT MEGAMIX // by DJ Pizuh",
      "author": "Pizuh",
      "duration": "7:45",
      "thumbnail": "https://img.youtube.com/vi/UlVp3okEBXM/hqdefault.jpg",
      "views": 1152396
    },
    {
      "videoId": "LxsRsYMA3PY",
      "title": "Hoàng Thùy Linh - Chuyện Tình Lá Gió (Love Story of Wind and Leaf) | Lyrics MV",
      "author": "Hoàng Thùy Linh",
      "duration": "5:18",
      "thumbnail": "https://img.youtube.com/vi/LxsRsYMA3PY/hqdefault.jpg",
      "views": 1074201
    },
    {
      "videoId": "BHbA3zni0gI",
      "title": "Top 30 MV Nhạc Chế Việt (Parody) Nhiều Lượt Xem Nhất Youtube (10.2023) | VIETNAM PARODY",
      "author": "Bảng Xếp Hạng Âm Nhạc",
      "duration": "3:36",
      "thumbnail": "https://img.youtube.com/vi/BHbA3zni0gI/hqdefault.jpg",
      "views": 1010189
    },
    {
      "videoId": "WP9j_S955UE",
      "title": "Đức Phúc - Hơn Cả Hạnh Phúc (Official Music Video)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "6:20",
      "thumbnail": "https://img.youtube.com/vi/WP9j_S955UE/hqdefault.jpg",
      "views": 921906
    },
    {
      "videoId": "mvnLoBB4RZM",
      "title": "Top 100 Nhạc Trẻ Việt Của Năm 2024 Nhiều View Nhất Youtube (12.2024) | Tổng Kết Vpop 2024",
      "author": "Bảng Xếp Hạng Âm Nhạc",
      "duration": "9:31",
      "thumbnail": "https://img.youtube.com/vi/mvnLoBB4RZM/hqdefault.jpg",
      "views": 759953
    },
    {
      "videoId": "ofDcHDMvBJ4",
      "title": "Top 50 Nhạc Trẻ Việt Năm 2024 Nhiều Lượt Xem Nhất Youtube (10.2024) | 2024 Vpop",
      "author": "Bảng Xếp Hạng Âm Nhạc",
      "duration": "4:55",
      "thumbnail": "https://img.youtube.com/vi/ofDcHDMvBJ4/hqdefault.jpg",
      "views": 535666
    },
    {
      "videoId": "dcZHwlBgh2s",
      "title": "Đức Phúc - Niệm Khúc Cuối (Tháng Năm Rực Rỡ OST) (Official Music Video)",
      "author": "ĐỨC PHÚC OFFICIAL",
      "duration": "4:11",
      "thumbnail": "https://img.youtube.com/vi/dcZHwlBgh2s/hqdefault.jpg",
      "views": 525570
    },
    {
      "videoId": "OhJ6-oiRwsg",
      "title": "Gió Đêm Qua Đường - Chu Thúy Quỳnh",
      "author": "Chu Thuy Quynh Official",
      "duration": "4:20",
      "thumbnail": "https://img.youtube.com/vi/OhJ6-oiRwsg/hqdefault.jpg",
      "views": 517510
    },
    {
      "videoId": "6qBeZRPkfqs",
      "title": "Mr.T - Ăn Gì Đây ft. Hòa Minzy | Official MV (2015)",
      "author": "MR.T Official",
      "duration": "4:57",
      "thumbnail": "https://img.youtube.com/vi/6qBeZRPkfqs/hqdefault.jpg",
      "views": 379290
    },
    {
      "videoId": "i7Ls_sHlvj0",
      "title": "Cười Trên Vết Nứt - Hàn Việt Phong, LQ MEDIA",
      "author": "LQ MEDIA",
      "duration": "4:26",
      "thumbnail": "https://img.youtube.com/vi/i7Ls_sHlvj0/hqdefault.jpg",
      "views": 240031
    },
    {
      "videoId": "hO4X_mJSqPI",
      "title": "Cơn Mưa Ngang Qua - Sơn Tùng MTP [OFFICIAL MV]",
      "author": "Sơn Tùng M-TP",
      "duration": "3:51",
      "thumbnail": "https://img.youtube.com/vi/hO4X_mJSqPI/hqdefault.jpg",
      "views": 233635
    },
    {
      "videoId": "K6AzP-YX-is",
      "title": "Không Phải Dạng Vừa Đâu   Sơn Tùng M TP Official MV",
      "author": "Son tung We Love M-TP",
      "duration": "4:45",
      "thumbnail": "https://img.youtube.com/vi/K6AzP-YX-is/hqdefault.jpg",
      "views": 222052
    },
    {
      "videoId": "ZYO9ObsA38c",
      "title": "Mr.T - Ăn Gì Đây 2 ft. Hòa Minzy | Official MV (2016)",
      "author": "MR.T Official",
      "duration": "4:34",
      "thumbnail": "https://img.youtube.com/vi/ZYO9ObsA38c/hqdefault.jpg",
      "views": 99674
    },
    {
      "videoId": "_5W0ljS3vT0",
      "title": "Mở Lòng Vì Ai - Ivan",
      "author": "Ivan Lý Văn Official",
      "duration": "4:57",
      "thumbnail": "https://img.youtube.com/vi/_5W0ljS3vT0/hqdefault.jpg",
      "views": 45225
    },
    {
      "videoId": "TYaAUBYEWuY",
      "title": "Top Bài Hát Vpop 2026 Có Lượt Xem Cao Nhất Trên YouTube (5.2026) | Nhạc Việt 2026",
      "author": "Bảng Xếp Hạng Âm Nhạc",
      "duration": "4:50",
      "thumbnail": "https://img.youtube.com/vi/TYaAUBYEWuY/hqdefault.jpg",
      "views": 45143
    },
    {
      "videoId": "8eFoEu23B2E",
      "title": "Top Nhạc Trẻ Việt Sắp Cán Mốc 100 Triệu View Trên Youtube (6.2026) | Vpop Gần 100M View",
      "author": "Bảng Xếp Hạng Âm Nhạc",
      "duration": "4:50",
      "thumbnail": "https://img.youtube.com/vi/8eFoEu23B2E/hqdefault.jpg",
      "views": 42566
    },
    {
      "videoId": "_m3tdC9DQlY",
      "title": "TOP VPOP NHIỀU LƯỢT XEM NHẤT TUẦN QUA | TUẦN 2 - THÁNG 7 (2026)",
      "author": "Bảng Xếp Hạng Âm Nhạc",
      "duration": "3:14",
      "thumbnail": "https://img.youtube.com/vi/_m3tdC9DQlY/hqdefault.jpg",
      "views": 39829
    },
    {
      "videoId": "SfM6igDswow",
      "title": "Top Bài Hát Vpop 2026 Có Lượt Xem Cao Nhất Trên YouTube (2.2026) | Nhạc Việt 2026",
      "author": "Bảng Xếp Hạng Âm Nhạc",
      "duration": "3:54",
      "thumbnail": "https://img.youtube.com/vi/SfM6igDswow/hqdefault.jpg",
      "views": 35651
    },
    {
      "videoId": "qMotyvFWxsY",
      "title": "Top 100 Bài Hát Vpop 2024 Có Lượt Xem Cao Nhất Trên YouTube (12.2025) | Nhạc Trẻ Việt 2024",
      "author": "Bảng Xếp Hạng Âm Nhạc",
      "duration": "9:25",
      "thumbnail": "https://img.youtube.com/vi/qMotyvFWxsY/hqdefault.jpg",
      "views": 33298
    },
    {
      "videoId": "n6YzdGUdJxg",
      "title": "Top Bài Hát Vpop 2026 Có Lượt Xem Cao Nhất Trên YouTube (4.2026) | Nhạc Việt 2026",
      "author": "Bảng Xếp Hạng Âm Nhạc",
      "duration": "4:50",
      "thumbnail": "https://img.youtube.com/vi/n6YzdGUdJxg/hqdefault.jpg",
      "views": 33251
    },
    {
      "videoId": "CO6LsxHIlYA",
      "title": "Chắc Chắn Một Người (Version 1) - TLong, LKT Media",
      "author": "TLong - Topic",
      "duration": "3:46",
      "thumbnail": "https://img.youtube.com/vi/CO6LsxHIlYA/hqdefault.jpg",
      "views": 10945
    }
  ],
  "kpop": [
    {
      "videoId": "ekr2nIex040",
      "title": "ROSÉ & Bruno Mars - APT. (Official Music Video)",
      "author": "ROSÉ and Bruno Mars",
      "duration": "2:54",
      "thumbnail": "https://img.youtube.com/vi/ekr2nIex040/hqdefault.jpg",
      "views": 2587049730
    },
    {
      "videoId": "IHNzOHi8sJs",
      "title": "BLACKPINK - ‘뚜두뚜두 (DDU-DU DDU-DU)’ M/V",
      "author": "BLACKPINK",
      "duration": "3:36",
      "thumbnail": "https://img.youtube.com/vi/IHNzOHi8sJs/hqdefault.jpg",
      "views": 2399563895
    },
    {
      "videoId": "2S24-y0Ij3Y",
      "title": "BLACKPINK - 'Kill This Love' M/V",
      "author": "BLACKPINK",
      "duration": "3:14",
      "thumbnail": "https://img.youtube.com/vi/2S24-y0Ij3Y/hqdefault.jpg",
      "views": 2226144147
    },
    {
      "videoId": "gdZLi9oWNZg",
      "title": "BTS (방탄소년단) 'Dynamite' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:44",
      "thumbnail": "https://img.youtube.com/vi/gdZLi9oWNZg/hqdefault.jpg",
      "views": 2111131923
    },
    {
      "videoId": "32si5cfrCNc",
      "title": "BLACKPINK - 'How You Like That' DANCE PERFORMANCE VIDEO",
      "author": "BLACKPINK",
      "duration": "3:01",
      "thumbnail": "https://img.youtube.com/vi/32si5cfrCNc/hqdefault.jpg",
      "views": 2021600540
    },
    {
      "videoId": "bwmSjveL3Lc",
      "title": "BLACKPINK - '붐바야 (BOOMBAYAH)' M/V",
      "author": "BLACKPINK",
      "duration": "4:04",
      "thumbnail": "https://img.youtube.com/vi/bwmSjveL3Lc/hqdefault.jpg",
      "views": 1886673367
    },
    {
      "videoId": "MBdVXkSdhwU",
      "title": "BTS (방탄소년단) 'DNA' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:16",
      "thumbnail": "https://img.youtube.com/vi/MBdVXkSdhwU/hqdefault.jpg",
      "views": 1665102740
    },
    {
      "videoId": "kTlv5_Bs8aw",
      "title": "BTS (방탄소년단) 'MIC Drop (Steve Aoki Remix)' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:34",
      "thumbnail": "https://img.youtube.com/vi/kTlv5_Bs8aw/hqdefault.jpg",
      "views": 1586911460
    },
    {
      "videoId": "Amq-qlqbjYA",
      "title": "BLACKPINK - '마지막처럼 (AS IF IT'S YOUR LAST)' M/V",
      "author": "BLACKPINK",
      "duration": "3:37",
      "thumbnail": "https://img.youtube.com/vi/Amq-qlqbjYA/hqdefault.jpg",
      "views": 1529193096
    },
    {
      "videoId": "ioNng23DkIM",
      "title": "BLACKPINK - 'How You Like That' M/V",
      "author": "BLACKPINK",
      "duration": "3:04",
      "thumbnail": "https://img.youtube.com/vi/ioNng23DkIM/hqdefault.jpg",
      "views": 1375204960
    },
    {
      "videoId": "dNCWe_6HAM8",
      "title": "LISA - 'MONEY' EXCLUSIVE PERFORMANCE VIDEO",
      "author": "BLACKPINK",
      "duration": "2:51",
      "thumbnail": "https://img.youtube.com/vi/dNCWe_6HAM8/hqdefault.jpg",
      "views": 1226218579
    },
    {
      "videoId": "WMweEpGlu_U",
      "title": "BTS (방탄소년단) 'Butter' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:03",
      "thumbnail": "https://img.youtube.com/vi/WMweEpGlu_U/hqdefault.jpg",
      "views": 1099073231
    },
    {
      "videoId": "gQlMMD8auMs",
      "title": "BLACKPINK - ‘Pink Venom’ M/V",
      "author": "BLACKPINK",
      "duration": "3:14",
      "thumbnail": "https://img.youtube.com/vi/gQlMMD8auMs/hqdefault.jpg",
      "views": 1088026113
    },
    {
      "videoId": "vRXZj0DzXIA",
      "title": "BLACKPINK - 'Ice Cream (with Selena Gomez)' M/V",
      "author": "BLACKPINK",
      "duration": "3:03",
      "thumbnail": "https://img.youtube.com/vi/vRXZj0DzXIA/hqdefault.jpg",
      "views": 1008767888
    },
    {
      "videoId": "9pdj4iJD08s",
      "title": "BLACKPINK - '불장난 (PLAYING WITH FIRE)' M/V",
      "author": "BLACKPINK",
      "duration": "3:29",
      "thumbnail": "https://img.youtube.com/vi/9pdj4iJD08s/hqdefault.jpg",
      "views": 968817220
    },
    {
      "videoId": "dISNgvVpWlo",
      "title": "BLACKPINK - '휘파람 (WHISTLE)' M/V",
      "author": "BLACKPINK",
      "duration": "3:51",
      "thumbnail": "https://img.youtube.com/vi/dISNgvVpWlo/hqdefault.jpg",
      "views": 963630219
    },
    {
      "videoId": "i0p1bmr0EmE",
      "title": "TWICE \"What is Love?\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:44",
      "thumbnail": "https://img.youtube.com/vi/i0p1bmr0EmE/hqdefault.jpg",
      "views": 931125852
    },
    {
      "videoId": "dyRsYk0LyA8",
      "title": "BLACKPINK - 'Lovesick Girls' M/V",
      "author": "BLACKPINK",
      "duration": "3:22",
      "thumbnail": "https://img.youtube.com/vi/dyRsYk0LyA8/hqdefault.jpg",
      "views": 859470581
    },
    {
      "videoId": "POe9SOEKotk",
      "title": "BLACKPINK - ‘Shut Down’ M/V",
      "author": "BLACKPINK",
      "duration": "3:01",
      "thumbnail": "https://img.youtube.com/vi/POe9SOEKotk/hqdefault.jpg",
      "views": 814484502
    },
    {
      "videoId": "CuklIb9d3fI",
      "title": "BTS (방탄소년단) 'Permission to Dance' Official MV",
      "author": "HYBE LABELS",
      "duration": "5:00",
      "thumbnail": "https://img.youtube.com/vi/CuklIb9d3fI/hqdefault.jpg",
      "views": 723496419
    },
    {
      "videoId": "ePpPVE-GGJw",
      "title": "TWICE \"TT\" M/V",
      "author": "JYP Entertainment",
      "duration": "4:14",
      "thumbnail": "https://img.youtube.com/vi/ePpPVE-GGJw/hqdefault.jpg",
      "views": 717603285
    },
    {
      "videoId": "kOHB85vDuow",
      "title": "TWICE \"FANCY\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:39",
      "thumbnail": "https://img.youtube.com/vi/kOHB85vDuow/hqdefault.jpg",
      "views": 698845334
    },
    {
      "videoId": "V2hlQkVJZhE",
      "title": "TWICE \"LIKEY\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:42",
      "thumbnail": "https://img.youtube.com/vi/V2hlQkVJZhE/hqdefault.jpg",
      "views": 662948618
    },
    {
      "videoId": "0lapF4DQPKQ",
      "title": "BTS (방탄소년단) 'Black Swan' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:38",
      "thumbnail": "https://img.youtube.com/vi/0lapF4DQPKQ/hqdefault.jpg",
      "views": 604739656
    },
    {
      "videoId": "-5q5mZbe3V8",
      "title": "BTS (방탄소년단) 'Life Goes On' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:51",
      "thumbnail": "https://img.youtube.com/vi/-5q5mZbe3V8/hqdefault.jpg",
      "views": 600955464
    },
    {
      "videoId": "TQTlCHxyuu8",
      "title": "Stray Kids \"神메뉴(God's Menu)\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:07",
      "thumbnail": "https://img.youtube.com/vi/TQTlCHxyuu8/hqdefault.jpg",
      "views": 572050615
    },
    {
      "videoId": "CM4CkVFmTds",
      "title": "TWICE \"I CAN'T STOP ME\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:41",
      "thumbnail": "https://img.youtube.com/vi/CM4CkVFmTds/hqdefault.jpg",
      "views": 570433870
    },
    {
      "videoId": "f5_wn8mexmM",
      "title": "TWICE \"The Feels\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:52",
      "thumbnail": "https://img.youtube.com/vi/f5_wn8mexmM/hqdefault.jpg",
      "views": 527550192
    },
    {
      "videoId": "rRzxEiBLQCA",
      "title": "TWICE \"Heart Shaker\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:13",
      "thumbnail": "https://img.youtube.com/vi/rRzxEiBLQCA/hqdefault.jpg",
      "views": 492567472
    },
    {
      "videoId": "EaswWiwMVs8",
      "title": "Stray Kids \"소리꾼(Thunderous)\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:19",
      "thumbnail": "https://img.youtube.com/vi/EaswWiwMVs8/hqdefault.jpg",
      "views": 451268798
    },
    {
      "videoId": "2wA_b6YHjqQ",
      "title": "BABYMONSTER - ‘SHEESH’ M/V",
      "author": "BABYMONSTER",
      "duration": "3:06",
      "thumbnail": "https://img.youtube.com/vi/2wA_b6YHjqQ/hqdefault.jpg",
      "views": 413590458
    },
    {
      "videoId": "CgCVZdcKcqY",
      "title": "BLACKPINK - ‘뛰어(JUMP)’ M/V",
      "author": "BLACKPINK",
      "duration": "3:14",
      "thumbnail": "https://img.youtube.com/vi/CgCVZdcKcqY/hqdefault.jpg",
      "views": 411279515
    },
    {
      "videoId": "sVTy_wmn5SU",
      "title": "NewJeans (뉴진스) 'OMG' Official MV (Performance ver.1)",
      "author": "HYBE LABELS",
      "duration": "3:40",
      "thumbnail": "https://img.youtube.com/vi/sVTy_wmn5SU/hqdefault.jpg",
      "views": 409418707
    },
    {
      "videoId": "Fm5iP0S1z9w",
      "title": "TWICE \"Dance The Night Away\" M/V",
      "author": "JYP Entertainment",
      "duration": "4:09",
      "thumbnail": "https://img.youtube.com/vi/Fm5iP0S1z9w/hqdefault.jpg",
      "views": 404427105
    },
    {
      "videoId": "6ZUIwj3FgUY",
      "title": "IVE 아이브 'I AM' MV",
      "author": "STARSHIP and IVE",
      "duration": "3:05",
      "thumbnail": "https://img.youtube.com/vi/6ZUIwj3FgUY/hqdefault.jpg",
      "views": 393910770
    },
    {
      "videoId": "Zp-Jhuhq0bQ",
      "title": "BABYMONSTER - 'DRIP' M/V",
      "author": "BABYMONSTER",
      "duration": "3:07",
      "thumbnail": "https://img.youtube.com/vi/Zp-Jhuhq0bQ/hqdefault.jpg",
      "views": 391769692
    },
    {
      "videoId": "FzVR_fymZw4",
      "title": "BLACKPINK - 'STAY' M/V",
      "author": "BLACKPINK",
      "duration": "4:01",
      "thumbnail": "https://img.youtube.com/vi/FzVR_fymZw4/hqdefault.jpg",
      "views": 383423020
    },
    {
      "videoId": "F0B7HDiY-10",
      "title": "IVE 아이브 'After LIKE' MV",
      "author": "STARSHIP and IVE",
      "duration": "3:01",
      "thumbnail": "https://img.youtube.com/vi/F0B7HDiY-10/hqdefault.jpg",
      "views": 363464397
    },
    {
      "videoId": "mPVDGOVjRQ0",
      "title": "BTS (방탄소년단) 'ON' Official MV",
      "author": "HYBE LABELS",
      "duration": "5:55",
      "thumbnail": "https://img.youtube.com/vi/mPVDGOVjRQ0/hqdefault.jpg",
      "views": 352395644
    },
    {
      "videoId": "OvioeS1ZZ7o",
      "title": "Stray Kids \"MANIAC\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:23",
      "thumbnail": "https://img.youtube.com/vi/OvioeS1ZZ7o/hqdefault.jpg",
      "views": 348701462
    },
    {
      "videoId": "dBDkYofMUs4",
      "title": "Stray Kids \"락 (樂) (LALALALA)\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:20",
      "thumbnail": "https://img.youtube.com/vi/dBDkYofMUs4/hqdefault.jpg",
      "views": 347930788
    },
    {
      "videoId": "olDWm2veCrM",
      "title": "BABYMONSTER - 'BATTER UP' M/V",
      "author": "BABYMONSTER",
      "duration": "3:19",
      "thumbnail": "https://img.youtube.com/vi/olDWm2veCrM/hqdefault.jpg",
      "views": 347201736
    },
    {
      "videoId": "Y8JFxS1HlDo",
      "title": "IVE 아이브 'LOVE DIVE' MV",
      "author": "STARSHIP and IVE",
      "duration": "2:59",
      "thumbnail": "https://img.youtube.com/vi/Y8JFxS1HlDo/hqdefault.jpg",
      "views": 335554531
    },
    {
      "videoId": "Vk5-c_v4gMU",
      "title": "ILLIT (아일릿) ‘Magnetic’ Official MV",
      "author": "HYBE LABELS",
      "duration": "3:09",
      "thumbnail": "https://img.youtube.com/vi/Vk5-c_v4gMU/hqdefault.jpg",
      "views": 332301669
    },
    {
      "videoId": "XA2YEHn-A8Q",
      "title": "TWICE \"Alcohol-Free\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:34",
      "thumbnail": "https://img.youtube.com/vi/XA2YEHn-A8Q/hqdefault.jpg",
      "views": 329769747
    },
    {
      "videoId": "4TWR90KJl84",
      "title": "aespa 에스파 'Next Level' MV",
      "author": "SMTOWN",
      "duration": "3:56",
      "thumbnail": "https://img.youtube.com/vi/4TWR90KJl84/hqdefault.jpg",
      "views": 324865544
    },
    {
      "videoId": "JsOOis4bBFg",
      "title": "Stray Kids \"특(S-Class)\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:31",
      "thumbnail": "https://img.youtube.com/vi/JsOOis4bBFg/hqdefault.jpg",
      "views": 315014236
    },
    {
      "videoId": "zEkg4GBQumc",
      "title": "[M/V] SEVENTEEN(세븐틴) - 울고 싶지 않아 (Don't Wanna Cry)",
      "author": "SEVENTEEN",
      "duration": "3:27",
      "thumbnail": "https://img.youtube.com/vi/zEkg4GBQumc/hqdefault.jpg",
      "views": 305332945
    },
    {
      "videoId": "D8VEhcPeSlc",
      "title": "aespa 에스파 'Drama' MV",
      "author": "SMTOWN",
      "duration": "3:48",
      "thumbnail": "https://img.youtube.com/vi/D8VEhcPeSlc/hqdefault.jpg",
      "views": 303794308
    },
    {
      "videoId": "jWQx2f-CErU",
      "title": "aespa 에스파 'Whiplash' MV",
      "author": "SMTOWN",
      "duration": "3:11",
      "thumbnail": "https://img.youtube.com/vi/jWQx2f-CErU/hqdefault.jpg",
      "views": 302640910
    },
    {
      "videoId": "-GQg25oP0S4",
      "title": "SEVENTEEN (세븐틴) '손오공' Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "3:33",
      "thumbnail": "https://img.youtube.com/vi/-GQg25oP0S4/hqdefault.jpg",
      "views": 300066816
    },
    {
      "videoId": "ZeerrnuLi5E",
      "title": "aespa 에스파 'Black Mamba' MV",
      "author": "SMTOWN",
      "duration": "3:50",
      "thumbnail": "https://img.youtube.com/vi/ZeerrnuLi5E/hqdefault.jpg",
      "views": 291219129
    },
    {
      "videoId": "ArmDp-zijuc",
      "title": "NewJeans (뉴진스) 'Super Shy' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:21",
      "thumbnail": "https://img.youtube.com/vi/ArmDp-zijuc/hqdefault.jpg",
      "views": 291035711
    },
    {
      "videoId": "WPdWvnAAurg",
      "title": "aespa 에스파 'Savage' MV",
      "author": "SMTOWN",
      "duration": "4:19",
      "thumbnail": "https://img.youtube.com/vi/WPdWvnAAurg/hqdefault.jpg",
      "views": 282232523
    },
    {
      "videoId": "pyf8cbqyfPs",
      "title": "LE SSERAFIM (르세라핌) 'ANTIFRAGILE' OFFICIAL M/V",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "3:52",
      "thumbnail": "https://img.youtube.com/vi/pyf8cbqyfPs/hqdefault.jpg",
      "views": 281930658
    },
    {
      "videoId": "9IHwqdz8Xhw",
      "title": "BTS (방탄소년단) 'Stay Gold' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:16",
      "thumbnail": "https://img.youtube.com/vi/9IHwqdz8Xhw/hqdefault.jpg",
      "views": 275153285
    },
    {
      "videoId": "--FmExEAsM8",
      "title": "[MV] IVE(아이브) - ELEVEN",
      "author": "STARSHIP and IVE",
      "duration": "3:04",
      "thumbnail": "https://img.youtube.com/vi/--FmExEAsM8/hqdefault.jpg",
      "views": 264650505
    },
    {
      "videoId": "eJCHKjt0MPw",
      "title": "BABYMONSTER - ‘FOREVER’ M/V",
      "author": "BABYMONSTER",
      "duration": "3:54",
      "thumbnail": "https://img.youtube.com/vi/eJCHKjt0MPw/hqdefault.jpg",
      "views": 259374588
    },
    {
      "videoId": "11cta61wi0g",
      "title": "NewJeans (뉴진스) 'Hype Boy' Official MV (Performance ver.1)",
      "author": "HYBE LABELS",
      "duration": "2:58",
      "thumbnail": "https://img.youtube.com/vi/11cta61wi0g/hqdefault.jpg",
      "views": 249424587
    },
    {
      "videoId": "phuiiNCxRMg",
      "title": "aespa 에스파 'Supernova' MV",
      "author": "SMTOWN",
      "duration": "3:14",
      "thumbnail": "https://img.youtube.com/vi/phuiiNCxRMg/hqdefault.jpg",
      "views": 248750938
    },
    {
      "videoId": "M8r3x4Re8-I",
      "title": "BABYMONSTER - 'LIKE THAT' EXCLUSIVE PERFORMANCE VIDEO",
      "author": "BABYMONSTER",
      "duration": "2:58",
      "thumbnail": "https://img.youtube.com/vi/M8r3x4Re8-I/hqdefault.jpg",
      "views": 245926662
    },
    {
      "videoId": "n6B5gQXlB-0",
      "title": "LE SSERAFIM (르세라핌) 'CRAZY' OFFICIAL MV",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "2:50",
      "thumbnail": "https://img.youtube.com/vi/n6B5gQXlB-0/hqdefault.jpg",
      "views": 224155660
    },
    {
      "videoId": "4vbDFu0PUew",
      "title": "LE SSERAFIM FEARLESS OFFICIAL M/V",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "3:03",
      "thumbnail": "https://img.youtube.com/vi/4vbDFu0PUew/hqdefault.jpg",
      "views": 220745197
    },
    {
      "videoId": "k6jqx9kZgPM",
      "title": "TWICE \"Talk that Talk\" M/V",
      "author": "JYP Entertainment",
      "duration": "2:55",
      "thumbnail": "https://img.youtube.com/vi/k6jqx9kZgPM/hqdefault.jpg",
      "views": 219412686
    },
    {
      "videoId": "wlHwjkYpSr0",
      "title": "BABYMONSTER - ‘WE GO UP’ M/V",
      "author": "BABYMONSTER",
      "duration": "3:23",
      "thumbnail": "https://img.youtube.com/vi/wlHwjkYpSr0/hqdefault.jpg",
      "views": 218418966
    },
    {
      "videoId": "gRnuFC4Ualw",
      "title": "SEVENTEEN (세븐틴) 'HOT' Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "3:20",
      "thumbnail": "https://img.youtube.com/vi/gRnuFC4Ualw/hqdefault.jpg",
      "views": 211138888
    },
    {
      "videoId": "0P0aQreFs8w",
      "title": "Stray Kids \"Chk Chk Boom\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:26",
      "thumbnail": "https://img.youtube.com/vi/0P0aQreFs8w/hqdefault.jpg",
      "views": 210467801
    },
    {
      "videoId": "yd_uG3TtREs",
      "title": "BABYMONSTER - ‘PSYCHO’ M/V",
      "author": "BABYMONSTER",
      "duration": "3:24",
      "thumbnail": "https://img.youtube.com/vi/yd_uG3TtREs/hqdefault.jpg",
      "views": 205039223
    },
    {
      "videoId": "KNexS61fjus",
      "title": "LE SSERAFIM (르세라핌) 'Smart' OFFICIAL MV",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "3:14",
      "thumbnail": "https://img.youtube.com/vi/KNexS61fjus/hqdefault.jpg",
      "views": 194661028
    },
    {
      "videoId": "T17AR8cVmto",
      "title": "Stray Kids \"Chk Chk Boom\" Performance Video",
      "author": "Stray Kids",
      "duration": "2:31",
      "thumbnail": "https://img.youtube.com/vi/T17AR8cVmto/hqdefault.jpg",
      "views": 190252444
    },
    {
      "videoId": "Os_heh8vPfs",
      "title": "aespa 에스파 'Spicy' MV",
      "author": "SMTOWN",
      "duration": "3:25",
      "thumbnail": "https://img.youtube.com/vi/Os_heh8vPfs/hqdefault.jpg",
      "views": 188641628
    },
    {
      "videoId": "nFYwcndNuOY",
      "title": "aespa 에스파 'Armageddon' MV",
      "author": "SMTOWN",
      "duration": "3:33",
      "thumbnail": "https://img.youtube.com/vi/nFYwcndNuOY/hqdefault.jpg",
      "views": 177278748
    },
    {
      "videoId": "K1uuK4QdvGY",
      "title": "ROSÉ & 火星人布魯諾 Bruno Mars - APT. (華納官方中字版)",
      "author": "華納音樂西洋日韓頻道",
      "duration": "2:54",
      "thumbnail": "https://img.youtube.com/vi/K1uuK4QdvGY/hqdefault.jpg",
      "views": 174078993
    },
    {
      "videoId": "xn8mQqz2xmM",
      "title": "BABYMONSTER - ‘HOT SAUCE’ M/V",
      "author": "BABYMONSTER",
      "duration": "2:35",
      "thumbnail": "https://img.youtube.com/vi/xn8mQqz2xmM/hqdefault.jpg",
      "views": 171684718
    },
    {
      "videoId": "x3eqqoZPV_E",
      "title": "BABYMONSTER - '춤 (CHOOM)' M/V",
      "author": "BABYMONSTER",
      "duration": "3:25",
      "thumbnail": "https://img.youtube.com/vi/x3eqqoZPV_E/hqdefault.jpg",
      "views": 169468668
    },
    {
      "videoId": "Sz_wWzgh-vQ",
      "title": "TWICE “Strategy (feat. Megan Thee Stallion)” M/V",
      "author": "JYP Entertainment",
      "duration": "3:51",
      "thumbnail": "https://img.youtube.com/vi/Sz_wWzgh-vQ/hqdefault.jpg",
      "views": 166646870
    },
    {
      "videoId": "jW-bkbSWb4A",
      "title": "Stray Kids 『CIRCUS』 Music Video",
      "author": "Stray Kids Japan Official YouTube",
      "duration": "3:20",
      "thumbnail": "https://img.youtube.com/vi/jW-bkbSWb4A/hqdefault.jpg",
      "views": 156236949
    },
    {
      "videoId": "Gz_yRl6703c",
      "title": "BABYMONSTER - 'BILLIONAIRE' EXCLUSIVE PERFORMANCE VIDEO",
      "author": "BABYMONSTER",
      "duration": "2:44",
      "thumbnail": "https://img.youtube.com/vi/Gz_yRl6703c/hqdefault.jpg",
      "views": 155379983
    },
    {
      "videoId": "wKysONrSmew",
      "title": "BTS (방탄소년단) 'RUN' Official MV",
      "author": "HYBE LABELS",
      "duration": "7:31",
      "thumbnail": "https://img.youtube.com/vi/wKysONrSmew/hqdefault.jpg",
      "views": 154984974
    },
    {
      "videoId": "pG6iaOMV46I",
      "title": "IVE 아이브 'Kitsch' MV",
      "author": "STARSHIP and IVE",
      "duration": "3:22",
      "thumbnail": "https://img.youtube.com/vi/pG6iaOMV46I/hqdefault.jpg",
      "views": 154474404
    },
    {
      "videoId": "UBURTj20HXI",
      "title": "LE SSERAFIM (르세라핌) 'UNFORGIVEN (feat. Nile Rodgers)' OFFICIAL M/V",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "4:20",
      "thumbnail": "https://img.youtube.com/vi/UBURTj20HXI/hqdefault.jpg",
      "views": 150614525
    },
    {
      "videoId": "WpuatuzSDK4",
      "title": "SEVENTEEN (세븐틴) 'Rock with you' Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "3:04",
      "thumbnail": "https://img.youtube.com/vi/WpuatuzSDK4/hqdefault.jpg",
      "views": 148301714
    },
    {
      "videoId": "hLvWy2b857I",
      "title": "LE SSERAFIM (르세라핌) 'Perfect Night' OFFICIAL M/V with OVERWATCH 2",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "3:03",
      "thumbnail": "https://img.youtube.com/vi/hLvWy2b857I/hqdefault.jpg",
      "views": 147813165
    },
    {
      "videoId": "JqwPCzJnYyY",
      "title": "Stray Kids \"MEGAVERSE\" Video",
      "author": "Stray Kids",
      "duration": "4:06",
      "thumbnail": "https://img.youtube.com/vi/JqwPCzJnYyY/hqdefault.jpg",
      "views": 146032086
    },
    {
      "videoId": "b4iVv91Z6lY",
      "title": "BTS (방탄소년단) ‘SWIM’ Official MV",
      "author": "HYBE LABELS",
      "duration": "4:05",
      "thumbnail": "https://img.youtube.com/vi/b4iVv91Z6lY/hqdefault.jpg",
      "views": 144512727
    },
    {
      "videoId": "_gyultVTesk",
      "title": "BTS (방탄소년단) '2.0' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:55",
      "thumbnail": "https://img.youtube.com/vi/_gyultVTesk/hqdefault.jpg",
      "views": 143642816
    },
    {
      "videoId": "VOmIplFAGeg",
      "title": "NewJeans (뉴진스) 'Cookie' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:59",
      "thumbnail": "https://img.youtube.com/vi/VOmIplFAGeg/hqdefault.jpg",
      "views": 141281565
    },
    {
      "videoId": "GsV1i0QHi-o",
      "title": "BABYMONSTER - 'Stuck In The Middle' M/V",
      "author": "BABYMONSTER",
      "duration": "4:18",
      "thumbnail": "https://img.youtube.com/vi/GsV1i0QHi-o/hqdefault.jpg",
      "views": 140261685
    },
    {
      "videoId": "cKlEE_EYuNM",
      "title": "TWICE Pre-release english track \"MOONLIGHT SUNRISE\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:24",
      "thumbnail": "https://img.youtube.com/vi/cKlEE_EYuNM/hqdefault.jpg",
      "views": 140161086
    },
    {
      "videoId": "dZs_cLHfnNA",
      "title": "LE SSERAFIM (르세라핌) 'Eve, Psyche & The Bluebeard's wife' OFFICIAL M/V",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "3:48",
      "thumbnail": "https://img.youtube.com/vi/dZs_cLHfnNA/hqdefault.jpg",
      "views": 140038837
    },
    {
      "videoId": "eHHQaoEW30Q",
      "title": "TWICE \"THIS IS FOR\" M/V",
      "author": "JYP Entertainment",
      "duration": "2:14",
      "thumbnail": "https://img.youtube.com/vi/eHHQaoEW30Q/hqdefault.jpg",
      "views": 136143047
    },
    {
      "videoId": "HdZdxocqzq4",
      "title": "SEVENTEEN (세븐틴) 'Left & Right' Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "4:11",
      "thumbnail": "https://img.youtube.com/vi/HdZdxocqzq4/hqdefault.jpg",
      "views": 135704889
    },
    {
      "videoId": "o0oW3lPoOXM",
      "title": "BABYMONSTER - 'CLIK CLAK' M/V",
      "author": "BABYMONSTER",
      "duration": "2:55",
      "thumbnail": "https://img.youtube.com/vi/o0oW3lPoOXM/hqdefault.jpg",
      "views": 134751954
    },
    {
      "videoId": "43r6lXilbcQ",
      "title": "BTS (방탄소년단) 'Danger' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:47",
      "thumbnail": "https://img.youtube.com/vi/43r6lXilbcQ/hqdefault.jpg",
      "views": 134004710
    },
    {
      "videoId": "TvVtYaqCni8",
      "title": "LE SSERAFIM (르세라핌) 'SPAGHETTI (feat. j-hope of BTS)' OFFICIAL MV",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "3:19",
      "thumbnail": "https://img.youtube.com/vi/TvVtYaqCni8/hqdefault.jpg",
      "views": 130874914
    },
    {
      "videoId": "w4cTYnOPdNk",
      "title": "TWICE \"SET ME FREE\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:32",
      "thumbnail": "https://img.youtube.com/vi/w4cTYnOPdNk/hqdefault.jpg",
      "views": 127886147
    },
    {
      "videoId": "XShaIZs7J7M",
      "title": "BABYMONSTER - ‘Really Like You’ M/V",
      "author": "BABYMONSTER",
      "duration": "3:46",
      "thumbnail": "https://img.youtube.com/vi/XShaIZs7J7M/hqdefault.jpg",
      "views": 126759215
    },
    {
      "videoId": "P7vBoGWoReg",
      "title": "Stray Kids \"CEREMONY\" M/V",
      "author": "JYP Entertainment",
      "duration": "2:52",
      "thumbnail": "https://img.youtube.com/vi/P7vBoGWoReg/hqdefault.jpg",
      "views": 123024245
    },
    {
      "videoId": "NED7nev2ywQ",
      "title": "Stray Kids \"Do It\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:01",
      "thumbnail": "https://img.youtube.com/vi/NED7nev2ywQ/hqdefault.jpg",
      "views": 121346483
    },
    {
      "videoId": "bNKXxwOQYB8",
      "title": "LE SSERAFIM (르세라핌) 'EASY' OFFICIAL MV",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "3:10",
      "thumbnail": "https://img.youtube.com/vi/bNKXxwOQYB8/hqdefault.jpg",
      "views": 121042088
    },
    {
      "videoId": "naoGk-Zjc1s",
      "title": "BABYMONSTER - 'SUGAR HONEY ICE TEA' M/V",
      "author": "BABYMONSTER",
      "duration": "3:07",
      "thumbnail": "https://img.youtube.com/vi/naoGk-Zjc1s/hqdefault.jpg",
      "views": 117958308
    },
    {
      "videoId": "jOTfBlKSQYY",
      "title": "NewJeans (뉴진스) 'ETA' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:37",
      "thumbnail": "https://img.youtube.com/vi/jOTfBlKSQYY/hqdefault.jpg",
      "views": 117866749
    },
    {
      "videoId": "ThI0pBAbFnk",
      "title": "SEVENTEEN (세븐틴) 'MAESTRO' Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "4:12",
      "thumbnail": "https://img.youtube.com/vi/ThI0pBAbFnk/hqdefault.jpg",
      "views": 113093707
    },
    {
      "videoId": "VCDWg0ljbFQ",
      "title": "SEVENTEEN (세븐틴) '_WORLD' Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "3:37",
      "thumbnail": "https://img.youtube.com/vi/VCDWg0ljbFQ/hqdefault.jpg",
      "views": 105412636
    },
    {
      "videoId": "ovHoY8UBIu8",
      "title": "Stray Kids \"Walkin On Water\" M/V",
      "author": "JYP Entertainment",
      "duration": "2:52",
      "thumbnail": "https://img.youtube.com/vi/ovHoY8UBIu8/hqdefault.jpg",
      "views": 104813392
    },
    {
      "videoId": "07EzMbVH3QE",
      "title": "IVE 아이브 '해야 (HEYA)' MV",
      "author": "STARSHIP and IVE",
      "duration": "3:10",
      "thumbnail": "https://img.youtube.com/vi/07EzMbVH3QE/hqdefault.jpg",
      "views": 104415934
    },
    {
      "videoId": "bMhDJ0S0OBA",
      "title": "ILLIT (아일릿) ‘It’s Me’ Official MV",
      "author": "HYBE LABELS and ILLIT",
      "duration": "2:27",
      "thumbnail": "https://img.youtube.com/vi/bMhDJ0S0OBA/hqdefault.jpg",
      "views": 104255110
    },
    {
      "videoId": "Jn8KvdWagfo",
      "title": "ROSÉ & Bruno Mars - APT. (live from 2024 MAMA AWARDS)",
      "author": "ROSÉ",
      "duration": "2:56",
      "thumbnail": "https://img.youtube.com/vi/Jn8KvdWagfo/hqdefault.jpg",
      "views": 103661728
    },
    {
      "videoId": "ZncbtRo7RXs",
      "title": "NewJeans (뉴진스) ‘Supernatural’ Official MV (Part.1)",
      "author": "HYBE LABELS",
      "duration": "3:11",
      "thumbnail": "https://img.youtube.com/vi/ZncbtRo7RXs/hqdefault.jpg",
      "views": 95306096
    },
    {
      "videoId": "M2WTUoy4y6E",
      "title": "aespa 에스파 'Dirty Work' MV",
      "author": "SMTOWN",
      "duration": "3:10",
      "thumbnail": "https://img.youtube.com/vi/M2WTUoy4y6E/hqdefault.jpg",
      "views": 93598486
    },
    {
      "videoId": "ynOtYmpZxak",
      "title": "BABYMONSTER - 'DREAM' (PRE-DEBUT SONG)",
      "author": "BABYMONSTER",
      "duration": "3:15",
      "thumbnail": "https://img.youtube.com/vi/ynOtYmpZxak/hqdefault.jpg",
      "views": 91739449
    },
    {
      "videoId": "27C4pfRsf9g",
      "title": "LE SSERAFIM (르세라핌) x ILLIT (아일릿) x KATSEYE (캣츠아이) 'ICONIC BY MISTAKE' Official MV",
      "author": "HYBE LABELS and 3 more",
      "duration": "3:20",
      "thumbnail": "https://img.youtube.com/vi/27C4pfRsf9g/hqdefault.jpg",
      "views": 91339368
    },
    {
      "videoId": "wHr45iW1AC8",
      "title": "Seventeen - Menemukanmu (Official Music Video)",
      "author": "GP Records",
      "duration": "4:19",
      "thumbnail": "https://img.youtube.com/vi/wHr45iW1AC8/hqdefault.jpg",
      "views": 88438769
    },
    {
      "videoId": "2GJfWMYCWY0",
      "title": "BLACKPINK - ‘GO’ M/V",
      "author": "BLACKPINK",
      "duration": "3:22",
      "thumbnail": "https://img.youtube.com/vi/2GJfWMYCWY0/hqdefault.jpg",
      "views": 87241531
    },
    {
      "videoId": "1kXLsrun51s",
      "title": "BABYMONSTER - 'Love In My Heart' M/V",
      "author": "BABYMONSTER",
      "duration": "3:52",
      "thumbnail": "https://img.youtube.com/vi/1kXLsrun51s/hqdefault.jpg",
      "views": 85844724
    },
    {
      "videoId": "ft70sAYrFyY",
      "title": "NewJeans (뉴진스) 'Bubble Gum' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:41",
      "thumbnail": "https://img.youtube.com/vi/ft70sAYrFyY/hqdefault.jpg",
      "views": 85647099
    },
    {
      "videoId": "E8i32NXMxnc",
      "title": "Stray Kids \"신선놀음 (DIVINE)\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:21",
      "thumbnail": "https://img.youtube.com/vi/E8i32NXMxnc/hqdefault.jpg",
      "views": 84125581
    },
    {
      "videoId": "gfk3QLU1x0E",
      "title": "aespa 에스파 'Better Things' MV",
      "author": "SMTOWN",
      "duration": "3:59",
      "thumbnail": "https://img.youtube.com/vi/gfk3QLU1x0E/hqdefault.jpg",
      "views": 83921315
    },
    {
      "videoId": "pS57UX6s-xw",
      "title": "SEVENTEEN (세븐틴) 'THUNDER' Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "3:06",
      "thumbnail": "https://img.youtube.com/vi/pS57UX6s-xw/hqdefault.jpg",
      "views": 83857984
    },
    {
      "videoId": "-nEGVrzPaiU",
      "title": "ILLIT (아일릿) ‘Tick-Tack’ Official MV",
      "author": "HYBE LABELS",
      "duration": "2:57",
      "thumbnail": "https://img.youtube.com/vi/-nEGVrzPaiU/hqdefault.jpg",
      "views": 83075697
    },
    {
      "videoId": "js1CtxSY38I",
      "title": "NewJeans (뉴진스) 'Attention' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:23",
      "thumbnail": "https://img.youtube.com/vi/js1CtxSY38I/hqdefault.jpg",
      "views": 82319059
    },
    {
      "videoId": "SbdOIdg2McI",
      "title": "BABYMONSTER - ‘SUPA DUPA LUV’ M/V",
      "author": "BABYMONSTER",
      "duration": "3:02",
      "thumbnail": "https://img.youtube.com/vi/SbdOIdg2McI/hqdefault.jpg",
      "views": 81002816
    },
    {
      "videoId": "9cS2wv6AfHk",
      "title": "BABYMONSTER - 'I LIKE IT' M/V",
      "author": "BABYMONSTER",
      "duration": "3:39",
      "thumbnail": "https://img.youtube.com/vi/9cS2wv6AfHk/hqdefault.jpg",
      "views": 80526642
    },
    {
      "videoId": "r9AEGPB6qIU",
      "title": "LE SSERAFIM (르세라핌) 'HOT' OFFICIAL MV",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "2:49",
      "thumbnail": "https://img.youtube.com/vi/r9AEGPB6qIU/hqdefault.jpg",
      "views": 80384509
    },
    {
      "videoId": "Q3K0TOvTOno",
      "title": "NewJeans (뉴진스) 'How Sweet' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:03",
      "thumbnail": "https://img.youtube.com/vi/Q3K0TOvTOno/hqdefault.jpg",
      "views": 78522212
    },
    {
      "videoId": "diBO0gMuTXo",
      "title": "BTS (방탄소년단) 'Hooligan' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:04",
      "thumbnail": "https://img.youtube.com/vi/diBO0gMuTXo/hqdefault.jpg",
      "views": 77278811
    },
    {
      "videoId": "yCvSR4lSqTg",
      "title": "SEVENTEEN (세븐틴) 'Ready to love' Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "3:10",
      "thumbnail": "https://img.youtube.com/vi/yCvSR4lSqTg/hqdefault.jpg",
      "views": 77085514
    },
    {
      "videoId": "GkG60kISnfc",
      "title": "ILLIT (아일릿) 'jellyous’ Official MV",
      "author": "HYBE LABELS",
      "duration": "3:09",
      "thumbnail": "https://img.youtube.com/vi/GkG60kISnfc/hqdefault.jpg",
      "views": 74054248
    },
    {
      "videoId": "9M7k9ZV67c0",
      "title": "[M/V] SEVENTEEN(세븐틴) - 만세(MANSAE)",
      "author": "SEVENTEEN",
      "duration": "3:28",
      "thumbnail": "https://img.youtube.com/vi/9M7k9ZV67c0/hqdefault.jpg",
      "views": 72909463
    },
    {
      "videoId": "jCzez_q8si0",
      "title": "TWICE \"ONE SPARK\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:14",
      "thumbnail": "https://img.youtube.com/vi/jCzez_q8si0/hqdefault.jpg",
      "views": 72210958
    },
    {
      "videoId": "UCmgGZbfjmk",
      "title": "ILLIT (아일릿) 'Lucky Girl Syndrome' Official MV",
      "author": "HYBE LABELS",
      "duration": "2:26",
      "thumbnail": "https://img.youtube.com/vi/UCmgGZbfjmk/hqdefault.jpg",
      "views": 71967799
    },
    {
      "videoId": "g36q0ZLvygQ",
      "title": "IVE 아이브 'REBEL HEART' MV",
      "author": "STARSHIP and IVE",
      "duration": "3:13",
      "thumbnail": "https://img.youtube.com/vi/g36q0ZLvygQ/hqdefault.jpg",
      "views": 71180610
    },
    {
      "videoId": "_ApV7Lm87cg",
      "title": "IVE 아이브 'Off The Record' MV",
      "author": "STARSHIP and IVE",
      "duration": "3:12",
      "thumbnail": "https://img.youtube.com/vi/_ApV7Lm87cg/hqdefault.jpg",
      "views": 69063967
    },
    {
      "videoId": "Da4P2uT4mVc",
      "title": "IVE 아이브 'Baddie' MV",
      "author": "STARSHIP and IVE",
      "duration": "2:49",
      "thumbnail": "https://img.youtube.com/vi/Da4P2uT4mVc/hqdefault.jpg",
      "views": 68653418
    },
    {
      "videoId": "tbDGl7jEazA",
      "title": "ILLIT (아일릿) ‘Cherish (My Love)’ Official MV",
      "author": "HYBE LABELS",
      "duration": "3:35",
      "thumbnail": "https://img.youtube.com/vi/tbDGl7jEazA/hqdefault.jpg",
      "views": 67573430
    },
    {
      "videoId": "8Ebqe2Dbzls",
      "title": "ROSÉ & Bruno Mars - APT. (Official Lyric Video)",
      "author": "Bruno Mars",
      "duration": "2:50",
      "thumbnail": "https://img.youtube.com/vi/8Ebqe2Dbzls/hqdefault.jpg",
      "views": 66972807
    },
    {
      "videoId": "38xYeot-ciM",
      "title": "IVE 아이브 'ATTITUDE' MV",
      "author": "STARSHIP and IVE",
      "duration": "3:26",
      "thumbnail": "https://img.youtube.com/vi/38xYeot-ciM/hqdefault.jpg",
      "views": 66961825
    },
    {
      "videoId": "ySxIjeCScgY",
      "title": "Stray Kids 『ALL IN』 Music Video",
      "author": "Stray Kids Japan Official YouTube",
      "duration": "3:15",
      "thumbnail": "https://img.youtube.com/vi/ySxIjeCScgY/hqdefault.jpg",
      "views": 66805536
    },
    {
      "videoId": "ap14O5-G7UA",
      "title": "[M/V] SEVENTEEN(세븐틴) - 독 : Fear",
      "author": "SEVENTEEN",
      "duration": "3:03",
      "thumbnail": "https://img.youtube.com/vi/ap14O5-G7UA/hqdefault.jpg",
      "views": 64958417
    },
    {
      "videoId": "SsuCimm5BIU",
      "title": "BABYMONSTER - 'SUGAR HONEY ICE TEA' PERFORMANCE VIDEO",
      "author": "BABYMONSTER",
      "duration": "3:11",
      "thumbnail": "https://img.youtube.com/vi/SsuCimm5BIU/hqdefault.jpg",
      "views": 64940448
    },
    {
      "videoId": "pSUydWEqKwE",
      "title": "NewJeans (뉴진스) 'Ditto' Official MV (side A)",
      "author": "HYBE LABELS",
      "duration": "5:34",
      "thumbnail": "https://img.youtube.com/vi/pSUydWEqKwE/hqdefault.jpg",
      "views": 64350659
    },
    {
      "videoId": "negtrQu5mTA",
      "title": "ILLIT (아일릿) '빌려온 고양이 (Do the Dance)' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:22",
      "thumbnail": "https://img.youtube.com/vi/negtrQu5mTA/hqdefault.jpg",
      "views": 63666902
    },
    {
      "videoId": "5oQVTnq-UKk",
      "title": "aespa 에스파 'Rich Man' MV",
      "author": "SMTOWN",
      "duration": "3:30",
      "thumbnail": "https://img.youtube.com/vi/5oQVTnq-UKk/hqdefault.jpg",
      "views": 62997057
    },
    {
      "videoId": "x_RYZsOfpKY",
      "title": "ILLIT (아일릿) 'NOT CUTE ANYMORE’ Official MV",
      "author": "HYBE LABELS",
      "duration": "2:27",
      "thumbnail": "https://img.youtube.com/vi/x_RYZsOfpKY/hqdefault.jpg",
      "views": 62589980
    },
    {
      "videoId": "5NPe8_gDSr4",
      "title": "SEVENTEEN (세븐틴) 'LOVE, MONEY, FAME (feat. DJ Khaled)' Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "3:35",
      "thumbnail": "https://img.youtube.com/vi/5NPe8_gDSr4/hqdefault.jpg",
      "views": 62518051
    },
    {
      "videoId": "9qkpcLK422o",
      "title": "IVE 아이브 'BANG BANG' MV",
      "author": "STARSHIP and IVE",
      "duration": "3:05",
      "thumbnail": "https://img.youtube.com/vi/9qkpcLK422o/hqdefault.jpg",
      "views": 59772193
    },
    {
      "videoId": "etjQd0wgUTo",
      "title": "Stray Kids \"땡(FREEZE)\" Video",
      "author": "Stray Kids",
      "duration": "4:08",
      "thumbnail": "https://img.youtube.com/vi/etjQd0wgUTo/hqdefault.jpg",
      "views": 58886240
    },
    {
      "videoId": "tVIXY14aJms",
      "title": "NewJeans (뉴진스) 'Hurt' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:02",
      "thumbnail": "https://img.youtube.com/vi/tVIXY14aJms/hqdefault.jpg",
      "views": 57942546
    },
    {
      "videoId": "PGLx4V680J8",
      "title": "IVE 아이브 'Accendio' MV",
      "author": "STARSHIP and IVE",
      "duration": "3:44",
      "thumbnail": "https://img.youtube.com/vi/PGLx4V680J8/hqdefault.jpg",
      "views": 56323236
    },
    {
      "videoId": "83C3TZ4Zm_o",
      "title": "aespa 에스파 'LEMONADE' MV",
      "author": "SMTOWN and aespa",
      "duration": "3:12",
      "thumbnail": "https://img.youtube.com/vi/83C3TZ4Zm_o/hqdefault.jpg",
      "views": 54089219
    },
    {
      "videoId": "UnWUmg6fEIw",
      "title": "LE SSERAFIM (르세라핌) 'UNFORGIVEN (feat. Nile Rodgers)' OFFICIAL M/V (Choreography ver.)",
      "author": "HYBE LABELS",
      "duration": "3:10",
      "thumbnail": "https://img.youtube.com/vi/UnWUmg6fEIw/hqdefault.jpg",
      "views": 53333139
    },
    {
      "videoId": "kMxuLQWMOLc",
      "title": "Stray Kids \"Stray Kids\" Video",
      "author": "Stray Kids",
      "duration": "3:25",
      "thumbnail": "https://img.youtube.com/vi/kMxuLQWMOLc/hqdefault.jpg",
      "views": 47519721
    },
    {
      "videoId": "9rUFQJrCT7M",
      "title": "[M/V] 세븐틴(SEVENTEEN)-아낀다 (Adore U)",
      "author": "SEVENTEEN",
      "duration": "3:06",
      "thumbnail": "https://img.youtube.com/vi/9rUFQJrCT7M/hqdefault.jpg",
      "views": 47459881
    },
    {
      "videoId": "80H_-aHTUws",
      "title": "Stray Kids \"MOUNTAINS\" Video",
      "author": "Stray Kids",
      "duration": "3:12",
      "thumbnail": "https://img.youtube.com/vi/80H_-aHTUws/hqdefault.jpg",
      "views": 46259001
    },
    {
      "videoId": "haf67eKF0uo",
      "title": "TWICE \"I GOT YOU\" M/V",
      "author": "JYP Entertainment",
      "duration": "3:53",
      "thumbnail": "https://img.youtube.com/vi/haf67eKF0uo/hqdefault.jpg",
      "views": 45734849
    },
    {
      "videoId": "Q7IFjVUUb_E",
      "title": "Stray Kids \"RUN IT\" M/V",
      "author": "JYP Entertainment and Stray Kids",
      "duration": "3:49",
      "thumbnail": "https://img.youtube.com/vi/Q7IFjVUUb_E/hqdefault.jpg",
      "views": 44577177
    },
    {
      "videoId": "B1ShLiq3EVc",
      "title": "IVE 아이브 ‘XOXZ’ MV",
      "author": "STARSHIP and IVE",
      "duration": "2:38",
      "thumbnail": "https://img.youtube.com/vi/B1ShLiq3EVc/hqdefault.jpg",
      "views": 44309367
    },
    {
      "videoId": "JIddQ2m4oXw",
      "title": "ROSÉ & Bruno Mars - APT.",
      "author": "LatinHype",
      "duration": "2:50",
      "thumbnail": "https://img.youtube.com/vi/JIddQ2m4oXw/hqdefault.jpg",
      "views": 44136606
    },
    {
      "videoId": "_ZAgIHmHLdc",
      "title": "NewJeans (뉴진스) 'OMG' Official MV",
      "author": "HYBE LABELS",
      "duration": "6:34",
      "thumbnail": "https://img.youtube.com/vi/_ZAgIHmHLdc/hqdefault.jpg",
      "views": 43257569
    },
    {
      "videoId": "kcelgrGY1h8",
      "title": "NewJeans (뉴진스) 'New Jeans' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:31",
      "thumbnail": "https://img.youtube.com/vi/kcelgrGY1h8/hqdefault.jpg",
      "views": 42728230
    },
    {
      "videoId": "Hhph0_CdUHg",
      "title": "BTS (방탄소년단) '호르몬전쟁' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:59",
      "thumbnail": "https://img.youtube.com/vi/Hhph0_CdUHg/hqdefault.jpg",
      "views": 42629848
    },
    {
      "videoId": "F2qZWD0F7rM",
      "title": "SEVENTEEN (세븐틴) 'LALALI' Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "3:19",
      "thumbnail": "https://img.youtube.com/vi/F2qZWD0F7rM/hqdefault.jpg",
      "views": 41053144
    },
    {
      "videoId": "Ccz123Jlflc",
      "title": "LE SSERAFIM (르세라핌) 'Impurities' OFFICIAL M/V",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "3:43",
      "thumbnail": "https://img.youtube.com/vi/Ccz123Jlflc/hqdefault.jpg",
      "views": 40509152
    },
    {
      "videoId": "N_Qh1UFt4_U",
      "title": "BTS (방탄소년단) 'We Are Bulletproof: The Eternal' MV",
      "author": "elisssa",
      "duration": "4:22",
      "thumbnail": "https://img.youtube.com/vi/N_Qh1UFt4_U/hqdefault.jpg",
      "views": 40297301
    },
    {
      "videoId": "1yMzV0NdB9g",
      "title": "ILLIT (아일릿) ‘Tick-Tack’ Official MV (Performance ver.)",
      "author": "HYBE LABELS",
      "duration": "2:16",
      "thumbnail": "https://img.youtube.com/vi/1yMzV0NdB9g/hqdefault.jpg",
      "views": 39719401
    },
    {
      "videoId": "_Hu4GYtye5U",
      "title": "IVE 아이브 'Either Way’ MV",
      "author": "STARSHIP and IVE",
      "duration": "3:58",
      "thumbnail": "https://img.youtube.com/vi/_Hu4GYtye5U/hqdefault.jpg",
      "views": 38826868
    },
    {
      "videoId": "dJdqn5v4Dkw",
      "title": "NewJeans (뉴진스) 'ASAP' Official MV",
      "author": "HYBE LABELS",
      "duration": "2:21",
      "thumbnail": "https://img.youtube.com/vi/dJdqn5v4Dkw/hqdefault.jpg",
      "views": 38596831
    },
    {
      "videoId": "3zQXMPbK5jU",
      "title": "TWICE「What is Love? -Japanese ver.-」Music Video",
      "author": "TWICE JAPAN OFFICIAL YouTube Channel",
      "duration": "3:40",
      "thumbnail": "https://img.youtube.com/vi/3zQXMPbK5jU/hqdefault.jpg",
      "views": 37912877
    },
    {
      "videoId": "qlgEadao-Sk",
      "title": "ILLIT (아일릿) 'Almond Chocolate' Special Film",
      "author": "HYBE LABELS",
      "duration": "3:46",
      "thumbnail": "https://img.youtube.com/vi/qlgEadao-Sk/hqdefault.jpg",
      "views": 35158347
    },
    {
      "videoId": "bw4AuPrLWeA",
      "title": "SEVENTEEN (세븐틴) '청춘찬가' Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "4:00",
      "thumbnail": "https://img.youtube.com/vi/bw4AuPrLWeA/hqdefault.jpg",
      "views": 34096367
    },
    {
      "videoId": "Gnn4GRSzRXI",
      "title": "LE SSERAFIM (르세라핌) 'BOOMPALA' OFFICIAL PERFORMANCE FILM",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "2:58",
      "thumbnail": "https://img.youtube.com/vi/Gnn4GRSzRXI/hqdefault.jpg",
      "views": 32948912
    },
    {
      "videoId": "vvN4FgqNXwE",
      "title": "SEVENTEEN (세븐틴) '今 -明日 世界が終わっても-' (Ima -Even if the world ends tomorrow-) Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "3:39",
      "thumbnail": "https://img.youtube.com/vi/vvN4FgqNXwE/hqdefault.jpg",
      "views": 32447658
    },
    {
      "videoId": "9wUKhEgnllc",
      "title": "NewJeans (뉴진스) 'Hype Boy' Official MV (DANIELLE&HAERIN ver.)",
      "author": "HYBE LABELS",
      "duration": "3:07",
      "thumbnail": "https://img.youtube.com/vi/9wUKhEgnllc/hqdefault.jpg",
      "views": 31341666
    },
    {
      "videoId": "iTJSbJtS8MU",
      "title": "aespa 에스파 'WDA (Whole Different Animal) (Feat. G-DRAGON)' MV",
      "author": "SMTOWN and aespa",
      "duration": "3:09",
      "thumbnail": "https://img.youtube.com/vi/iTJSbJtS8MU/hqdefault.jpg",
      "views": 30309585
    },
    {
      "videoId": "X8WEMtDqyZg",
      "title": "ROSÉ & Bruno Mars - APT.(Animation) FULL ver(Fan made)",
      "author": "그리네모",
      "duration": "2:49",
      "thumbnail": "https://img.youtube.com/vi/X8WEMtDqyZg/hqdefault.jpg",
      "views": 28447596
    },
    {
      "videoId": "m6pTbEz4w3o",
      "title": "NewJeans (뉴진스) 'Right Now' Official MV",
      "author": "HYBE LABELS",
      "duration": "2:55",
      "thumbnail": "https://img.youtube.com/vi/m6pTbEz4w3o/hqdefault.jpg",
      "views": 28066362
    },
    {
      "videoId": "cr_lx0GSfrA",
      "title": "[M/V] SEVENTEEN(세븐틴) -  숨이 차 (Getting Closer)",
      "author": "SEVENTEEN",
      "duration": "3:06",
      "thumbnail": "https://img.youtube.com/vi/cr_lx0GSfrA/hqdefault.jpg",
      "views": 26746981
    },
    {
      "videoId": "0xdB_vo4r2c",
      "title": "aespa 에스파 'Welcome To MY World (Feat. nævis)' MV",
      "author": "SMTOWN",
      "duration": "3:32",
      "thumbnail": "https://img.youtube.com/vi/0xdB_vo4r2c/hqdefault.jpg",
      "views": 26745734
    },
    {
      "videoId": "V1Lr-_AxeR8",
      "title": "LE SSERAFIM (르세라핌) 'BOOMPALA' OFFICIAL MV",
      "author": "HYBE LABELS and 2 more",
      "duration": "3:29",
      "thumbnail": "https://img.youtube.com/vi/V1Lr-_AxeR8/hqdefault.jpg",
      "views": 26263708
    },
    {
      "videoId": "HFZUAXhdnHk",
      "title": "LE SSERAFIM (르세라핌) 'DIFFERENT' OFFICIAL MV",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "2:23",
      "thumbnail": "https://img.youtube.com/vi/HFZUAXhdnHk/hqdefault.jpg",
      "views": 25980414
    },
    {
      "videoId": "QGCkDOkpWf8",
      "title": "TWICE『DIVE』Music Video",
      "author": "TWICE JAPAN OFFICIAL YouTube Channel",
      "duration": "3:12",
      "thumbnail": "https://img.youtube.com/vi/QGCkDOkpWf8/hqdefault.jpg",
      "views": 25343299
    },
    {
      "videoId": "1Lmy7qwmSMc",
      "title": "IVE 아이브 'BLACKHOLE' MV",
      "author": "STARSHIP and IVE",
      "duration": "3:24",
      "thumbnail": "https://img.youtube.com/vi/1Lmy7qwmSMc/hqdefault.jpg",
      "views": 25125378
    },
    {
      "videoId": "JjvX09nG2F0",
      "title": "SEVENTEEN (세븐틴) 'Eyes on you' Official MV",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "2:59",
      "thumbnail": "https://img.youtube.com/vi/JjvX09nG2F0/hqdefault.jpg",
      "views": 24304969
    },
    {
      "videoId": "YEA1ROHi0Eg",
      "title": "aespa 에스파 'Live My Life' MV",
      "author": "SMTOWN",
      "duration": "3:35",
      "thumbnail": "https://img.youtube.com/vi/YEA1ROHi0Eg/hqdefault.jpg",
      "views": 24172005
    },
    {
      "videoId": "2iK3ccCsI6s",
      "title": "aespa エスパ 'Hot Mess' MV",
      "author": "SMTOWN",
      "duration": "3:27",
      "thumbnail": "https://img.youtube.com/vi/2iK3ccCsI6s/hqdefault.jpg",
      "views": 23967050
    },
    {
      "videoId": "8ziUcTYwARI",
      "title": "Stray Kids \"SUPER BOARD\" Video",
      "author": "Stray Kids",
      "duration": "3:13",
      "thumbnail": "https://img.youtube.com/vi/8ziUcTYwARI/hqdefault.jpg",
      "views": 23612990
    },
    {
      "videoId": "0n8su37VyZQ",
      "title": "[MV]SEVENTEEN - ひとりじゃない",
      "author": "SEVENTEEN Japan official Youtube",
      "duration": "3:18",
      "thumbnail": "https://img.youtube.com/vi/0n8su37VyZQ/hqdefault.jpg",
      "views": 23229026
    },
    {
      "videoId": "lOpdrEgmYzY",
      "title": "ILLIT (아일릿) 'It’s Me’ Official MV (Performance ver.)",
      "author": "HYBE LABELS and ILLIT",
      "duration": "2:23",
      "thumbnail": "https://img.youtube.com/vi/lOpdrEgmYzY/hqdefault.jpg",
      "views": 21149722
    },
    {
      "videoId": "HeqsjDF7Lw0",
      "title": "ILLIT (아일릿) '時よ止まれ (Toki Yo Tomare)' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:30",
      "thumbnail": "https://img.youtube.com/vi/HeqsjDF7Lw0/hqdefault.jpg",
      "views": 21139606
    },
    {
      "videoId": "zsYSSVoQnP4",
      "title": "NewJeans (뉴진스) 'Cool With You' Official MV (side A)",
      "author": "HYBE LABELS",
      "duration": "4:00",
      "thumbnail": "https://img.youtube.com/vi/zsYSSVoQnP4/hqdefault.jpg",
      "views": 20978594
    },
    {
      "videoId": "xU8mQMLx0tk",
      "title": "IVE 아이브 'All Night (Feat. Saweetie)' Official Music Video",
      "author": "IVE",
      "duration": "3:27",
      "thumbnail": "https://img.youtube.com/vi/xU8mQMLx0tk/hqdefault.jpg",
      "views": 20947542
    },
    {
      "videoId": "-01oDwXKSuE",
      "title": "ILLIT (아일릿) 'Sunday Morning’ Official MV",
      "author": "HYBE LABELS",
      "duration": "2:57",
      "thumbnail": "https://img.youtube.com/vi/-01oDwXKSuE/hqdefault.jpg",
      "views": 19441774
    },
    {
      "videoId": "fyk6vjwI3wc",
      "title": "IVE, David Guetta - Supernova Love Official Music Video",
      "author": "IVE",
      "duration": "2:34",
      "thumbnail": "https://img.youtube.com/vi/fyk6vjwI3wc/hqdefault.jpg",
      "views": 17231322
    },
    {
      "videoId": "a2grcJdfXmY",
      "title": "LE SSERAFIM (르세라핌) 'CELEBRATION' OFFICIAL MV",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "3:09",
      "thumbnail": "https://img.youtube.com/vi/a2grcJdfXmY/hqdefault.jpg",
      "views": 16073683
    },
    {
      "videoId": "z_uqieM8VGM",
      "title": "LE SSERAFIM (르세라핌) 'Come Over' OFFICIAL MV with Android",
      "author": "HYBE LABELS and LE SSERAFIM",
      "duration": "3:28",
      "thumbnail": "https://img.youtube.com/vi/z_uqieM8VGM/hqdefault.jpg",
      "views": 15815924
    },
    {
      "videoId": "43k4pbfWc8I",
      "title": "Vietsub | APT. - ROSÉ & Bruno Mars | Lyrics Video",
      "author": "Vietsub Mỗi Ngày",
      "duration": "2:54",
      "thumbnail": "https://img.youtube.com/vi/43k4pbfWc8I/hqdefault.jpg",
      "views": 14765385
    },
    {
      "videoId": "E3nWu1VgRJU",
      "title": "BTS | FIFA World Cup 2026™ Final Halftime Show | Full Performance",
      "author": "FIFA and BANGTANTV",
      "duration": "1:51",
      "thumbnail": "https://img.youtube.com/vi/E3nWu1VgRJU/hqdefault.jpg",
      "views": 13764847
    },
    {
      "videoId": "n2JNQ3m0EUs",
      "title": "SEVENTEEN (세븐틴) '_WORLD' Official MV (Eye Contact Ver.)",
      "author": "HYBE LABELS and SEVENTEEN",
      "duration": "3:09",
      "thumbnail": "https://img.youtube.com/vi/n2JNQ3m0EUs/hqdefault.jpg",
      "views": 13450048
    },
    {
      "videoId": "gC7cURZsiH8",
      "title": "IVE 아이브 'Be Alright'",
      "author": "Sony Music (Japan)",
      "duration": "3:14",
      "thumbnail": "https://img.youtube.com/vi/gC7cURZsiH8/hqdefault.jpg",
      "views": 13186115
    },
    {
      "videoId": "A4S8zl50AdM",
      "title": "NewJeans (뉴진스) ‘Supernatural’ Official MV (Part.2)",
      "author": "HYBE LABELS",
      "duration": "3:11",
      "thumbnail": "https://img.youtube.com/vi/A4S8zl50AdM/hqdefault.jpg",
      "views": 11274024
    },
    {
      "videoId": "i0RCcSBPjuU",
      "title": "aespa 에스파 'Thirsty' Track Video",
      "author": "aespa",
      "duration": "2:26",
      "thumbnail": "https://img.youtube.com/vi/i0RCcSBPjuU/hqdefault.jpg",
      "views": 10977756
    },
    {
      "videoId": "bYjhzP8x_uc",
      "title": "[Sub Thai] APT. - ROSÉ & Bruno Mars",
      "author": "Warner Music Thailand",
      "duration": "2:50",
      "thumbnail": "https://img.youtube.com/vi/bYjhzP8x_uc/hqdefault.jpg",
      "views": 9367505
    },
    {
      "videoId": "xRU1XXHIpIc",
      "title": "ILLIT (아일릿) 'bomb' Brand Film (little monster MV)",
      "author": "HYBE LABELS",
      "duration": "3:41",
      "thumbnail": "https://img.youtube.com/vi/xRU1XXHIpIc/hqdefault.jpg",
      "views": 9193075
    },
    {
      "videoId": "GEk4jHwfFTA",
      "title": "BTS (방탄소년단) ‘NORMAL’ Official MV",
      "author": "HYBE LABELS",
      "duration": "3:27",
      "thumbnail": "https://img.youtube.com/vi/GEk4jHwfFTA/hqdefault.jpg",
      "views": 8043624
    },
    {
      "videoId": "9nEp9eeGaJk",
      "title": "ILLIT (아일릿) 'NOT ME’ Official MV",
      "author": "HYBE LABELS",
      "duration": "2:36",
      "thumbnail": "https://img.youtube.com/vi/9nEp9eeGaJk/hqdefault.jpg",
      "views": 8002205
    },
    {
      "videoId": "Dw3JSLBNf04",
      "title": "ROSÉ & Bruno Mars - APT. (Live at the 68th Annual Grammy Awards)",
      "author": "ROSÉ and Bruno Mars",
      "duration": "3:06",
      "thumbnail": "https://img.youtube.com/vi/Dw3JSLBNf04/hqdefault.jpg",
      "views": 7994663
    },
    {
      "videoId": "wpokz1JhGl0",
      "title": "ILLIT (아일릿) ‘oops!’ @ Spotify Performance Video",
      "author": "ILLIT",
      "duration": "3:21",
      "thumbnail": "https://img.youtube.com/vi/wpokz1JhGl0/hqdefault.jpg",
      "views": 4135797
    },
    {
      "videoId": "p4ahGSFTY-c",
      "title": "aespa 에스파 'LEMONADE' Complæxity Trailer",
      "author": "aespa",
      "duration": "2:41",
      "thumbnail": "https://img.youtube.com/vi/p4ahGSFTY-c/hqdefault.jpg",
      "views": 3508008
    },
    {
      "videoId": "trlOTS4nKO4",
      "title": "IVE 아이브 'LUCID DREAM' MV",
      "author": "Sony Music (Japan) and IVE",
      "duration": "3:41",
      "thumbnail": "https://img.youtube.com/vi/trlOTS4nKO4/hqdefault.jpg",
      "views": 2848664
    },
    {
      "videoId": "qNpv6LGxj-Q",
      "title": "ROSÉ - APT. Performance Le Gala des Pièces Jaunes 2025",
      "author": "Lady Mia ",
      "duration": "3:35",
      "thumbnail": "https://img.youtube.com/vi/qNpv6LGxj-Q/hqdefault.jpg",
      "views": 2784677
    },
    {
      "videoId": "BWRoEDP6Pks",
      "title": "ROSÉ & BRUNO MARS Surprise \"APT\" Performance in BLACKPINK DEADLINE World Tour LA! 4K Fancam",
      "author": "Rey & Rob",
      "duration": "3:38",
      "thumbnail": "https://img.youtube.com/vi/BWRoEDP6Pks/hqdefault.jpg",
      "views": 2780582
    },
    {
      "videoId": "ZiUKTd7e3r8",
      "title": "ROSÉ & Bruno Mars - APT. (Lyrics)",
      "author": "7clouds K-pop",
      "duration": "2:49",
      "thumbnail": "https://img.youtube.com/vi/ZiUKTd7e3r8/hqdefault.jpg",
      "views": 1290080
    },
    {
      "videoId": "-933PCOccEk",
      "title": "BLACKPINK - 'Champion' M/V",
      "author": "pinkbloody",
      "duration": "2:54",
      "thumbnail": "https://img.youtube.com/vi/-933PCOccEk/hqdefault.jpg",
      "views": 973493
    },
    {
      "videoId": "my38BhPN1v8",
      "title": "BLACKPINK - ‘CRAZY OVER YOU’ M/V",
      "author": "TWICEBLINK",
      "duration": "2:41",
      "thumbnail": "https://img.youtube.com/vi/my38BhPN1v8/hqdefault.jpg",
      "views": 766698
    },
    {
      "videoId": "9VhQCCPEDuc",
      "title": "ROSÉ & Bruno Mars - APT. (Official Japanese Lyric Video)",
      "author": "Atlantic Records",
      "duration": "2:50",
      "thumbnail": "https://img.youtube.com/vi/9VhQCCPEDuc/hqdefault.jpg",
      "views": 504899
    },
    {
      "videoId": "Vvyi-e3u1kg",
      "title": "Rosé Plays Original “APT.” Demo and Shares How Bruno Mars Helped Make the Song a Hit",
      "author": "The Howard Stern Show",
      "duration": "2:51",
      "thumbnail": "https://img.youtube.com/vi/Vvyi-e3u1kg/hqdefault.jpg",
      "views": 501736
    },
    {
      "videoId": "8jEM1oaLM8E",
      "title": "ROSÉ & Bruno Mars - APT. (Official Music Video)",
      "author": "Dess Records",
      "duration": "2:54",
      "thumbnail": "https://img.youtube.com/vi/8jEM1oaLM8E/hqdefault.jpg",
      "views": 44959
    }
  ],
  "vinahouse": [
    {
      "videoId": "yoZy2E17-50",
      "title": "Phao - 2 Phut Hon (KAIZ Remix) | TikTok Vietnamese Music 2020",
      "author": "Light Night Music",
      "duration": "4:21",
      "thumbnail": "https://img.youtube.com/vi/yoZy2E17-50/hqdefault.jpg",
      "views": 370965193
    },
    {
      "videoId": "_AL4IwHuHlY",
      "title": "Pháo - 2 Phút Hơn (KAIZ Remix)",
      "author": "Distraction",
      "duration": "3:04",
      "thumbnail": "https://img.youtube.com/vi/_AL4IwHuHlY/hqdefault.jpg",
      "views": 258635735
    },
    {
      "videoId": "LaxkmhiECfM",
      "title": "[BAE] Tăng Duy Tân - Bên Trên Tầng Lầu | Official Lyric Video",
      "author": "Tăng Duy Tân",
      "duration": "3:11",
      "thumbnail": "https://img.youtube.com/vi/LaxkmhiECfM/hqdefault.jpg",
      "views": 87254577
    },
    {
      "videoId": "gJHSDZfJrRY",
      "title": "Hoàng Thuỳ Linh - See Tình | Official Music Video",
      "author": "Hoàng Thùy Linh",
      "duration": "3:57",
      "thumbnail": "https://img.youtube.com/vi/gJHSDZfJrRY/hqdefault.jpg",
      "views": 74343457
    },
    {
      "videoId": "tVTRY6851Ug",
      "title": "See Tình - Hoàng Thùy Linh「Cukak Remix」/ Audio Lyrics Video",
      "author": "Cukak",
      "duration": "2:51",
      "thumbnail": "https://img.youtube.com/vi/tVTRY6851Ug/hqdefault.jpg",
      "views": 64690067
    },
    {
      "videoId": "stwlBOkVtBE",
      "title": "[HOT TIKTOK Dance Public]PHAO - 2 Phut Hon/Zero Two (KAIZ Remix) Challenge Dance by JT Crew VietNam",
      "author": "JUNTO Crew Official",
      "duration": "3:25",
      "thumbnail": "https://img.youtube.com/vi/stwlBOkVtBE/hqdefault.jpg",
      "views": 63087897
    },
    {
      "videoId": "o_TYVGp9n0s",
      "title": "Phao - 2 Phut Hon (KAIZ Remix) | 9D AUDIO 🎧",
      "author": "Shake Music",
      "duration": "3:04",
      "thumbnail": "https://img.youtube.com/vi/o_TYVGp9n0s/hqdefault.jpg",
      "views": 50915848
    },
    {
      "videoId": "MxXKfq86E0I",
      "title": "2 Phút Hơn - Pháo x Masew",
      "author": "Masew",
      "duration": "2:58",
      "thumbnail": "https://img.youtube.com/vi/MxXKfq86E0I/hqdefault.jpg",
      "views": 41009714
    },
    {
      "videoId": "IF7iwRZ_pJM",
      "title": "HAI PHÚT HƠN | PHÁO & CM1X | ORIGINAL MIX",
      "author": "CM1X Official",
      "duration": "3:15",
      "thumbnail": "https://img.youtube.com/vi/IF7iwRZ_pJM/hqdefault.jpg",
      "views": 30483136
    },
    {
      "videoId": "mw7Y0jQ8_BU",
      "title": "Pháo - 2 Phút Hơn (KAIZ Remix) [Official Music Video]",
      "author": "Spinnin' Records",
      "duration": "3:11",
      "thumbnail": "https://img.youtube.com/vi/mw7Y0jQ8_BU/hqdefault.jpg",
      "views": 25035979
    },
    {
      "videoId": "AKChFg7ku2A",
      "title": "See Tình - Hoàng Thùy Linh「Cukak Remix」/ Audio Lyrics Video",
      "author": "Nicole Mayumi",
      "duration": "2:46",
      "thumbnail": "https://img.youtube.com/vi/AKChFg7ku2A/hqdefault.jpg",
      "views": 21586116
    },
    {
      "videoId": "AiJbA-81Pew",
      "title": "Phao - 2 Phut Hon (KAIZ Remix) | Animation Video 2021",
      "author": "MrMoMMusic",
      "duration": "3:04",
      "thumbnail": "https://img.youtube.com/vi/AiJbA-81Pew/hqdefault.jpg",
      "views": 20546698
    },
    {
      "videoId": "HZaShvbm8Q0",
      "title": "LẠC TRÔI (TRIPLE D REMIX) | 360 DEGREE MV |  SƠN TÙNG M-TP",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:20",
      "thumbnail": "https://img.youtube.com/vi/HZaShvbm8Q0/hqdefault.jpg",
      "views": 13010084
    },
    {
      "videoId": "dbiqR8dkITI",
      "title": "BÊN TRÊN TẦNG LẦU - TĂNG DUY TÂN ( VISCONC REMIX ) Em Ơi Đừng Khóc Bóng Tối Trước Mắt Sẽ Bắt Em Đi",
      "author": "HOA HỒNG DẠI MUSIC",
      "duration": "4:08",
      "thumbnail": "https://img.youtube.com/vi/dbiqR8dkITI/hqdefault.jpg",
      "views": 12916724
    },
    {
      "videoId": "fCRVKd4ra0A",
      "title": "Hoàng Thuỳ Linh - See Tình (speed up / TikTok Remix)",
      "author": "Dan Music",
      "duration": "2:12",
      "thumbnail": "https://img.youtube.com/vi/fCRVKd4ra0A/hqdefault.jpg",
      "views": 12467140
    },
    {
      "videoId": "7ykO69206AI",
      "title": "[叮叮当当 - TING TING TANG TANG] See Tình - Hoàng Thuỳ Linh (Cukak Remix DJ抖音版) Dance Choreo The Will5",
      "author": "The Will5 Official",
      "duration": "2:56",
      "thumbnail": "https://img.youtube.com/vi/7ykO69206AI/hqdefault.jpg",
      "views": 12217687
    },
    {
      "videoId": "oNIwqIeNpU4",
      "title": "Hoàng Thuỳ Linh - See Tình | Dance Performance",
      "author": "Hoàng Thùy Linh",
      "duration": "3:26",
      "thumbnail": "https://img.youtube.com/vi/oNIwqIeNpU4/hqdefault.jpg",
      "views": 11811189
    },
    {
      "videoId": "rN51g0l5Zpw",
      "title": "[HOT TIKTOK CHALLENGE PHỐ ĐI BỘ TẾT 2021] Pháo - 2 Phút Hơn KAIZ Remix Dance By B-WILD From Vietnam",
      "author": "B-Wild Official",
      "duration": "3:55",
      "thumbnail": "https://img.youtube.com/vi/rN51g0l5Zpw/hqdefault.jpg",
      "views": 8715793
    },
    {
      "videoId": "3BbAgRg_XKQ",
      "title": "Hoàng Thuỳ Linh - See Tình | Speed Up Version",
      "author": "Hoàng Thùy Linh",
      "duration": "2:23",
      "thumbnail": "https://img.youtube.com/vi/3BbAgRg_XKQ/hqdefault.jpg",
      "views": 6224737
    },
    {
      "videoId": "mfpoqzPdG8g",
      "title": "LẠC TRÔI Remix 2020 ( ARS Remix )",
      "author": "Leng Sambath",
      "duration": "4:13",
      "thumbnail": "https://img.youtube.com/vi/mfpoqzPdG8g/hqdefault.jpg",
      "views": 5471760
    },
    {
      "videoId": "O0sKsN-7H9Y",
      "title": "PSY-TRANCE ◉ Pháo - 2 Phút Hơn (KAIZ X RΛKHZ Remix)",
      "author": "BrutishHeavyMusic",
      "duration": "3:26",
      "thumbnail": "https://img.youtube.com/vi/O0sKsN-7H9Y/hqdefault.jpg",
      "views": 4803224
    },
    {
      "videoId": "Fv65KNGXNec",
      "title": "LAZADA SUPER PARTY - SINH NHẬT THẾ KỶ | 1ST LIVE STAGE SEE TÌNH - HOÀNG THÙY LINH",
      "author": "Lazada Việt Nam",
      "duration": "2:59",
      "thumbnail": "https://img.youtube.com/vi/Fv65KNGXNec/hqdefault.jpg",
      "views": 3141760
    },
    {
      "videoId": "QpYFGyvmtsw",
      "title": "VÙNG TRỜI BÌNH YÊN REMIX - UTHOUSE REMIX - NHẠC VINAHOUSE REMIX HÓT NHẤT TIKTOK 2024- VNC PRODUCTION",
      "author": "VNC PRODUCTION",
      "duration": "5:20",
      "thumbnail": "https://img.youtube.com/vi/QpYFGyvmtsw/hqdefault.jpg",
      "views": 3128188
    },
    {
      "videoId": "UfMEtjxzpBk",
      "title": "SEE TÌNH",
      "author": "Hoàng Thùy Linh",
      "duration": "3:06",
      "thumbnail": "https://img.youtube.com/vi/UfMEtjxzpBk/hqdefault.jpg",
      "views": 2946093
    },
    {
      "videoId": "8bG6ElvGRdk",
      "title": "Hoàng Thuỳ Linh - See Tình | Remix Version",
      "author": "Hoàng Thùy Linh",
      "duration": "2:51",
      "thumbnail": "https://img.youtube.com/vi/8bG6ElvGRdk/hqdefault.jpg",
      "views": 2444957
    },
    {
      "videoId": "-cbGww7sL_s",
      "title": "2 Phút Hơn (Make It Hot) (KAIZ Remix)",
      "author": "Pháo Northside",
      "duration": "2:40",
      "thumbnail": "https://img.youtube.com/vi/-cbGww7sL_s/hqdefault.jpg",
      "views": 2358616
    },
    {
      "videoId": "gvfXuFeTAMA",
      "title": "Phao - 2 Phut Hon (Lyrics) (KAIZ Remix) [TIKTOK SONG]",
      "author": "Unique Song",
      "duration": "3:33",
      "thumbnail": "https://img.youtube.com/vi/gvfXuFeTAMA/hqdefault.jpg",
      "views": 2273990
    },
    {
      "videoId": "DHgZb5vieaY",
      "title": "(4K) [2023 ROUND FESTIVAL] PHÁO  - Hai Phút Hơn (More Than Two Minutes)",
      "author": "ROUND Festival",
      "duration": "4:12",
      "thumbnail": "https://img.youtube.com/vi/DHgZb5vieaY/hqdefault.jpg",
      "views": 2131180
    },
    {
      "videoId": "wCKmSe9zDMw",
      "title": "Hai Phút Hơn - Pháo Northside | Live at GENfest 23",
      "author": "GENfest",
      "duration": "4:56",
      "thumbnail": "https://img.youtube.com/vi/wCKmSe9zDMw/hqdefault.jpg",
      "views": 1725351
    },
    {
      "videoId": "CmmUQZXcHAI",
      "title": "Pháo - 2 Phút Hơn (KAIZ Remix) [Official Audio]",
      "author": "Spinnin' Records",
      "duration": "3:10",
      "thumbnail": "https://img.youtube.com/vi/CmmUQZXcHAI/hqdefault.jpg",
      "views": 1510984
    },
    {
      "videoId": "RGJnT7zY2-Q",
      "title": "See Tình (Orinn Remix) - Hoàng Thùy Linh | Nhạc Trẻ Remix Hot TikTok Gây Nghiện Nhất 2022",
      "author": "Orinn Mix",
      "duration": "3:13",
      "thumbnail": "https://img.youtube.com/vi/RGJnT7zY2-Q/hqdefault.jpg",
      "views": 1506541
    },
    {
      "videoId": "RBUzwmGq2n8",
      "title": "Lạc Trôi Remix cực chất hay hơn cả Sơn Tùng MTP",
      "author": "Kiếm tiền online",
      "duration": "3:53",
      "thumbnail": "https://img.youtube.com/vi/RBUzwmGq2n8/hqdefault.jpg",
      "views": 1291801
    },
    {
      "videoId": "QYJ0qYtq2cA",
      "title": "Phao x Tyga - 2 Phút Hơn (Make It Hot) [KAIZ Remix] (Official Music Video)",
      "author": "Spinnin' Records",
      "duration": "2:42",
      "thumbnail": "https://img.youtube.com/vi/QYJ0qYtq2cA/hqdefault.jpg",
      "views": 1251293
    },
    {
      "videoId": "B1_eHmkvnrY",
      "title": "2 Phut Hon - phao Lyrics (kaiz Remix) phut Hon remix lyrics TikTok Song ( Sub. English - Lyrics )",
      "author": "LyricsVibin",
      "duration": "3:37",
      "thumbnail": "https://img.youtube.com/vi/B1_eHmkvnrY/hqdefault.jpg",
      "views": 1220059
    },
    {
      "videoId": "SBCP40He_EE",
      "title": "Bên Trên Tầng Lầu remix live cực cháy - Tăng Duy Tân | Happy Bee 13 Hà Nội",
      "author": "Cao đẳng FPT Polytechnic",
      "duration": "2:47",
      "thumbnail": "https://img.youtube.com/vi/SBCP40He_EE/hqdefault.jpg",
      "views": 474791
    },
    {
      "videoId": "pYkHkg2oGjM",
      "title": "Bên Trên Tầng Lầu - Tăng Duy Tân x Vũ HP「Remix Version by 1 9 6 7」/ Audio Lyrics Video",
      "author": "1 9 6 7 Remix",
      "duration": "2:38",
      "thumbnail": "https://img.youtube.com/vi/pYkHkg2oGjM/hqdefault.jpg",
      "views": 399134
    },
    {
      "videoId": "hUixNORyWGQ",
      "title": "Nhân Sinh Lạc Lối -  Remix | Bản Remix Vinahouse Cực Mạnh 2026",
      "author": "Góc Remix 4.0",
      "duration": "3:21",
      "thumbnail": "https://img.youtube.com/vi/hUixNORyWGQ/hqdefault.jpg",
      "views": 396396
    },
    {
      "videoId": "8NiymDaU1W8",
      "title": "See Tình - Hoàng Thùy Linh x AnhVu「Remix Version by 1 9 6 7」/ Audio Lyrics Video",
      "author": "1 9 6 7 Remix",
      "duration": "2:22",
      "thumbnail": "https://img.youtube.com/vi/8NiymDaU1W8/hqdefault.jpg",
      "views": 266960
    },
    {
      "videoId": "vFJJ1stHuzk",
      "title": "See Tình - Hoàng Thùy Linh - 2024 Petersounds Remix - Modern Talking Style - Italo Disco - New Wave",
      "author": "Petersounds Official",
      "duration": "5:44",
      "thumbnail": "https://img.youtube.com/vi/vFJJ1stHuzk/hqdefault.jpg",
      "views": 203354
    },
    {
      "videoId": "LAuGa92qq-k",
      "title": "2 Phút Hơn (KAIZ Remix)",
      "author": "Pháo Northside",
      "duration": "3:09",
      "thumbnail": "https://img.youtube.com/vi/LAuGa92qq-k/hqdefault.jpg",
      "views": 179038
    },
    {
      "videoId": "xNE6cQ-g8WE",
      "title": "Lạc Trôi Remix - Sơn Tùng M-TP x KOV | Người Theo Hương Hoa Mây Mù Giăng Lối TikTok",
      "author": "KOV New Music",
      "duration": "3:51",
      "thumbnail": "https://img.youtube.com/vi/xNE6cQ-g8WE/hqdefault.jpg",
      "views": 163676
    },
    {
      "videoId": "gtarw6wgJfI",
      "title": "Hoàng Thùy Linh - See Tình | Official Visualizer Video",
      "author": "Mưa.",
      "duration": "3:02",
      "thumbnail": "https://img.youtube.com/vi/gtarw6wgJfI/hqdefault.jpg",
      "views": 159704
    },
    {
      "videoId": "vPyWgJrRlUw",
      "title": "LẠC TRÔI REMIX ( VINZ MIX ) NHẠC TỪNG 1 THỜI HOT TIK TOK | HUYNH PAY PỎNG",
      "author": "Huỳnh Zi Zi🥀",
      "duration": "4:08",
      "thumbnail": "https://img.youtube.com/vi/vPyWgJrRlUw/hqdefault.jpg",
      "views": 130452
    },
    {
      "videoId": "v5VJFedyVfI",
      "title": "Nonstop Vinahouse 2021 Hay Nhất - New Phương Đông Club | Da Nang City",
      "author": "New Phương Đông Club",
      "duration": "5:15",
      "thumbnail": "https://img.youtube.com/vi/v5VJFedyVfI/hqdefault.jpg",
      "views": 74448
    },
    {
      "videoId": "AkG3ic_LUCQ",
      "title": "Lạc Trôi Remix | Nữ Vocal ( Hương Ly ) - NONSTOP VN Plus",
      "author": "NONSTOP VN Plus",
      "duration": "3:09",
      "thumbnail": "https://img.youtube.com/vi/AkG3ic_LUCQ/hqdefault.jpg",
      "views": 45523
    },
    {
      "videoId": "SyqZJMZ7m2s",
      "title": "[4K] MASHUP LẠC TRÔI X CHÚNG TA KHÔNG THUỘC VỀ NHAU REMIX | SƠN TÙNG M-TP LIVE Y-FEST 2024",
      "author": "NgTruongGiang",
      "duration": "3:35",
      "thumbnail": "https://img.youtube.com/vi/SyqZJMZ7m2s/hqdefault.jpg",
      "views": 43568
    },
    {
      "videoId": "iLYQP_Id3Ko",
      "title": "Hoàng Thuỳ Linh - See Tình (Vietnamese Concert Edition)",
      "author": "Hoàng Thùy Linh",
      "duration": "3:18",
      "thumbnail": "https://img.youtube.com/vi/iLYQP_Id3Ko/hqdefault.jpg",
      "views": 32266
    },
    {
      "videoId": "Elo0qZorpr0",
      "title": "LẠC TRÔI × RUNAWAY REMIX    exclusive music    NHẠC CHIẾN ĐÉT HOT TIKTOK HIỆN NAY",
      "author": "review phim",
      "duration": "6:37",
      "thumbnail": "https://img.youtube.com/vi/Elo0qZorpr0/hqdefault.jpg",
      "views": 30307
    },
    {
      "videoId": "5yJY_AGqv_A",
      "title": "BÊN TRÊN TẦNG LẦU - TĂNG DUY TÂN | LOUB ft. HOÀNG KHIÊM REMIX | NHẠC HOT TIKTOK 2022 | yuHSoda",
      "author": "yuHSoda",
      "duration": "3:41",
      "thumbnail": "https://img.youtube.com/vi/5yJY_AGqv_A/hqdefault.jpg",
      "views": 23963
    },
    {
      "videoId": "asJzEBwv3p8",
      "title": "Phao - 2 Phut Hon (Lyrics) (KAIZ Remix)",
      "author": "FirePlay",
      "duration": "3:04",
      "thumbnail": "https://img.youtube.com/vi/asJzEBwv3p8/hqdefault.jpg",
      "views": 22214
    },
    {
      "videoId": "civr37Pqi6s",
      "title": "Lạc Trôi - Thazh x Đông Remix | Nhạc Remix Hot TikTok 2026",
      "author": "Hyper Remix",
      "duration": "4:14",
      "thumbnail": "https://img.youtube.com/vi/civr37Pqi6s/hqdefault.jpg",
      "views": 9636
    },
    {
      "videoId": "NR46y3z4ClU",
      "title": "[VŨ ĐOÀN JT] Hoàng Thùy Linh - See Tình Cukak Remix Dance Practice - Nhận show biểu diễn Hà Nội",
      "author": "Vũ Đoàn JT - JUNTO Daily",
      "duration": "2:43",
      "thumbnail": "https://img.youtube.com/vi/NR46y3z4ClU/hqdefault.jpg",
      "views": 8537
    },
    {
      "videoId": "10s0FidkXOo",
      "title": "Lk Remix Cực Hay|THU CUỐI×BÊN TRÊN TẦNG LẦU×CHẠY VỀ NƠI PHÍA ANH|Nhạc phố cổ",
      "author": "Escuchar para entender",
      "duration": "8:29",
      "thumbnail": "https://img.youtube.com/vi/10s0FidkXOo/hqdefault.jpg",
      "views": 8494
    },
    {
      "videoId": "tJaRjG3XKUY",
      "title": "Hoàng Thùy Linh - See Tình (DTAP Remix) [Audio]",
      "author": "FC Hoàng Thùy Linh Hà Nội",
      "duration": "2:37",
      "thumbnail": "https://img.youtube.com/vi/tJaRjG3XKUY/hqdefault.jpg",
      "views": 4820
    },
    {
      "videoId": "GV0HId6-jgo",
      "title": "BÊN TRÊN TẦNG LẦU REMIX//VINAHOUSE MTST MUSIC",
      "author": "TU PHAM TEAM MUSIC",
      "duration": "9:32",
      "thumbnail": "https://img.youtube.com/vi/GV0HId6-jgo/hqdefault.jpg",
      "views": 4041
    },
    {
      "videoId": "CtNk-9KunJY",
      "title": "Lạc Trôi Remix 2026 ( Hương Ly ) - Dj Ảo Ma",
      "author": "Hùng House MuZik",
      "duration": "7:10",
      "thumbnail": "https://img.youtube.com/vi/CtNk-9KunJY/hqdefault.jpg",
      "views": 2138
    },
    {
      "videoId": "Coj8-zTvfRw",
      "title": "​Bên Trên Tầng Lầu Remix Vinahouse 2026 - Bản Mix \"Cháy\" Nhất Hiện Nay",
      "author": "hieutran-nhacviet",
      "duration": "5:48",
      "thumbnail": "https://img.youtube.com/vi/Coj8-zTvfRw/hqdefault.jpg",
      "views": 2079
    },
    {
      "videoId": "pypXGNqoqPc",
      "title": "Bên Trên Tầng Lầu - Tăng Duy Tân (Vinahouse Remix) | LAI REMIX",
      "author": "LAI REMIX",
      "duration": "3:17",
      "thumbnail": "https://img.youtube.com/vi/pypXGNqoqPc/hqdefault.jpg",
      "views": 1347
    },
    {
      "videoId": "yY0pFj57KXw",
      "title": "BÊN TRÊN TẦNG LẦU REMIX  💋 - DJ ĐẠI MÈO - NONSTOP  - VINAHOUSE - VIỆT MIX - NVH Music ♫",
      "author": "NVH Music ♫",
      "duration": "3:48",
      "thumbnail": "https://img.youtube.com/vi/yY0pFj57KXw/hqdefault.jpg",
      "views": 1190
    },
    {
      "videoId": "9Pbkg6jpcqA",
      "title": "NAM2K REMIX - [ LAC TROI - MTP ] - | - VINAHOUSE 2026",
      "author": "NAM2K",
      "duration": "4:22",
      "thumbnail": "https://img.youtube.com/vi/9Pbkg6jpcqA/hqdefault.jpg",
      "views": 565
    }
  ]
};

