import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Clock, MapPin, Phone, Plus, X, Heart, Share2, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { HelpPost } from '../lib/supabase'
import { repairHelpPostText } from '../lib/textEncoding'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = ['housing', 'job', 'food', 'transport', 'study', 'emergency', 'social', 'other'] as const
type Category = typeof CATEGORIES[number] | 'all'

const KOREAN_CITIES = ['Seoul', 'Busan', 'Daegu', 'Incheon', 'Gwangju', 'Daejeon', 'Suwon', 'Jeonju', 'Gyeonggi', 'Gyeongnam', 'Khác']

const CAT_COLORS: Record<string, string> = {
  housing: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  job: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30',
  food: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30',
  transport: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  study: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  emergency: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
  social: 'bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30',
  other: 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800/30',
}

const AVATAR_BGS = [
  'bg-red-400 dark:bg-red-600',
  'bg-orange-400 dark:bg-orange-600',
  'bg-amber-400 dark:bg-amber-600',
  'bg-emerald-400 dark:bg-emerald-600',
  'bg-teal-400 dark:bg-teal-600',
  'bg-blue-400 dark:bg-blue-600',
  'bg-indigo-400 dark:bg-indigo-600',
  'bg-violet-400 dark:bg-violet-600',
  'bg-purple-400 dark:bg-purple-600',
  'bg-pink-400 dark:bg-pink-600',
  'bg-rose-400 dark:bg-rose-600'
]

function getAvatarBg(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_BGS.length
  return AVATAR_BGS[index]
}

const SAMPLE_POSTS: HelpPost[] = [
  {
    id: '1',
    user_id: 'demo',
    username: 'Minh Anh',
    title: 'Cần người đi cùng lên Cục XNC Suwon',
    content: 'Mình cần gia hạn visa lần đầu, không quen đường. Ai cũng cần thì đi chung cho vui nhé, mình biết đường đi sơ sơ thôi nên có bạn đồng hành cùng tìm kiếm sẽ an tâm hơn rất nhiều.',
    category: 'transport',
    city: 'Suwon',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    contact: 'Zalo: 0912345678',
  },
  {
    id: '2',
    user_id: 'demo',
    username: 'Goz',
    title: 'Tìm bạn mua chung gia vị Việt ở Itaewon',
    content: 'Cuối tháng mình lên Itaewon mua mắm ruốc, sả, lá chanh, hạt nêm... Ai cần gì thì nhắn mình nhé, tụi mình mua chung cho rẻ tiền vận chuyển, tiết kiệm chi phí sinh hoạt nè.',
    category: 'food',
    city: 'Seoul',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    contact: 'KakaoTalk: goz_kr',
  },
  {
    id: '3',
    user_id: 'demo',
    username: 'Thu Trang',
    title: 'Job làm thêm cuối tuần tại nhà hàng',
    content: 'Quán ăn Việt ở Ansan cần người phụ bàn cuối tuần. Lương 10,000원/giờ, chủ người Việt cực kỳ thân thiện và tạo điều kiện cho du học sinh. Inbox mình để biết thêm thông tin chi tiết nha.',
    category: 'job',
    city: 'Gyeonggi',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    contact: 'Zalo: 0987654321',
  },
]

type QuickHelpBoardProps = {
  initialExpandedPostId?: string | null
}

