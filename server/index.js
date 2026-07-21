import express from 'express';
import crypto from 'crypto';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import yts from 'yt-search';
import ytsr from 'ytsr';
import { readFileSync, writeFileSync } from 'fs';
import { publishTopikGrammarBundle } from './topik-publish.mjs';
import { buildTopikQuestionOrder, canManageTopikRoomGame, shuffleTopikQuestionOptions } from './topik-game-utils.mjs';
import {
  filterMusicVideo,
  getFallbackMusicSearchQuery,
  getTrendingMusicQueries,
  STATIC_TRENDING_FALLBACKS,
} from './music-trending-utils.mjs';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use((error, req, res, next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Nội dung AI quá lớn để gửi lên server. Hãy thử tạo ít mẫu hơn mỗi lần.' });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Dữ liệu gửi lên server không đúng định dạng JSON.' });
  }
  return next(error);
});

app.get('/', (req, res) => {
  res.status(200).json({ ok: true, service: 'duhoc-mate-server' });
});


app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

let exchangeRateCache = { loadedAt: 0, rateText: '1,000 ₩ ≈ 17.830 ₫' };

const getExchangeRateText = async () => {
  const now = Date.now();
  if (exchangeRateCache.rateText && now - exchangeRateCache.loadedAt < 3600_000) {
    return exchangeRateCache.rateText;
  }
  try {
    const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=KRW');
    if (res.ok) {
      const json = await res.json();
      const vndRateStr = json.data?.rates?.VND;
      if (vndRateStr) {
        const vndRate = parseFloat(vndRateStr);
        if (!isNaN(vndRate)) {
          const rate1000 = (1000 * vndRate).toFixed(0);
          const formatted = Number(rate1000).toLocaleString('vi-VN');
          exchangeRateCache = {
            loadedAt: now,
            rateText: `1,000 ₩ ≈ ${formatted} ₫`
          };
          return exchangeRateCache.rateText;
        }
      }
    }
  } catch (err) {
    console.warn('[Exchange Rate] Fetch failed, using cached/fallback:', err.message);
  }
  return exchangeRateCache.rateText || '1,000 ₩ ≈ 17.830 ₫';
};

app.get('/api/exchange-rate', async (req, res) => {
  try {
    const rateText = await getExchangeRateText();
    res.json({ rateText });
  } catch (err) {
    res.json({ rateText: '1,000 ₩ ≈ 17.830 ₫' });
  }
});


const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://imqrvssxfrhivlumhoze.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_d-szvo4evO2V69FCNc__IQ_xc8OqFPV';
const ROOM_STATES_ENDPOINT = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/room_states`;
const ROOMS_ENDPOINT = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rooms`;
const TOPIK_QUESTION_BANK_ENDPOINT = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/topik_question_bank`;
const TOPIK_GAME_SESSIONS_ENDPOINT = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/topik_game_sessions`;
const TOPIK_WORDS_ENDPOINT = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/topik_words`;
const supabaseHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

const MAX_CHAT_MESSAGE_LENGTH = 800;
const MAX_ROOM_CHAT_MESSAGES = 100;
const CHAT_RATE_LIMIT_WINDOW_MS = 10_000;
const CHAT_RATE_LIMIT_MAX_MESSAGES = 12;
const MAX_WHITEBOARD_IMAGE_DATA_URL_LENGTH = 3_000_000;
const MAX_WB_POINTS_PER_EVENT = 80;
const MAX_WB_POINTS_PER_STROKE = 2_000;
const MAX_IDEA_TASKS = 120;
const MAX_IDEA_TITLE_LENGTH = 240;
const MAX_IDEA_NOTE_LENGTH = 800;
const MAX_IDEA_META_LENGTH = 80;
const MAX_PLAYLIST_ITEMS = 80;
const MAX_PLAYLIST_TITLE_LENGTH = 180;
const MAX_PLAYLIST_DURATION_LENGTH = 20;
const MAX_ROOM_TITLE_LENGTH = 80;
const MAX_ROOM_PASSWORD_LENGTH = 80;
const MAX_MEDIA_URL_LENGTH = 1200;
const SAFE_DATA_IMAGE_RE = /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i;
const SAFE_MEDIA_URL_RE = /^(https?:\/\/|\/)[^\s<>"]*$/i;
const TRENDING_MUSIC_TYPES = new Set(['vpop', 'kpop', 'vinahouse']);

const chatRateBuckets = new Map();
const eventRateBuckets = new Map();
const restRateBuckets = new Map();

const rateLimitSocketEvent = (socketId, key, maxCount, windowMs) => {
  const now = Date.now();
  const bucketKey = `${socketId}:${key}`;
  const bucket = eventRateBuckets.get(bucketKey) || { windowStart: now, count: 0 };
  if (now - bucket.windowStart > windowMs) {
    bucket.windowStart = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  eventRateBuckets.set(bucketKey, bucket);
  return bucket.count > maxCount;
};

const clearSocketRateBuckets = (socketId) => {
  chatRateBuckets.delete(socketId);
  const prefix = `${socketId}:`;
  for (const key of eventRateBuckets.keys()) {
    if (key.startsWith(prefix)) eventRateBuckets.delete(key);
  }
};

const rateLimitRest = (key, maxCount, windowMs) => (req, res, next) => {
  const forwardedFor = typeof req.headers['x-forwarded-for'] === 'string'
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : '';
  const actor = forwardedFor || req.ip || req.socket?.remoteAddress || 'unknown';
  const bucketKey = `${actor}:${key}`;
  const now = Date.now();
  const bucket = restRateBuckets.get(bucketKey) || { windowStart: now, count: 0 };
  if (now - bucket.windowStart > windowMs) {
    bucket.windowStart = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  restRateBuckets.set(bucketKey, bucket);
  if (bucket.count > maxCount) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  return next();
};

const findRoomMember = (room, socketId) => room?.members?.find(member => member.id === socketId) || null;

const sanitizeBoundedString = (value, maxLength) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);
};

const sanitizeShortId = (value, maxLength = 80) => {
  const text = sanitizeBoundedString(value, maxLength);
  return /^[\w:.-]+$/u.test(text) ? text : '';
};

const sanitizeMediaUrl = (value) => {
  const url = sanitizeBoundedString(value, MAX_MEDIA_URL_LENGTH);
  if (!url) return '';
  return SAFE_MEDIA_URL_RE.test(url) ? url : '';
};

const trimRoomChatMessages = (room) => {
  if (!Array.isArray(room.chatMessages)) room.chatMessages = [];
  if (room.chatMessages.length > MAX_ROOM_CHAT_MESSAGES) {
    room.chatMessages.splice(0, room.chatMessages.length - MAX_ROOM_CHAT_MESSAGES);
  }
};

const sanitizeIdeaTasks = (tasks) => {
  if (!Array.isArray(tasks)) return [];
  const allowedStatuses = new Set(['todo', 'doing', 'done']);
  const seenIds = new Set();
  return tasks.slice(0, MAX_IDEA_TASKS).map((task, index) => {
    const rawId = sanitizeBoundedString(task?.id, MAX_IDEA_META_LENGTH);
    const id = rawId && !seenIds.has(rawId) ? rawId : `task-${Date.now()}-${index}`;
    seenIds.add(id);
    const title = sanitizeBoundedString(task?.title, MAX_IDEA_TITLE_LENGTH);
    const status = allowedStatuses.has(task?.status) ? task.status : 'todo';
    return {
      id,
      title,
      status,
      note: sanitizeBoundedString(task?.note, MAX_IDEA_NOTE_LENGTH),
      owner: sanitizeBoundedString(task?.owner, MAX_IDEA_META_LENGTH),
      due: sanitizeBoundedString(task?.due, MAX_IDEA_META_LENGTH),
    };
  }).filter(task => task.title || task.note);
};

const sanitizeChatMessage = (message) => {
  return sanitizeBoundedString(message, MAX_CHAT_MESSAGE_LENGTH);
};

const isChatRateLimited = (socketId) => {
  const now = Date.now();
  const bucket = chatRateBuckets.get(socketId) || { windowStart: now, count: 0 };
  if (now - bucket.windowStart > CHAT_RATE_LIMIT_WINDOW_MS) {
    bucket.windowStart = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  chatRateBuckets.set(socketId, bucket);
  return bucket.count > CHAT_RATE_LIMIT_MAX_MESSAGES;
};

const sanitizeWhiteboardPoint = (point) => {
  if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return null;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  return {
    x: Math.max(0, Math.min(1, point.x)),
    y: Math.max(0, Math.min(1, point.y)),
  };
};

const sanitizeWhiteboardPoints = (points, limit = MAX_WB_POINTS_PER_EVENT) => {
  if (!Array.isArray(points)) return [];
  return points
    .slice(0, limit)
    .map(sanitizeWhiteboardPoint)
    .filter(Boolean);
};

const isSafeWhiteboardImageSrc = (src) => {
  return typeof src === 'string'
    && src.length <= MAX_WHITEBOARD_IMAGE_DATA_URL_LENGTH
    && SAFE_DATA_IMAGE_RE.test(src);
};

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ============================================================
// REST API: Tìm kiếm nhạc YouTube qua yt-search / ytsr / Invidious / YouTube API
// ============================================================
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

// Chuyển ISO 8601 (PT4M30S, PT1H2M3S) → "4:30" / "1:02:03"
const parseISO8601Duration = (iso) => {
  if (!iso || typeof iso !== 'string') return '0:00';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '0:00';
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${min}:${String(s).padStart(2, '0')}`;
};

// 1. Tìm kiếm bằng official YouTube API v3 (nếu có Key)
const searchWithOfficialApi = async (query) => {
  if (!YOUTUBE_API_KEY) throw new Error('No YOUTUBE_API_KEY configured');
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube API error (${response.status}): ${errorText}`);
  }
  const data = await response.json();
  const items = data.items || [];

  // search endpoint KHÔNG trả duration → gọi thêm videos?part=contentDetails để lấy thời lượng
  const ids = items.map(v => v.id?.videoId).filter(Boolean);
  const durationMap = {};
  if (ids.length > 0) {
    try {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids.join(',')}&key=${YOUTUBE_API_KEY}`;
      const detailsRes = await fetch(detailsUrl);
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        for (const item of detailsData.items || []) {
          durationMap[item.id] = parseISO8601Duration(item.contentDetails?.duration);
        }
      }
    } catch (e) {
      console.warn('YouTube contentDetails fetch failed:', e.message);
    }
  }

  return items.map(v => ({
    videoId: v.id.videoId,
    title: v.snippet.title,
    author: v.snippet.channelTitle || '',
    duration: durationMap[v.id.videoId] || '0:00',
    thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || `https://img.youtube.com/vi/${v.id.videoId}/mqdefault.jpg`,
    views: 0,
  }));
};

// 2. Tìm kiếm bằng các instance Invidious healthy
const searchWithInvidious = async (query) => {
  try {
    const listRes = await fetch("https://api.invidious.io/instances.json?sort_by=type,health", { signal: AbortSignal.timeout(3000) });
    if (!listRes.ok) throw new Error("Failed to fetch Invidious list");
    const list = await listRes.json();
    
    const healthyInstances = list
      .map(item => item[1])
      .filter(details => {
        return details.type === 'https' && 
               details.api === true &&
               details.monitor &&
               details.monitor.down === false;
      })
      .map(details => details.uri)
      .filter(Boolean);

    const fallbacks = [
      'https://inv.thepixora.com',
      'https://yewtu.be',
      'https://invidious.projectsegfau.lt',
      'https://invidious.privacydev.net'
    ];
    const targetInstances = [...new Set([...healthyInstances, ...fallbacks])];

    for (const uri of targetInstances.slice(0, 5)) {
      try {
        const url = `${uri}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items) && items.length > 0) {
            return items
              .filter(v => v && v.videoId)
              .map(v => ({
                videoId: v.videoId,
                title: v.title,
                author: v.author || '',
                duration: typeof v.lengthSeconds === 'number' 
                  ? `${Math.floor(v.lengthSeconds / 60)}:${String(v.lengthSeconds % 60).padStart(2, '0')}`
                  : '0:00',
                thumbnail: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
                views: v.viewCount || 0,
              }));
          }
        }
      } catch (e) {
        console.warn(`Invidious instance ${uri} failed:`, e.message);
      }
    }
  } catch (err) {
    console.warn("Invidious fetching failed:", err.message);
  }
  throw new Error("All Invidious searches failed or no instances available");
};

app.get('/api/search-music', rateLimitRest('search-music', 30, 60_000), async (req, res) => {
  const query = sanitizeBoundedString(req.query.q, 120);
  if (!query) return res.json({ results: [] });

  // Tầng 1: Official YouTube API v3
  if (YOUTUBE_API_KEY) {
    try {
      console.log('Searching via Official YouTube API...');
      const results = await searchWithOfficialApi(query);
      return res.json({ results });
    } catch (err) {
      console.warn('Official YouTube API failed:', err.message);
    }
  }

  // Tầng 2: Invidious Proxy instances
  try {
    console.log('Searching via Invidious instances...');
    const results = await searchWithInvidious(query);
    return res.json({ results });
  } catch (err) {
    console.warn('Invidious search failed:', err.message);
  }

  // Tầng 3: yt-search
  try {
    console.log('Searching via yt-search...');
    const searchResult = await yts(String(query));
    const results = (searchResult.videos || [])
      .filter(v => v && v.videoId)
      .slice(0, 10)
      .map(v => ({
        videoId: v.videoId,
        title: v.title,
        author: v.author?.name || String(v.author) || '',
        duration: v.duration?.timestamp || v.timestamp || '0:00',
        thumbnail: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
        views: v.views || 0,
      }));
    return res.json({ results });
  } catch (err) {
    console.warn('yt-search failed, trying ytsr fallback...', err.message);
    // Tầng 4: ytsr với Chrome User-Agent
    try {
      console.log('Searching via ytsr with custom User-Agent...');
      const searchResult = await ytsr(String(query), {
        limit: 10,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        }
      });
      
      const results = (searchResult.items || [])
        .filter(item => item && item.type === 'video' && item.id)
        .map(v => ({
          videoId: v.id,
          title: v.title,
          author: v.author?.name || '',
          duration: v.duration || '0:00',
          thumbnail: `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`,
          views: v.views || 0,
        }));
      return res.json({ results });
    } catch (fallbackErr) {
      console.error('All YouTube search methods failed on this server:', fallbackErr.message);
      return res.json({ results: [], error: 'Không tìm được kết quả do server bị chặn kết nối YouTube. Bạn có thể tự dán link video trực tiếp để phát.' });
    }
  }
});

const uniqueMusicResults = (items, type = 'vpop', limit = 80) => {
  const uniqueVideos = [];
  const seenIds = new Set();
  for (const item of items || []) {
    if (!item?.videoId || seenIds.has(item.videoId)) continue;
    seenIds.add(item.videoId);
    if (filterMusicVideo(item, type)) {
      uniqueVideos.push(item);
    }
    if (uniqueVideos.length >= limit) break;
  }
  return uniqueVideos;
};

const getTrendingMusicWithOfficialApi = async (type = 'vpop') => {
  if (!YOUTUBE_API_KEY) throw new Error('No YOUTUBE_API_KEY configured');
  const queries = getTrendingMusicQueries(type);
  const shuffledQueries = [...queries].sort(() => 0.5 - Math.random()).slice(0, 5);
  const searchResults = await Promise.allSettled(shuffledQueries.map(query => searchWithOfficialApi(query)));
  const allVideos = searchResults.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  return uniqueMusicResults(allVideos, type, 60);
};

const getTrendingMusicWithInvidious = async (type = 'vpop') => {
  return searchWithInvidious(getFallbackMusicSearchQuery(type));
};

const getTrendingMusicWithYtSearch = async (type = 'vpop') => {
  console.log(`Fetching trending music via yt-search fallback for ${type}...`);
  const queries = getTrendingMusicQueries(type);
  
  // Use a smaller query set to avoid rate limits
  const shuffledQueries = [...queries].sort(() => 0.5 - Math.random());
  const selectedQueries = shuffledQueries.slice(0, 2);
  
  const searchPromises = selectedQueries.map(q => yts(q));
  const searchResults = await Promise.all(searchPromises);
  
  let allVideos = [];
  for (const res of searchResults) {
    if (res && res.videos) {
      allVideos = allVideos.concat(res.videos);
    }
  }
  
  return uniqueMusicResults(allVideos, type, 80).map(v => ({
    videoId: v.videoId,
    title: v.title,
    author: v.author?.name || String(v.author) || '',
    duration: v.duration?.timestamp || v.timestamp || '0:00',
    thumbnail: `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
    views: v.views || 0,
  }));
};

const trendingCache = {
  vpop: { data: null, lastUpdated: 0 },
  kpop: { data: null, lastUpdated: 0 },
  vinahouse: { data: null, lastUpdated: 0 }
};
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const zingResolveCache = new Map();

