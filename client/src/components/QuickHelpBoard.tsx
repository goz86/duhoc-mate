import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle, Clock, MapPin, Phone, Plus, X, Heart, Share2, Send, MessageCircle, Trash2,
  Home, Briefcase, UtensilsCrossed, Bus, GraduationCap, Siren, Users as UsersIcon, MoreHorizontal,
  Search, Check, ShieldCheck, User, Flame, ChevronLeft
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { HelpPost } from '../lib/supabase'
import { repairHelpPostText } from '../lib/textEncoding'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = ['housing', 'job', 'food', 'transport', 'study', 'emergency', 'social', 'other'] as const
type Category = typeof CATEGORIES[number] | 'all'

const KOREAN_CITIES = ['Seoul', 'Busan', 'Daegu', 'Incheon', 'Gwangju', 'Daejeon', 'Suwon', 'Jeonju', 'Gyeonggi', 'Gyeongnam', 'Khác']

const CAT_META: Record<string, { color: string; bg: string; Icon: typeof Home }> = {
  housing:   { color: '#0369a1', bg: 'rgba(14,165,233,0.10)', Icon: Home },
  job:       { color: '#7c3aed', bg: 'rgba(124,58,237,0.10)', Icon: Briefcase },
  food:      { color: '#c2410c', bg: 'rgba(234,88,12,0.10)',  Icon: UtensilsCrossed },
  transport: { color: '#059669', bg: 'rgba(16,185,129,0.10)', Icon: Bus },
  study:     { color: '#b45309', bg: 'rgba(245,158,11,0.10)', Icon: GraduationCap },
  emergency: { color: '#dc2626', bg: 'rgba(239,68,68,0.10)',  Icon: Siren },
  social:    { color: '#db2777', bg: 'rgba(236,72,153,0.10)', Icon: UsersIcon },
  other:     { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', Icon: MoreHorizontal },
}

const AVATAR_GRADIENTS = [
  'from-rose-400 to-pink-500',
  'from-orange-400 to-red-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-teal-400 to-cyan-500',
  'from-sky-400 to-blue-500',
  'from-indigo-400 to-purple-500',
  'from-violet-400 to-fuchsia-500',
  'from-purple-400 to-pink-500',
  'from-pink-400 to-rose-500',
]

function getAvatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

interface HelpComment {
  id: string
  post_id: string
  user_id: string | null
  content: string
  is_anonymous: boolean
  display_name: string
  expires_at: string | null
  created_at: string
  parent_id?: string | null
}

const SAMPLE_POSTS: HelpPost[] = [
  {
    id: '1', user_id: 'demo', username: 'Minh Anh',
    title: 'Cần người đi cùng lên Cục XNC Suwon',
    content: 'Mình cần gia hạn visa lần đầu, không quen đường. Ai cũng cần thì đi chung cho vui nhé, mình biết đường đi sơ sơ thôi nên có bạn đồng hành cùng tìm kiếm sẽ an tâm hơn rất nhiều.',
    category: 'transport', city: 'Suwon',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    contact: 'Zalo: 0912345678',
  },
  {
    id: '2', user_id: 'demo', username: 'Goz',
    title: 'Tìm bạn mua chung gia vị Việt ở Itaewon',
    content: 'Cuối tháng mình lên Itaewon mua mắm ruốc, sả, lá chanh, hạt nêm... Ai cần gì thì nhắn mình nhé, tụi mình mua chung cho rẻ tiền vận chuyển, tiết kiệm chi phí sinh hoạt nè.',
    category: 'food', city: 'Seoul',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    contact: 'KakaoTalk: goz_kr',
  },
  {
    id: '3', user_id: 'demo', username: 'Thu Trang',
    title: 'Job làm thêm cuối tuần tại nhà hàng',
    content: 'Quán ăn Việt ở Ansan cần người phụ bàn cuối tuần. Lương 10,000원/giờ, chủ người Việt cực kỳ thân thiện và tạo điều kiện cho du học sinh. Inbox mình để biết thêm thông tin chi tiết nha.',
    category: 'job', city: 'Gyeonggi',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    contact: 'Zalo: 0987654321',
  },
]

const SAMPLE_COMMENTS: HelpComment[] = [
  {
    id: 'c1', post_id: '1', user_id: null,
    content: 'Mình cũng đi gia hạn visa ngày đó nè! Đi chung nhé bạn ơi.',
    is_anonymous: true, display_name: 'Ẩn danh (Khách) 15',
    expires_at: new Date(Date.now() + 2 * 3600 * 1000 + 45 * 60000).toISOString(),
    created_at: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    id: 'c2', post_id: '2', user_id: 'user1',
    content: 'Itaewon nhiều quán bán gia vị Việt đầy đủ lắm, mua chung share ship siêu rẻ luôn á.',
    is_anonymous: false, display_name: 'Hoàng Long',
    expires_at: null,
    created_at: new Date(Date.now() - 30 * 60000).toISOString()
  }
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
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [likedCounts, setLikedCounts] = useState<Record<string, number>>({})
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null)

  const [commentsByPost, setCommentsByPost] = useState<Record<string, HelpComment[]>>({})
  const [commentsCount, setCommentsCount] = useState<Record<string, number>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [replyTo, setReplyTo] = useState<Record<string, { id: string; name: string } | null>>({})
  const [isAnonCommentInputs, setIsAnonCommentInputs] = useState<Record<string, boolean>>({})
  const [submittingCommentPosts, setSubmittingCommentPosts] = useState<Set<string>>(new Set())

  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState<typeof CATEGORIES[number]>('other')
  const [formCity, setFormCity] = useState('Seoul')
  const [formContact, setFormContact] = useState('')

  useEffect(() => {
    fetchPosts()
    fetchAllCommentsCount()
  }, [])

  useEffect(() => {
    if (initialExpandedPostId) {
      setTimeout(() => {
        const el = document.getElementById(`post-${initialExpandedPostId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-2', 'ring-brand-terracotta/40')
        }
        toggleComments(initialExpandedPostId)
      }, 300)
    }
  }, [initialExpandedPostId])

  const fetchPosts = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('help_posts').select('*').order('created_at', { ascending: false }).limit(50)
      if (data && data.length > 0) {
        const list = (data as HelpPost[]).map(repairHelpPostText)
        setPosts(list)
        const initialLikes: Record<string, number> = {}
        list.forEach(p => { initialLikes[p.id] = (new Date(p.created_at).getTime() % 8) + 1 })
        setLikedCounts(initialLikes)
      } else {
        setLikedCounts({ '1': 4, '2': 7, '3': 11 })
      }
    } catch {
      setLikedCounts({ '1': 4, '2': 7, '3': 11 })
    }
  }

  const fetchAllCommentsCount = async () => {
    const defaultCounts: Record<string, number> = { '1': 1, '2': 1, '3': 0 }
    if (!supabase) { setCommentsCount(defaultCounts); return }
    try {
      const { data, error } = await supabase.from('help_comments').select('post_id')
      if (!error && data) {
        const counts: Record<string, number> = {}
        data.forEach(item => { counts[item.post_id] = (counts[item.post_id] || 0) + 1 })
        setCommentsCount(prev => ({ ...prev, ...defaultCounts, ...counts }))
      } else {
        setCommentsCount(defaultCounts)
      }
    } catch {
      setCommentsCount(defaultCounts)
    }
  }

  const fetchComments = async (postId: string) => {
    const list = SAMPLE_COMMENTS.filter(c => c.post_id === postId)
    if (!supabase) { setCommentsByPost(prev => ({ ...prev, [postId]: list })); return }
    try {
      const { data, error } = await supabase
        .from('help_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true })
      if (!error && data) {
        const dbComments = data as HelpComment[]
        const combined = [...list.filter(sc => !dbComments.some(dc => dc.id === sc.id)), ...dbComments]
        setCommentsByPost(prev => ({ ...prev, [postId]: combined }))
        setCommentsCount(prev => ({ ...prev, [postId]: combined.length }))
      } else {
        setCommentsByPost(prev => ({ ...prev, [postId]: list }))
      }
    } catch {
      setCommentsByPost(prev => ({ ...prev, [postId]: list }))
    }
  }

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const s = new Set(prev)
      if (s.has(postId)) s.delete(postId)
      else { s.add(postId); fetchComments(postId) }
      return s
    })
  }

  const handleSubmitComment = async (postId: string, event: React.FormEvent) => {
    event.preventDefault()
    const text = commentInputs[postId]?.trim()
    if (!text || submittingCommentPosts.has(postId)) return

    setSubmittingCommentPosts(prev => new Set([...prev, postId]))
    const isAnon = !user ? true : (isAnonCommentInputs[postId] ?? true)
    const expiresAt = isAnon ? new Date(Date.now() + 3 * 3600 * 1000).toISOString() : null
    const anonName = isAnon
      ? (user ? `Ẩn danh ${Math.floor(Math.random() * 100) + 1}` : `Ẩn danh (Khách) ${Math.floor(Math.random() * 100) + 1}`)
      : (profile?.username || 'Bạn học')

    const newCommentPayload = {
      post_id: postId,
      user_id: user?.id || null,
      content: text,
      is_anonymous: isAnon,
      display_name: anonName,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    }

    try {
      if (supabase) {
        const { data, error } = await supabase.from('help_comments').insert([newCommentPayload]).select().single()
        if (!error && data) {
          setCommentsByPost(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data as HelpComment] }))
        } else {
          const fallback = { ...newCommentPayload, id: `lc-${Date.now()}` }
          setCommentsByPost(prev => ({ ...prev, [postId]: [...(prev[postId] || []), fallback] }))
        }
      } else {
        const fallback = { ...newCommentPayload, id: `lc-${Date.now()}` }
        setCommentsByPost(prev => ({ ...prev, [postId]: [...(prev[postId] || []), fallback] }))
      }
    } catch {
      const fallback = { ...newCommentPayload, id: `lc-${Date.now()}` }
      setCommentsByPost(prev => ({ ...prev, [postId]: [...(prev[postId] || []), fallback] }))
    }

    setCommentsCount(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }))
    setCommentInputs(prev => ({ ...prev, [postId]: '' }))
    setReplyTo(prev => ({ ...prev, [postId]: null }))
    setSubmittingCommentPosts(prev => { const s = new Set(prev); s.delete(postId); return s })
  }

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return
    try {
      if (supabase && !commentId.startsWith('lc-') && !commentId.startsWith('c')) {
        const { error } = await supabase.from('help_comments').delete().eq('id', commentId)
        if (error) throw error
      }
      setCommentsByPost(prev => ({ ...prev, [postId]: (prev[postId] || []).filter(c => c.id !== commentId) }))
      setCommentsCount(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 0) - 1) }))
    } catch (err) {
      console.error('Error deleting comment:', err)
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
          setCommentsCount(prev => ({ ...prev, [added.id]: 0 }))
        } else {
          const fallbackId = Date.now().toString()
          setPosts(prev => [{ ...newPost, id: fallbackId } as HelpPost, ...prev])
          setLikedCounts(prev => ({ ...prev, [fallbackId]: 0 }))
          setCommentsCount(prev => ({ ...prev, [fallbackId]: 0 }))
        }
      } else {
        const fallbackId = Date.now().toString()
        setPosts(prev => [{ ...newPost, id: fallbackId } as HelpPost, ...prev])
        setLikedCounts(prev => ({ ...prev, [fallbackId]: 0 }))
        setCommentsCount(prev => ({ ...prev, [fallbackId]: 0 }))
      }
    } catch {
      const fallbackId = Date.now().toString()
      setPosts(prev => [{ ...newPost, id: fallbackId } as HelpPost, ...prev])
      setLikedCounts(prev => ({ ...prev, [fallbackId]: 0 }))
      setCommentsCount(prev => ({ ...prev, [fallbackId]: 0 }))
    }
    setFormTitle(''); setFormContent(''); setFormContact(''); setShowForm(false); setLoading(false)
  }

  const handleLike = (postId: string) => {
    const hasLiked = likedPosts.has(postId)
    setLikedPosts(prev => { const s = new Set(prev); if (hasLiked) s.delete(postId); else s.add(postId); return s })
    setLikedCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + (hasLiked ? -1 : 1) }))
  }

  const handleShare = (postId: string) => {
    const shareUrl = `${window.location.origin}/#board/post/${postId}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedPostId(postId)
    setTimeout(() => setCopiedPostId(null), 2500)
  }

  const filtered = useMemo(() => {
    let list = activeCategory === 'all' ? posts : posts.filter(p => p.category === activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q)
      )
    }
    return list
  }, [posts, activeCategory, searchQuery])

  const trendingPost = useMemo(() => {
    if (posts.length === 0) return null
    const sorted = [...posts].sort((a, b) =>
      ((likedCounts[b.id] || 0) + (commentsCount[b.id] || 0) * 2) -
      ((likedCounts[a.id] || 0) + (commentsCount[a.id] || 0) * 2)
    )
    return sorted[0]
  }, [posts, likedCounts, commentsCount])

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 60) return `${Math.max(1, minutes)}p`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return new Date(dateStr).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="help-board w-full overflow-hidden rounded-[28px] bg-white border border-brand-terracotta-light/15 shadow-[0_8px_28px_rgba(76,55,49,0.08)] flex flex-col dark:bg-brand-panel dark:border-brand-terracotta-light/10">

      {/* ─── HERO BANNER ─── */}
      <div className="relative bg-gradient-to-br from-brand-terracotta via-[#b16a55] to-brand-brown-dark px-5 py-3.5 sm:px-8 sm:py-4 lg:py-3 text-white shrink-0 overflow-hidden">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-6 -bottom-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl lg:text-lg font-black tracking-tight">Bảng tin nhanh</h2>
            <p className="mt-0.5 text-[10px] sm:text-xs lg:text-[10px] text-white/75 font-medium hidden sm:block">{t('help.subtitle')}</p>
          </div>
          <button
            onClick={() => setShowSearch(v => !v)}
            className={`shrink-0 grid h-10 w-10 place-items-center rounded-full backdrop-blur-md transition active:scale-95 ${
              showSearch ? 'bg-white text-brand-terracotta' : 'bg-white/15 text-white hover:bg-white/25'
            }`}
            aria-label="Tìm kiếm"
          >
            <Search size={16} />
          </button>
        </div>

        {/* Search bar inside banner */}
        {showSearch && (
          <div className="relative mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white text-brand-brown-dark">
            <Search size={14} className="text-brand-brown-light shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm bài viết, người đăng..."
              className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-brand-brown-light/60"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="grid h-5 w-5 place-items-center rounded-full hover:bg-brand-light">
                <X size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative flex flex-col gap-3 lg:gap-2.5 min-h-0 overflow-y-auto custom-scrollbar">

        {/* ─── CATEGORY TABS (sticky) ─── */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-brand-panel/95 backdrop-blur-md border-b border-brand-terracotta-light/15 px-4 sm:px-6 py-2 lg:py-1.5">
          <div className="flex gap-1.5 lg:gap-1 overflow-x-auto pb-1 forum-scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 lg:px-2.5 lg:py-1 rounded-full text-xs lg:text-[11px] font-black border transition active:scale-95 ${
                activeCategory === 'all'
                  ? 'bg-brand-brown-dark text-white border-brand-brown-dark'
                  : 'bg-white text-brand-brown-light border-brand-terracotta-light/25 hover:border-brand-terracotta/40 dark:bg-brand-panel'
              }`}
            >
              <Flame size={11} />
              {t('help.cat.all')}
            </button>
            {CATEGORIES.map(category => {
              const meta = CAT_META[category]
              const CatIcon = meta.Icon
              const active = activeCategory === category
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 lg:px-2.5 lg:py-1 rounded-full text-xs lg:text-[11px] font-black border transition active:scale-95 ${
                    active
                      ? 'bg-brand-brown-dark text-white border-brand-brown-dark'
                      : 'bg-white text-brand-brown-light border-brand-terracotta-light/25 hover:border-brand-terracotta/40 dark:bg-brand-panel'
                  }`}
                >
                  <CatIcon size={11} />
                  {t(`help.cat.${category}`)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-24 flex flex-col gap-3 lg:gap-2.5">

        {/* ─── QUICK POST ENTRY (only logged in) ─── */}
        {user && !showForm && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-brand-terracotta-light/15 shadow-[0_4px_14px_rgba(76,55,49,0.05)] hover:border-brand-terracotta-light/35 transition dark:bg-brand-panel">
            <div className={`shrink-0 grid h-10 w-10 place-items-center rounded-full text-sm font-black text-white shadow-inner bg-gradient-to-br ${getAvatarGradient(profile?.username || 'Bạn học')}`}>
              {(profile?.username || 'U').slice(0, 2).toUpperCase()}
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 text-left px-4 py-2.5 rounded-full bg-brand-light text-sm font-medium text-brand-brown-light/80 hover:bg-brand-terracotta-light/15 transition truncate"
            >
              {profile?.username ? `${profile.username} ơi, bạn cần hỗ trợ gì?` : 'Đăng tin hỗ trợ...'}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="shrink-0 grid h-10 w-10 place-items-center rounded-full bg-brand-terracotta text-white shadow-md shadow-brand-terracotta/25 hover:bg-brand-brown-dark transition active:scale-95"
              aria-label="Đăng tin"
            >
              <Plus size={18} />
            </button>
          </div>
        )}

        {/* Guest banner */}
        {!user && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
            <ShieldCheck size={14} className="text-amber-600 shrink-0" />
            <span>{t('help.noLogin')} — bạn vẫn có thể bình luận ẩn danh (tự xóa sau 3 giờ).</span>
          </div>
        )}

        {/* ─── COMPOSE FORM ─── */}
        {showForm && user && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-brand-terracotta-light/20 bg-white shadow-[0_8px_24px_rgba(76,55,49,0.08)] overflow-hidden animate-fade-slide-down dark:bg-brand-panel"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-terracotta-light/15 bg-gradient-to-r from-brand-light/50 to-transparent">
              <h4 className="font-display text-sm font-black text-brand-brown-dark">Tạo bài viết mới</h4>
              <button type="button" onClick={() => setShowForm(false)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-brand-light text-brand-brown-light transition">
                <X size={14} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3.5">
              {/* Category chips */}
              <div>
                <label className="text-[10px] font-black uppercase text-brand-brown-light block mb-1.5">Chuyên mục</label>
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORIES.map(c => {
                    const meta = CAT_META[c]
                    const CatIcon = meta.Icon
                    const active = formCategory === c
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormCategory(c)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-black border transition active:scale-95 ${
                          active
                            ? 'bg-brand-brown-dark text-white border-brand-brown-dark'
                            : 'bg-white text-brand-brown-light border-brand-terracotta-light/25 hover:border-brand-terracotta/40'
                        }`}
                      >
                        <CatIcon size={11} />
                        {t(`help.cat.${c}`)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* City */}
              <div>
                <label className="text-[10px] font-black uppercase text-brand-brown-light block mb-1.5">Khu vực</label>
                <div className="relative inline-flex items-center w-full">
                  <MapPin size={14} className="absolute left-3 text-brand-brown-light pointer-events-none" />
                  <select
                    value={formCity}
                    onChange={e => setFormCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-brand-terracotta-light/25 bg-white text-sm font-bold text-brand-brown-dark outline-none focus:ring-2 focus:ring-brand-terracotta/30 appearance-none cursor-pointer dark:bg-brand-panel"
                  >
                    {KOREAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
              </div>

              {/* Title */}
              <input
                type="text"
                placeholder="Tiêu đề ngắn gọn..."
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-brand-terracotta-light/25 bg-brand-light/50 text-sm font-bold text-brand-brown-dark placeholder:text-brand-brown-light/50 outline-none focus:ring-2 focus:ring-brand-terracotta/30 focus:bg-white transition"
                required
                maxLength={100}
              />

              {/* Content */}
              <textarea
                placeholder="Mô tả chi tiết..."
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-brand-terracotta-light/25 bg-brand-light/50 text-sm font-medium text-brand-brown-dark placeholder:text-brand-brown-light/50 outline-none focus:ring-2 focus:ring-brand-terracotta/30 focus:bg-white transition resize-none custom-scrollbar"
                required
                maxLength={2000}
              />

              {/* Contact */}
              <div className="relative flex items-center">
                <Phone size={14} className="absolute left-3 text-brand-brown-light pointer-events-none" />
                <input
                  type="text"
                  placeholder="Liên hệ (Zalo, Kakao, SĐT)..."
                  value={formContact}
                  onChange={e => setFormContact(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-brand-terracotta-light/25 bg-white text-sm font-bold text-brand-brown-dark placeholder:text-brand-brown-light/50 outline-none focus:ring-2 focus:ring-brand-terracotta/30 dark:bg-brand-panel"
                  maxLength={150}
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-full bg-brand-light text-xs font-black text-brand-brown-dark hover:bg-brand-terracotta-light/20 transition active:scale-95"
                >
                  {t('help.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading || !formTitle.trim() || !formContent.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-brand-terracotta text-xs font-black text-white shadow-md shadow-brand-terracotta/25 hover:bg-brand-brown-dark transition active:scale-95 disabled:opacity-50"
                >
                  <Send size={12} />
                  {loading ? 'Đang đăng...' : 'Đăng tin'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ─── TRENDING CARD ─── */}
        {trendingPost && activeCategory === 'all' && !searchQuery && filtered.length > 0 && (
          <button
            onClick={() => toggleComments(trendingPost.id)}
            className="text-left w-full p-3.5 rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50 via-amber-50/40 to-white hover:shadow-md transition group"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-black text-orange-600 mb-1.5">
              <Flame size={13} className="fill-orange-500 text-orange-500" />
              <span>Đang hot</span>
              <span className="ml-auto text-brand-brown-light/70 font-bold">{timeAgo(trendingPost.created_at)}</span>
            </div>
            <h3 className="font-display font-black text-sm text-brand-brown-dark group-hover:text-brand-terracotta transition leading-snug line-clamp-1">
              {trendingPost.title}
            </h3>
            <div className="mt-1.5 flex items-center gap-3 text-[11px] font-bold text-brand-brown-light/80">
              <span className="inline-flex items-center gap-1"><Heart size={11} />{likedCounts[trendingPost.id] || 0}</span>
              <span className="inline-flex items-center gap-1"><MessageCircle size={11} />{commentsCount[trendingPost.id] || 0}</span>
              <span className="ml-auto inline-flex items-center gap-1"><MapPin size={10} />{trendingPost.city}</span>
            </div>
          </button>
        )}

        {/* ─── POSTS FEED ─── */}
        <div className="flex flex-col gap-3 lg:gap-2.5">
          {filtered.length === 0 ? (
            <div className="space-y-2 py-12 text-center rounded-2xl border border-dashed border-brand-terracotta-light/30 bg-white dark:bg-brand-panel">
              <AlertCircle size={36} className="mx-auto text-brand-terracotta-light/40" />
              <p className="text-sm font-black text-brand-brown-dark">{t('help.noPosts')}</p>
              <p className="text-xs font-bold text-brand-brown-light/75">{t('help.noPostsDesc')}</p>
            </div>
          ) : (
            filtered.map(post => {
              const isCommentsOpen = expandedComments.has(post.id)
              const postComments = commentsByPost[post.id] || []
              const commentText = commentInputs[post.id] || ''
              const isAnonVal = isAnonCommentInputs[post.id] ?? true
              const isSubmitting = submittingCommentPosts.has(post.id)
              const meta = CAT_META[post.category] || CAT_META.other
              const CatIcon = meta.Icon
              const replyToData = replyTo[post.id]

              return (
                <article
                  key={post.id}
                  id={`post-${post.id}`}
                  className="rounded-2xl border border-brand-terracotta-light/15 bg-white shadow-[0_4px_14px_rgba(76,55,49,0.05)] hover:shadow-[0_10px_28px_rgba(76,55,49,0.10)] hover:border-brand-terracotta-light/30 transition overflow-hidden dark:bg-brand-panel"
                >
                  {/* Header */}
                  <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                    <div className={`shrink-0 grid h-11 w-11 place-items-center rounded-full text-sm font-black text-white shadow-inner bg-gradient-to-br ${getAvatarGradient(post.username)}`}>
                      {post.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display font-black text-sm text-brand-brown-dark leading-none">{post.username}</span>
                        <span className="text-[10px] text-brand-brown-light/60">·</span>
                        <span className="text-[11px] text-brand-brown-light font-bold inline-flex items-center gap-1">
                          <Clock size={10} /> {timeAgo(post.created_at)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-brown-light">
                          <MapPin size={10} /> {post.city}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-black"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          <CatIcon size={9} />
                          {t(`help.cat.${post.category}`)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-4 pb-3">
                    <h3 className="font-display text-base font-black text-brand-brown-dark leading-snug mb-1.5">
                      {post.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-brand-brown-dark/85 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    {post.contact && (
                      <a
                        href={`tel:${post.contact.replace(/[^0-9+]/g, '')}`}
                        onClick={(e) => { if (!/[0-9]/.test(post.contact)) e.preventDefault() }}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-light px-3.5 py-2 text-xs font-black text-brand-terracotta border border-brand-terracotta-light/25 select-all hover:bg-brand-terracotta hover:text-white transition"
                      >
                        <Phone size={13} className="animate-pulse" />
                        <span>{post.contact}</span>
                      </a>
                    )}
                  </div>

                  {/* Action bar */}
                  <div className="flex items-center border-t border-brand-terracotta-light/12 divide-x divide-brand-terracotta-light/12">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition active:bg-brand-light/50 ${
                        likedPosts.has(post.id) ? 'text-rose-500' : 'text-brand-brown-light hover:text-rose-500'
                      }`}
                    >
                      <Heart size={15} fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} />
                      <span>{likedCounts[post.id] || 0}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition active:bg-brand-light/50 ${
                        isCommentsOpen ? 'text-brand-terracotta' : 'text-brand-brown-light hover:text-brand-brown-dark'
                      }`}
                    >
                      <MessageCircle size={15} />
                      <span>{commentsCount[post.id] || 0}</span>
                    </button>
                    <button
                      onClick={() => handleShare(post.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-brand-brown-light hover:text-brand-brown-dark transition active:bg-brand-light/50"
                    >
                      {copiedPostId === post.id ? <Check size={15} className="text-emerald-500" /> : <Share2 size={15} />}
                      <span>{copiedPostId === post.id ? 'Đã copy' : 'Chia sẻ'}</span>
                    </button>
                  </div>

                  {/* Comments accordion */}
                  {isCommentsOpen && (
                    <div className="border-t border-brand-terracotta-light/15 bg-brand-light/30 p-4 animate-fade-slide-down">
                      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar mb-3">
                        {postComments.length === 0 ? (
                          <div className="py-6 text-center">
                            <MessageCircle size={26} className="text-brand-terracotta/30 mx-auto mb-1.5" />
                            <p className="text-xs font-bold text-brand-brown-light">Chưa có bình luận. Hãy là người đầu tiên!</p>
                          </div>
                        ) : (
                          postComments.map(comment => (
                            <HelpCommentItem
                              key={comment.id}
                              comment={comment}
                              onDelete={() => handleDeleteComment(comment.id, post.id)}
                              canDelete={!!user && (user.id === comment.user_id || !!profile?.is_admin)}
                              onReply={() => {
                                setReplyTo(prev => ({ ...prev, [post.id]: { id: comment.id, name: comment.display_name } }))
                                setCommentInputs(prev => ({ ...prev, [post.id]: `@${comment.display_name} ` }))
                              }}
                            />
                          ))
                        )}
                      </div>

                      {/* Comment input form */}
                      <form onSubmit={(e) => handleSubmitComment(post.id, e)} className="flex flex-col gap-2">
                        {replyToData && (
                          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white rounded-lg text-[11px] font-bold text-brand-terracotta border border-brand-terracotta-light/25">
                            <span className="truncate">Trả lời <strong>{replyToData.name}</strong></span>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyTo(prev => ({ ...prev, [post.id]: null }))
                                setCommentInputs(prev => ({ ...prev, [post.id]: '' }))
                              }}
                              className="grid h-5 w-5 place-items-center rounded-full hover:bg-brand-light"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!user}
                            onClick={() => setIsAnonCommentInputs(prev => ({ ...prev, [post.id]: !isAnonVal }))}
                            className={`forum-anon-toggle shrink-0 ${(!user || isAnonVal) ? 'is-anon' : 'is-public'}`}
                          >
                            <span className="forum-anon-switch" />
                            {(!user || isAnonVal) ? (
                              <><ShieldCheck size={12} /><span>Ẩn danh</span></>
                            ) : (
                              <><User size={12} /><span className="truncate max-w-[60px]">{profile?.username || 'Bạn'}</span></>
                            )}
                          </button>
                          <input
                            type="text"
                            value={commentText}
                            onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder={user ? 'Viết bình luận...' : 'Khách ẩn danh viết bình luận...'}
                            maxLength={800}
                            className="flex-1 h-10 px-4 rounded-full bg-white text-sm font-medium text-brand-brown-dark outline-none placeholder:text-brand-brown-light/60 focus:ring-2 focus:ring-brand-terracotta/30 border border-brand-terracotta-light/15"
                          />
                          <button
                            type="submit"
                            disabled={!commentText.trim() || isSubmitting}
                            className="shrink-0 grid h-10 w-10 place-items-center rounded-full bg-brand-terracotta text-white hover:bg-brand-brown-dark transition active:scale-95 disabled:opacity-40 shadow-md shadow-brand-terracotta/25"
                          >
                            <Send size={13} />
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>
        </div>
      </div>

      {/* FAB Đăng tin (mobile only) */}
      {user && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="forum-fab fixed bottom-5 right-5 z-40 sm:hidden inline-flex items-center gap-2 h-12 px-5 rounded-full bg-brand-terracotta text-white font-black text-sm shadow-[0_8px_24px_rgba(193,124,99,0.45)] hover:bg-brand-brown-dark transition active:scale-95"
        >
          <Plus size={18} />
          <span>Đăng tin</span>
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// HelpCommentItem with avatar + countdown bar
// ─────────────────────────────────────────────────────────────────────────
function HelpCommentItem({
  comment, onDelete, canDelete, onReply
}: {
  comment: HelpComment
  onDelete: () => void
  canDelete: boolean
  onReply: () => void
}) {
  const [remainingMs, setRemainingMs] = useState<number | null>(() => {
    if (!comment.expires_at) return null
    return new Date(comment.expires_at).getTime() - Date.now()
  })

  useEffect(() => {
    if (!comment.expires_at) return
    const tick = () => setRemainingMs(new Date(comment.expires_at!).getTime() - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [comment.expires_at])

  const showCountdown = remainingMs !== null && remainingMs > 0
  const totalMs = comment.expires_at && comment.created_at
    ? new Date(comment.expires_at).getTime() - new Date(comment.created_at).getTime()
    : 10_800_000
  const progressPct = showCountdown ? Math.max(0, Math.min(100, (remainingMs! / totalMs) * 100)) : 0

  if (comment.expires_at && remainingMs !== null && remainingMs <= 0) return null

  const fmtCountdown = (ms: number) => {
    if (ms <= 0) return '0:00:00'
    const totalSec = Math.floor(ms / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const timeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (seconds < 60) return 'vừa xong'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}p`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    return new Date(dateString).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
  }

  const initial = comment.display_name.charAt(0).toUpperCase()
  const isAnon = comment.is_anonymous

  return (
    <div className="flex gap-2.5">
      <div className={`shrink-0 grid h-8 w-8 place-items-center rounded-full font-black text-white text-xs ${
        isAnon
          ? 'bg-gradient-to-br from-slate-400 to-slate-500'
          : `bg-gradient-to-br ${getAvatarGradient(comment.display_name)}`
      }`}>
        {isAnon ? <ShieldCheck size={13} /> : initial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="rounded-2xl bg-white px-3.5 py-2 border border-brand-terracotta-light/15">
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <strong className="text-[13px] font-black text-brand-brown-dark">{comment.display_name}</strong>
            <span className="text-[10px] text-brand-brown-light/70 ml-auto">{timeAgo(comment.created_at)}</span>
            {canDelete && (
              <button onClick={onDelete} className="text-brand-brown-light/60 hover:text-red-500 transition" title="Xóa">
                <Trash2 size={11} />
              </button>
            )}
          </div>
          <p className="text-[13px] text-brand-brown-dark/90 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>

        {/* Bottom row: Reply + countdown */}
        <div className="flex items-center gap-3 mt-1.5 ml-1">
          <button
            type="button"
            onClick={onReply}
            className="text-[11px] font-bold text-brand-brown-light hover:text-brand-terracotta transition"
          >
            Trả lời
          </button>
          {showCountdown && (
            <div className="flex-1 flex items-center gap-1.5">
              <Clock size={9} className="text-amber-500 shrink-0" />
              <span className="text-[10px] font-black text-amber-700 tabular-nums shrink-0">
                {fmtCountdown(remainingMs!)}
              </span>
              <div className="flex-1 h-0.5 rounded-full bg-amber-100 overflow-hidden max-w-[100px]">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-1000 ease-linear"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
