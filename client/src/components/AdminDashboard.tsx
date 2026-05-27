import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  Timer,
  MessageSquare,
  ShieldAlert,
  Search,
  Trash2,
  Ban,
  UserCheck,
  FileText,
  Activity,
  LogOut,
  RefreshCw,
  AlertCircle,
  ChevronLeft
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AdminStats {
  totalUsers: number
  totalActiveRooms: number
  totalPosts: number
  totalBanned: number
}

interface MemberUser {
  id: string
  username: string
  avatar_url: string | null
  city: string | null
  bio: string | null
  language: string
  is_admin: boolean
  is_banned: boolean
  ban_reason?: string
  created_at: string
}

interface LiveRoom {
  id: string
  title: string
  host_name: string
  is_private: boolean
  created_at: string
  last_active_at: string
}

interface AdminPost {
  id: string
  title: string
  content: string
  category: string
  display_name: string
  likes_count: number
  comments_count: number
  views_count: number
  created_at: string
}

interface Props {
  currentUserId: string
  onClose: () => void
}

type TabType = 'stats' | 'members' | 'forum' | 'rooms'

export default function AdminDashboard({ currentUserId, onClose }: Props) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('stats')
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalActiveRooms: 0,
    totalPosts: 0,
    totalBanned: 0
  })
  const [loading, setLoading] = useState(true)

  // Tab: Members
  const [members, setMembers] = useState<MemberUser[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [banReason, setBanReason] = useState('')
  const [showBanModal, setShowBanModal] = useState(false)

  // Tab: Forum
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [forumSearch, setForumSearch] = useState('')

  // Tab: Rooms
  const [rooms, setRooms] = useState<LiveRoom[]>([])

  useEffect(() => {
    fetchStats()
    if (activeTab === 'members') fetchMembers()
    else if (activeTab === 'forum') fetchForumPosts()
    else if (activeTab === 'rooms') fetchActiveRooms()
  }, [activeTab])

  const fetchStats = async () => {
    if (!supabase) return
    setLoading(true)
    try {
      // 1. Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // 2. Get active rooms
      const { count: roomsCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })

      // 3. Get total posts
      const { count: postsCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })

      // 4. Get total banned
      const { count: bannedCount } = await supabase
        .from('banned_users')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalUsers: usersCount || 0,
        totalActiveRooms: roomsCount || 0,
        totalPosts: postsCount || 0,
        totalBanned: bannedCount || 0
      })
    } catch (err) {
      console.error('Error fetching admin statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    if (!supabase) return
    setLoading(true)
    try {
      // Fetch all profiles
      const { data: profiles, error: err } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err

      // Fetch all banned list to cross-reference
      const { data: banned } = await supabase
        .from('banned_users')
        .select('user_id, reason')

      const bannedMap = new Map(banned?.map(b => [b.user_id, b.reason]) || [])

      const formatted: MemberUser[] = (profiles || []).map(p => ({
        id: p.id,
        username: p.username || 'Bạn học',
        avatar_url: p.avatar_url || null,
        city: p.city || null,
        bio: p.bio || null,
        language: p.language || 'vi',
        is_admin: p.is_admin || false,
        is_banned: bannedMap.has(p.id),
        ban_reason: bannedMap.get(p.id) || undefined,
        created_at: p.created_at
      }))

      setMembers(formatted)
    } catch (err) {
      console.error('Error fetching members:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchForumPosts = async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (err) {
      console.error('Error fetching forum posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveRooms = async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('last_active_at', { ascending: false })

      if (error) throw error
      setRooms(data || [])
    } catch (err) {
      console.error('Error fetching active rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenBanModal = (userId: string) => {
    setActionUserId(userId)
    setBanReason('')
    setShowBanModal(true)
  }

  const handleBanMember = async () => {
    if (!supabase || !actionUserId) return
    try {
      const reasonText = banReason.trim() || 'Vi phạm tiêu chuẩn cộng đồng'
      
      const { error } = await supabase
        .from('banned_users')
        .insert([{
          user_id: actionUserId,
          reason: reasonText,
          banned_by: currentUserId
        }])

      if (error) throw error

      setMembers(prev => prev.map(m => m.id === actionUserId ? { ...m, is_banned: true, ban_reason: reasonText } : m))
      setShowBanModal(false)
      setActionUserId(null)
      fetchStats()
    } catch (err) {
      console.error('Error banning member:', err)
    }
  }

  const handleUnbanMember = async (userId: string) => {
    if (!supabase) return
    if (!confirm('Bạn có chắc chắn muốn mở khóa cho tài khoản này?')) return
    try {
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      setMembers(prev => prev.map(m => m.id === userId ? { ...m, is_banned: false, ban_reason: undefined } : m))
      fetchStats()
    } catch (err) {
      console.error('Error unbanning member:', err)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!supabase) return
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return
    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      setPosts(prev => prev.filter(p => p.id !== postId))
      fetchStats()
    } catch (err) {
      console.error('Error deleting post:', err)
    }
  }

  const handleCloseRoom = async (roomId: string) => {
    if (!supabase) return
    if (!confirm('Bạn có chắc chắn muốn đóng và xóa phòng học này khỏi hệ thống?')) return
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)

      if (error) throw error

      setRooms(prev => prev.filter(r => r.id !== roomId))
      fetchStats()
    } catch (err) {
      console.error('Error closing room:', err)
    }
  }

  // Filter lists
  const filteredMembers = members.filter(m => 
    m.username.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(forumSearch.toLowerCase()) ||
    p.display_name.toLowerCase().includes(forumSearch.toLowerCase())
  )

  return (
    <div className="flex-1 w-full max-w-[1240px] px-3 sm:px-6 py-4 flex flex-col min-h-0">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full border border-brand-terracotta-light/10 bg-white/80 hover:bg-white text-brand-brown-dark shadow-sm transition active:scale-95 cursor-pointer dark:bg-brand-panel"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h2 className="font-display text-2xl font-black text-brand-brown-dark leading-tight flex items-center gap-2">
              <ShieldAlert size={22} className="text-brand-terracotta" />
              Quản trị Hệ thống
            </h2>
            <p className="text-xs text-brand-brown-light mt-0.5">
              {t('admin.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-brand-terracotta-light/15 bg-white text-xs font-black text-brand-brown-light hover:text-brand-brown-dark transition cursor-pointer active:scale-95 dark:bg-brand-panel"
        >
          <RefreshCw size={13} />
          {t('admin.refresh')}
        </button>
      </div>

      {/* ADMIN TABS SELECTOR CONTAINER */}
      <div className="flex gap-1 p-1 bg-white/55 rounded-2xl w-fit mb-4 shrink-0 dark:bg-brand-panel/55">
        {([
          { value: 'stats', label: t('admin.tab.stats'), Icon: Activity },
          { value: 'members', label: t('admin.tab.members'), Icon: Users },
          { value: 'forum', label: t('admin.tab.forum'), Icon: MessageSquare },
          { value: 'rooms', label: t('admin.tab.rooms'), Icon: Timer }
        ] as const).map(tab => {
          const TabIcon = tab.Icon
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              title={tab.label}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === tab.value
                  ? 'bg-brand-terracotta text-white shadow-sm'
                  : 'text-brand-brown-light hover:text-brand-brown-dark'
              }`}
            >
              <TabIcon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* MAIN CONTENT WORKSPACE VIEW */}
      {loading && activeTab !== 'stats' ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="animate-spin text-brand-terracotta" size={24} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          
          {/* TAB 1: ANALYTICS OVERVIEW */}
          {activeTab === 'stats' && (
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
              
              {/* Index Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-brand-terracotta-light/15 bg-white/85 p-4 shadow-sm dark:bg-brand-panel/85">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase text-brand-brown-light">{t('admin.stat.users')}</span>
                    <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"><Users size={14} /></span>
                  </div>
                  <h4 className="font-display text-2xl font-black text-brand-brown-dark">{stats.totalUsers}</h4>
                  <p className="text-[9px] text-emerald-600 mt-1">{t('admin.stat.usersDesc')}</p>
                </div>

                <div className="rounded-2xl border border-brand-terracotta-light/15 bg-white/85 p-4 shadow-sm dark:bg-brand-panel/85">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase text-brand-brown-light">{t('admin.stat.rooms')}</span>
                    <span className="p-1.5 bg-amber-50 rounded-lg text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"><Timer size={14} /></span>
                  </div>
                  <h4 className="font-display text-2xl font-black text-brand-brown-dark">{stats.totalActiveRooms}</h4>
                  <p className="text-[9px] text-amber-600 mt-1">{t('admin.stat.roomsDesc')}</p>
                </div>

                <div className="rounded-2xl border border-brand-terracotta-light/15 bg-white/85 p-4 shadow-sm dark:bg-brand-panel/85">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase text-brand-brown-light">{t('admin.stat.posts')}</span>
                    <span className="p-1.5 bg-sky-50 rounded-lg text-sky-700 dark:bg-sky-950/20 dark:text-sky-400"><FileText size={14} /></span>
                  </div>
                  <h4 className="font-display text-2xl font-black text-brand-brown-dark">{stats.totalPosts}</h4>
                  <p className="text-[9px] text-sky-600 mt-1">{t('admin.stat.postsDesc')}</p>
                </div>

                <div className="rounded-2xl border border-brand-terracotta-light/15 bg-white/85 p-4 shadow-sm dark:bg-brand-panel/85">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase text-brand-brown-light">{t('admin.stat.banned')}</span>
                    <span className="p-1.5 bg-red-50 rounded-lg text-red-700 dark:bg-red-950/20 dark:text-red-400"><Ban size={14} /></span>
                  </div>
                  <h4 className="font-display text-2xl font-black text-brand-brown-dark">{stats.totalBanned}</h4>
                  <p className="text-[9px] text-red-500 mt-1">{t('admin.stat.bannedDesc')}</p>
                </div>
              </div>

              {/* Status Graphic & System Warning panel */}
              <div className="rounded-[28px] border border-brand-terracotta-light/20 bg-white/85 p-5 shadow-sm flex flex-col md:flex-row items-center gap-5 dark:bg-brand-panel/85">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-terracotta text-white shrink-0">
                  <Activity size={32} />
                </div>
                <div>
                  <h3 className="font-display text-base font-black text-brand-brown-dark mb-1">{t('admin.server.title')}</h3>
                  <p className="text-xs text-brand-brown-light leading-relaxed">{t('admin.server.desc')}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEMBER MANAGEMENT */}
          {activeTab === 'members' && (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Search Bar */}
              <div className="relative flex items-center rounded-2xl border border-brand-terracotta-light/15 bg-white/85 px-4 py-2.5 mb-3.5 shadow-sm dark:bg-brand-panel/85">
                <Search size={15} className="text-brand-brown-light mr-2" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder={t('admin.members.search')}
                  className="w-full bg-transparent text-xs font-medium text-brand-brown-dark outline-none placeholder:text-brand-brown-light/50"
                />
              </div>

              {/* Members Table */}
              <div className="flex-1 overflow-auto rounded-[24px] border border-brand-terracotta-light/15 bg-white/85 shadow-sm dark:bg-brand-panel/85 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-terracotta-light/15 text-[10px] font-black uppercase text-brand-brown-light">
                      <th className="px-5 py-3.5">{t('admin.members.col.name')}</th>
                      <th className="px-5 py-3.5">{t('admin.members.col.city')}</th>
                      <th className="px-5 py-3.5">{t('admin.members.col.role')}</th>
                      <th className="px-5 py-3.5">{t('admin.members.col.status')}</th>
                      <th className="px-5 py-3.5 text-right">{t('admin.members.col.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-terracotta-light/10 text-xs text-brand-brown-dark font-medium">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center font-bold text-brand-brown-light">
                          {t('admin.members.notFound')}
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map(member => (
                        <tr key={member.id} className="hover:bg-brand-cream/30 dark:hover:bg-brand-panel/40 transition">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-brand-terracotta text-white flex items-center justify-center font-display text-sm font-black shadow-inner">
                                {member.username.slice(0,2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold">{member.username}</div>
                                <div className="text-[9px] text-brand-brown-light">{new Date(member.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-brand-brown-light">
                            {member.city || t('admin.members.noCity')}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                              member.is_admin 
                                ? 'bg-brand-terracotta text-white' 
                                : 'bg-brand-cream/80 text-brand-brown-light dark:bg-brand-light'
                            }`}>
                              {member.is_admin ? 'Admin' : 'Member'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black ${
                              member.is_banned
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${member.is_banned ? 'bg-red-500' : 'bg-emerald-500'}`} />
                              {member.is_banned ? t('admin.members.banned') : t('admin.members.active')}
                            </span>
                            {member.is_banned && member.ban_reason && (
                              <div className="text-[9px] text-red-400/90 mt-0.5 truncate max-w-[150px]">{member.ban_reason}</div>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {member.id !== currentUserId && (
                              member.is_banned ? (
                                <button
                                  onClick={() => handleUnbanMember(member.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50/50 px-2 py-1 text-[10px] font-black text-emerald-700 hover:bg-emerald-50 cursor-pointer transition active:scale-95 dark:bg-emerald-950/20 dark:text-emerald-400"
                                >
                                  <UserCheck size={11} />
                                  {t('admin.members.unban')}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenBanModal(member.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50/50 px-2 py-1 text-[10px] font-black text-red-600 hover:bg-red-50 cursor-pointer transition active:scale-95 dark:bg-red-950/20 dark:text-red-400"
                                >
                                  <Ban size={11} />
                                  {t('admin.members.ban')}
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FORUM MODERATION */}
          {activeTab === 'forum' && (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Search Bar */}
              <div className="relative flex items-center rounded-2xl border border-brand-terracotta-light/15 bg-white/85 px-4 py-2.5 mb-3.5 shadow-sm dark:bg-brand-panel/85">
                <Search size={15} className="text-brand-brown-light mr-2" />
                <input
                  type="text"
                  value={forumSearch}
                  onChange={e => setForumSearch(e.target.value)}
                  placeholder={t('admin.forum.search')}
                  className="w-full bg-transparent text-xs font-medium text-brand-brown-dark outline-none placeholder:text-brand-brown-light/50"
                />
              </div>

              {/* Posts Feed Table */}
              <div className="flex-1 overflow-auto rounded-[24px] border border-brand-terracotta-light/15 bg-white/85 shadow-sm dark:bg-brand-panel/85 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-terracotta-light/15 text-[10px] font-black uppercase text-brand-brown-light">
                      <th className="px-5 py-3.5">{t('admin.forum.col.post')}</th>
                      <th className="px-5 py-3.5">{t('admin.forum.col.author')}</th>
                      <th className="px-5 py-3.5">{t('admin.forum.col.stats')}</th>
                      <th className="px-5 py-3.5">{t('admin.forum.col.date')}</th>
                      <th className="px-5 py-3.5 text-right">{t('admin.forum.col.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-terracotta-light/10 text-xs text-brand-brown-dark font-medium">
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center font-bold text-brand-brown-light">
                          {t('admin.forum.noPost')}
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map(post => (
                        <tr key={post.id} className="hover:bg-brand-cream/30 dark:hover:bg-brand-panel/40 transition">
                          <td className="px-5 py-3.5 max-w-[240px]">
                            <div className="font-bold truncate" title={post.title}>{post.title}</div>
                            <div className="text-[10px] text-brand-brown-light truncate" title={post.content}>{post.content}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold">{post.display_name}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-2.5 text-[10px] font-bold text-brand-brown-light">
                              <span>👍 {post.likes_count}</span>
                              <span>💬 {post.comments_count}</span>
                              <span>👁 {post.views_count}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-brand-brown-light">
                            {new Date(post.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1.5 rounded-lg border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 transition cursor-pointer active:scale-95 dark:bg-red-950/20 dark:text-red-400"
                              title="Xóa bài viết"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ROOM MONITOR */}
          {activeTab === 'rooms' && (
            <div className="flex-1 overflow-auto rounded-[24px] border border-brand-terracotta-light/15 bg-white/85 shadow-sm dark:bg-brand-panel/85 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-terracotta-light/15 text-[10px] font-black uppercase text-brand-brown-light">
                    <th className="px-5 py-3.5">{t('admin.rooms.col.room')}</th>
                    <th className="px-5 py-3.5">{t('admin.rooms.col.host')}</th>
                    <th className="px-5 py-3.5">{t('admin.rooms.col.type')}</th>
                    <th className="px-5 py-3.5">{t('admin.rooms.col.lastActive')}</th>
                    <th className="px-5 py-3.5 text-right">{t('admin.rooms.col.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-terracotta-light/10 text-xs text-brand-brown-dark font-medium">
                  {rooms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center font-bold text-brand-brown-light">
                      {t('admin.rooms.noRoom')}
                      </td>
                    </tr>
                  ) : (
                    rooms.map(room => (
                      <tr key={room.id} className="hover:bg-brand-cream/30 dark:hover:bg-brand-panel/40 transition">
                        <td className="px-5 py-3.5">
                          <div className="font-bold">{room.title || t('admin.rooms.freeTable')}</div>
                          <div className="text-[9px] text-brand-brown-light">ID: {room.id}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold">{room.host_name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                            room.is_private 
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' 
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          }`}>
                            {room.is_private ? t('admin.rooms.private') : t('admin.rooms.public')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-brand-brown-light">
                          {new Date(room.last_active_at).toLocaleTimeString()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleCloseRoom(room.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50/50 px-2.5 py-1.5 text-[10px] font-black text-red-600 hover:bg-red-50 cursor-pointer transition active:scale-95 dark:bg-red-950/20 dark:text-red-400"
                          >
                            <LogOut size={11} />
                            {t('admin.rooms.closeRoom')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ANONYMOUS BAN REASON MODAL OVERLAY */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-custom-fade-in">
          <div className="w-full max-w-sm rounded-[28px] border border-brand-terracotta-light/20 bg-white p-5 shadow-2xl animate-custom-scale-up dark:bg-brand-panel">
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <AlertCircle size={20} />
              <h3 className="font-display font-black text-sm text-brand-brown-dark">{t('admin.ban.title')}</h3>
            </div>
            <p className="text-xs text-brand-brown-light leading-relaxed mb-4">
              {t('admin.ban.desc')}
            </p>
            <input
              type="text"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder={t('admin.ban.placeholder')}
              className="w-full rounded-xl border border-brand-terracotta-light/20 bg-brand-cream/60 px-3.5 py-3 text-xs font-bold text-brand-brown-dark outline-none focus:ring-2 focus:ring-brand-terracotta/30 mb-4 dark:bg-brand-panel"
              maxLength={200}
            />
            <div className="flex justify-end gap-2 text-[10px] font-black">
              <button
                onClick={() => { setShowBanModal(false); setActionUserId(null); }}
                className="px-4 py-2 rounded-xl border border-brand-terracotta-light/10 bg-white text-brand-brown-light hover:text-brand-brown-dark transition cursor-pointer dark:bg-brand-panel"
              >
                {t('admin.ban.cancel')}
              </button>
              <button
                onClick={handleBanMember}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition cursor-pointer active:scale-95"
              >
                {t('admin.ban.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