const getZingVpopChart = async () => {
  console.log('Fetching fresh V-Pop chart from Zing MP3...');
  try {
    const res = await fetch('https://mp3.zing.vn/xhr/chart-realtime');
    if (!res.ok) throw new Error('Failed to fetch Zing MP3 chart');
    const json = await res.json();
    const songs = json?.data?.song || [];
    
    // Take the top 10 songs
    const topSongs = songs.slice(0, 10);
    if (topSongs.length === 0) throw new Error('No songs in Zing MP3 chart response');
    
    // Resolve each song to a YouTube video in parallel
    const searchPromises = topSongs.map(async (song) => {
      const cacheKey = `${song.name} - ${song.artists_names}`;
      if (zingResolveCache.has(cacheKey)) {
        return zingResolveCache.get(cacheKey);
      }
      try {
        const query = `${song.name} ${song.artists_names} official mv`;
        const searchResult = await yts(query);
        const video = searchResult?.videos?.[0];
        if (video) {
          const resolvedSong = {
            videoId: video.videoId,
            title: video.title,
            author: video.author?.name || String(video.author) || '',
            duration: video.duration?.timestamp || video.timestamp || '0:00',
            thumbnail: `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`,
            views: video.views || 0,
          };
          zingResolveCache.set(cacheKey, resolvedSong);
          return resolvedSong;
        }
      } catch (err) {
        console.warn(`Failed to resolve YouTube video for Zing song: ${song.name}`, err.message);
      }
      return null;
    });

    const resolved = await Promise.all(searchPromises);
    return resolved.filter(Boolean);
  } catch (err) {
    console.warn('Failed to fetch Zing V-Pop chart, falling back:', err.message);
  }
  return null;
};

const fetchAndCacheTrending = async (type) => {
  console.log(`[TRENDING CACHE] Refreshing cache for: ${type}`);
  let results = null;

  if (type === 'vpop') {
    try {
      results = await getZingVpopChart();
    } catch (err) {
      console.warn('[TRENDING CACHE] Zing V-Pop chart refresh failed:', err.message);
    }
  }

  // If vpop failed or type is not vpop, try YouTube API/yts/Invidious
  if (!results || results.length === 0) {
    if (YOUTUBE_API_KEY) {
      try {
        const officialResults = await getTrendingMusicWithOfficialApi(type);
        if (officialResults && officialResults.length > 0) {
          results = officialResults.filter(v => filterMusicVideo(v, type));
        }
      } catch (err) {
        console.warn('[TRENDING CACHE] Official YouTube API failed for:', type, err.message);
      }
    }
  }

  if (!results || results.length === 0) {
    try {
      results = await getTrendingMusicWithYtSearch(type);
    } catch (err) {
      console.warn('[TRENDING CACHE] yt-search failed for:', type, err.message);
    }
  }

  if (!results || results.length === 0) {
    try {
      const invidiousResults = await getTrendingMusicWithInvidious(type);
      if (invidiousResults && invidiousResults.length > 0) {
        results = invidiousResults.filter(v => filterMusicVideo(v, type));
      }
    } catch (err) {
      console.warn('[TRENDING CACHE] Invidious failed for:', type, err.message);
    }
  }

  if (results && results.length > 0) {
    trendingCache[type] = {
      data: results,
      lastUpdated: Date.now()
    };
    console.log(`[TRENDING CACHE] Successfully updated cache for ${type} with ${results.length} items.`);
    return results;
  } else {
    console.warn(`[TRENDING CACHE] Failed to fetch fresh data for ${type}. Keeping old cache or using fallbacks.`);
    return null;
  }
};

app.get('/api/trending-music', rateLimitRest('trending-music', 30, 60_000), async (req, res) => {
  const requestedType = sanitizeBoundedString(req.query.type, 24);
  const type = TRENDING_MUSIC_TYPES.has(requestedType) ? requestedType : 'vpop';
  
  const now = Date.now();
  const cached = trendingCache[type];
  
  // If cache is expired or missing, trigger background update (non-blocking)
  if (!cached.data || now - cached.lastUpdated > CACHE_TTL_MS) {
    fetchAndCacheTrending(type).catch(err => {
      console.error(`[TRENDING CACHE] Background update error for ${type}:`, err);
    });
  }
  
  // If we have cached data, return it immediately
  if (cached.data && cached.data.length > 0) {
    return res.json({ results: cached.data });
  }
  
  // If cache is empty/missing, return static fallback instantly
  console.log(`[TRENDING CACHE] Cache empty/missing for ${type}. Returning static fallback.`);
  return res.json({ results: STATIC_TRENDING_FALLBACKS[type] || [] });
});

