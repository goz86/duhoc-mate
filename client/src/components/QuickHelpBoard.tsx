import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import type { HelpPost } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, X, MapPin, Clock, Phone, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORIES = ['housing', 'job', 'food', 'transport', 'study', 'emergency', 'social', 'other'] as const
type Category = typeof CATEGORIES[number] | 'all'

const KOREAN_CITIES = ['Seoul', 'Busan', 'Daegu', 'Incheon', 'Gwangju', 'Daejeon', 'Suwon', 'Jeonju', 'Gyeonggi', 'Gyeongnam', 'Khác']

// Màu sắc cho từng danh mục
const CAT_COLORS: Record<string, string> = {
  housing: 'bg-blue-50 text-blue-700 border-blue-200',
  job: 'bg-violet-50 text-violet-700 border-violet-200',
  food: 'bg-orange-50 text-orange-700 border-orange-200',
  transport: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  study: 'bg-amber-50 text-amber-700 border-amber-200',
  emergency: 'bg-red-50 text-red-700 border-red-200',
  social: 'bg-pink-50 text-pink-700 border-pink-200',
  other: 'bg-gray-50 text-gray-600 border-gray-200',
}

// Dữ liệu mẫu khi Supabase chưa setup
const SAMPLE_POSTS: HelpPost[] = [
  { id: '1', user_id: 'demo', username: 'Minh Anh', title: 'Cần người đi cùng lên Cục XNC Suwon', content: 'Mình cần gia hạn visa lần đầu, không quen đường. Ai cũng cần thì đi chung cho vui nhé, mình biết đường 방향 sơ sơ thôi', category: 'transport', city: 'Suwon', created_at: new Date(Date.now() - 3600000).toISOString(), contact: 'Zalo: 0912345678' },
  { id: '2', user_id: 'demo', username: 'Goz', title: 'Tìm bạn mua chung gia vị Việt ở Itaewon', content: 'Cuối tháng mình lên Itaewon mua mắm ruốc, sả, lá chanh... Ai cần gì thì nhắn mình, mình mua chung cho rẻ shipping', category: 'food', city: 'Seoul', created_at: new Date(Date.now() - 7200000).toISOString(), contact: 'KakaoTalk: goz_kr' },
  { id: '3', user_id: 'demo', username: 'Thu Trang', title: 'Job làm thêm cuối tuần tại nhà hàng', content: 'Quán ăn Việt ở Ansan cần người phụ bàn cuối tuần. Lương 10,000원/h, chủ người Việt, thân thiện. DM mình để biết thêm', category: 'job', city: 'Gyeonggi', created_at: new Date(Date.now() - 86400000).toISOString(), contact: 'Zalo: 0987654321' },
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
  const [expandedPost, setExpandedPost] = useState<string | null>(null)

  // Form state
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
      setExpandedPost(initialExpandedPostId)
      setTimeout(() => {
        const el = document.getElementById(`post-${initialExpandedPostId}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
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
      if (data && data.length > 0) setPosts(data as HelpPost[])
    } catch { /* Use sample data */ }
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return
    setLoading(true)

    const newPost: Omit<HelpPost, 'id'> = {
      user_id: user.id,
      username: profile.username,
      title: formTitle,
      content: formContent,
      category: formCategory,
      city: formCity,
      contact: formContact,
      created_at: new Date().toISOString()
    }

    try {
      if (supabase) {
        const { data, error } = await supabase.from('help_posts').insert(newPost).select().single()
        if (!error && data) {
          setPosts(prev => [data as HelpPost, ...prev])
        } else {
          setPosts(prev => [{ ...newPost, id: Date.now().toString() } as HelpPost, ...prev])
        }
      } else {
        // Optimistic UI khi chưa có Supabase
        setPosts(prev => [{ ...newPost, id: Date.now().toString() } as HelpPost, ...prev])
      }
    } catch {
      setPosts(prev => [{ ...newPost, id: Date.now().toString() } as HelpPost, ...prev])
    }

    setFormTitle(''); setFormContent(''); setFormContact(''); setShowForm(false)
    setLoading(false)
  }

  const filtered = activeCategory === 'all' ? posts : posts.filter(p => p.category === activeCategory)

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `${days} ngày ${t('help.ago')}`
    if (hours > 0) return `${hours} giờ ${t('help.ago')}`
    return 'Vừa xong'
  }

  return (
    <div className="w-full bg-brand-cream rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-terracotta to-brand-brown-dark px-8 py-6 text-white">
        <h2 className="font-display font-black text-2xl">{t('help.title')}</h2>
        <p className="text-white/70 text-sm mt-1">{t('help.subtitle')}</p>
      </div>

      <div className="p-6">
        {/* Category filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${activeCategory === 'all' ? 'bg-brand-terracotta text-white border-brand-terracotta' : 'bg-white border-brand-terracotta-light/20 text-brand-brown-light hover:bg-brand-light'}`}
            >
              {t('help.cat.all')}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${activeCategory === cat ? 'bg-brand-terracotta text-white border-brand-terracotta' : 'bg-white border-brand-terracotta-light/20 text-brand-brown-light hover:bg-brand-light'}`}
              >
                {t(`help.cat.${cat}`)}
              </button>
            ))}
          </div>

          {/* New post button */}
          {user ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-terracotta hover:bg-brand-brown-dark text-white text-sm font-bold transition cursor-pointer shadow-sm ml-2 shrink-0"
            >
              <Plus size={16} /> {t('help.newPost')}
            </button>
          ) : (
            <div className="text-xs text-brand-brown-light ml-2 shrink-0 italic">{t('help.noLogin')}</div>
          )}
        </div>

        {/* New post form */}
        {showForm && user && (
          <form onSubmit={handleSubmit} className="mb-5 p-5 rounded-2xl bg-white border border-brand-terracotta-light/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-display font-extrabold text-base text-brand-brown-dark">Đăng tin hỗ trợ</h4>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-brand-light cursor-pointer"><X size={16} className="text-brand-brown-light" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-brown-light uppercase mb-1">Danh mục</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-terracotta-light/30 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{t(`help.cat.${c}`)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-brown-light uppercase mb-1">Thành phố</label>
                <select
                  value={formCity}
                  onChange={e => setFormCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-terracotta-light/30 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30"
                >
                  {KOREAN_CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <input
              type="text"
              placeholder={t('help.titleField')}
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-terracotta-light/30 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30"
              required
            />
            <textarea
              placeholder={t('help.contentField')}
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-terracotta-light/30 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30 resize-none"
              required
            />
            <input
              type="text"
              placeholder={t('help.contactField')}
              value={formContact}
              onChange={e => setFormContact(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-terracotta-light/30 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-brand-terracotta hover:bg-brand-brown-dark text-white font-bold text-sm transition cursor-pointer disabled:opacity-60">
                {loading ? 'Đang đăng...' : t('help.submit')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl bg-brand-light hover:bg-brand-terracotta-light/30 text-brand-brown-dark font-bold text-sm transition cursor-pointer">
                {t('help.cancel')}
              </button>
            </div>
          </form>
        )}

        {/* Posts list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-brand-brown-light">
              <AlertCircle size={32} className="mx-auto text-brand-terracotta-light/40" />
              <p className="text-sm font-semibold">{t('help.noPosts')}</p>
              <p className="text-xs">{t('help.noPostsDesc')}</p>
            </div>
          ) : (
            filtered.map(post => (
              <div key={post.id} id={`post-${post.id}`} className="p-4 rounded-2xl bg-white border border-brand-terracotta-light/10 shadow-sm hover:shadow-md transition group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${CAT_COLORS[post.category] || CAT_COLORS.other}`}>
                        {t(`help.cat.${post.category}`)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-brand-brown-light">
                        <MapPin size={11} /> {post.city}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-brand-brown-light">
                        <Clock size={11} /> {timeAgo(post.created_at)}
                      </div>
                    </div>
                    <h4 className="font-display font-extrabold text-sm text-brand-brown-dark group-hover:text-brand-terracotta transition">
                      {post.title}
                    </h4>
                    <p className="text-xs text-brand-brown-light mt-0.5 font-medium">bởi {post.username}</p>
                  </div>
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="p-1.5 rounded-lg hover:bg-brand-light transition cursor-pointer shrink-0"
                  >
                    {expandedPost === post.id ? <ChevronUp size={16} className="text-brand-brown-light" /> : <ChevronDown size={16} className="text-brand-brown-light" />}
                  </button>
                </div>

                {expandedPost === post.id && (
                  <div className="mt-3 pt-3 border-t border-brand-terracotta-light/10 space-y-2">
                    <p className="text-sm text-brand-brown-dark leading-relaxed">{post.content}</p>
                    {post.contact && (
                      <div className="flex items-center gap-2 text-xs text-brand-terracotta font-semibold bg-brand-light/50 px-3 py-2 rounded-xl">
                        <Phone size={12} /> {t('help.contact')}: {post.contact}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
