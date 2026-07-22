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
      "videoId": "knW7-x7Y7RE",
      "title": "SƠN TÙNG M-TP | HÃY TRAO CHO ANH ft. Snoop Dogg | Official MV",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:23",
      "thumbnail": "https://img.youtube.com/vi/knW7-x7Y7RE/hqdefault.jpg",
      "views": 311737549
    },
    {
      "videoId": "yuuWdm5tBD0",
      "title": "SON TUNG M-TP | COME MY WAY (softer version) | OFFICIAL MUSIC VIDEO",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:13",
      "thumbnail": "https://img.youtube.com/vi/yuuWdm5tBD0/hqdefault.jpg",
      "views": 3809488
    },
    {
      "videoId": "32sYGCOYJUM",
      "title": "CHẠY NGAY ĐI | RUN NOW | SƠN TÙNG M-TP | Official Music Video",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:34",
      "thumbnail": "https://img.youtube.com/vi/32sYGCOYJUM/hqdefault.jpg",
      "views": 165392019
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
      "videoId": "zoEtcR5EW08",
      "title": "SƠN TÙNG M-TP | CHÚNG TA CỦA TƯƠNG LAI | OFFICIAL MUSIC VIDEO",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:37",
      "thumbnail": "https://img.youtube.com/vi/zoEtcR5EW08/hqdefault.jpg",
      "views": 90443180
    },
    {
      "videoId": "Llw9Q6akRo4",
      "title": "LẠC TRÔI | OFFICIAL MUSIC VIDEO | SƠN TÙNG M-TP",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:33",
      "thumbnail": "https://img.youtube.com/vi/Llw9Q6akRo4/hqdefault.jpg",
      "views": 287347649
    },
    {
      "videoId": "Vt4kAu-ziRY",
      "title": "Em Của Ngày Hôm Qua - Sơn Tùng MTP [OFFICIAL MV]",
      "author": "Sơn Tùng M-TP",
      "duration": "4:55",
      "thumbnail": "https://img.youtube.com/vi/Vt4kAu-ziRY/hqdefault.jpg",
      "views": 3803489
    },
    {
      "videoId": "abPmZCZZrFA",
      "title": "SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU | OFFICIAL MUSIC VIDEO",
      "author": "Sơn Tùng M-TP Official",
      "duration": "5:26",
      "thumbnail": "https://img.youtube.com/vi/abPmZCZZrFA/hqdefault.jpg",
      "views": 180200524
    },
    {
      "videoId": "SlQR9iu09bQ",
      "title": "SON TUNG M-TP x TYGA | COME MY WAY | OFFICIAL MUSIC VIDEO",
      "author": "Sơn Tùng M-TP Official and Tyga",
      "duration": "3:55",
      "thumbnail": "https://img.youtube.com/vi/SlQR9iu09bQ/hqdefault.jpg",
      "views": 39519241
    },
    {
      "videoId": "FN7ALfpGxiI",
      "title": "NƠI NÀY CÓ ANH | OFFICIAL MUSIC VIDEO | SƠN TÙNG M-TP",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:39",
      "thumbnail": "https://img.youtube.com/vi/FN7ALfpGxiI/hqdefault.jpg",
      "views": 454200236
    },
    {
      "videoId": "PdbsnGuduvo",
      "title": "Sơn Tùng M-TP - Chắc Ai Đó Sẽ Về",
      "author": "Sơn Tùng M-TP Official",
      "duration": "5:15",
      "thumbnail": "https://img.youtube.com/vi/PdbsnGuduvo/hqdefault.jpg",
      "views": 61005764
    },
    {
      "videoId": "qGRU3sRbaYw",
      "title": "Chúng Ta Không Thuộc Về Nhau | Official Music Video | Sơn Tùng M-TP",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:03",
      "thumbnail": "https://img.youtube.com/vi/qGRU3sRbaYw/hqdefault.jpg",
      "views": 248885803
    },
    {
      "videoId": "JHSRTU31T14",
      "title": "SƠN TÙNG M-TP | THERE’S NO ONE AT ALL (ANOTHER VERSION) | OFFICIAL MUSIC VIDEO",
      "author": "Sơn Tùng M-TP Official",
      "duration": "3:42",
      "thumbnail": "https://img.youtube.com/vi/JHSRTU31T14/hqdefault.jpg",
      "views": 26108455
    },
    {
      "videoId": "LCyo565N_5w",
      "title": "Buông Đôi Tay Nhau Ra | OFFICIAL MUSIC VIDEO | Sơn Tùng M-TP",
      "author": "Sơn Tùng M-TP Official",
      "duration": "4:50",
      "thumbnail": "https://img.youtube.com/vi/LCyo565N_5w/hqdefault.jpg",
      "views": 176795559
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
      "videoId": "8sVtL0o-v7U",
      "title": "HIEUTHUHAI - Người Im Lặng Gặp Người Hay Nói (prod. by Kewtiie) l Official Music Video",
      "author": "HIEUTHUHAI",
      "duration": "5:23",
      "thumbnail": "https://img.youtube.com/vi/8sVtL0o-v7U/hqdefault.jpg",
      "views": 40254367
    },
    {
      "videoId": "i0nd3NPJ4MI",
      "title": "HIEUTHUHAI - Không Thể Say (prod. by Kewtiie) l Official Video",
      "author": "HIEUTHUHAI",
      "duration": "4:21",
      "thumbnail": "https://img.youtube.com/vi/i0nd3NPJ4MI/hqdefault.jpg",
      "views": 67207055
    },
    {
      "videoId": "1OJQdxT6WHE",
      "title": "hieuthuhai - ngủ một mình (tình rất tình) ft. negav (prod. by kewtiie)",
      "author": "HIEUTHUHAI",
      "duration": "3:26",
      "thumbnail": "https://img.youtube.com/vi/1OJQdxT6WHE/hqdefault.jpg",
      "views": 84593687
    },
    {
      "videoId": "zaYS8tiD0Og",
      "title": "HIEUTHUHAI - Crocodile Tears (prod. by Kewtiie) l Official Music Video",
      "author": "HIEUTHUHAI",
      "duration": "3:33",
      "thumbnail": "https://img.youtube.com/vi/zaYS8tiD0Og/hqdefault.jpg",
      "views": 30166559
    },
    {
      "videoId": "sJt_i0hOugA",
      "title": "HIEUTHUHAI - Exit Sign (prod. by Kewtiie) ft. marzuz [Official Lyric Video]",
      "author": "HIEUTHUHAI",
      "duration": "3:22",
      "thumbnail": "https://img.youtube.com/vi/sJt_i0hOugA/hqdefault.jpg",
      "views": 101368578
    },
    {
      "videoId": "aEAbCjFPtjY",
      "title": "HIEUTHUHAI x PHƯƠNG LY - Xoay Một Vòng (prod. by Kewtiie) l Official Music Video",
      "author": "HIEUTHUHAI",
      "duration": "2:56",
      "thumbnail": "https://img.youtube.com/vi/aEAbCjFPtjY/hqdefault.jpg",
      "views": 10739935
    },
    {
      "videoId": "TTwlhJzXHo4",
      "title": "HIEUTHUHAI - Vệ Tinh ft. Hoàng Tôn (prod. by Kewtiie) | OFFICIAL MV",
      "author": "HIEUTHUHAI",
      "duration": "4:01",
      "thumbnail": "https://img.youtube.com/vi/TTwlhJzXHo4/hqdefault.jpg",
      "views": 37469011
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
      "videoId": "RkgqKIjnpGs",
      "title": "HIEUTHUHAI - Anh Nên Đi Khỏi Đây (prod. by Kewtiie) | Official Lyric Video",
      "author": "HIEUTHUHAI",
      "duration": "3:20",
      "thumbnail": "https://img.youtube.com/vi/RkgqKIjnpGs/hqdefault.jpg",
      "views": 1883584
    },
    {
      "videoId": "NpI4TSgBVTw",
      "title": "HIEUTHUHAI - Mong Năm Mới Trải Hoa (prod. by Kewtiie) I Official Music Video",
      "author": "HIEUTHUHAI",
      "duration": "3:06",
      "thumbnail": "https://img.youtube.com/vi/NpI4TSgBVTw/hqdefault.jpg",
      "views": 6238700
    },
    {
      "videoId": "Cmz5f3Sock4",
      "title": "HIEUTHUHAI - Hết Yêu (prod. by Kewtiie) | Official Lyric Video",
      "author": "HIEUTHUHAI",
      "duration": "4:02",
      "thumbnail": "https://img.youtube.com/vi/Cmz5f3Sock4/hqdefault.jpg",
      "views": 2634042
    },
    {
      "videoId": "STjzkjnLlZ4",
      "title": "hieuthuhai - ngủ một mình ft. negav (prod. by kewtiie) | official mv",
      "author": "HIEUTHUHAI",
      "duration": "3:41",
      "thumbnail": "https://img.youtube.com/vi/STjzkjnLlZ4/hqdefault.jpg",
      "views": 15633025
    },
    {
      "videoId": "dLmczwDCEZI",
      "title": "HURRYKNG, HIEUTHUHAI, MANBO | Hẹn Gặp Em Dưới Ánh Trăng | Official Video",
      "author": "GERDNANG",
      "duration": "3:52",
      "thumbnail": "https://img.youtube.com/vi/dLmczwDCEZI/hqdefault.jpg",
      "views": 55755062
    },
    {
      "videoId": "umMQf9spwMw",
      "title": "HIEUTHUHAI - Người Im Lặng Gặp Người Hay Nói (prod. by Kewtiie) | Official Lyric Video",
      "author": "HIEUTHUHAI",
      "duration": "4:16",
      "thumbnail": "https://img.youtube.com/vi/umMQf9spwMw/hqdefault.jpg",
      "views": 3367081
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
      "videoId": "dytPiW3fef0",
      "title": "HIEUTHUHAI - Chờ Tới Khi Anh Về ft. Hoàng Tôn (prod. by Kewtiie) | Official Lyric Video",
      "author": "HIEUTHUHAI",
      "duration": "3:34",
      "thumbnail": "https://img.youtube.com/vi/dytPiW3fef0/hqdefault.jpg",
      "views": 4736729
    },
    {
      "videoId": "YtH1P4X-8_o",
      "title": "Trúc Nhân x HIEUTHUHAI x Bùi Công Nam - TẾT NHỚ TỚI GIÀ (Official M/V)",
      "author": "Trúc Nhân",
      "duration": "4:12",
      "thumbnail": "https://img.youtube.com/vi/YtH1P4X-8_o/hqdefault.jpg",
      "views": 13006213
    },
    {
      "videoId": "Nf6Lb7DCzM0",
      "title": "Orange ft HIEUTHUHAI - 'Ok Anh Đúng' (Chapt. 2) Lyrical MV",
      "author": "Orange Singer Official",
      "duration": "3:20",
      "thumbnail": "https://img.youtube.com/vi/Nf6Lb7DCzM0/hqdefault.jpg",
      "views": 2847201
    },
    {
      "videoId": "o9thOizwRW4",
      "title": "수빈 (SOOBIN) 'Sunday Driver' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:07",
      "thumbnail": "https://img.youtube.com/vi/o9thOizwRW4/hqdefault.jpg",
      "views": 4624889
    },
    {
      "videoId": "OZmK0YuSmXU",
      "title": "SOOBIN - Dancing In The Dark | 'BẬT NÓ LÊN' Album (Official MV)",
      "author": "SOOBIN Official",
      "duration": "4:39",
      "thumbnail": "https://img.youtube.com/vi/OZmK0YuSmXU/hqdefault.jpg",
      "views": 41392043
    }
  ],
  "kpop": [
    {
      "videoId": "2GJfWMYCWY0",
      "title": "BLACKPINK - ‘GO’ M/V",
      "author": "BLACKPINK",
      "duration": "3:22",
      "thumbnail": "https://img.youtube.com/vi/2GJfWMYCWY0/hqdefault.jpg",
      "views": 87240999
    },
    {
      "videoId": "ioNng23DkIM",
      "title": "BLACKPINK - 'How You Like That' M/V",
      "author": "BLACKPINK",
      "duration": "3:04",
      "thumbnail": "https://img.youtube.com/vi/ioNng23DkIM/hqdefault.jpg",
      "views": 1375204526
    },
    {
      "videoId": "gQlMMD8auMs",
      "title": "BLACKPINK - ‘Pink Venom’ M/V",
      "author": "BLACKPINK",
      "duration": "3:14",
      "thumbnail": "https://img.youtube.com/vi/gQlMMD8auMs/hqdefault.jpg",
      "views": 1088025008
    },
    {
      "videoId": "2S24-y0Ij3Y",
      "title": "BLACKPINK - 'Kill This Love' M/V",
      "author": "BLACKPINK",
      "duration": "3:14",
      "thumbnail": "https://img.youtube.com/vi/2S24-y0Ij3Y/hqdefault.jpg",
      "views": 2226143002
    },
    {
      "videoId": "Amq-qlqbjYA",
      "title": "BLACKPINK - '마지막처럼 (AS IF IT'S YOUR LAST)' M/V",
      "author": "BLACKPINK",
      "duration": "3:37",
      "thumbnail": "https://img.youtube.com/vi/Amq-qlqbjYA/hqdefault.jpg",
      "views": 1529192326
    },
    {
      "videoId": "dyRsYk0LyA8",
      "title": "BLACKPINK - 'Lovesick Girls' M/V",
      "author": "BLACKPINK",
      "duration": "3:22",
      "thumbnail": "https://img.youtube.com/vi/dyRsYk0LyA8/hqdefault.jpg",
      "views": 859469960
    },
    {
      "videoId": "CgCVZdcKcqY",
      "title": "BLACKPINK - ‘뛰어(JUMP)’ M/V",
      "author": "BLACKPINK",
      "duration": "3:14",
      "thumbnail": "https://img.youtube.com/vi/CgCVZdcKcqY/hqdefault.jpg",
      "views": 411277053
    },
    {
      "videoId": "vRXZj0DzXIA",
      "title": "BLACKPINK - 'Ice Cream (with Selena Gomez)' M/V",
      "author": "BLACKPINK",
      "duration": "3:03",
      "thumbnail": "https://img.youtube.com/vi/vRXZj0DzXIA/hqdefault.jpg",
      "views": 1008767253
    },
    {
      "videoId": "POe9SOEKotk",
      "title": "BLACKPINK - ‘Shut Down’ M/V",
      "author": "BLACKPINK",
      "duration": "3:01",
      "thumbnail": "https://img.youtube.com/vi/POe9SOEKotk/hqdefault.jpg",
      "views": 814483645
    },
    {
      "videoId": "IHNzOHi8sJs",
      "title": "BLACKPINK - ‘뚜두뚜두 (DDU-DU DDU-DU)’ M/V",
      "author": "BLACKPINK",
      "duration": "3:36",
      "thumbnail": "https://img.youtube.com/vi/IHNzOHi8sJs/hqdefault.jpg",
      "views": 2399563464
    },
    {
      "videoId": "9pdj4iJD08s",
      "title": "BLACKPINK - '불장난 (PLAYING WITH FIRE)' M/V",
      "author": "BLACKPINK",
      "duration": "3:29",
      "thumbnail": "https://img.youtube.com/vi/9pdj4iJD08s/hqdefault.jpg",
      "views": 968816554
    },
    {
      "videoId": "bwmSjveL3Lc",
      "title": "BLACKPINK - '붐바야 (BOOMBAYAH)' M/V",
      "author": "BLACKPINK",
      "duration": "4:04",
      "thumbnail": "https://img.youtube.com/vi/bwmSjveL3Lc/hqdefault.jpg",
      "views": 1886672397
    },
    {
      "videoId": "FzVR_fymZw4",
      "title": "BLACKPINK - 'STAY' M/V",
      "author": "BLACKPINK",
      "duration": "4:01",
      "thumbnail": "https://img.youtube.com/vi/FzVR_fymZw4/hqdefault.jpg",
      "views": 383422793
    },
    {
      "videoId": "-933PCOccEk",
      "title": "BLACKPINK - 'Champion' M/V",
      "author": "pinkbloody",
      "duration": "2:54",
      "thumbnail": "https://img.youtube.com/vi/-933PCOccEk/hqdefault.jpg",
      "views": 973490
    },
    {
      "videoId": "b73BI9eUkjM",
      "title": "JENNIE - 'SOLO' M/V",
      "author": "BLACKPINK",
      "duration": "2:57",
      "thumbnail": "https://img.youtube.com/vi/b73BI9eUkjM/hqdefault.jpg",
      "views": 1086433487
    },
    {
      "videoId": "7WyHtSlvHD4",
      "title": "BLACKPINK X PUBG MOBILE - ‘Ready For Love’ M/V",
      "author": "BLACKPINK",
      "duration": "3:07",
      "thumbnail": "https://img.youtube.com/vi/7WyHtSlvHD4/hqdefault.jpg",
      "views": 189650097
    },
    {
      "videoId": "GEk4jHwfFTA",
      "title": "BTS (방탄소년단) ‘NORMAL’ Official MV",
      "author": "HYBE LABELS",
      "duration": "3:27",
      "thumbnail": "https://img.youtube.com/vi/GEk4jHwfFTA/hqdefault.jpg",
      "views": 8037697
    },
    {
      "videoId": "_gyultVTesk",
      "title": "BTS (방탄소년단) '2.0' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:55",
      "thumbnail": "https://img.youtube.com/vi/_gyultVTesk/hqdefault.jpg",
      "views": 143639916
    },
    {
      "videoId": "gdZLi9oWNZg",
      "title": "BTS (방탄소년단) 'Dynamite' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:44",
      "thumbnail": "https://img.youtube.com/vi/gdZLi9oWNZg/hqdefault.jpg",
      "views": 2111128593
    },
    {
      "videoId": "H8lYMWZD5P8",
      "title": "BTS (방탄소년단) '쩔어' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:17",
      "thumbnail": "https://img.youtube.com/vi/H8lYMWZD5P8/hqdefault.jpg",
      "views": 229316038
    },
    {
      "videoId": "WMweEpGlu_U",
      "title": "BTS (방탄소년단) 'Butter' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:03",
      "thumbnail": "https://img.youtube.com/vi/WMweEpGlu_U/hqdefault.jpg",
      "views": 1099072014
    },
    {
      "videoId": "43r6lXilbcQ",
      "title": "BTS (방탄소년단) 'Danger' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:47",
      "thumbnail": "https://img.youtube.com/vi/43r6lXilbcQ/hqdefault.jpg",
      "views": 134004526
    },
    {
      "videoId": "GZjt_sA2eso",
      "title": "BTS (방탄소년단) 'Save ME' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:37",
      "thumbnail": "https://img.youtube.com/vi/GZjt_sA2eso/hqdefault.jpg",
      "views": 819872339
    },
    {
      "videoId": "VTRGOBT6p80",
      "title": "BTS (방탄소년단) 'Magic Shop' Official MV",
      "author": "BIGHIT MUSIC OFFICIAL",
      "duration": "4:49",
      "thumbnail": "https://img.youtube.com/vi/VTRGOBT6p80/hqdefault.jpg",
      "views": 1857780
    },
    {
      "videoId": "diBO0gMuTXo",
      "title": "BTS (방탄소년단) 'Hooligan' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:04",
      "thumbnail": "https://img.youtube.com/vi/diBO0gMuTXo/hqdefault.jpg",
      "views": 77277941
    },
    {
      "videoId": "zFT3f9biz68",
      "title": "BTS (방탄소년단) 'Film out' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:49",
      "thumbnail": "https://img.youtube.com/vi/zFT3f9biz68/hqdefault.jpg",
      "views": 242140750
    },
    {
      "videoId": "kTlv5_Bs8aw",
      "title": "BTS (방탄소년단) 'MIC Drop (Steve Aoki Remix)' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:34",
      "thumbnail": "https://img.youtube.com/vi/kTlv5_Bs8aw/hqdefault.jpg",
      "views": 1586910850
    },
    {
      "videoId": "b4iVv91Z6lY",
      "title": "BTS (방탄소년단) ‘SWIM’ Official MV",
      "author": "HYBE LABELS",
      "duration": "4:05",
      "thumbnail": "https://img.youtube.com/vi/b4iVv91Z6lY/hqdefault.jpg",
      "views": 144511460
    },
    {
      "videoId": "0lapF4DQPKQ",
      "title": "BTS (방탄소년단) 'Black Swan' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:38",
      "thumbnail": "https://img.youtube.com/vi/0lapF4DQPKQ/hqdefault.jpg",
      "views": 604739043
    },
    {
      "videoId": "teiso8wiqOI",
      "title": "BTS “NORMAL” Fan Music Video",
      "author": "Laura Helena",
      "duration": "3:19",
      "thumbnail": "https://img.youtube.com/vi/teiso8wiqOI/hqdefault.jpg",
      "views": 1080646
    },
    {
      "videoId": "-5q5mZbe3V8",
      "title": "BTS (방탄소년단) 'Life Goes On' Official MV",
      "author": "HYBE LABELS",
      "duration": "3:51",
      "thumbnail": "https://img.youtube.com/vi/-5q5mZbe3V8/hqdefault.jpg",
      "views": 600954922
    },
    {
      "videoId": "7UWBYJjuIL0",
      "title": "[2020 FESTA] BTS (방탄소년단) 'We are Bulletproof : the Eternal' MV #2020BTSFESTA",
      "author": "BANGTANTV",
      "duration": "4:33",
      "thumbnail": "https://img.youtube.com/vi/7UWBYJjuIL0/hqdefault.jpg",
      "views": 124137646
    },
    {
      "videoId": "xEeFrLSkMm8",
      "title": "BTS (방탄소년단) '봄날 (Spring Day)' Official MV",
      "author": "HYBE LABELS",
      "duration": "5:29",
      "thumbnail": "https://img.youtube.com/vi/xEeFrLSkMm8/hqdefault.jpg",
      "views": 573170376
    },
    {
      "videoId": "MBdVXkSdhwU",
      "title": "BTS (방탄소년단) 'DNA' Official MV",
      "author": "HYBE LABELS",
      "duration": "4:16",
      "thumbnail": "https://img.youtube.com/vi/MBdVXkSdhwU/hqdefault.jpg",
      "views": 1665102164
    },
    {
      "videoId": "eHHQaoEW30Q",
      "title": "TWICE \"THIS IS FOR\" M/V",
      "author": "JYP Entertainment",
      "duration": "2:14",
      "thumbnail": "https://img.youtube.com/vi/eHHQaoEW30Q/hqdefault.jpg",
      "views": 136142724
    }
  ],
  "vinahouse": [
    {
      "videoId": "yoZy2E17-50",
      "title": "Phao - 2 Phut Hon (KAIZ Remix) | TikTok Vietnamese Music 2020",
      "author": "Light Night Music",
      "duration": "4:21",
      "thumbnail": "https://img.youtube.com/vi/yoZy2E17-50/hqdefault.jpg",
      "views": 370964659
    },
    {
      "videoId": "mw7Y0jQ8_BU",
      "title": "Pháo - 2 Phút Hơn (KAIZ Remix) [Official Music Video]",
      "author": "Spinnin' Records",
      "duration": "3:11",
      "thumbnail": "https://img.youtube.com/vi/mw7Y0jQ8_BU/hqdefault.jpg",
      "views": 25035932
    },
    {
      "videoId": "_AL4IwHuHlY",
      "title": "Pháo - 2 Phút Hơn (KAIZ Remix)",
      "author": "Distraction",
      "duration": "3:04",
      "thumbnail": "https://img.youtube.com/vi/_AL4IwHuHlY/hqdefault.jpg",
      "views": 258635394
    },
    {
      "videoId": "DHgZb5vieaY",
      "title": "(4K) [2023 ROUND FESTIVAL] PHÁO  - Hai Phút Hơn (More Than Two Minutes)",
      "author": "ROUND Festival",
      "duration": "4:12",
      "thumbnail": "https://img.youtube.com/vi/DHgZb5vieaY/hqdefault.jpg",
      "views": 2131170
    },
    {
      "videoId": "stwlBOkVtBE",
      "title": "[HOT TIKTOK Dance Public]PHAO - 2 Phut Hon/Zero Two (KAIZ Remix) Challenge Dance by JT Crew VietNam",
      "author": "JUNTO Crew Official",
      "duration": "3:25",
      "thumbnail": "https://img.youtube.com/vi/stwlBOkVtBE/hqdefault.jpg",
      "views": 63087831
    },
    {
      "videoId": "Lpj_F8NlGnk",
      "title": "Pháo Northside - 2 Phút Hơn (DJ Kaiz) (Remake) ft. Tyga",
      "author": "Pháo Northside",
      "duration": "2:40",
      "thumbnail": "https://img.youtube.com/vi/Lpj_F8NlGnk/hqdefault.jpg",
      "views": 2199956
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
      "videoId": "QYJ0qYtq2cA",
      "title": "Phao x Tyga - 2 Phút Hơn (Make It Hot) [KAIZ Remix] (Official Music Video)",
      "author": "Spinnin' Records",
      "duration": "2:42",
      "thumbnail": "https://img.youtube.com/vi/QYJ0qYtq2cA/hqdefault.jpg",
      "views": 1251292
    },
    {
      "videoId": "-cbGww7sL_s",
      "title": "2 Phút Hơn (Make It Hot) (KAIZ Remix)",
      "author": "Pháo Northside",
      "duration": "2:40",
      "thumbnail": "https://img.youtube.com/vi/-cbGww7sL_s/hqdefault.jpg",
      "views": 2358603
    },
    {
      "videoId": "MxXKfq86E0I",
      "title": "2 Phút Hơn - Pháo x Masew",
      "author": "Masew",
      "duration": "2:58",
      "thumbnail": "https://img.youtube.com/vi/MxXKfq86E0I/hqdefault.jpg",
      "views": 41009698
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
      "videoId": "wCKmSe9zDMw",
      "title": "Hai Phút Hơn - Pháo Northside | Live at GENfest 23",
      "author": "GENfest",
      "duration": "4:56",
      "thumbnail": "https://img.youtube.com/vi/wCKmSe9zDMw/hqdefault.jpg",
      "views": 1725330
    },
    {
      "videoId": "3NSNzxzCnNA",
      "title": "2 Phut Hon - Phao (KAIZ Remix) GUITAR COVER.",
      "author": "To₿ee Maguire",
      "duration": "3:12",
      "thumbnail": "https://img.youtube.com/vi/3NSNzxzCnNA/hqdefault.jpg",
      "views": 9886826
    },
    {
      "videoId": "o_TYVGp9n0s",
      "title": "Phao - 2 Phut Hon (KAIZ Remix) | 9D AUDIO 🎧",
      "author": "Shake Music",
      "duration": "3:04",
      "thumbnail": "https://img.youtube.com/vi/o_TYVGp9n0s/hqdefault.jpg",
      "views": 50915833
    },
    {
      "videoId": "2NIlG5DTdv0",
      "title": "Pháo - 2 Phút Hơn (KAIZ Extended Remix)",
      "author": "DANIEL BRESCHAK",
      "duration": "4:01",
      "thumbnail": "https://img.youtube.com/vi/2NIlG5DTdv0/hqdefault.jpg",
      "views": 22180
    },
    {
      "videoId": "FA6o31DKjmg",
      "title": "2 Phút Hơn - Pháo × KAIZ Remix [ Lyrics // Speed Up ] | Ichika - Blue Archive Live2D",
      "author": "SArisu Chill",
      "duration": "2:46",
      "thumbnail": "https://img.youtube.com/vi/FA6o31DKjmg/hqdefault.jpg",
      "views": 520412
    },
    {
      "videoId": "zIlkbytO0LA",
      "title": "TIKTOK Dance Public - PHAO - 2 Phut Hon Zero Two (KAIZ Remix) Dance Challenge #tiktok #dance",
      "author": "Logan x24 Tekken 8",
      "duration": "2:24",
      "thumbnail": "https://img.youtube.com/vi/zIlkbytO0LA/hqdefault.jpg",
      "views": 413873
    },
    {
      "videoId": "8bG6ElvGRdk",
      "title": "Hoàng Thuỳ Linh - See Tình | Remix Version",
      "author": "Hoàng Thùy Linh",
      "duration": "2:51",
      "thumbnail": "https://img.youtube.com/vi/8bG6ElvGRdk/hqdefault.jpg",
      "views": 2444946
    },
    {
      "videoId": "tVTRY6851Ug",
      "title": "See Tình - Hoàng Thùy Linh「Cukak Remix」/ Audio Lyrics Video",
      "author": "Cukak",
      "duration": "2:51",
      "thumbnail": "https://img.youtube.com/vi/tVTRY6851Ug/hqdefault.jpg",
      "views": 64689813
    },
    {
      "videoId": "AKChFg7ku2A",
      "title": "See Tình - Hoàng Thùy Linh「Cukak Remix」/ Audio Lyrics Video",
      "author": "Nicole Mayumi",
      "duration": "2:46",
      "thumbnail": "https://img.youtube.com/vi/AKChFg7ku2A/hqdefault.jpg",
      "views": 21586060
    },
    {
      "videoId": "gJHSDZfJrRY",
      "title": "Hoàng Thuỳ Linh - See Tình | Official Music Video",
      "author": "Hoàng Thùy Linh",
      "duration": "3:57",
      "thumbnail": "https://img.youtube.com/vi/gJHSDZfJrRY/hqdefault.jpg",
      "views": 74343378
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
      "videoId": "oNIwqIeNpU4",
      "title": "Hoàng Thuỳ Linh - See Tình | Dance Performance",
      "author": "Hoàng Thùy Linh",
      "duration": "3:26",
      "thumbnail": "https://img.youtube.com/vi/oNIwqIeNpU4/hqdefault.jpg",
      "views": 11811189
    },
    {
      "videoId": "E1PIqgTltVA",
      "title": "See Tình (Cucak Remix DJ抖音版) - Hoàng Thùy Linh『叮叮当当 Tình tình tình tang tang tính。』【動態歌詞】♪",
      "author": "Lyrics Music",
      "duration": "2:51",
      "thumbnail": "https://img.youtube.com/vi/E1PIqgTltVA/hqdefault.jpg",
      "views": 22591899
    },
    {
      "videoId": "3BbAgRg_XKQ",
      "title": "Hoàng Thuỳ Linh - See Tình | Speed Up Version",
      "author": "Hoàng Thùy Linh",
      "duration": "2:23",
      "thumbnail": "https://img.youtube.com/vi/3BbAgRg_XKQ/hqdefault.jpg",
      "views": 6224732
    },
    {
      "videoId": "fCRVKd4ra0A",
      "title": "Hoàng Thuỳ Linh - See Tình (speed up / TikTok Remix)",
      "author": "Dan Music",
      "duration": "2:12",
      "thumbnail": "https://img.youtube.com/vi/fCRVKd4ra0A/hqdefault.jpg",
      "views": 12467122
    },
    {
      "videoId": "7ykO69206AI",
      "title": "[叮叮当当 - TING TING TANG TANG] See Tình - Hoàng Thuỳ Linh (Cukak Remix DJ抖音版) Dance Choreo The Will5",
      "author": "The Will5 Official",
      "duration": "2:56",
      "thumbnail": "https://img.youtube.com/vi/7ykO69206AI/hqdefault.jpg",
      "views": 12217644
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
      "videoId": "lVFvMCRU-2A",
      "title": "See Tình x Ai Đưa Em Về (Switching Vocals) / Nightcore",
      "author": "Sen",
      "duration": "4:27",
      "thumbnail": "https://img.youtube.com/vi/lVFvMCRU-2A/hqdefault.jpg",
      "views": 1975922
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
      "videoId": "bA1MhSK8wBE",
      "title": "Hoàng Thùy Linh - Kẻ Cắp Gặp Bà Già (Diamond Cut Diamond)| Official Music Video",
      "author": "Hoàng Thùy Linh",
      "duration": "4:30",
      "thumbnail": "https://img.youtube.com/vi/bA1MhSK8wBE/hqdefault.jpg",
      "views": 82191714
    },
    {
      "videoId": "ob213mr3tPc",
      "title": "Hoàng Thùy Linh - See Tình (Remix)  | Tiger Remix (TP.HCM)",
      "author": "FC Hoàng Thùy Linh Hà Nội",
      "duration": "3:27",
      "thumbnail": "https://img.youtube.com/vi/ob213mr3tPc/hqdefault.jpg",
      "views": 217673
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
      "videoId": "v5VJFedyVfI",
      "title": "Nonstop Vinahouse 2021 Hay Nhất - New Phương Đông Club | Da Nang City",
      "author": "New Phương Đông Club",
      "duration": "5:15",
      "thumbnail": "https://img.youtube.com/vi/v5VJFedyVfI/hqdefault.jpg",
      "views": 74448
    },
    {
      "videoId": "WymQNJ4iuHk",
      "title": "ĐÀ LẠT CÒN MƯA KHÔNG EM - DJ TRIỆU MUZIK x OANH TẠ | HẢI SEA REMIX",
      "author": "DJ Triệu Muzik Official",
      "duration": "3:24",
      "thumbnail": "https://img.youtube.com/vi/WymQNJ4iuHk/hqdefault.jpg",
      "views": 1117698
    }
  ]
};