// Run background pre-fetching on startup
setTimeout(async () => {
  console.log('[STARTUP] Running initial database synchronization...');
  syncRoomDirectoryWithSupabase().catch(err => {
    console.error('[Supabase] Initial room directory sync failed:', err.message);
  });

  console.log('[TRENDING CACHE] Starting initial background pre-fetch...');
  for (const type of ['vpop', 'kpop', 'vinahouse']) {
    try {
      await fetchAndCacheTrending(type);
    } catch (err) {
      console.error(`[TRENDING CACHE] Initial background pre-fetch failed for ${type}:`, err);
    }
    // Wait 2 seconds between categories to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}, 3000);


const socketOptions = {
  cors: {
    origin: '*', // Hỗ trợ mọi nguồn kết nối cục bộ và deploy
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 6_000_000
};

const httpServer = createServer(app);
const io = new Server(httpServer, socketOptions);

// Lưu trữ dữ liệu các phòng trong memory
// Cấu trúc room: { roomId, members: [], playlist: [], videoState: { id, time, playing }, pomodoro: {} }
const rooms = new Map();
const emptyRoomCleanupTimers = new Map();
const EMPTY_ROOM_TTL_MS = 30 * 60 * 1000;

// Persist roomDirectory sang file JSON để không mất dữ liệu sau restart
const ROOM_DIR_FILE = './room-directory.json';
let _savedDir = {};
try { _savedDir = JSON.parse(readFileSync(ROOM_DIR_FILE, 'utf8')); } catch {}
const roomDirectory = new Map(Object.entries(_savedDir));
const ROOM_STATE_FILE = './room-state.json';
let _savedRoomState = {};
try { _savedRoomState = JSON.parse(readFileSync(ROOM_STATE_FILE, 'utf8')); } catch {}
const savedRoomState = new Map(Object.entries(_savedRoomState));

const normalizePlaylist = (playlist = [], currentVideoId = '', playlistItemId = '') => playlist.map((item) => {
  let status = item.status;
  if (!status) {
    if (playlistItemId && item.id === playlistItemId) {
      status = 'playing';
    } else if (!playlistItemId && currentVideoId && item.videoId === currentVideoId) {
      status = 'playing';
    } else {
      status = 'queued';
    }
  }
  return { ...item, status };
});

const setPlaylistPlaying = (room, playlistItemId, videoId, prevItemId, prevVideoId) => {
  const now = new Date().toISOString();
  room.playlist = room.playlist.map((item) => {
    if (playlistItemId) {
      // Mark bài mới là 'playing'
      if (item.id === playlistItemId) {
        return { ...item, status: 'playing', playedAt: undefined };
      }
      // Mark bài cũ là 'played': theo status hoặc theo prevItemId/prevVideoId
      const isOldItem = (item.status === 'playing') ||
        (prevItemId && item.id === prevItemId) ||
        (prevVideoId && item.videoId === prevVideoId && item.id !== playlistItemId);
      if (isOldItem) {
        return { ...item, status: 'played', playedAt: item.playedAt || now };
      }
    } else if (videoId) {
      if (item.videoId === videoId) {
        return { ...item, status: 'playing', playedAt: undefined };
      }
      const isOldItem = (item.status === 'playing') ||
        (prevVideoId && item.videoId === prevVideoId && item.videoId !== videoId);
      if (isOldItem) {
        return { ...item, status: 'played', playedAt: item.playedAt || now };
      }
    }
    return item;
  });
};

const sortPlaylist = (playlist = []) => {
  const rank = { playing: 0, queued: 1, played: 2 };
  return [...playlist].sort((a, b) => {
    const statusA = a.status || 'queued';
    const statusB = b.status || 'queued';
    if (rank[statusA] !== rank[statusB]) return rank[statusA] - rank[statusB];
    
    if (statusA === 'queued') {
      if (a.queueOrder !== undefined && b.queueOrder !== undefined) {
        return a.queueOrder - b.queueOrder;
      }
      if (a.queueOrder !== undefined) return -1;
      if (b.queueOrder !== undefined) return 1;
      
      if ((b.votes || 0) !== (a.votes || 0)) {
        return (b.votes || 0) - (a.votes || 0);
      }
      return (a.id || '').localeCompare(b.id || '');
    }
    
    if (statusA === 'played') {
      return (a.playedAt || '').localeCompare(b.playedAt || '');
    }
    return 0;
  });
};

const saveRoomDirectory = () => {
  try {
    const obj = {};
    for (const [k, v] of roomDirectory.entries()) obj[k] = v;
    writeFileSync(ROOM_DIR_FILE, JSON.stringify(obj, null, 2));
  } catch (e) { console.error('saveRoomDirectory error:', e.message); }
};
const onlineUsers = new Map(); // socket.id -> { socketId, friendCode, username, currentRoomId, currentSong }
const HOST_RECONNECT_TTL_MS = 5 * 60 * 1000;
const hostTransferTimers = new Map();

const hasPermission = (member, action) => {
  if (!member) return false;
  const role = member.role || (member.isHost ? 'host' : 'member');
  if (action === 'music.control') {
    return role === 'host' || role === 'cohost';
  }
  if (action === 'music.reorder') {
    return true;
  }
  if (action === 'pomodoro.control') {
    return role === 'host' || role === 'cohost';
  }
  if (action === 'chat.moderate') {
    return role === 'host' || role === 'cohost' || role === 'moderator';
  }
  return false;
};

const TOPIK_GAME_QUESTIONS = [
  {
    id: 'game-vocab-cha-byeol',
    level: 6,
    gameType: 'vocab-speed',
    category: 'vocabulary',
    errorType: 'vocabulary',
    prompt: '차별',
    options: ['Phân biệt đối xử', 'Thỏa hiệp', 'Dự báo', 'Tập trung'],
    answerIndex: 0,
    explanation: '차별 nghĩa là sự phân biệt đối xử.'
  },
  {
    id: 'game-vocab-gachi',
    level: 4,
    gameType: 'vocab-speed',
    category: 'vocabulary',
    errorType: 'similar_meaning',
    prompt: '가치관',
    options: ['Quan niệm giá trị', 'Kế hoạch du lịch', 'Phí sinh hoạt', 'Thời tiết'],
    answerIndex: 0,
    explanation: '가치관 là quan niệm/hệ giá trị.'
  },
  {
    id: 'game-vocab-hyogwa',
    level: 3,
    gameType: 'vocab-speed',
    category: 'vocabulary',
    errorType: 'vocabulary',
    prompt: '효과',
    options: ['Hiệu quả', 'Lịch hẹn', 'Mùa', 'Quảng cáo'],
    answerIndex: 0,
    explanation: '효과 nghĩa là hiệu quả/tác dụng.'
  },
  {
    id: 'game-grammar-go-sipda',
    level: 1,
    gameType: 'grammar-race',
    category: 'grammar',
    errorType: 'grammar_connector',
    prompt: '한국어를 ____.',
    options: ['배우고 싶어요', '배우러 싶어요', '배우기 전에', '배우는 바람에'],
    answerIndex: 0,
    explanation: 'Muốn làm gì dùng V-고 싶다.'
  },
  {
    id: 'game-grammar-eumyeon',
    level: 2,
    gameType: 'grammar-race',
    category: 'grammar',
    errorType: 'grammar_connector',
    prompt: '시간이 ____ 같이 공부합시다.',
    options: ['있으면', '있기 전에', '있는 바람에', '있는 둥 마는 둥'],
    answerIndex: 0,
    explanation: 'Điều kiện “nếu có thời gian” dùng A/V-(으)면.'
  },
  {
    id: 'game-grammar-baram',
    level: 3,
    gameType: 'grammar-race',
    category: 'grammar',
    errorType: 'grammar_connector',
    prompt: '비가 많이 ____ 약속이 취소됐어요.',
    options: ['오는 바람에', '오도록', '올 뿐만 아니라', '오는 한'],
    answerIndex: 0,
    explanation: '-는 바람에 hợp với nguyên nhân bất ngờ dẫn tới kết quả không mong muốn.'
  },
  {
    id: 'game-sentence-before',
    level: 2,
    gameType: 'sentence-build',
    category: 'sentence',
    errorType: 'grammar_connector',
    prompt: 'Chọn câu ghép đúng: “Trước khi ngủ, tôi đọc sách.”',
    options: ['자기 전에 책을 읽어요.', '자고 전에 책을 읽어요.', '자기 바람에 책을 읽어요.', '자는 한 책을 읽어요.'],
    answerIndex: 0,
    explanation: 'Trước khi làm gì dùng V-기 전에.'
  },
  {
    id: 'game-sentence-dorok',
    level: 3,
    gameType: 'sentence-build',
    category: 'sentence',
    errorType: 'grammar_connector',
    prompt: 'Chọn câu tự nhiên nhất: “Hãy nói to để mọi người nghe được.”',
    options: ['모두 들을 수 있도록 크게 말하세요.', '모두 듣는 바람에 크게 말하세요.', '모두 듣기 전에 크게 말하세요.', '모두 듣는 한 크게 말하세요.'],
    answerIndex: 0,
    explanation: 'Mục tiêu/kết quả mong muốn dùng -도록.'
  },
  {
    id: 'game-master-honorific',
    level: 2,
    gameType: 'topik-master',
    category: 'grammar',
    errorType: 'honorific',
    prompt: 'Câu nào dùng kính ngữ tự nhiên nhất khi nói với giáo viên?',
    options: ['선생님, 어디 가?', '선생님, 어디 가세요?', '선생님, 어디 갔어?', '선생님, 어디야?'],
    answerIndex: 1,
    explanation: 'Với giáo viên nên dùng đuôi kính ngữ -세요.'
  },
  {
    id: 'game-master-reading',
    level: 3,
    gameType: 'topik-master',
    category: 'reading',
    errorType: 'reading',
    prompt: '“비가 와서 행사가 취소되었습니다.” Ý chính là gì?',
    options: ['Sự kiện bị hủy vì trời mưa', 'Sự kiện được tổ chức ngoài trời', 'Trời mưa sau sự kiện', 'Sự kiện bị hoãn vì tắc đường'],
    answerIndex: 0,
    explanation: '취소되다 là bị hủy, nguyên nhân là 비가 와서.'
  },
  {
    id: 'game-vocab-gyotong',
    level: 3,
    gameType: 'vocab-speed',
    category: 'vocabulary',
    errorType: 'vocabulary',
    prompt: '교통',
    options: ['Giao thông', 'Môi trường', 'Giáo dục', 'Kinh tế'],
    answerIndex: 0,
    explanation: '교통 nghĩa là giao thông.'
  },
  {
    id: 'game-vocab-yaksok',
    level: 1,
    gameType: 'vocab-speed',
    category: 'vocabulary',
    errorType: 'vocabulary',
    prompt: '약속',
    options: ['Lịch hẹn/lời hứa', 'Bữa ăn', 'Bài tập', 'Kỳ nghỉ'],
    answerIndex: 0,
    explanation: '약속 nghĩa là cuộc hẹn hoặc lời hứa.'
  },
  {
    id: 'game-vocab-seonggong',
    level: 4,
    gameType: 'vocab-speed',
    category: 'vocabulary',
    errorType: 'vocabulary',
    prompt: '성공',
    options: ['Thành công', 'Thất bại', 'Chuẩn bị', 'Trải nghiệm'],
    answerIndex: 0,
    explanation: '성공 nghĩa là thành công.'
  },
  {
    id: 'game-vocab-shilpae',
    level: 4,
    gameType: 'vocab-speed',
    category: 'vocabulary',
    errorType: 'vocabulary',
    prompt: '실패',
    options: ['Thất bại', 'Thành công', 'Cố gắng', 'Quyết định'],
    answerIndex: 0,
    explanation: '실패 nghĩa là thất bại.'
  },
  {
    id: 'game-vocab-myeongjeo',
    level: 5,
    gameType: 'vocab-speed',
    category: 'vocabulary',
    errorType: 'vocabulary',
    prompt: '명절',
    options: ['Ngày lễ tết', 'Mùa đông', 'Sinh nhật', 'Kỷ niệm'],
    answerIndex: 0,
    explanation: '명절 nghĩa là ngày tết/ngày lễ truyền thống.'
  },
  {
    id: 'game-vocab-gibun',
    level: 2,
    gameType: 'vocab-speed',
    category: 'vocabulary',
    errorType: 'vocabulary',
    prompt: '기분',
    options: ['Tâm trạng/cảm xúc', 'Thời tiết', 'Sức khỏe', 'Sở thích'],
    answerIndex: 0,
    explanation: '기분 nghĩa là tâm trạng/cảm xúc.'
  },
  {
    id: 'game-grammar-gireul',
    level: 2,
    gameType: 'grammar-race',
    category: 'grammar',
    errorType: 'grammar_connector',
    prompt: '길을 ____ 경찰에게 물어보았습니다.',
    options: ['몰라서', '모르니까', '모르기 전에', '모르는 바람에'],
    answerIndex: 0,
    explanation: 'Vì không biết đường nên hỏi cảnh sát, dùng cấu trúc chỉ nguyên nhân khách quan -아/어서.'
  },
  {
    id: 'game-grammar-nuri',
    level: 3,
    gameType: 'grammar-race',
    category: 'grammar',
    errorType: 'grammar_connector',
    prompt: '한국에 ____ 한국 문화를 배우고 싶습니다.',
    options: ['있는 동안', '있기 전에', '있었기 때문에', '있는 대로'],
    answerIndex: 0,
    explanation: '-는 동안 diễn tả hành động xảy ra trong suốt thời gian của vế trước (trong khi ở Hàn).'
  },
  {
    id: 'game-grammar-gishiwuda',
    level: 2,
    gameType: 'grammar-race',
    category: 'grammar',
    errorType: 'grammar_connector',
    prompt: '이 책은 글씨가 커서 읽기 ____.',
    options: ['쉬워요', '어려워요', '쉽기 전에', '쉬운 바람에'],
    answerIndex: 0,
    explanation: 'V-기 쉽다/어렵다 diễn tả việc làm gì đó dễ/khó.'
  },
  {
    id: 'game-grammar-gittamune',
    level: 2,
    gameType: 'grammar-race',
    category: 'grammar',
    errorType: 'grammar_connector',
    prompt: '눈이 오____ 길이 미끄럽습니다.',
    options: ['기 때문에', '는 바람에', 'ㄹ 뿐만 아니라', '는 한'],
    answerIndex: 0,
    explanation: 'Lý do mang tính khách quan dùng -기 때문에.'
  },
  {
    id: 'game-grammar-ryeogo',
    level: 2,
    gameType: 'grammar-race',
    category: 'grammar',
    errorType: 'grammar_connector',
    prompt: '의사가 ____ 의대에 진학했습니다.',
    options: ['되려고', '되도록', '되니까', '되는 바람에'],
    answerIndex: 0,
    explanation: 'Biểu thị ý định, mục đích dùng -(으)려고.'
  },
  {
    id: 'game-sentence-myeon',
    level: 2,
    gameType: 'sentence-build',
    category: 'sentence',
    errorType: 'grammar_connector',
    prompt: 'Chọn câu tự nhiên nhất: “Nếu ngày mai thời tiết đẹp, tôi sẽ đi công viên.”',
    options: ['내일 날씨가 좋으면 공원에 갈 거예요.', '내일 날씨가 좋아서 공원에 갈 거예요.', '내일 날씨가 좋기 전에 공원에 갈 거예요.', '내일 날씨가 좋은 한 공원에 갈 거예요.'],
    answerIndex: 0,
    explanation: 'Giả định “nếu... thì” dùng -(으)면.'
  },
  {
    id: 'game-sentence-go',
    level: 1,
    gameType: 'sentence-build',
    category: 'sentence',
    errorType: 'grammar_connector',
    prompt: 'Chọn câu đúng: “Tôi ăn cơm rồi uống cà phê.”',
    options: ['밥을 먹고 커피를 마셔요.', '밥을 먹어서 커피를 마셔요.', '밥을 먹기 전에 커피를 마셔요.', '밥을 먹는 바람에 커피를 마셔요.'],
    answerIndex: 0,
    explanation: 'Liên kết hai hành động xảy ra theo trình tự thời gian dùng -고.'
  },
  {
    id: 'game-sentence-neo',
    level: 3,
    gameType: 'sentence-build',
    category: 'sentence',
    errorType: 'grammar_connector',
    prompt: 'Chọn câu viết lại đúng: “Vì ngủ quên nên tôi đã đi học muộn.”',
    options: ['늦잠을 자는 바람에 학교에 늦었어요.', '늦잠을 자는 한 학교에 늦었어요.', '늦잠을 자기 전에 학교에 늦었어요.', '늦잠을 자도록 학교에 늦었어요.'],
    answerIndex: 0,
    explanation: '-는 바람에 chỉ nguyên nhân khách quan ngoài ý muốn dẫn đến kết quả xấu.'
  },
  {
    id: 'game-master-honorific-salda',
    level: 2,
    gameType: 'topik-master',
    category: 'grammar',
    errorType: 'honorific',
    prompt: 'Chọn câu dùng kính ngữ đúng nhất khi nói về bố mẹ.',
    options: ['부모님께서는 시골에 살고 계십니다.', '부모님은 시골에 삽니다.', '부모님께서는 시골에 거주하십니다.', '부모님은 시골에 있으십니다.'],
    answerIndex: 0,
    explanation: 'Kính ngữ của động từ 살다 là 살고 계시다 hoặc 사시다.'
  },
  {
    id: 'game-master-reading-juju',
    level: 4,
    gameType: 'topik-master',
    category: 'reading',
    errorType: 'reading',
    prompt: '“그는 실패를 두려워하지 않고 계속 도전하여 마침내 성공했다.” Ý chính là gì?',
    options: ['Sự kiên trì vượt qua thất bại dẫn đến thành công', 'Thất bại là điều đáng sợ', 'Thành công chỉ đến nhờ may mắn', 'Không nên thử thách bản thân'],
    answerIndex: 0,
    explanation: 'Ý nghĩa câu: Anh ấy không sợ thất bại mà liên tục thử thách và cuối cùng đã thành công.'
  },
  {
    id: 'game-master-reading-simri',
    level: 4,
    gameType: 'topik-master',
    category: 'reading',
    errorType: 'reading',
    prompt: '“동생이 상을 받자 형은 겉으로는 축하했지만 속으로는 부러웠다.” Tâm trạng của người anh?',
    options: ['Ghen tị nhưng vẫn tỏ ra chúc mừng em', 'Hoàn toàn vui mừng cho em mình', 'Tức giận vì không được nhận giải', 'Thờ ơ không có cảm xúc gì'],
    answerIndex: 0,
    explanation: '겉으로는 축하 (ngoài mặt chúc mừng) 속으로는 부러웠다 (trong lòng ghen tị).'
  },
  {
    id: 'game-master-reading-kwanggo',
    level: 3,
    gameType: 'topik-master',
    category: 'reading',
    errorType: 'reading',
    prompt: '“한 번 사면 평생 쓰는 튼튼한 가구.” Quảng cáo này nói về sản phẩm gì?',
    options: ['Đồ nội thất (가구)', 'Thiết bị điện tử', 'Quần áo thời trang', 'Mỹ phẩm dưỡng da'],
    answerIndex: 0,
    explanation: '가구 có nghĩa là đồ nội thất.'
  }
];

const topikGameTimers = new Map();
let topikQuestionBankCache = { loadedAt: 0, questions: [] };
const TOPIK_QUESTION_BANK_CACHE_MS = 5 * 60 * 1000;
let vocabMatchWordCache = { loadedAt: 0, words: [] };
const VOCAB_MATCH_WORD_CACHE_MS = 5 * 60 * 1000;

const VOCAB_MATCH_ROUND_SECONDS = 15;
const VOCAB_MATCH_MIN_SECONDS = 10;
const VOCAB_MATCH_MAX_SECONDS = 20;
const VOCAB_MATCH_PAIR_COUNT = 6;
const VOCAB_MATCH_WORDS = [
  { id: 'vm-001', level: 1, ko: '안녕하세요', vi: 'Xin chào' },
  { id: 'vm-002', level: 1, ko: '감사합니다', vi: 'Cảm ơn' },
  { id: 'vm-003', level: 1, ko: '죄송합니다', vi: 'Xin lỗi' },
  { id: 'vm-004', level: 1, ko: '이름', vi: 'Tên' },
  { id: 'vm-005', level: 1, ko: '학교', vi: 'Trường học' },
  { id: 'vm-006', level: 1, ko: '선생님', vi: 'Giáo viên' },
  { id: 'vm-007', level: 1, ko: '친구', vi: 'Bạn bè' },
  { id: 'vm-008', level: 1, ko: '음식', vi: 'Món ăn' },
  { id: 'vm-009', level: 1, ko: '가족', vi: 'Gia đình' },
  { id: 'vm-010', level: 1, ko: '책', vi: 'Sách' },
  { id: 'vm-011', level: 2, ko: '여행', vi: 'Du lịch' },
  { id: 'vm-012', level: 2, ko: '날씨', vi: 'Thời tiết' },
  { id: 'vm-013', level: 2, ko: '교통', vi: 'Giao thông' },
  { id: 'vm-014', level: 2, ko: '문화', vi: 'Văn hóa' },
  { id: 'vm-015', level: 2, ko: '경험', vi: 'Kinh nghiệm' },
  { id: 'vm-016', level: 2, ko: '비교', vi: 'So sánh' },
  { id: 'vm-017', level: 2, ko: '도서관', vi: 'Thư viện' },
  { id: 'vm-018', level: 2, ko: '계절', vi: 'Mùa' },
  { id: 'vm-019', level: 2, ko: '준비', vi: 'Chuẩn bị' },
  { id: 'vm-020', level: 2, ko: '예약', vi: 'Đặt trước' },
  { id: 'vm-021', level: 3, ko: '환경', vi: 'Môi trường' },
  { id: 'vm-022', level: 3, ko: '경제', vi: 'Kinh tế' },
  { id: 'vm-023', level: 3, ko: '사회', vi: 'Xã hội' },
  { id: 'vm-024', level: 3, ko: '정치', vi: 'Chính trị' },
  { id: 'vm-025', level: 3, ko: '과학기술', vi: 'Khoa học kỹ thuật' },
  { id: 'vm-026', level: 3, ko: '전통', vi: 'Truyền thống' },
  { id: 'vm-027', level: 3, ko: '광고', vi: 'Quảng cáo' },
  { id: 'vm-028', level: 3, ko: '설명', vi: 'Giải thích' },
  { id: 'vm-029', level: 3, ko: '상황', vi: 'Tình huống' },
  { id: 'vm-030', level: 3, ko: '노력', vi: 'Nỗ lực' },
  { id: 'vm-031', level: 4, ko: '복지', vi: 'Phúc lợi' },
  { id: 'vm-032', level: 4, ko: '소통', vi: 'Giao tiếp' },
  { id: 'vm-033', level: 4, ko: '갈등', vi: 'Mâu thuẫn' },
  { id: 'vm-034', level: 4, ko: '해결', vi: 'Giải quyết' },
  { id: 'vm-035', level: 4, ko: '자료', vi: 'Tài liệu' },
  { id: 'vm-036', level: 4, ko: '원인', vi: 'Nguyên nhân' },
  { id: 'vm-037', level: 4, ko: '결과', vi: 'Kết quả' },
  { id: 'vm-038', level: 4, ko: '관점', vi: 'Quan điểm' },
  { id: 'vm-039', level: 5, ko: '효율성', vi: 'Tính hiệu quả' },
  { id: 'vm-040', level: 5, ko: '다양성', vi: 'Tính đa dạng' },
  { id: 'vm-041', level: 5, ko: '가능성', vi: 'Khả năng' },
  { id: 'vm-042', level: 5, ko: '책임감', vi: 'Tinh thần trách nhiệm' },
  { id: 'vm-043', level: 5, ko: '경쟁력', vi: 'Năng lực cạnh tranh' },
  { id: 'vm-044', level: 5, ko: '공동체', vi: 'Cộng đồng' },
  { id: 'vm-045', level: 5, ko: '인식', vi: 'Nhận thức' },
  { id: 'vm-046', level: 5, ko: '전망', vi: 'Triển vọng' },
  { id: 'vm-047', level: 6, ko: '차별', vi: 'Phân biệt đối xử' },
  { id: 'vm-048', level: 6, ko: '가치관', vi: 'Quan niệm giá trị' },
  { id: 'vm-049', level: 6, ko: '지속가능성', vi: 'Tính bền vững' },
  { id: 'vm-050', level: 6, ko: '양극화', vi: 'Phân hóa hai cực' },
  { id: 'vm-051', level: 6, ko: '고령화', vi: 'Già hóa dân số' },
  { id: 'vm-052', level: 6, ko: '자율성', vi: 'Tính tự chủ' }
];

const vocabMatchTimers = new Map();

const shuffleItems = (items) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
};

const createDefaultTopikGame = () => ({
  status: 'idle',
  gameType: null,
  round: 0,
  totalRounds: 0,
  question: null,
  questionOrder: [],
  questionPool: [],
  roundStartedAt: 0,
  startedAt: 0,
  sessionSaved: false,
  leaderboard: {},
  answers: {}
});

app.post('/api/topik-grammar-publish', rateLimitRest('topik-grammar-publish', 5, 10 * 60_000), async (req, res) => {
  try {
    const result = await publishTopikGrammarBundle({
      bundle: req.body?.bundle,
      level: Number(req.body?.level),
      supabaseUrl: SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseKey: SUPABASE_KEY,
    });
    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lưu mẫu ngữ pháp.';
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return res.status(status).json({ error: message });
  }
});

const ensureTopikGame = (room) => {
  if (!room.topikGame) room.topikGame = createDefaultTopikGame();
  return room.topikGame;
};

const createDefaultVocabMatchGame = () => ({
  status: 'idle',
  round: 0,
  durationSec: VOCAB_MATCH_ROUND_SECONDS,
  roundStartedAt: 0,
  roundEndsAt: 0,
  cards: [],
  pairMap: {},
  matchedPairIds: [],
  players: {},
  leaderboard: {},
  lastResult: null
});

const ensureVocabMatchGame = (room) => {
  if (!room.vocabMatchGame) room.vocabMatchGame = createDefaultVocabMatchGame();
  return room.vocabMatchGame;
};

const normalizeVocabMatchDuration = (value) => {
  const duration = Number(value);
  if (!Number.isFinite(duration)) return VOCAB_MATCH_ROUND_SECONDS;
  return Math.min(VOCAB_MATCH_MAX_SECONDS, Math.max(VOCAB_MATCH_MIN_SECONDS, Math.round(duration)));
};

const getVocabMatchPlayerName = (room, memberId) => {
  const member = room.members.find(m => m.id === memberId);
  return member?.username || room.vocabMatchGame?.players?.[memberId]?.username || 'Bạn học';
};

const normalizeVocabMatchWord = (word, index = 0) => ({
  id: String(word.id || `${word.ko}-${word.level || index}`),
  level: Number(word.level) || 1,
  ko: String(word.ko || '').trim(),
  vi: String(word.vi || word.en || '').trim()
});

const getVocabMatchWords = async () => {
  const now = Date.now();
  if (vocabMatchWordCache.words.length >= VOCAB_MATCH_PAIR_COUNT && now - vocabMatchWordCache.loadedAt < VOCAB_MATCH_WORD_CACHE_MS) {
    return vocabMatchWordCache.words;
  }

  try {
    const response = await fetch(`${TOPIK_WORDS_ENDPOINT}?select=id,ko,vi,en,level&order=created_at.desc&limit=500`, {
      headers: supabaseHeaders()
    });
    if (response.ok) {
      const rows = await response.json();
      const seen = new Set();
      const words = (Array.isArray(rows) ? rows : [])
        .map(normalizeVocabMatchWord)
        .filter(word => {
          const key = `${word.ko}-${word.level}`;
          if (!word.ko || !word.vi || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      if (words.length >= VOCAB_MATCH_PAIR_COUNT) {
        vocabMatchWordCache = { loadedAt: now, words };
        return words;
      }
    } else if (response.status !== 404) {
      console.warn('[VocabMatch] topik_words fetch warning:', response.status, await response.text());
    }
  } catch (error) {
    console.warn('[VocabMatch] topik_words fallback:', error.message);
  }

  const fallback = VOCAB_MATCH_WORDS.map(normalizeVocabMatchWord);
  vocabMatchWordCache = { loadedAt: now, words: fallback };
  return fallback;
};

const buildVocabMatchRound = (words = VOCAB_MATCH_WORDS) => {
  const selectedWords = shuffleItems(words).slice(0, VOCAB_MATCH_PAIR_COUNT);
  const pairMap = {};
  const cards = selectedWords.flatMap((word, index) => {
    const pairId = `${word.id}-${Date.now()}-${index}`;
    const koCardId = `${pairId}-ko`;
    const viCardId = `${pairId}-vi`;
    pairMap[pairId] = { koCardId, viCardId };
    return [
      { id: koCardId, pairId, type: 'ko', text: word.ko, level: word.level },
      { id: viCardId, pairId, type: 'vi', text: word.vi, level: word.level }
    ];
  });
  return { cards: shuffleItems(cards), pairMap };
};

const publicVocabMatchGameState = (room) => {
  const game = ensureVocabMatchGame(room);
  const activeMemberIds = new Set(room.members.map(m => m.id));
  const players = Object.entries(game.players || {})
    .filter(([memberId]) => activeMemberIds.has(memberId))
    .map(([memberId, player]) => ({
      memberId,
      username: getVocabMatchPlayerName(room, memberId),
      ready: !!player.ready,
      joinedAt: player.joinedAt || 0
    }))
    .sort((a, b) => a.joinedAt - b.joinedAt);
  const leaderboard = Object.entries(game.leaderboard || {})
    .filter(([memberId]) => activeMemberIds.has(memberId))
    .map(([memberId, score]) => ({
      memberId,
      username: getVocabMatchPlayerName(room, memberId),
      score: score.score || 0,
      matches: score.matches || 0,
      wrong: score.wrong || 0,
      fastestMs: score.fastestMs || null,
      lastMatchedAt: score.lastMatchedAt || null
    }))
    .sort((a, b) => b.score - a.score || b.matches - a.matches || a.username.localeCompare(b.username));

  return {
    status: game.status,
    round: game.round,
    durationSec: game.durationSec,
    roundStartedAt: game.roundStartedAt,
    roundEndsAt: game.roundEndsAt,
    cards: game.cards || [],
    matchedPairIds: game.matchedPairIds || [],
    players,
    leaderboard,
    lastResult: game.lastResult || null,
    wordBankSize: VOCAB_MATCH_WORDS.length,
    serverTime: Date.now()
  };
};

const emitVocabMatchGame = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit('vocab-match-sync', publicVocabMatchGameState(room));
};

const clearVocabMatchTimers = (roomId) => {
  const timers = vocabMatchTimers.get(roomId);
  if (timers?.endTimer) clearTimeout(timers.endTimer);
  if (timers?.nextTimer) clearTimeout(timers.nextTimer);
  vocabMatchTimers.delete(roomId);
};

const removeVocabMatchPlayer = (room, memberId) => {
  const game = ensureVocabMatchGame(room);
  if (game.players?.[memberId]) delete game.players[memberId];
};

const startVocabMatchRound = async (roomId, durationSec) => {
  let room = rooms.get(roomId);
  if (!room) return;
  const game = ensureVocabMatchGame(room);
  const nextDuration = normalizeVocabMatchDuration(durationSec || game.durationSec);
  const words = await getVocabMatchWords();
  room = rooms.get(roomId);
  if (!room) return;
  const round = buildVocabMatchRound(words);
  const now = Date.now();

  room.vocabMatchGame = {
    ...game,
    status: 'playing',
    round: (game.round || 0) + 1,
    durationSec: nextDuration,
    roundStartedAt: now,
    roundEndsAt: now + nextDuration * 1000,
    cards: round.cards,
    pairMap: round.pairMap,
    matchedPairIds: [],
    players: game.players || {},
    leaderboard: game.leaderboard || {},
    lastResult: null
  };

  clearVocabMatchTimers(roomId);
  const endTimer = setTimeout(() => finishVocabMatchRound(roomId), nextDuration * 1000);
  vocabMatchTimers.set(roomId, { endTimer, nextTimer: null });
  emitVocabMatchGame(roomId);
};

function finishVocabMatchRound(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const game = ensureVocabMatchGame(room);
  if (game.status !== 'playing') return;
  game.status = 'round-ended';
  game.roundEndsAt = Date.now();
  game.lastResult = {
    reason: 'time',
    finishedAt: Date.now(),
    winner: publicVocabMatchGameState(room).leaderboard[0] || null
  };
  const timers = vocabMatchTimers.get(roomId);
  if (timers?.endTimer) clearTimeout(timers.endTimer);
  emitVocabMatchGame(roomId);
}

const publicTopikQuestion = (question, revealed) => {
  if (!question) return null;
  const { answerIndex, ...safeQuestion } = question;
  return revealed ? { ...safeQuestion, answerIndex } : safeQuestion;
};

const publicTopikGameState = (room) => {
  const game = ensureTopikGame(room);
  const revealed = game.status === 'revealed' || game.status === 'finished';
  const leaderboard = Object.entries(game.leaderboard || {})
    .map(([memberId, score]) => {
      const member = room.members.find(m => m.id === memberId);
      return {
        memberId,
        username: member?.username || score.username || 'Bạn học',
        score: score.score || 0,
        correct: score.correct || 0,
        answeredAt: score.answeredAt || null
      };
    })
    .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));

  return {
    status: game.status,
    gameType: game.gameType,
    round: game.round,
    totalRounds: game.totalRounds,
    question: publicTopikQuestion(game.question, revealed),
    roundStartedAt: game.roundStartedAt,
    leaderboard,
    answers: game.answers || {}
  };
};

const emitTopikGame = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit('topik-game-sync', publicTopikGameState(room));
};

const clearTopikGameTimer = (roomId) => {
  const timer = topikGameTimers.get(roomId);
  if (timer) clearTimeout(timer);
  topikGameTimers.delete(roomId);
};

const revealTopikGameRound = (roomId) => {
  const room = rooms.get(roomId);
  if (!room?.topikGame || room.topikGame.status !== 'question') return;
  room.topikGame.status = 'revealed';
  clearTopikGameTimer(roomId);
  emitTopikGame(roomId);
};

const startTopikGameRound = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const game = ensureTopikGame(room);
  const questionId = game.questionOrder[game.round - 1];
  const question = [...(game.questionPool || []), ...TOPIK_GAME_QUESTIONS].find(q => q.id === questionId);
  if (!question) {
    game.status = 'finished';
    game.question = null;
    emitTopikGame(roomId);
    return;
  }

  game.status = 'question';
  game.question = shuffleTopikQuestionOptions(question);
  game.answers = {};
  game.roundStartedAt = Date.now();
  clearTopikGameTimer(roomId);
  topikGameTimers.set(roomId, setTimeout(() => revealTopikGameRound(roomId), 20000));
  emitTopikGame(roomId);
};

const normalizeTopikQuestionRow = (row) => ({
  id: row.id,
  level: row.level,
  gameType: Array.isArray(row.game_types) ? row.game_types[0] : row.game_type,
  gameTypes: Array.isArray(row.game_types) ? row.game_types : [],
  category: row.category,
  errorType: row.error_type,
  patternId: row.pattern_id || undefined,
  prompt: row.prompt,
  options: Array.isArray(row.options) ? row.options : [],
  answerIndex: row.answer_index,
  explanation: row.explanation || ''
});

const getPublishedTopikQuestions = async (gameType) => {
  const now = Date.now();
  if (topikQuestionBankCache.questions.length && now - topikQuestionBankCache.loadedAt < TOPIK_QUESTION_BANK_CACHE_MS) {
    return topikQuestionBankCache.questions.filter(q => q.gameTypes?.includes(gameType) || gameType === 'topik-master');
  }

  try {
    const rows = [];
    const pageSize = 1000;
    for (let offset = 0; offset < 10000; offset += pageSize) {
      const url = `${TOPIK_QUESTION_BANK_ENDPOINT}?select=id,level,category,game_types,error_type,pattern_id,prompt,options,answer_index,explanation&status=eq.published&order=quality_score.desc&limit=${pageSize}&offset=${offset}`;
      const response = await fetch(url, { headers: supabaseHeaders() });
      if (response.ok) {
        const pageRows = await response.json();
        if (!Array.isArray(pageRows) || pageRows.length === 0) break;
        rows.push(...pageRows);
        if (pageRows.length < pageSize) break;
      } else {
        if (response.status !== 404) {
          console.warn('[TOPIK] Question bank fetch warning:', response.status, await response.text());
        }
        break;
      }
    }
    const questions = rows.map(normalizeTopikQuestionRow);
    if (questions.length) {
      topikQuestionBankCache = { loadedAt: now, questions };
      return questions.filter(q => q.gameTypes?.includes(gameType) || gameType === 'topik-master');
    }
  } catch (error) {
    console.warn('[TOPIK] Question bank fallback:', error.message);
  }

  const fallback = TOPIK_GAME_QUESTIONS.map(q => ({ ...q, gameTypes: q.gameType ? [q.gameType, 'topik-master'] : ['topik-master'] }));
  return fallback.filter(q => q.gameTypes?.includes(gameType) || gameType === 'topik-master');
};

const persistTopikGameSession = async (room, game) => {
  if (!room || !game || game.sessionSaved || !game.startedAt || !game.gameType) return;
  game.sessionSaved = true;
  try {
    const leaderboard = publicTopikGameState(room).leaderboard;
    const response = await fetch(TOPIK_GAME_SESSIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        ...supabaseHeaders(),
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        room_id: room.roomId,
        game_type: game.gameType,
        started_at: new Date(game.startedAt).toISOString(),
        ended_at: new Date().toISOString(),
        questions_used: game.questionOrder || [],
        leaderboard,
        player_count: leaderboard.length,
      }),
    });
    if (!response.ok && response.status !== 404) {
      console.warn('[TOPIK] Game session save warning:', response.status, await response.text());
    }
  } catch (error) {
    console.warn('[TOPIK] Game session save fallback:', error.message);
  }
};