export default function QuickHelpBoard({ initialExpandedPostId }: QuickHelpBoardProps = {}) {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState<HelpPost[]>(SAMPLE_POSTS)
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Social interactions state
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [likedCounts, setLikedCounts] = useState<Record<string, number>>({})
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null)

  // Form states
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState<typeof CATEGORIES[number]>('other')
  const [formCity, setFormCity] = useState('Seoul')
  const [formContact, setFormContact] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    if (initialExpandedPostId) {
      setTimeout(() => {
        const el = document.getElementById(`post-${initialExpandedPostId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-2', 'ring-brand-terracotta/40')
        }
      }, 300)
    }
  }, [initialExpandedPostId])

  const fetchPosts = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('help_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data && data.length > 0) {
        const list = (data as HelpPost[]).map(repairHelpPostText)
        setPosts(list)
        
        // Initialize random likes for visual richness
        const initialLikes: Record<string, number> = {}
        list.forEach(p => {
          // Semi-random deterministic likes based on created date timestamp
          const timestamp = new Date(p.created_at).getTime()
          initialLikes[p.id] = (timestamp % 12) + 1
        })
        setLikedCounts(initialLikes)
      } else {
        // Fallback demo posts likes
        setLikedCounts({ '1': 5, '2': 8, '3': 12 })
      }
    } catch {
      setLikedCounts({ '1': 5, '2': 8, '3': 12 })
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !profile) return
    setLoading(true)

    const newPost: Omit<HelpPost, 'id'> = {
      user_id: user.id,
      username: profile.username || 'Bạn học',
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      city: formCity,
      contact: formContact.trim(),
      created_at: new Date().toISOString(),
    }

    try {
      if (supabase) {
        const { data, error } = await supabase.from('help_posts').insert(newPost).select().single()
        if (!error && data) {
          const added = repairHelpPostText(data as HelpPost)
          setPosts(prev => [added, ...prev])
          setLikedCounts(prev => ({ ...prev, [added.id]: 0 }))
        } else {
          const fallbackId = Date.now().toString()
          setPosts(prev => [{ ...newPost, id: fallbackId } as HelpPost, ...prev])
          setLikedCounts(prev => ({ ...prev, [fallbackId]: 0 }))
        }
      } else {
        const fallbackId = Date.now().toString()
        setPosts(prev => [{ ...newPost, id: fallbackId } as HelpPost, ...prev])
        setLikedCounts(prev => ({ ...prev, [fallbackId]: 0 }))
      }
    } catch {
      const fallbackId = Date.now().toString()
      setPosts(prev => [{ ...newPost, id: fallbackId } as HelpPost, ...prev])
      setLikedCounts(prev => ({ ...prev, [fallbackId]: 0 }))
    }

    setFormTitle('')
    setFormContent('')
    setFormContact('')
    setShowForm(false)
    setLoading(false)
  }

  const handleLike = (postId: string) => {
    const hasLiked = likedPosts.has(postId)
    setLikedPosts(prev => {
      const s = new Set(prev)
      if (hasLiked) s.delete(postId)
      else s.add(postId)
      return s
    })

    setLikedCounts(prev => ({
      ...prev,
      [postId]: (prev[postId] || 0) + (hasLiked ? -1 : 1)
    }))
  }

  const handleShare = (postId: string) => {
    const shareUrl = `${window.location.origin}/#board/post/${postId}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedPostId(postId)
    setTimeout(() => setCopiedPostId(null), 2500)
  }

  const filtered = activeCategory === 'all' ? posts : posts.filter(post => post.category === activeCategory)

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${Math.max(1, minutes)} phút ${t('help.ago')}`
    if (hours < 24) return `${hours} giờ ${t('help.ago')}`
    if (days < 7) return `${days} ngày ${t('help.ago')}`
    return new Date(dateStr).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="w-full overflow-hidden rounded-[32px] bg-[#fbf6ef] dark:bg-brand-cream border border-brand-terracotta-light/10 shadow-sm flex flex-col">
      
      {/* Visual Social Header Banner */}
      <div className="bg-gradient-to-r from-brand-terracotta to-brand-brown-dark px-5 py-5 sm:px-8 sm:py-6 text-white shrink-0">
        <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight">{t('help.title')}</h2>
        <p className="mt-1 text-xs sm:text-sm text-white/70 font-semibold">{t('help.subtitle')}</p>
      </div>

      <div className="p-4 sm:p-6 flex flex-col gap-4 min-h-0 overflow-y-auto">
        
        {/* CATEGORY & CREATION CONTROLS */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between shrink-0">
          
          {/* Horizontal category chips scrolling panel */}
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 md:pb-0 custom-scrollbar max-w-full">
            <button
              onClick={() => setActiveCategory('all')}
              className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-black transition whitespace-nowrap active:scale-95 ${
                activeCategory === 'all' 
                  ? 'border-brand-terracotta bg-brand-terracotta text-white shadow-sm' 
                  : 'border-brand-terracotta-light/15 bg-white text-brand-brown-light hover:bg-brand-light dark:bg-brand-panel'
              }`}
            >
              {t('help.cat.all')}
            </button>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-black transition whitespace-nowrap active:scale-95 ${
                  activeCategory === category 
                    ? 'border-brand-terracotta bg-brand-terracotta text-white shadow-sm' 
                    : 'border-brand-terracotta-light/15 bg-white text-brand-brown-light hover:bg-brand-light dark:bg-brand-panel'
                }`}
              >
                {t(`help.cat.${category}`)}
              </button>
            ))}
          </div>

          {!user && (
            <div className="text-right text-xs italic font-bold text-brand-brown-light pr-2">
              {t('help.noLogin')}
            </div>
          )}
        </div>

        {/* FACEBOOK STYLE QUICK POST BOX CONTAINER */}
        {user && !showForm && (
          <div className="rounded-[22px] border border-brand-terracotta-light/15 bg-white p-4 shadow-xs shrink-0 flex items-center gap-3 transition hover:border-brand-terracotta-light/35 dark:bg-brand-panel">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-black text-white shadow-inner shrink-0 ${getAvatarBg(profile?.username || 'Bạn học')}`}>
              {(profile?.username || 'U').slice(0, 2).toUpperCase()}
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 text-left px-5 py-3 rounded-full bg-[#fbf6ef] dark:bg-brand-cream text-xs sm:text-sm font-bold text-brand-brown-light/75 hover:bg-brand-light transition cursor-pointer outline-none select-none"
            >
              {profile?.username ? `${profile.username} ơi, bạn cần hỗ trợ hay chia sẻ thông tin gì?` : 'Đăng tin hỗ trợ cuộc sống học tập tại Hàn Quốc...'}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-brand-terracotta text-white shadow-sm hover:bg-brand-brown-dark transition active:scale-95 cursor-pointer"
              title="Đăng bài mới"
            >
              <Plus size={18} />
            </button>
          </div>
        )}

        {/* MODAL/FORM FOR CREATING NEW SOCIAL POST */}
        {showForm && user && (
          <form 
            onSubmit={handleSubmit} 
            className="rounded-[24px] border border-brand-terracotta-light/20 bg-white p-4 sm:p-5 shadow-md shrink-0 flex flex-col gap-4 animate-fade-slide-down dark:bg-brand-panel"
          >
            <div className="flex items-center justify-between border-b border-brand-terracotta-light/10 pb-2.5">
              <h4 className="font-display text-sm sm:text-base font-black text-brand-brown-dark">Tạo bài viết mới</h4>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="cursor-pointer rounded-full p-1.5 hover:bg-brand-light text-brand-brown-light transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-brand-brown-light">Chuyên mục hỗ trợ</label>
                <select
                  value={formCategory}
                  onChange={event => setFormCategory(event.target.value as typeof CATEGORIES[number])}
                  className="w-full rounded-xl border border-brand-terracotta-light/25 bg-white px-3.5 py-2.5 text-xs font-bold text-brand-brown-dark focus:outline-none focus:ring-2 focus:ring-brand-terracotta/20 dark:bg-brand-panel"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{t(`help.cat.${category}`)}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-brand-brown-light">Khu vực / Thành phố</label>
                <select
                  value={formCity}
                  onChange={event => setFormCity(event.target.value)}
                  className="w-full rounded-xl border border-brand-terracotta-light/25 bg-white px-3.5 py-2.5 text-xs font-bold text-brand-brown-dark focus:outline-none focus:ring-2 focus:ring-brand-terracotta/20 dark:bg-brand-panel"
                >
                  {KOREAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-brand-brown-light">Tiêu đề tin đăng</label>
              <input
                type="text"
                placeholder="Nhập tiêu đề tóm tắt ngắn gọn yêu cầu (ví dụ: Tìm nhà trọ gần Đại học Hanyang)..."
                value={formTitle}
                onChange={event => setFormTitle(event.target.value)}
                className="w-full rounded-xl border border-brand-terracotta-light/25 bg-[#fbf6ef] dark:bg-brand-cream px-3.5 py-3 text-xs font-bold text-brand-brown-dark placeholder:text-brand-brown-light/45 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/20"
                required
                maxLength={100}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-brand-brown-light">Nội dung chi tiết</label>
              <textarea
                placeholder="Mô tả cụ thể thông tin, yêu cầu hỗ trợ hoặc cơ hội để mọi người trong cộng đồng có thể giúp đỡ tốt nhất..."
                value={formContent}
                onChange={event => setFormContent(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-brand-terracotta-light/25 bg-[#fbf6ef] dark:bg-brand-cream px-3.5 py-3 text-xs font-medium text-brand-brown-dark placeholder:text-brand-brown-light/45 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/20 custom-scrollbar"
                required
                maxLength={2000}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-brand-brown-light">Thông tin liên hệ</label>
              <input
                type="text"
                placeholder="Số điện thoại, KakaoTalk ID, Zalo link hoặc ghi chú 'DM trong app'..."
                value={formContact}
                onChange={event => setFormContact(event.target.value)}
                className="w-full rounded-xl border border-brand-terracotta-light/25 bg-[#fbf6ef] dark:bg-brand-cream px-3.5 py-3 text-xs font-bold text-brand-brown-dark placeholder:text-brand-brown-light/45 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/20"
                maxLength={150}
              />
            </div>

            <div className="flex gap-2 justify-end text-xs font-black">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="cursor-pointer rounded-xl bg-brand-light px-4 py-2.5 text-brand-brown-dark transition hover:bg-brand-terracotta-light/20"
              >
                {t('help.cancel')}
              </button>
              <button 
                type="submit" 
                disabled={loading || !formTitle.trim() || !formContent.trim()} 
                className="cursor-pointer rounded-xl bg-brand-terracotta px-5 py-2.5 text-white transition hover:bg-brand-brown-dark disabled:opacity-60 flex items-center gap-1.5"
              >
                <Send size={13} />
                {loading ? 'Đang đăng...' : 'Đăng tin ngay'}
              </button>
            </div>
          </form>
        )}

        {/* SOCIAL POSTS DYNAMIC FEED LIST */}
        <div className="flex flex-col gap-4">
          {filtered.length === 0 ? (
            <div className="space-y-2 py-12 text-center text-brand-brown-light rounded-3xl border border-dashed border-brand-terracotta-light/20 bg-white dark:bg-brand-panel">
              <AlertCircle size={36} className="mx-auto text-brand-terracotta-light/30" />
              <p className="text-sm font-black">{t('help.noPosts')}</p>
              <p className="text-xs font-bold text-brand-brown-light/75">{t('help.noPostsDesc')}</p>
            </div>
          ) : (
            filtered.map(post => (
              <article 
                key={post.id} 
                id={`post-${post.id}`} 
                className="group rounded-[24px] border border-brand-terracotta-light/10 bg-white p-4.5 shadow-sm transition hover:shadow-md flex flex-col gap-3.5 dark:bg-brand-panel"
              >
                {/* Header Row: Avatar, UserName, Category chips, City & Time metadata */}
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    {/* Circle user initials avatar */}
                    <div className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-black text-white shadow-inner shrink-0 ${getAvatarBg(post.username)}`}>
                      {post.username.substring(0, 2).toUpperCase()}
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display font-black text-xs sm:text-sm text-brand-brown-dark leading-none">{post.username}</span>
                        <span className="text-[10px] text-brand-brown-light/60 font-black">·</span>
                        <span className="text-[10px] text-brand-brown-light font-black inline-flex items-center gap-0.5"><Clock size={10} /> {timeAgo(post.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-brand-brown-light">
                        <span className="inline-flex items-center gap-0.5"><MapPin size={9} /> {post.city}</span>
                        <span className="text-brand-brown-light/35">|</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[8.5px] font-black uppercase ${CAT_COLORS[post.category] || CAT_COLORS.other}`}>
                          {t(`help.cat.${post.category}`)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Row: Detailed text title, Description, Phone/Zalo contact badge */}
                <div className="flex flex-col gap-1.5 min-w-0">
                  <h3 className="font-display text-sm sm:text-base font-black text-brand-brown-dark group-hover:text-brand-terracotta transition leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-brand-brown-dark/90 whitespace-pre-wrap">
                    {post.content}
                  </p>
                  {post.contact && (
                    <div className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-xl bg-brand-light/75 px-3.5 py-2 text-[10.5px] sm:text-xs font-black text-brand-terracotta border border-brand-terracotta-light/10 select-all">
                      <Phone size={12} className="animate-pulse" />
                      <span>{t('help.contact')}: {post.contact}</span>
                    </div>
                  )}
                </div>

                {/* Footer Row: Facebook Style Interactive Actions */}
                <div className="flex items-center gap-2 border-t border-brand-terracotta-light/10 pt-2.5 mt-1 text-[11px] font-black text-brand-brown-light shrink-0 select-none">
                  
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition hover:bg-red-50/50 cursor-pointer ${
                      likedPosts.has(post.id) ? 'text-red-500 bg-red-50/10' : 'hover:text-red-500'
                    }`}
                  >
                    <Heart size={14} fill={likedPosts.has(post.id) ? '#ef4444' : 'none'} className="transition-transform duration-200 active:scale-125" />
                    <span>{likedCounts[post.id] || 0} {t('forum.likes_count', 'Thích')}</span>
                  </button>

                  {/* Share/Copy link button */}
                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition hover:bg-brand-light/50 hover:text-brand-brown-dark cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span>{copiedPostId === post.id ? 'Đã sao chép liên kết!' : 'Chia sẻ'}</span>
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