const fetchTopikArenaLeaderboard = async (period = 'week') => {
  const days = period === 'month' ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  try {
    const url = `${TOPIK_GAME_SESSIONS_ENDPOINT}?select=game_type,ended_at,leaderboard&ended_at=gte.${encodeURIComponent(since)}&order=ended_at.desc&limit=200`;
    const response = await fetch(url, { headers: supabaseHeaders() });
    if (!response.ok) {
      if (response.status !== 404) {
        console.warn('[TOPIK] Arena leaderboard fetch warning:', response.status, await response.text());
      }
      return [];
    }
    const rows = await response.json();
    const scoreMap = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
      const leaderboard = Array.isArray(row.leaderboard) ? row.leaderboard : [];
      for (const player of leaderboard) {
        const key = player.memberId || player.username;
        if (!key) continue;
        const current = scoreMap.get(key) || {
          memberId: player.memberId || key,
          username: player.username || 'Bạn học',
          score: 0,
          correct: 0,
          games: 0,
          lastPlayedAt: row.ended_at
        };
        current.username = player.username || current.username;
        current.score += Number(player.score) || 0;
        current.correct += Number(player.correct) || 0;
        current.games += 1;
        if (!current.lastPlayedAt || new Date(row.ended_at).getTime() > new Date(current.lastPlayedAt).getTime()) {
          current.lastPlayedAt = row.ended_at;
        }
        scoreMap.set(key, current);
      }
    }
    return Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score || b.correct - a.correct || a.username.localeCompare(b.username))
      .slice(0, 20);
  } catch (error) {
    console.warn('[TOPIK] Arena leaderboard fallback:', error.message);
    return [];
  }
};

const normalizeStr = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

const clearHostTransferTimer = (roomId) => {
  const timer = hostTransferTimers.get(roomId);
  if (timer) clearTimeout(timer);
  hostTransferTimers.delete(roomId);
};

const setRoomHost = (room, targetId) => {
  const target = room.members.find(member => member.id === targetId);
  if (!target) return null;
  room.members.forEach(member => {
    const wasHost = member.isHost || member.role === 'host';
    member.isHost = member.id === targetId;
    if (member.id === targetId) {
      member.role = 'host';
    } else if (wasHost) {
      member.role = 'member';
    }
  });
  room.hostFriendCode = target.friendCode || '';
  room.hostUsername = target.username || '';
  room.hostReconnectUntil = null;
  return target;
};

const scheduleHostTransfer = (roomId) => {
  clearHostTransferTimer(roomId);
  const timer = setTimeout(() => {
    hostTransferTimers.delete(roomId);
    const room = rooms.get(roomId);
    if (!room || room.members.length === 0 || room.members.some(member => member.isHost)) return;
    
    let candidate = room.members.find(m => m.role === 'cohost');
    if (!candidate) {
      candidate = room.members.find(m => m.role === 'moderator');
    }
    if (!candidate) {
      candidate = room.members[0];
    }
    
    const nextHost = setRoomHost(room, candidate.id);
    if (!nextHost) return;
    io.to(nextHost.id).emit('assigned-host', true);
    io.to(roomId).emit('room-users', room.members);
    sendSystemMessage(roomId, `Bạn học ${nextHost.username} đã trở thành chủ phòng.`);
    rememberRoom(room, nextHost.username);
    rememberRoomState(room);
    broadcastRoomDirectory();
  }, HOST_RECONNECT_TTL_MS);
  hostTransferTimers.set(roomId, timer);
};

const createDefaultStudyTable = () => ({
  seats: {},
  reactions: [],
});

const createPersonalPomodoro = () => ({
  timeLeft: 25 * 60,
  duration: 25 * 60,
  isRunning: false,
  isBreak: false,
  lastUpdated: Date.now(),
});

const getStudyTable = (room) => {
  if (!room.studyTable || typeof room.studyTable !== 'object') {
    room.studyTable = createDefaultStudyTable();
  }
  if (!room.studyTable.seats || typeof room.studyTable.seats !== 'object') {
    room.studyTable.seats = {};
  }
  if (!Array.isArray(room.studyTable.reactions)) {
    room.studyTable.reactions = [];
  }
  return room.studyTable;
};

const ensureStudySeat = (room, member) => {
  const studyTable = getStudyTable(room);
  const existing = studyTable.seats[member.id] || {};
  studyTable.seats[member.id] = {
    memberId: member.id,
    username: member.username,
    isHost: !!member.isHost,
    joinedAt: existing.joinedAt || Date.now(),
    active: existing.active !== false,
    status: existing.status || 'focus',
    personalPomodoro: existing.personalPomodoro || createPersonalPomodoro(),
    // Giữ lại tracking thời gian nghỉ để timer client tính đúng
    pausedSince: existing.pausedSince || null,
    totalPausedMs: existing.totalPausedMs || 0,
  };
  return studyTable.seats[member.id];
};

const syncStudyMembers = (room) => {
  const studyTable = getStudyTable(room);
  const memberIds = new Set(room.members.map(member => member.id));
  for (const key of Object.keys(studyTable.seats)) {
    if (!memberIds.has(key)) delete studyTable.seats[key];
  }
  room.members.forEach(member => ensureStudySeat(room, member));
  return studyTable;
};

const emitStudyTable = (roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit('study-table-sync', syncStudyMembers(room));
};

const serializeRoomState = (room) => ({
  roomId: room.roomId,
  playlist: room.playlist || [],
  videoState: room.videoState || { id: '', time: 0, playing: false, pausedByHost: false, lastUpdated: Date.now() },
  pomodoro: room.pomodoro || createDefaultPomodoro(),
  chatMessages: Array.isArray(room.chatMessages) ? room.chatMessages.slice(-MAX_ROOM_CHAT_MESSAGES) : [],
  ideaTasks: sanitizeIdeaTasks(room.ideaTasks),
  roomTitle: room.roomTitle || '',
  isPrivate: !!room.isPrivate,
  password: room.password || '',
  hostAvatarUrl: room.hostAvatarUrl || '',
  tiktokVideoId: room.tiktokVideoId || '',
  hostFriendCode: room.hostFriendCode || '',
  hostUsername: room.hostUsername || '',
  hostReconnectUntil: room.hostReconnectUntil || null,
  studyTable: room.studyTable || createDefaultStudyTable(),
  pinnedMessage: room.pinnedMessage || null,
  roomAvatarUrl: room.roomAvatarUrl || '',
  roomBackgroundUrl: room.roomBackgroundUrl || '',
});

const saveRoomState = () => {
  try {
    const obj = {};
    for (const [k, v] of savedRoomState.entries()) obj[k] = v;
    writeFileSync(ROOM_STATE_FILE, JSON.stringify(obj, null, 2));
  } catch (e) { console.error('saveRoomState error:', e.message); }
};

const rememberRoomState = (room) => {
  if (!room?.roomId) return;
  const state = serializeRoomState(room);
  savedRoomState.set(room.roomId, state);
  saveRoomState();
  void saveRoomStateToSupabase(state);
};

const saveRoomStateToSupabase = async (state) => {
  if (!SUPABASE_KEY) return;
  try {
    const response = await fetch(`${ROOM_STATES_ENDPOINT}?on_conflict=room_id`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders(),
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        room_id: state.roomId,
        playlist: state.playlist,
        current_video: state.videoState,
        chat_messages: state.chatMessages,
        pomodoro: state.pomodoro,
        idea_tasks: state.ideaTasks,
        room_title: state.roomTitle,
        is_private: state.isPrivate,
        host_avatar_url: state.hostAvatarUrl,
        tiktok_video_id: state.tiktokVideoId,
        host_friend_code: state.hostFriendCode,
        host_username: state.hostUsername,
        host_reconnect_until: state.hostReconnectUntil,
        study_table: state.studyTable,
        pinned_message: state.pinnedMessage || null,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      console.error('saveRoomStateToSupabase error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('saveRoomStateToSupabase error:', error.message);
  }
};

const loadRoomStateFromSupabase = async (roomId) => {
  if (!SUPABASE_KEY) return null;
  try {
    const response = await fetch(`${ROOM_STATES_ENDPOINT}?room_id=eq.${encodeURIComponent(roomId)}&select=*`, {
      headers: supabaseHeaders(),
    });
    if (!response.ok) {
      console.error('loadRoomStateFromSupabase error:', response.status, await response.text());
      return null;
    }
    const rows = await response.json();
    const row = rows?.[0];
    if (!row) return null;
    return {
      playlist: row.playlist || [],
      videoState: row.current_video || {},
      chatMessages: row.chat_messages || [],
      pomodoro: row.pomodoro || createDefaultPomodoro(),
      ideaTasks: row.idea_tasks || [],
      roomTitle: row.room_title || '',
      isPrivate: !!row.is_private,
      hostAvatarUrl: row.host_avatar_url || '',
      tiktokVideoId: row.tiktok_video_id || '',
      hostFriendCode: row.host_friend_code || '',
      hostUsername: row.host_username || '',
      hostReconnectUntil: row.host_reconnect_until || null,
      studyTable: row.study_table || createDefaultStudyTable(),
      pinnedMessage: row.pinned_message || null,
    };
  } catch (error) {
    console.error('loadRoomStateFromSupabase error:', error.message);
    return null;
  }
};

const deleteRoomStateFromSupabase = async (roomId) => {
  savedRoomState.delete(roomId);
  saveRoomState();
  if (!SUPABASE_KEY) return;
  try {
    const response = await fetch(`${ROOM_STATES_ENDPOINT}?room_id=eq.${encodeURIComponent(roomId)}`, {
      method: 'DELETE',
      headers: supabaseHeaders(),
    });
    if (!response.ok) {
      console.error('deleteRoomStateFromSupabase error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('deleteRoomStateFromSupabase error:', error.message);
  }
};

const cancelEmptyRoomCleanup = (roomId) => {
  const timer = emptyRoomCleanupTimers.get(roomId);
  if (!timer) return;
  clearTimeout(timer);
  emptyRoomCleanupTimers.delete(roomId);
};

const scheduleEmptyRoomCleanup = (roomId) => {
  cancelEmptyRoomCleanup(roomId);
  const timer = setTimeout(() => {
    const room = rooms.get(roomId);
    if (room && room.members.length === 0) {
      rememberRoom(room);
      clearVocabMatchTimers(roomId);
      clearTopikGameTimer(roomId);
      rooms.delete(roomId);
      console.log(`Deleted inactive empty room after TTL: ${roomId}`);
      broadcastRoomDirectory();
    }
    emptyRoomCleanupTimers.delete(roomId);
  }, EMPTY_ROOM_TTL_MS);
  emptyRoomCleanupTimers.set(roomId, timer);
};

// Trạng thái mặc định của đồng hồ Pomodoro
const createDefaultPomodoro = () => ({
  timeLeft: 25 * 60,
  duration: 25 * 60,
  isRunning: false,
  isBreak: false
});

// Helper phát sóng danh sách phòng đang hoạt động
const broadcastActiveRooms = () => {
  const activeRooms = Array.from(rooms.values()).map(r => ({
    id: r.roomId,
    hostName: r.members.find(m => m.isHost)?.username || 'Ẩn danh',
    memberCount: r.members.length,
    currentSong: r.playlist[0]?.title || 'Đang nghe nhạc Lofi',
    roomTitle: r.roomTitle || `Phòng học tập`,
    isPrivate: !!r.isPrivate,
    hostAvatarUrl: r.hostAvatarUrl || ''
  }));
  io.emit('active-rooms-list', activeRooms);
};

const getRoomDirectoryList = () => {
  return Array.from(roomDirectory.values())
    .map(entry => {
      const liveRoom = rooms.get(entry.id);
      const host = liveRoom?.members.find(m => m.isHost);
      const { password, ...publicEntry } = entry;
      void password;

      return {
        ...publicEntry,
        hostName: host?.username || entry.hostName || 'An danh',
        memberCount: liveRoom?.members.length || 0,
        currentSong: liveRoom?.playlist[0]?.title || entry.currentSong || 'Dang nghe nhac Lofi',
        roomTitle: liveRoom?.roomTitle || entry.roomTitle || 'Phong hoc tap',
        isPrivate: liveRoom ? !!liveRoom.isPrivate : !!entry.isPrivate,
        hostAvatarUrl: liveRoom?.hostAvatarUrl || entry.hostAvatarUrl || '',
        roomAvatarUrl: liveRoom?.roomAvatarUrl || entry.roomAvatarUrl || '',
        lastActiveAt: liveRoom ? new Date().toISOString() : entry.lastActiveAt
      };
    })
    .sort((a, b) => {
      const memberDiff = (b.memberCount || 0) - (a.memberCount || 0);
      if (memberDiff !== 0) return memberDiff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    })
    .slice(0, 50);
};


const rememberRoom = (room, hostName) => {
  const existing = roomDirectory.get(room.roomId);
  const now = new Date().toISOString();

  const entry = {
    id: room.roomId,
    hostName: hostName || existing?.hostName || 'An danh',
    memberCount: room.members.length,
    currentSong: room.playlist[0]?.title || existing?.currentSong || 'Dang nghe nhac Lofi',
    roomTitle: room.roomTitle || existing?.roomTitle || 'Phong hoc tap',
    isPrivate: !!room.isPrivate,
    password: room.password || existing?.password || '',
    passwordHash: room.passwordHash || existing?.passwordHash || '',
    hostAvatarUrl: room.hostAvatarUrl || existing?.hostAvatarUrl || '',
    roomAvatarUrl: room.roomAvatarUrl || existing?.roomAvatarUrl || '',
    createdAt: existing?.createdAt || now,
    lastActiveAt: now
  };

  roomDirectory.set(room.roomId, entry);
  saveRoomDirectory();

  if (SUPABASE_KEY) {
    fetch(`${ROOMS_ENDPOINT}?id=eq.${encodeURIComponent(entry.id)}`, {
      method: 'PATCH',
      headers: supabaseHeaders(),
      body: JSON.stringify({
        title: entry.roomTitle,
        host_name: entry.hostName,
        host_avatar_url: entry.hostAvatarUrl,
        is_private: entry.isPrivate,
        last_active_at: entry.lastActiveAt,
      }),
    }).catch(err => console.error('[Supabase] PATCH room error:', err.message));
  }
};

const syncRoomDirectoryWithSupabase = async () => {
  if (!SUPABASE_KEY) return;
  try {
    const response = await fetch(`${ROOMS_ENDPOINT}?select=*`, {
      headers: supabaseHeaders(),
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        for (const row of data) {
          roomDirectory.set(row.id, {
            id: row.id,
            hostName: row.host_name || 'Bạn học',
            memberCount: 0,
            currentSong: 'Đang nghe nhạc Lofi',
            roomTitle: row.title || 'Phòng học tập',
            isPrivate: !!row.is_private,
            password: '',
            passwordHash: row.password_hash || '',
            hostAvatarUrl: row.host_avatar_url || '',
            roomAvatarUrl: '',
            createdAt: row.created_at || new Date().toISOString(),
            lastActiveAt: row.last_active_at || new Date().toISOString(),
          });
        }
        console.log(`[Supabase] Synced ${data.length} rooms from database on startup.`);
        saveRoomDirectory();
      }
    } else {
      console.warn('[Supabase] Failed to fetch rooms list on startup:', response.status, await response.text());
    }
  } catch (err) {
    console.error('[Supabase] syncRoomDirectoryWithSupabase error:', err.message);
  }
};

const broadcastRoomDirectory = () => {
  io.emit('active-rooms-list', getRoomDirectoryList());
};

// Helper phát sóng danh sách user online (để filter tìm bạn bè)
const broadcastFriendsStatus = () => {
  io.emit('online-users-changed', Array.from(onlineUsers.values()));
};

// Helper cập nhật bài hát đang nghe cho tất cả thành viên trong phòng
const updateRoomMembersSongs = (roomId, songTitle) => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.members.forEach(member => {
    const user = onlineUsers.get(member.id);
    if (user) {
      user.currentSong = songTitle;
    }
  });
  broadcastFriendsStatus();
};

// Helper phát sóng tin nhắn hệ thống vào phòng
const sendSystemMessage = (roomId, text) => {
  const room = rooms.get(roomId);
  if (!room) return;

  const systemMsg = {
    id: `${Date.now()}-${Math.random()}`,
    sender: 'Hệ thống',
    senderId: 'system',
    isHost: false,
    text: sanitizeBoundedString(text, MAX_CHAT_MESSAGE_LENGTH),
    type: 'system',
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  };

  if (!room.chatMessages) room.chatMessages = [];
  room.chatMessages.push(systemMsg);
  trimRoomChatMessages(room);
  rememberRoomState(room);

  io.to(roomId).emit('receive-message', systemMsg);
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Đăng ký thông tin user khi kết nối
  socket.on('register-user', ({ friendCode, username }) => {
    onlineUsers.set(socket.id, {
      socketId: socket.id,
      friendCode,
      username: username || 'Bạn học',
      currentRoomId: null,
      currentSong: 'Đang ở trang chủ KST'
    });
    broadcastFriendsStatus();
  });

  // Yêu cầu danh sách phòng
  socket.on('request-active-rooms', () => {
    const activeRooms = Array.from(rooms.values()).map(r => ({
      id: r.roomId,
      hostName: r.members.find(m => m.isHost)?.username || 'Ẩn danh',
      memberCount: r.members.length,
      currentSong: r.playlist[0]?.title || 'Đang nghe nhạc Lofi',
      roomTitle: r.roomTitle || `Phòng học tập`,
      isPrivate: !!r.isPrivate,
      hostAvatarUrl: r.hostAvatarUrl || ''
    }));
    socket.emit('active-rooms-list', getRoomDirectoryList());
  });

  // 1. Tham gia phòng
  socket.on('join-room', async ({ roomId, username, ideaTasks = [], roomTitle, isPrivate, password, hostAvatarUrl, roomAvatarUrl, friendCode, avatarUrl }) => {
    const rememberedRoom = roomDirectory.get(roomId);
    const restoredState = savedRoomState.get(roomId) || await loadRoomStateFromSupabase(roomId) || {};
    // Khởi tạo phòng nếu chưa tồn tại
    if (!rooms.has(roomId)) {
      const incomingHash = password ? crypto.createHash('sha256').update(password).digest('hex') : '';
      rooms.set(roomId, {
        roomId,
        members: [],
        playlist: sortPlaylist(normalizePlaylist(
          Array.isArray(restoredState.playlist) ? restoredState.playlist : [],
          restoredState.videoState?.id,
          restoredState.videoState?.playlistItemId
        )),
        videoState: restoredState.videoState || {
          id: '', // Không có video mặc định — chờ người dùng chọn
          time: 0,
          playing: false,
          pausedByHost: false, // Host đã tạm dừng toàn phòng
          lastUpdated: Date.now()
        },
        pomodoro: restoredState.pomodoro || createDefaultPomodoro(),
        chatMessages: Array.isArray(restoredState.chatMessages) ? restoredState.chatMessages : [],
        ideaTasks: Array.isArray(restoredState.ideaTasks) ? restoredState.ideaTasks : (Array.isArray(ideaTasks) ? ideaTasks : []),
        roomTitle: roomTitle || `Phòng của ${username}`,
        isPrivate: isPrivate !== undefined ? !!isPrivate : !!restoredState.isPrivate || !!rememberedRoom?.isPrivate,
        password: password || restoredState.password || rememberedRoom?.password || '',
        passwordHash: incomingHash || rememberedRoom?.passwordHash || '',
        hostAvatarUrl: hostAvatarUrl || restoredState.hostAvatarUrl || rememberedRoom?.hostAvatarUrl || '',
        tiktokVideoId: restoredState.tiktokVideoId || '',
        hostFriendCode: restoredState.hostFriendCode || '',
        hostUsername: restoredState.hostUsername || rememberedRoom?.hostName || '',
        hostReconnectUntil: restoredState.hostReconnectUntil || null,
        studyTable: restoredState.studyTable || createDefaultStudyTable(),
        pinnedMessage: restoredState.pinnedMessage || null,
        roomAvatarUrl: roomAvatarUrl || restoredState.roomAvatarUrl || rememberedRoom?.roomAvatarUrl || '',
        roomBackgroundUrl: restoredState.roomBackgroundUrl || '',
        whiteboard: { elements: [] },  // bảng vẽ chung: [{id,type:'stroke'|'image',...}]
        voiceUsers: {},  // { [socketId]: { muted, speaking, cameraOn } }
        topikGame: createDefaultTopikGame(),
        vocabMatchGame: createDefaultVocabMatchGame()
      });
    }

    const room = rooms.get(roomId);
    room.chatMessages = Array.isArray(room.chatMessages) ? room.chatMessages.slice(-MAX_ROOM_CHAT_MESSAGES) : [];
    room.ideaTasks = sanitizeIdeaTasks(room.ideaTasks);
    room.roomTitle = sanitizeBoundedString(room.roomTitle, MAX_ROOM_TITLE_LENGTH) || room.roomTitle || '';
    room.password = sanitizeBoundedString(room.password, MAX_ROOM_PASSWORD_LENGTH);
    room.hostAvatarUrl = sanitizeMediaUrl(room.hostAvatarUrl);
    room.roomAvatarUrl = sanitizeMediaUrl(room.roomAvatarUrl);
    room.roomBackgroundUrl = sanitizeMediaUrl(room.roomBackgroundUrl);
    ensureTopikGame(room);
    ensureVocabMatchGame(room);
    cancelEmptyRoomCleanup(roomId);
    if (rememberedRoom && !roomTitle) {
      room.roomTitle = rememberedRoom.roomTitle || room.roomTitle;
    }
    if (typeof roomAvatarUrl === 'string' && roomAvatarUrl && !room.roomAvatarUrl) {
      room.roomAvatarUrl = roomAvatarUrl;
    }

    // Kiểm tra mật khẩu nếu phòng riêng tư
    if (room.isPrivate) {
      if (room.passwordHash) {
        const hash = password ? crypto.createHash('sha256').update(password).digest('hex') : '';
        if (hash !== room.passwordHash) {
          socket.emit('join-room-error', 'Sai mật khẩu phòng!');
          return;
        }
      } else if (room.password && room.password !== password) {
        socket.emit('join-room-error', 'Sai mật khẩu phòng!');
        return;
      }
    }

    socket.join(roomId);
    if (Array.isArray(ideaTasks) && ideaTasks.length && (!room.ideaTasks || room.ideaTasks.length === 0)) {
      room.ideaTasks = sanitizeIdeaTasks(ideaTasks);
    }
    
    // Kiểm tra xem user đã tồn tại trong phòng chưa (qua friendCode hoặc username đã chuẩn hóa)
    const memberFriendCode = friendCode || onlineUsers.get(socket.id)?.friendCode || '';
    const normalizedNewUsername = normalizeStr(username);
    const existingMembers = room.members.filter(member => {
      // Nếu cả hai đều có friendCode, chỉ match nếu friendCode giống nhau
      if (memberFriendCode && member.friendCode) {
        return member.friendCode === memberFriendCode;
      }
      // Nếu một trong hai không có friendCode, match bằng username đã chuẩn hóa để tránh lỗi do gõ sai dấu tiếng Việt
      return normalizeStr(member.username) === normalizedNewUsername;
    });

    if (existingMembers.length) {
      // 1. Kick/cleanup actual old connections (different socket.id)
      const disconnectMembers = existingMembers.filter(m => m.id !== socket.id);
      if (disconnectMembers.length) {
        const disconnectIds = new Set(disconnectMembers.map(m => m.id));
        disconnectMembers.forEach((existingMember) => {
          const oldSocket = io.sockets.sockets.get(existingMember.id);
          oldSocket?.leave(roomId);
          if (room.voiceUsers?.[existingMember.id]) {
            delete room.voiceUsers[existingMember.id];
            io.to(roomId).emit('voice-user-left', { userId: existingMember.id });
          }
        });
        room.members = room.members.filter(member => !disconnectIds.has(member.id));
      }

      // 2. For same socket.id (re-emission of join-room), just remove from room.members array
      // so it will be replaced by the updated newMember object, without leaving the socket.io room.
      const sameSocketMembers = existingMembers.filter(m => m.id === socket.id);
      if (sameSocketMembers.length) {
        const sameSocketIds = new Set(sameSocketMembers.map(m => m.id));
        room.members = room.members.filter(member => !sameSocketIds.has(member.id));
      }
    }

    const reconnectDeadline = room.hostReconnectUntil ? new Date(room.hostReconnectUntil).getTime() : 0;
    const returningHost = (room.hostFriendCode && memberFriendCode && room.hostFriendCode === memberFriendCode) ||
                          (!room.hostFriendCode && room.hostUsername && username && normalizeStr(room.hostUsername) === normalizedNewUsername);
    const waitingForHost = !!room.hostFriendCode && reconnectDeadline > Date.now();
    const isHost = room.members.length === 0 || returningHost || (!room.members.some(member => member.isHost) && !waitingForHost);

    const newMember = {
      id: socket.id,
      username: username || `Bạn học #${Math.floor(1000 + Math.random() * 9000)}`,
      isHost: false,
      role: 'member',
      friendCode: memberFriendCode,
      avatarUrl: avatarUrl || '',
      mutedUntil: null
    };

    room.members.push(newMember);
    if (isHost) {
      if (returningHost) clearHostTransferTimer(roomId);
      setRoomHost(room, socket.id);
    }
    if (newMember.isHost && hostAvatarUrl) {
      room.hostAvatarUrl = hostAvatarUrl;
    }
    ensureStudySeat(room, newMember);
    rememberRoom(room, room.members.find(m => m.isHost)?.username || newMember.username);
    rememberRoomState(room);

    // Cập nhật thông tin phòng & bài hát của user trong onlineUsers
    const user = onlineUsers.get(socket.id);
    if (user) {
      user.currentRoomId = roomId;
      if (friendCode) user.friendCode = friendCode;
      user.currentSong = room.playlist[0]?.title || 'Đang nghe nhạc Lofi';
    } else {
      onlineUsers.set(socket.id, {
        socketId: socket.id,
        friendCode: friendCode || '',
        username: newMember.username,
        currentRoomId: roomId,
        currentSong: room.playlist[0]?.title || 'Đang nghe nhạc Lofi'
      });
    }
    broadcastFriendsStatus();

    // Gửi thông báo cho mọi người trong phòng
    io.to(roomId).emit('room-users', room.members);
    
    // Gửi dữ liệu phòng hiện tại cho người mới vào (bao gồm lịch sử chat)
    socket.emit('init-room-state', {
      playlist: room.playlist,
      videoState: room.videoState,
      pomodoro: room.pomodoro,
      chatMessages: room.chatMessages || [],
      isHost,
      tiktokVideoId: room.tiktokVideoId || null,
      ideaTasks: room.ideaTasks || [],
      voiceUsers: room.voiceUsers || {},
      slideUrl: room.slideUrl || '',
      whiteboard: room.whiteboard || { elements: [] },
      studyTable: syncStudyMembers(room),
      pinnedMessage: room.pinnedMessage || null,
      roomAvatarUrl: room.roomAvatarUrl || '',
      roomBackgroundUrl: room.roomBackgroundUrl || ''
    });
    emitStudyTable(roomId);

    // Nếu phòng đang có TikTok video, gửi sync cho member mới
    if (room.tiktokVideoId) {
      socket.emit('tiktok-sync', { videoId: room.tiktokVideoId });
    }

    broadcastRoomDirectory();
    
    console.log(`${newMember.username} joined room: ${roomId} (Host: ${isHost})`);
  });

  // 1b. Rời phòng chủ động (client navigate về landing mà không reload)
  socket.on('leave-room', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const index = room.members.findIndex(m => m.id === socket.id);
    if (index === -1) return;

    const removedMember = room.members.splice(index, 1)[0];
    socket.leave(roomId);

    // Cleanup voice chat
    if (room.voiceUsers && room.voiceUsers[socket.id]) {
      delete room.voiceUsers[socket.id];
      io.to(roomId).emit('voice-user-left', { userId: socket.id });
    }
    if (room.studyTable?.seats) {
      delete room.studyTable.seats[socket.id];
      emitStudyTable(roomId);
    }

    // Cập nhật online user
    const user = onlineUsers.get(socket.id);
    if (user) {
      user.currentRoomId = null;
      user.currentSong = 'Đang ở trang chủ KST';
    }

    if (room.members.length === 0) {
      rememberRoom(room, removedMember.username);
      clearVocabMatchTimers(roomId);
      clearTopikGameTimer(roomId);
      rooms.delete(roomId);
      console.log(`Deleted empty room after leave-room: ${roomId}`);
    } else {
      removeVocabMatchPlayer(room, socket.id);
      emitVocabMatchGame(roomId);
      if (removedMember.isHost) {
        let candidate = room.members.find(m => m.role === 'cohost');
        if (!candidate) {
          candidate = room.members.find(m => m.role === 'moderator');
        }
        if (!candidate) {
          candidate = room.members[0];
        }
        const nextHost = setRoomHost(room, candidate.id);
        if (nextHost) {
          io.to(nextHost.id).emit('assigned-host', true);
          sendSystemMessage(roomId, `Bạn học ${nextHost.username} đã trở thành chủ phòng.`);
        }
      }
      io.to(roomId).emit('room-users', room.members);
      rememberRoomState(room);
    }

    broadcastFriendsStatus();
    broadcastRoomDirectory();
    console.log(`${removedMember.username} left room (leave-room event): ${roomId}`);
  });

  // 2. Chat thời gian thực
  socket.on('send-message', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const sender = room.members.find(m => m.id === socket.id);
    if (!sender) return;

    if (isChatRateLimited(socket.id)) {
      socket.emit('chat-error', { code: 'rateLimit' });
      return;
    }

    const safeMessage = sanitizeChatMessage(message);
    if (!safeMessage) {
      socket.emit('chat-error', { code: 'invalid' });
      return;
    }

    if (sender.mutedUntil && new Date(sender.mutedUntil).getTime() > Date.now()) {
      socket.emit('receive-message', {
        id: `system-mute-${Date.now()}`,
        sender: 'Hệ thống',
        senderId: 'system',
        text: 'Bạn đang bị khóa chat tạm thời và không thể gửi tin nhắn.',
        type: 'system',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      });
      return;
    }

    const now = Date.now();
    const chatMsg = {
      id: `${now}-${Math.random()}`,
      sender: sender.username,
      senderId: socket.id,
      isHost: sender.isHost,
      text: safeMessage,
      type: 'user',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      sentAt: now,   // unix ms — dùng cho chat bubble
    };

    if (!room.chatMessages) room.chatMessages = [];
    room.chatMessages.push(chatMsg);
    trimRoomChatMessages(room);
    rememberRoomState(room);

    io.to(roomId).emit('receive-message', chatMsg);
  });

  // Đồng bộ đồng hồ client ↔ server (NTP đơn giản) để bù trễ video chính xác,
  // không phụ thuộc đồng hồ máy người dùng có lệch hay không.
  socket.on('ping-time', (clientT0) => {
    socket.emit('pong-time', { clientT0, serverTime: Date.now() });
  });

  // 3. Đồng bộ Video YouTube
  socket.on('video-action', ({ roomId, action, time, videoId, playlistItemId, userInitiated }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'video-action', 40, 10_000)) return;

    // GUARD 1: chặn pause liên tục khi đã pausedByHost (host onStateChange spam state=2)
    // → không re-broadcast, không update lastUpdated (để guard 2 hoạt động đúng)
    if (action === 'pause' && room.videoState.pausedByHost && !userInitiated) {
      // Đã pause rồi, bỏ qua spurious pause repeat
      return;
    }

    // GUARD 2: chặn MỌI play (kể cả từ sync interval) khi pausedByHost trừ khi:
    // - userInitiated=true → user thực sự click play UI button
    // - có videoId → đổi bài mới (auto-play bài tiếp theo trong playlist)
    // Lý do: sync interval của host emit play mỗi 5s với cùng cvr.playing cũ
    // → nếu không chặn, sẽ tự reset pausedByHost và unpause toàn phòng
    if (action === 'play' && room.videoState.pausedByHost && !userInitiated && !videoId) {
      console.log(`[GUARD] Block play from ${socket.id} while pausedByHost=true (no userInit, no videoId)`);
      return;
    }

    // Lưu video/item cũ TRƯỚC KHI cập nhật để truyền vào setPlaylistPlaying
    const prevVideoId = room.videoState.id;
    const prevItemId = room.videoState.playlistItemId;

    // Cập nhật trạng thái video của phòng
    if (videoId) room.videoState.id = videoId;
    if (playlistItemId) room.videoState.playlistItemId = playlistItemId;
    if (time !== undefined) room.videoState.time = time;
    if (action === 'play') {
      room.videoState.playing = true;
      // Chỉ unset pausedByHost khi là user explicit action (UI click) hoặc đổi bài mới
      if (userInitiated || videoId) {
        room.videoState.pausedByHost = false;
      }
    }
    if (action === 'pause') {
      room.videoState.playing = false;
      room.videoState.pausedByHost = true; // Host dừng → đánh dấu toàn phòng
    }
    room.videoState.lastUpdated = Date.now();
    if (videoId) {
      setPlaylistPlaying(room, playlistItemId, videoId, prevItemId, prevVideoId);
      room.playlist = sortPlaylist(room.playlist);
    }
    rememberRoomState(room);

    // Gửi lại trạng thái video mới cho các thành viên khác trong phòng (ngoại trừ người gửi)
    socket.to(roomId).emit('video-sync', {
      action,
      time,
      videoId,
      userInitiated,
      videoState: room.videoState
    });

    if (videoId) {
      const activeItem = room.playlist.find(item => item.videoId === videoId);
      io.to(roomId).emit('update-playlist', room.playlist);
      updateRoomMembersSongs(roomId, activeItem ? activeItem.title : `Đang phát video (${videoId})`);
    }
  });

  // 4b. Slide URL Sync (Google Slides / Canva embed)
  socket.on('slide-url-set', ({ roomId, url }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'slide-url-set', 8, 60_000)) return;
    room.slideUrl = sanitizeMediaUrl(url);
    // Broadcast tới tất cả người trong phòng (kể cả người gửi để confirm)
    io.to(roomId).emit('slide-url-sync', { url: room.slideUrl });
  });

  // 4c. WHITEBOARD (Bảng vẽ chung real-time) ──────────────────────────
  const MAX_WB_ELEMENTS = 4000; // chặn phình bộ nhớ
  const ensureWhiteboard = (room) => {
    if (!room.whiteboard) room.whiteboard = { elements: [] };
    return room.whiteboard;
  };

  // Bắt đầu 1 nét vẽ mới
  socket.on('whiteboard-stroke-start', ({ roomId, stroke }) => {
    const room = rooms.get(roomId);
    if (!room || typeof stroke?.id !== 'string' || stroke.id.length > 80) return;
    if (!findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'whiteboard-stroke-start', 80, 10_000)) return;
    const initialPoints = sanitizeWhiteboardPoints(stroke.points, 4);
    const wb = ensureWhiteboard(room);
    wb.elements.push({
      id: stroke.id,
      type: 'stroke',
      tool: stroke.tool === 'eraser' ? 'eraser' : 'pen',
      color: String(stroke.color || '#4c3731').slice(0, 32),
      size: Math.max(0.0005, Math.min(0.2, Number(stroke.size) || 0.006)),
      points: initialPoints,
      by: socket.id,
    });
    if (wb.elements.length > MAX_WB_ELEMENTS) wb.elements.splice(0, wb.elements.length - MAX_WB_ELEMENTS);
    socket.to(roomId).emit('whiteboard-stroke-start', { stroke: wb.elements[wb.elements.length - 1] });
  });

  // Thêm điểm vào nét đang vẽ (relay + lưu)
  socket.on('whiteboard-stroke-point', ({ roomId, strokeId, points }) => {
    const room = rooms.get(roomId);
    if (!room || typeof strokeId !== 'string' || !Array.isArray(points)) return;
    if (!findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'whiteboard-stroke-point', 300, 10_000)) return;
    const wb = ensureWhiteboard(room);
    const el = wb.elements.find(e => e.id === strokeId);
    const safePoints = sanitizeWhiteboardPoints(points);
    if (safePoints.length === 0) return;
    if (el && el.type === 'stroke') {
      el.points.push(...safePoints);
      if (el.points.length > MAX_WB_POINTS_PER_STROKE) {
        el.points.splice(0, el.points.length - MAX_WB_POINTS_PER_STROKE);
      }
    }
    socket.to(roomId).emit('whiteboard-stroke-point', { strokeId, points: safePoints });
  });

  // Dán/upload ảnh lên bảng
  socket.on('whiteboard-image', ({ roomId, image }) => {
    const room = rooms.get(roomId);
    if (!room || typeof image?.id !== 'string' || image.id.length > 80) return;
    if (!findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'whiteboard-image', 5, 60_000)) {
      socket.emit('whiteboard-image-error', { code: 'rateLimit' });
      return;
    }
    if (!isSafeWhiteboardImageSrc(image.src)) {
      socket.emit('whiteboard-image-error', { code: 'invalidImage' });
      return;
    }
    const wb = ensureWhiteboard(room);
    const x = Number(image.x);
    const y = Number(image.y);
    const w = Number(image.w);
    const h = Number(image.h);
    const el = {
      id: image.id,
      type: 'image',
      src: image.src,
      x: Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0.5,
      y: Number.isFinite(y) ? Math.max(0, Math.min(1, y)) : 0.5,
      w: Number.isFinite(w) ? Math.max(0.05, Math.min(1, w)) : 0.4,
      h: Number.isFinite(h) ? Math.max(0.05, Math.min(1, h)) : 0.3,
      by: socket.id,
    };
    wb.elements.push(el);
    if (wb.elements.length > MAX_WB_ELEMENTS) wb.elements.splice(0, wb.elements.length - MAX_WB_ELEMENTS);
    io.to(roomId).emit('whiteboard-image', { image: el });
  });

  // Xoá toàn bộ bảng (mọi người đều được phép)
  socket.on('whiteboard-clear', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'whiteboard-clear', 6, 60_000)) return;
    ensureWhiteboard(room).elements = [];
    io.to(roomId).emit('whiteboard-clear', {});
  });

  // Lấy toàn bộ trạng thái bảng (khi mở tab Vẽ) → bắt kịp nét vẽ lúc ở tab khác
  socket.on('whiteboard-request', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'whiteboard-request', 20, 60_000)) return;
    socket.emit('whiteboard-state', { elements: ensureWhiteboard(room).elements });
  });

  // 4. Playlist & Upvote Jukebox
  socket.on('add-to-playlist', ({ roomId, videoId, title, duration }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const sender = room.members.find(m => m.id === socket.id);
    if (!sender) return;
    if (rateLimitSocketEvent(socket.id, 'add-to-playlist', 10, 60_000)) return;
    if (room.playlist.length >= MAX_PLAYLIST_ITEMS) {
      socket.emit('playlist-error', { code: 'playlistFull' });
      return;
    }
    const safeVideoId = sanitizeShortId(videoId, 80);
    const safeTitle = sanitizeBoundedString(title, MAX_PLAYLIST_TITLE_LENGTH);
    const safeDuration = sanitizeBoundedString(duration, MAX_PLAYLIST_DURATION_LENGTH) || '00:00';
    if (!safeVideoId || !safeTitle) return;
    const addedBy = sender ? sender.username : 'Ẩn danh';

    const queuedItems = room.playlist.filter(item => item.status === 'queued' && item.queueOrder !== undefined);
    let nextQueueOrder = undefined;
    if (queuedItems.length > 0) {
      const maxOrder = Math.max(...queuedItems.map(item => item.queueOrder));
      nextQueueOrder = maxOrder + 1;
    }

    const newItem = {
      id: `${Date.now()}-${Math.random()}`,
      videoId: safeVideoId,
      title: safeTitle,
      duration: safeDuration,
      votes: 1, // Bắt đầu bằng 1 vote từ người thêm
      votedUsers: [socket.id],
      addedBy,
      status: 'queued',
      queueOrder: nextQueueOrder
    };

    // wasEmpty: playlist trống VÀ không có video nào đang phát (kể cả video mặc định cũ đang lỗi)
    const wasEmpty = room.playlist.length === 0 && !room.videoState.playing;

    room.playlist.push(newItem);

    // Sắp xếp playlist theo số vote giảm dần
    room.playlist = sortPlaylist(room.playlist);
    rememberRoomState(room);

    sendSystemMessage(roomId, `Bạn học ${addedBy} đã thêm bài: "${title}".`);

    // Nếu phòng chưa có video nào đang phát → tự động phát bài vừa thêm
    if (wasEmpty) {
      room.videoState.id = newItem.videoId;
      room.videoState.playlistItemId = newItem.id;
      room.videoState.time = 0;
      room.videoState.playing = true;
      room.videoState.lastUpdated = Date.now();
      setPlaylistPlaying(room, newItem.id, newItem.videoId);
      room.playlist = sortPlaylist(room.playlist);
      rememberRoomState(room);
      // Emit playlist và video-sync cùng lúc để tránh race condition
      io.to(roomId).emit('update-playlist', room.playlist);
      io.to(roomId).emit('video-sync', {
        action: 'play',
        time: 0,
        videoId: newItem.videoId,
        videoState: room.videoState
      });
      updateRoomMembersSongs(roomId, newItem.title);
    } else {
      // Chỉ emit update-playlist một lần nếu không phải auto-play
      io.to(roomId).emit('update-playlist', room.playlist);
      updateRoomMembersSongs(roomId, room.playlist[0]?.title || 'Đang nghe nhạc Lofi');
    }
  });

  socket.on('vote-song', ({ roomId, songId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'vote-song', 30, 60_000)) return;

    const safeSongId = sanitizeBoundedString(songId, 100);
    const song = room.playlist.find(item => item.id === safeSongId);
    if (!song) return;

    const userIndex = song.votedUsers.indexOf(socket.id);
    if (userIndex === -1) {
      // User chưa vote -> Thêm vote
      song.votes += 1;
      song.votedUsers.push(socket.id);
    } else {
      // User đã vote rồi -> Hủy vote (toggle)
      song.votes = Math.max(0, song.votes - 1);
      song.votedUsers.splice(userIndex, 1);
    }

    // Sắp xếp lại playlist
    room.playlist = sortPlaylist(room.playlist);
    rememberRoomState(room);

    io.to(roomId).emit('update-playlist', room.playlist);
    updateRoomMembersSongs(roomId, room.playlist[0]?.title || 'Đang nghe nhạc Lofi');
  });

  // Xóa bài hát khỏi playlist (khi phát xong)
  socket.on('remove-song', ({ roomId, songId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.playlist = room.playlist.map(item =>
      item.id === songId ? { ...item, status: 'played', playedAt: item.playedAt || new Date().toISOString() } : item
    );
    room.playlist = sortPlaylist(room.playlist);
    rememberRoomState(room);
    io.to(roomId).emit('update-playlist', room.playlist);
    updateRoomMembersSongs(roomId, room.playlist[0]?.title || 'Đang nghe nhạc Lofi');
  });

  // 5. Đồng bộ đếm ngược Pomodoro
  socket.on('delete-playlist-item', ({ roomId, songId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!hasPermission(sender, 'music.control')) return;

    const item = room.playlist.find(song => song.id === songId);
    if (!item || item.status === 'playing' || item.videoId === room.videoState.id) return;

    room.playlist = room.playlist.filter(song => song.id !== songId);
    rememberRoomState(room);
    io.to(roomId).emit('update-playlist', room.playlist);
    updateRoomMembersSongs(roomId, room.playlist.find(song => song.status === 'playing')?.title || room.playlist[0]?.title || 'Dang nghe nhac Lofi');
  });

  // Reset playlist: đưa tất cả bài 'played' về 'queued' để phát lại
  socket.on('reset-playlist', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!hasPermission(sender, 'music.control')) return;

    const now = Date.now();
    room.playlist = room.playlist.map((item, idx) => {
      if (item.status === 'played') {
        return {
          ...item,
          status: 'queued',
          playedAt: undefined,
          votes: 0,
          votedUsers: [],
          queueOrder: 1000 + idx, // đặt sau các bài queued hiện tại
        };
      }
      return item;
    });
    room.playlist = sortPlaylist(room.playlist);
    rememberRoomState(room);
    io.to(roomId).emit('update-playlist', room.playlist);
    sendSystemMessage(roomId, `${sender.username} đã reset danh sách phát. Tất cả bài hát có thể phát lại!`);
  });

  socket.on('reorder-playlist', ({ roomId, orderedIds }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const sender = room.members.find(m => m.id === socket.id);
    if (!hasPermission(sender, 'music.reorder')) return;
    if (!Array.isArray(orderedIds) || orderedIds.length > MAX_PLAYLIST_ITEMS) return;
    if (rateLimitSocketEvent(socket.id, 'reorder-playlist', 12, 60_000)) return;

    const playlistMap = new Map(room.playlist.map(item => [item.id, item]));
    const newPlaylist = [];

    orderedIds.map(id => sanitizeBoundedString(id, 100)).forEach(id => {
      const item = playlistMap.get(id);
      if (item) {
        newPlaylist.push(item);
        playlistMap.delete(id);
      }
    });

    playlistMap.forEach(item => {
      newPlaylist.push(item);
    });

    let queuedIndex = 0;
    room.playlist = newPlaylist.map(item => {
      if (item.status === 'queued') {
        return { ...item, queueOrder: queuedIndex++ };
      }
      return { ...item, queueOrder: undefined };
    });

    rememberRoomState(room);
    io.to(roomId).emit('update-playlist', room.playlist);
  });

  socket.on('pomodoro-control', ({ roomId, action, duration, isBreak }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const sender = room.members.find(m => m.id === socket.id);
    if (!hasPermission(sender, 'pomodoro.control')) return;

    const p = room.pomodoro;
    const username = sender ? sender.username : 'Chủ phòng';

    if (action === 'start') {
      p.isRunning = true;
      sendSystemMessage(roomId, `${username} đã bắt đầu đếm ngược Pomodoro.`);
    } else if (action === 'pause') {
      p.isRunning = false;
      sendSystemMessage(roomId, `${username} đã tạm dừng đồng hồ Pomodoro.`);
    } else if (action === 'reset') {
      p.isRunning = false;
      p.isBreak = isBreak !== undefined ? isBreak : false;
      p.duration = duration || (p.isBreak ? 5 * 60 : 25 * 60);
      p.timeLeft = p.duration;
      sendSystemMessage(roomId, `${username} đã đặt lại thời gian ${p.isBreak ? 'giải lao (5 phút)' : 'học tập (25 phút)'}.`);
    }

    io.to(roomId).emit('pomodoro-sync', p);
    rememberRoomState(room);
  });

  socket.on('study-table-action', ({ roomId, type, payload = {} }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const member = room.members.find(m => m.id === socket.id);
    if (!member) return;
    const studyRateMax = type === 'reaction' ? 24 : type === 'presence' ? 90 : 40;
    if (rateLimitSocketEvent(socket.id, `study-table-${type}`, studyRateMax, 60_000)) return;

    const studyTable = syncStudyMembers(room);
    const seat = ensureStudySeat(room, member);

    if (type === 'presence') {
      const isActive = payload.active !== false;
      if (isActive && !seat.active) {
        // Quay lại bàn: cộng dồn thời gian nghỉ
        if (seat.pausedSince) {
          seat.totalPausedMs = (seat.totalPausedMs || 0) + (Date.now() - seat.pausedSince);
          seat.pausedSince = null;
        }
      } else if (!isActive && seat.active) {
        // Rời bàn: đánh dấu thời điểm bắt đầu nghỉ
        seat.pausedSince = Date.now();
      }
      seat.active = isActive;
    }

    if (type === 'status' && typeof payload.status === 'string') {
      seat.status = sanitizeBoundedString(payload.status, 40);
    }

    if (type === 'personal-pomodoro') {
      const allowedActions = new Set(['start', 'pause', 'reset']);
      if (!allowedActions.has(payload.action)) return;
      const pomo = seat.personalPomodoro || createPersonalPomodoro();
      if (payload.action === 'start') {
        pomo.isRunning = true;
      } else if (payload.action === 'pause') {
        pomo.isRunning = false;
      } else if (payload.action === 'reset') {
        pomo.isRunning = false;
        pomo.isBreak = !!payload.isBreak;
        pomo.duration = pomo.isBreak ? 5 * 60 : 25 * 60;
        pomo.timeLeft = pomo.duration;
      }
      pomo.lastUpdated = Date.now();
      seat.personalPomodoro = pomo;
    }

    if (type === 'reaction') {
      const label = sanitizeBoundedString(payload.label, 24);
      // targetMemberId = người NHẬN reaction; nếu không truyền thì về người gửi
      const targetMemberId = typeof payload.targetMemberId === 'string' && payload.targetMemberId
        ? payload.targetMemberId
        : socket.id;
      if (!room.members.some(item => item.id === targetMemberId)) return;
      if (label) {
        studyTable.reactions = [
          ...studyTable.reactions.slice(-20),
          {
            id: `${socket.id}-${Date.now()}`,
            memberId: targetMemberId,   // hiển thị trên card của người NHẬN
            senderId: socket.id,        // ai gửi
            senderName: member.username || 'Bạn học',  // tên người bấm
            label,
            createdAt: Date.now(),
          }
        ];
      }
    }

    rememberRoomState(room);
    emitStudyTable(roomId);
  });

  // Cập nhật avatar của member (khi profile tải xong sau lúc join) → broadcast cả phòng
  socket.on('update-avatar', ({ roomId, avatarUrl }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const member = room.members.find(m => m.id === socket.id);
    if (!member) return;
    if (rateLimitSocketEvent(socket.id, 'update-avatar', 10, 60_000)) return;
    const url = sanitizeMediaUrl(avatarUrl);
    if (member.avatarUrl === url) return; // không đổi → bỏ qua
    member.avatarUrl = url;
    if (member.isHost && url) room.hostAvatarUrl = url;
    rememberRoomState(room);
    io.to(roomId).emit('room-users', room.members);
    emitStudyTable(roomId);
  });

  // Cập nhật username của member → broadcast cả phòng
  socket.on('update-username', ({ roomId, username }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const member = room.members.find(m => m.id === socket.id);
    if (!member) return;
    if (rateLimitSocketEvent(socket.id, 'update-username', 6, 60_000)) return;
    const name = sanitizeBoundedString(username, 40);
    if (!name || member.username === name) return;
    const oldName = member.username;
    member.username = name;
    if (member.isHost) room.hostUsername = name;
    rememberRoomState(room);
    io.to(roomId).emit('room-users', room.members);
    emitStudyTable(roomId);
    sendSystemMessage(roomId, `Bạn học ${oldName} đã đổi tên thành ${name}.`);
  });

  // 7. Đồng bộ TOPIK Study giữa thành viên phòng
  socket.on('topik-action', ({ roomId, level, index }) => {
    const room = rooms.get(roomId);
    if (!room || !findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'topik-action', 40, 60_000)) return;
    const safeLevel = Math.max(1, Math.min(6, Number(level) || 1));
    const safeIndex = Math.max(0, Math.min(500, Number(index) || 0));
    socket.to(roomId).emit('topik-sync', { level: safeLevel, index: safeIndex });
  });

  // Phase B: TikTok sync — host tải video → broadcast cho cả phòng
  socket.on('topik-game-subscribe', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'topik-game-subscribe', 20, 60_000)) return;
    socket.emit('topik-game-sync', publicTopikGameState(room));
  });

  socket.on('topik-arena-leaderboard', async ({ period = 'week' } = {}) => {
    if (rateLimitSocketEvent(socket.id, 'topik-arena-leaderboard', 12, 60_000)) return;
    const normalizedPeriod = period === 'month' ? 'month' : 'week';
    const leaderboard = await fetchTopikArenaLeaderboard(normalizedPeriod);
    socket.emit('topik-arena-leaderboard-sync', {
      period: normalizedPeriod,
      leaderboard
    });
  });

  socket.on('topik-game-action', async ({ roomId, type, payload = {} }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const member = room.members.find(m => m.id === socket.id);
    if (!member) return;
    const gameRateMax = type === 'answer' ? 40 : 12;
    if (rateLimitSocketEvent(socket.id, `topik-game-${type}`, gameRateMax, 60_000)) return;

    const game = ensureTopikGame(room);
    const canManageGame = canManageTopikRoomGame(member);

    if (type === 'start') {
      const requestedType = typeof payload.gameType === 'string' ? payload.gameType : 'topik-master';
      const allowedTypes = new Set(['vocab-speed', 'sentence-build', 'topik-master', 'grammar-race']);
      const gameType = allowedTypes.has(requestedType) ? requestedType : 'topik-master';
      const pool = await getPublishedTopikQuestions(gameType);
      const questionOrder = buildTopikQuestionOrder(pool.length ? pool : TOPIK_GAME_QUESTIONS, Number(payload.totalRounds) || 8);

      room.topikGame = {
        ...createDefaultTopikGame(),
        status: 'question',
        gameType,
        round: 1,
        totalRounds: questionOrder.length,
        questionOrder,
        questionPool: pool,
        startedAt: Date.now(),
        leaderboard: {}
      };
      startTopikGameRound(roomId);
      return;
    }

    if (type === 'answer') {
      if (game.status !== 'question' || !game.question) return;
      if (game.answers?.[socket.id]) return;
      const optionIndex = Number(payload.optionIndex);
      if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= game.question.options.length) return;

      const correct = optionIndex === game.question.answerIndex;
      const elapsedMs = Math.max(0, Date.now() - (game.roundStartedAt || Date.now()));
      const speedBonus = correct ? Math.max(0, 50 - Math.floor(elapsedMs / 500)) : 0;
      const points = correct ? 100 + speedBonus : 0;
      const current = game.leaderboard[socket.id] || {
        username: member.username || 'Bạn học',
        score: 0,
        correct: 0
      };

      game.answers = {
        ...(game.answers || {}),
        [socket.id]: { optionIndex, correct, answeredAt: Date.now() }
      };
      game.leaderboard[socket.id] = {
        username: member.username || current.username,
        score: (current.score || 0) + points,
        correct: (current.correct || 0) + (correct ? 1 : 0),
        answeredAt: Date.now()
      };

      const activeMemberIds = room.members.map(m => m.id);
      const everyoneAnswered = activeMemberIds.length > 0 && activeMemberIds.every(id => !!game.answers[id]);
      if (everyoneAnswered) {
        game.status = 'revealed';
        clearTopikGameTimer(roomId);
      }
      emitTopikGame(roomId);
      return;
    }

    if (type === 'next') {
      if (!canManageGame) return;
      if (game.status === 'question') {
        revealTopikGameRound(roomId);
        return;
      }
      if (game.round >= game.totalRounds) {
        game.status = 'finished';
        game.question = null;
        clearTopikGameTimer(roomId);
        emitTopikGame(roomId);
        void persistTopikGameSession(room, game);
        return;
      }
      game.round += 1;
      startTopikGameRound(roomId);
      return;
    }

    if (type === 'reset') {
      if (!canManageGame) return;
      if (game.status === 'finished' || game.round > 0) {
        void persistTopikGameSession(room, game);
      }
      clearTopikGameTimer(roomId);
      room.topikGame = createDefaultTopikGame();
      emitTopikGame(roomId);
    }
  });

  socket.on('vocab-match-subscribe', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'vocab-match-subscribe', 20, 60_000)) return;
    socket.emit('vocab-match-sync', publicVocabMatchGameState(room));
  });

  socket.on('vocab-match-action', async ({ roomId, type, payload = {} }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const member = room.members.find(m => m.id === socket.id);
    if (!member) return;
    const vocabRateMax = type === 'match' ? 80 : 16;
    if (rateLimitSocketEvent(socket.id, `vocab-match-${type}`, vocabRateMax, 60_000)) return;
    const game = ensureVocabMatchGame(room);

    if (type === 'join' || type === 'ready') {
      game.players[socket.id] = {
        username: member.username || 'Bạn học',
        ready: true,
        joinedAt: game.players[socket.id]?.joinedAt || Date.now()
      };
      if (!game.leaderboard[socket.id]) {
        game.leaderboard[socket.id] = {
          username: member.username || 'Bạn học',
          score: 0,
          matches: 0,
          wrong: 0,
          fastestMs: null,
          lastMatchedAt: null
        };
      }
      emitVocabMatchGame(roomId);
      return;
    }

    if (type === 'leave') {
      removeVocabMatchPlayer(room, socket.id);
      emitVocabMatchGame(roomId);
      return;
    }

    if (type === 'start') {
      game.players[socket.id] = {
        username: member.username || 'Bạn học',
        ready: true,
        joinedAt: game.players[socket.id]?.joinedAt || Date.now()
      };
      void startVocabMatchRound(roomId, payload.durationSec);
      return;
    }

    if (type === 'match') {
      if (game.status !== 'playing') return;
      const firstCardId = typeof payload.firstCardId === 'string' ? payload.firstCardId : '';
      const secondCardId = typeof payload.secondCardId === 'string' ? payload.secondCardId : '';
      if (!firstCardId || !secondCardId || firstCardId === secondCardId) return;

      const firstCard = game.cards.find(card => card.id === firstCardId);
      const secondCard = game.cards.find(card => card.id === secondCardId);
      if (!firstCard || !secondCard) return;

      game.players[socket.id] = {
        username: member.username || 'Bạn học',
        ready: true,
        joinedAt: game.players[socket.id]?.joinedAt || Date.now()
      };

      const alreadyMatched = new Set(game.matchedPairIds || []);
      const samePair = firstCard.pairId === secondCard.pairId;
      const differentTypes = firstCard.type !== secondCard.type;
      const canMatch = samePair && differentTypes && !alreadyMatched.has(firstCard.pairId);
      const elapsedMs = Math.max(0, Date.now() - (game.roundStartedAt || Date.now()));
      const currentScore = game.leaderboard[socket.id] || {
        username: member.username || 'Bạn học',
        score: 0,
        matches: 0,
        wrong: 0,
        fastestMs: null,
        lastMatchedAt: null
      };

      if (canMatch) {
        const speedBonus = Math.max(0, 30 - Math.floor(elapsedMs / 500));
        const points = 100 + speedBonus;
        game.matchedPairIds = [...alreadyMatched, firstCard.pairId];
        game.cards = game.cards.map(card => (
          card.pairId === firstCard.pairId
            ? { ...card, matchedBy: socket.id, matchedByName: member.username || 'Bạn học' }
            : card
        ));
        game.leaderboard[socket.id] = {
          ...currentScore,
          username: member.username || currentScore.username,
          score: (currentScore.score || 0) + points,
          matches: (currentScore.matches || 0) + 1,
          fastestMs: currentScore.fastestMs ? Math.min(currentScore.fastestMs, elapsedMs) : elapsedMs,
          lastMatchedAt: Date.now()
        };
        game.lastResult = {
          type: 'match',
          memberId: socket.id,
          username: member.username || 'Bạn học',
          pairId: firstCard.pairId,
          points
        };
      } else {
        game.leaderboard[socket.id] = {
          ...currentScore,
          username: member.username || currentScore.username,
          wrong: (currentScore.wrong || 0) + 1
        };
        game.lastResult = {
          type: 'miss',
          memberId: socket.id,
          username: member.username || 'Bạn học'
        };
      }

      const allMatched = (game.matchedPairIds || []).length >= Math.min(VOCAB_MATCH_PAIR_COUNT, Math.floor((game.cards || []).length / 2));
      if (allMatched) {
        const remainingMs = Math.max(0, (game.roundEndsAt || 0) - Date.now());
        if (remainingMs > 1200) {
          const words = await getVocabMatchWords();
          const nextBoard = buildVocabMatchRound(words);
          const currentRoom = rooms.get(roomId);
          const currentGame = currentRoom ? ensureVocabMatchGame(currentRoom) : null;
          if (!currentRoom || currentGame.status !== 'playing') return;
          currentGame.cards = nextBoard.cards;
          currentGame.pairMap = nextBoard.pairMap;
          currentGame.matchedPairIds = [];
          currentGame.lastResult = {
            type: 'board-refill',
            refillAt: Date.now()
          };
          emitVocabMatchGame(roomId);
          return;
        }

        game.status = 'round-ended';
        game.roundEndsAt = Date.now();
        game.lastResult = {
          type: 'round-complete',
          finishedAt: Date.now(),
          winner: publicVocabMatchGameState(room).leaderboard[0] || null
        };
        const timers = vocabMatchTimers.get(roomId);
        if (timers?.endTimer) clearTimeout(timers.endTimer);
        emitVocabMatchGame(roomId);
        return;
      }

      emitVocabMatchGame(roomId);
      return;
    }

    if (type === 'reset') {
      clearVocabMatchTimers(roomId);
      room.vocabMatchGame = {
        ...createDefaultVocabMatchGame(),
        players: game.players || {}
      };
      emitVocabMatchGame(roomId);
    }
  });

  socket.on('idea-board-update', ({ roomId, tasks }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'idea-board-update', 20, 60_000)) return;
    room.ideaTasks = sanitizeIdeaTasks(tasks);
    rememberRoomState(room);
    socket.to(roomId).emit('idea-board-sync', room.ideaTasks);
  });

  socket.on('tiktok-sync', ({ roomId, videoId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!findRoomMember(room, socket.id)) return;
    if (rateLimitSocketEvent(socket.id, 'tiktok-sync', 12, 60_000)) return;
    // Lưu state TikTok vào room để members join sau cũng nhận được
    room.tiktokVideoId = sanitizeShortId(videoId, 80);
    rememberRoomState(room);
    socket.to(roomId).emit('tiktok-sync', { videoId: room.tiktokVideoId });
  });

  // 6. Ngắt kết nối
  socket.on('room-settings-update', ({ roomId, roomTitle, isPrivate, password, roomAvatarUrl, roomBackgroundUrl }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!sender?.isHost) return;
    if (rateLimitSocketEvent(socket.id, 'room-settings-update', 12, 60_000)) return;

    const safeRoomTitle = sanitizeBoundedString(roomTitle, MAX_ROOM_TITLE_LENGTH);
    if (safeRoomTitle) room.roomTitle = safeRoomTitle;
    if (typeof isPrivate === 'boolean') room.isPrivate = isPrivate;
    if (password !== undefined) room.password = sanitizeBoundedString(password, MAX_ROOM_PASSWORD_LENGTH);
    if (typeof roomAvatarUrl === 'string') room.roomAvatarUrl = sanitizeMediaUrl(roomAvatarUrl);
    if (typeof roomBackgroundUrl === 'string') room.roomBackgroundUrl = sanitizeMediaUrl(roomBackgroundUrl);
    rememberRoom(room, room.members.find(m => m.isHost)?.username || sender.username);
    rememberRoomState(room);

    io.to(roomId).emit('room-settings-updated', {
      roomTitle: room.roomTitle,
      isPrivate: room.isPrivate,
      roomAvatarUrl: room.roomAvatarUrl || '',
      roomBackgroundUrl: room.roomBackgroundUrl || ''
    });
    broadcastRoomDirectory();
  });

  socket.on('update-member-role', ({ roomId, targetId, role }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!sender?.isHost) return;

    const target = room.members.find(m => m.id === targetId);
    if (!target) return;

    const oldRole = target.role || 'member';
    target.role = role;
    target.isHost = (role === 'host');

    io.to(roomId).emit('room-users', room.members);
    io.to(roomId).emit('room-role-updated', { userId: targetId, role, username: target.username });

    if (role === 'cohost' && oldRole !== 'cohost') {
      io.to(roomId).emit('cohost-promoted', { userId: targetId, username: target.username });
      sendSystemMessage(roomId, `${sender.username} đã bổ nhiệm ${target.username} làm Co-host.`);
    } else if (role === 'moderator' && oldRole !== 'moderator') {
      sendSystemMessage(roomId, `${sender.username} đã bổ nhiệm ${target.username} làm Moderator.`);
    } else if (role === 'member') {
      sendSystemMessage(roomId, `${sender.username} đã chuyển ${target.username} thành Thành viên thường.`);
    }

    rememberRoomState(room);
  });

  socket.on('delete-message', ({ roomId, messageId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    
    const msgIndex = room.chatMessages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;
    const msg = room.chatMessages[msgIndex];

    const isOwnMessage = msg.senderId === socket.id;
    if (!isOwnMessage && !hasPermission(sender, 'chat.moderate')) return;

    room.chatMessages.splice(msgIndex, 1);
    rememberRoomState(room);

    io.to(roomId).emit('receive-message-deleted', { messageId });
    
    const moderatorName = sender ? sender.username : 'Hệ thống';
    io.to(roomId).emit('moderation-action', {
      action: 'delete-message',
      moderatorId: socket.id,
      moderatorName,
      targetId: msg.senderId,
      targetName: msg.sender,
      details: `Xóa tin nhắn: "${msg.text}"`
    });

    if (!isOwnMessage) {
      sendSystemMessage(roomId, `${moderatorName} đã xóa tin nhắn của ${msg.sender}.`);
    }
  });

  socket.on('pin-message', ({ roomId, messageId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!hasPermission(sender, 'chat.moderate')) return;

    const msg = room.chatMessages.find(m => m.id === messageId);
    if (!msg) return;

    room.pinnedMessage = msg;
    rememberRoomState(room);

    io.to(roomId).emit('room-pinned-message', msg);
    
    const moderatorName = sender ? sender.username : 'Hệ thống';
    io.to(roomId).emit('moderation-action', {
      action: 'pin-message',
      moderatorId: socket.id,
      moderatorName,
      targetId: msg.id,
      targetName: msg.sender,
      details: `Ghim tin nhắn: "${msg.text}"`
    });

    sendSystemMessage(roomId, `${moderatorName} đã ghim tin nhắn của ${msg.sender}.`);
  });

  socket.on('unpin-message', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!hasPermission(sender, 'chat.moderate')) return;

    room.pinnedMessage = null;
    rememberRoomState(room);

    io.to(roomId).emit('room-pinned-message', null);

    const moderatorName = sender ? sender.username : 'Hệ thống';
    io.to(roomId).emit('moderation-action', {
      action: 'unpin-message',
      moderatorId: socket.id,
      moderatorName,
      details: 'Bỏ ghim tin nhắn'
    });

    sendSystemMessage(roomId, `${moderatorName} đã bỏ ghim tin nhắn.`);
  });

  socket.on('mute-user', ({ roomId, targetId, durationMinutes }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!hasPermission(sender, 'chat.moderate')) return;

    const target = room.members.find(m => m.id === targetId);
    if (!target) return;

    const senderRole = sender.role || (sender.isHost ? 'host' : 'member');
    const targetRole = target.role || (target.isHost ? 'host' : 'member');
    
    if (targetRole === 'host') return;
    if (senderRole === 'moderator' && (targetRole === 'cohost' || targetRole === 'moderator')) return;
    if (senderRole === 'cohost' && targetRole === 'cohost') return;

    const durationMs = durationMinutes * 60 * 1000;
    target.mutedUntil = Date.now() + durationMs;
    rememberRoomState(room);

    io.to(roomId).emit('room-users', room.members);
    io.to(roomId).emit('user-muted', { targetId, mutedUntil: target.mutedUntil, targetName: target.username });

    const moderatorName = sender ? sender.username : 'Hệ thống';
    io.to(roomId).emit('moderation-action', {
      action: 'mute-user',
      moderatorId: socket.id,
      moderatorName,
      targetId,
      targetName: target.username,
      details: `Khóa chat trong ${durationMinutes} phút`
    });

    sendSystemMessage(roomId, `${moderatorName} đã khóa chat của bạn học ${target.username} trong ${durationMinutes} phút.`);
  });

  socket.on('unmute-user', ({ roomId, targetId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!hasPermission(sender, 'chat.moderate')) return;

    const target = room.members.find(m => m.id === targetId);
    if (!target) return;

    target.mutedUntil = null;
    rememberRoomState(room);

    io.to(roomId).emit('room-users', room.members);
    io.to(roomId).emit('user-unmuted', { targetId });

    const moderatorName = sender ? sender.username : 'Hệ thống';
    io.to(roomId).emit('moderation-action', {
      action: 'unmute-user',
      moderatorId: socket.id,
      moderatorName,
      targetId,
      targetName: target.username,
      details: 'Mở khóa chat'
    });

    sendSystemMessage(roomId, `${moderatorName} đã mở khóa chat cho bạn học ${target.username}.`);
  });

  socket.on('transfer-host', ({ roomId, targetId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    const target = room.members.find(m => m.id === targetId);
    if (!sender?.isHost || !target) return;

    setRoomHost(room, targetId);

    room.members.forEach(member => {
      io.to(member.id).emit('assigned-host', member.id === targetId);
    });
    clearHostTransferTimer(roomId);
    io.to(roomId).emit('room-users', room.members);
    sendSystemMessage(roomId, `${target.username} đã trở thành host của phòng.`);
    rememberRoom(room, target.username);
    rememberRoomState(room);
    broadcastRoomDirectory();
  });

  socket.on('close-room', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const sender = room.members.find(m => m.id === socket.id);
    if (!sender?.isHost) return;

    io.to(roomId).emit('room-closed', { roomId });
    room.members.forEach(member => {
      const memberSocket = io.sockets.sockets.get(member.id);
      memberSocket?.leave(roomId);
    });
    rooms.delete(roomId);
    clearVocabMatchTimers(roomId);
    clearTopikGameTimer(roomId);
    clearHostTransferTimer(roomId);
    roomDirectory.delete(roomId);
    saveRoomDirectory();
    void deleteRoomStateFromSupabase(roomId);
    if (SUPABASE_KEY) {
      fetch(`${ROOMS_ENDPOINT}?id=eq.${encodeURIComponent(roomId)}`, {
        method: 'DELETE',
        headers: supabaseHeaders(),
      }).catch(err => console.error('[Supabase] delete room error:', err.message));
    }
    broadcastRoomDirectory();
  });

  socket.on('admin-close-room', async ({ roomId, adminUserId }) => {
    if (!SUPABASE_KEY) return;
    try {
      const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/profiles?id=eq.${encodeURIComponent(adminUserId)}&select=is_admin`, {
        headers: supabaseHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const profile = Array.isArray(data) ? data[0] : null;
        if (profile && profile.is_admin) {
          const room = rooms.get(roomId);
          if (room) {
            io.to(roomId).emit('room-closed', { roomId });
            room.members.forEach(member => {
              const memberSocket = io.sockets.sockets.get(member.id);
              memberSocket?.leave(roomId);
            });
            rooms.delete(roomId);
            clearVocabMatchTimers(roomId);
            clearTopikGameTimer(roomId);
            clearHostTransferTimer(roomId);
          }
          roomDirectory.delete(roomId);
          saveRoomDirectory();
          void deleteRoomStateFromSupabase(roomId);
          broadcastRoomDirectory();
          console.log(`[Admin Delete] Room ${roomId} was deleted by admin ${adminUserId}`);
        } else {
          console.warn(`[Admin Delete] Unauthorized delete attempt by user ${adminUserId} for room ${roomId}`);
        }
      }
    } catch (err) {
      console.error('[Admin Delete] Error verifying admin permissions:', err.message);
    }
  });


  // ─── VOICE CHAT SIGNALING (WebRTC P2P) ─────────────────────────────────────

  // User bật mic → join voice channel
  socket.on('voice-join', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!room.voiceUsers) room.voiceUsers = {};
    const member = room.members.find(m => m.id === socket.id);
    if (!member) return;

    room.voiceUsers[socket.id] = { muted: false, speaking: false, cameraOn: false };

    // Gửi danh sách voice users hiện tại cho người vừa join (để biết ai đang ở đây)
    socket.emit('voice-users', { users: room.voiceUsers });

    // Thông báo cho các người còn lại → họ sẽ khởi tạo kết nối WebRTC đến user mới
    socket.to(roomId).emit('voice-user-joined', { userId: socket.id, username: member.username });
  });

  // User tắt mic / rời voice channel
  socket.on('voice-leave', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.voiceUsers) return;
    delete room.voiceUsers[socket.id];
    socket.to(roomId).emit('voice-user-left', { userId: socket.id });
  });

  // Relay WebRTC SDP Offer (initiator → target)
  socket.on('voice-subscribe', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    socket.emit('voice-users', { users: room.voiceUsers || {} });
  });

  socket.on('voice-offer', ({ targetId, offer }) => {
    io.to(targetId).emit('voice-offer', { fromId: socket.id, offer });
  });

  // Relay WebRTC SDP Answer (target → initiator)
  socket.on('voice-answer', ({ targetId, answer }) => {
    io.to(targetId).emit('voice-answer', { fromId: socket.id, answer });
  });

  // Relay ICE Candidate
  socket.on('voice-ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('voice-ice-candidate', { fromId: socket.id, candidate });
  });

  // User thay đổi trạng thái mute (tự mute/unmute)
  socket.on('voice-mute-changed', ({ roomId, muted }) => {
    const room = rooms.get(roomId);
    if (!room || !room.voiceUsers) return;
    if (room.voiceUsers[socket.id]) room.voiceUsers[socket.id].muted = muted;
    socket.to(roomId).emit('voice-mute-changed', { userId: socket.id, muted });
  });

  socket.on('voice-camera-changed', ({ roomId, cameraOn }) => {
    const room = rooms.get(roomId);
    if (!room || !room.voiceUsers) return;
    if (room.voiceUsers[socket.id]) room.voiceUsers[socket.id].cameraOn = !!cameraOn;
    socket.to(roomId).emit('voice-camera-changed', { userId: socket.id, cameraOn: !!cameraOn });
  });

  // Host mute/unmute một user khác
  socket.on('voice-host-mute', ({ roomId, targetId, muted }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const requester = room.members.find(m => m.id === socket.id);
    if (!requester?.isHost) return;
    if (room.voiceUsers && room.voiceUsers[targetId]) {
      room.voiceUsers[targetId].muted = muted;
    }
    io.to(targetId).emit('voice-host-muted', { muted });
    socket.to(roomId).emit('voice-mute-changed', { userId: targetId, muted });
  });

  // VAD: User đang nói / ngừng nói
  socket.on('voice-speaking', ({ roomId, speaking }) => {
    const room = rooms.get(roomId);
    if (!room || !room.voiceUsers) return;
    if (room.voiceUsers[socket.id]) room.voiceUsers[socket.id].speaking = speaking;
    socket.to(roomId).emit('voice-speaking', { userId: socket.id, speaking });
  });

  // ────────────────────────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    clearSocketRateBuckets(socket.id);
    onlineUsers.delete(socket.id);
    broadcastFriendsStatus();

    // Duyệt qua tất cả các phòng để xóa member ngắt kết nối
    for (const [roomId, room] of rooms.entries()) {
      const index = room.members.findIndex(m => m.id === socket.id);
      
      if (index !== -1) {
        const removedMember = room.members.splice(index, 1)[0];
        console.log(`${removedMember.username} left room: ${roomId}`);

        // Cleanup voice chat khi user rời phòng
        if (room.voiceUsers && room.voiceUsers[socket.id]) {
          delete room.voiceUsers[socket.id];
          io.to(roomId).emit('voice-user-left', { userId: socket.id });
        }
        if (room.studyTable?.seats) {
          delete room.studyTable.seats[socket.id];
          emitStudyTable(roomId);
        }

        if (room.members.length === 0) {
          // Keep state briefly so browser refresh/reconnect does not reset the room.
          rememberRoom(room, removedMember.username);
          removeVocabMatchPlayer(room, socket.id);
          scheduleEmptyRoomCleanup(roomId);
          console.log(`Room ${roomId} is empty; keeping state for quick reconnect.`);
        } else {
          // Nếu người rời đi là host, chuyển quyền host cho người kế tiếp
          removeVocabMatchPlayer(room, socket.id);
          emitVocabMatchGame(roomId);
          if (removedMember.isHost) {
            room.hostFriendCode = removedMember.friendCode || room.hostFriendCode || '';
            room.hostUsername = removedMember.username || room.hostUsername || '';
            room.hostReconnectUntil = new Date(Date.now() + HOST_RECONNECT_TTL_MS).toISOString();
            scheduleHostTransfer(roomId);
            rememberRoomState(room);
          }
          // Cập nhật lại danh sách user cho những người còn lại
          io.to(roomId).emit('room-users', room.members);
        }
        broadcastRoomDirectory();
        break;
      }
    }
  });
});

// Chạy một tiến trình ticker đếm ngược Pomodoro ở server cứ mỗi 1 giây
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    const studyTable = room.studyTable;
    if (studyTable?.seats) {
      let changed = false;
      for (const seat of Object.values(studyTable.seats)) {
        const personal = seat.personalPomodoro;
        if (personal?.isRunning && personal.timeLeft > 0) {
          personal.timeLeft -= 1;
          personal.lastUpdated = Date.now();
          changed = true;
          if (personal.timeLeft === 0) {
            personal.isRunning = false;
            personal.isBreak = !personal.isBreak;
            personal.duration = personal.isBreak ? 5 * 60 : 25 * 60;
            personal.timeLeft = personal.duration;
          }
        }
      }
      if (changed) io.to(roomId).emit('study-table-sync', studyTable);
    }

    const p = room.pomodoro;
    if (p.isRunning && p.timeLeft > 0) {
      p.timeLeft -= 1;
      
      // Khi đếm ngược hết giờ
      if (p.timeLeft === 0) {
        p.isRunning = false;
        p.isBreak = !p.isBreak;
        p.duration = p.isBreak ? 5 * 60 : 25 * 60;
        p.timeLeft = p.duration;
        io.to(roomId).emit('pomodoro-done', { isBreak: p.isBreak });
        sendSystemMessage(roomId, p.isBreak ? "⏰ Hết giờ học tập! Hãy nghỉ giải lao 5 phút." : "💪 Đã hết giờ giải lao! Tập trung học tiếp thôi.");
      }

      io.to(roomId).emit('pomodoro-sync', p);
    }
  }
}, 1000);

const DEFAULT_PORT = 3001;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const HOST = '0.0.0.0';
const DISABLE_FALLBACK_PORT = ['1', 'true', 'yes'].includes(String(process.env.DISABLE_FALLBACK_PORT || '').toLowerCase());

const listen = (server, port, label) => {
  server.listen(port, HOST, () => {
    console.log(`Socket.io Server is running on ${HOST}:${port} (${label})`);
  });
  server.on('error', (err) => {
    console.error(`Server failed on ${HOST}:${port} (${label}):`, err.message);
    if (label === 'primary') process.exit(1);
  });
};

listen(httpServer, PORT, 'primary');

if (PORT !== DEFAULT_PORT && !DISABLE_FALLBACK_PORT) {
  const fallbackServer = createServer(app);
  io.attach(fallbackServer, socketOptions);
  listen(fallbackServer, DEFAULT_PORT, 'fallback');
}
