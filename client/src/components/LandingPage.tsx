import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudSun,
  Globe2,
  LockKeyhole,
  LogIn,
  LogOut,
  LayoutDashboard,
  Megaphone,
  Music2,
  Plus,
  Settings,
  Search,
  Timer,
  TrendingUp,
  Upload,
  UsersRound,
  Wallet,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import studyLounge3d from '../assets/study-lounge-3d-new.png'
import createRoomScene from '../assets/create-room-scene.png'
import createRoomSceneSecondary from '../assets/create-room-scene-secondary.png'
import duhocMateLogo from '../assets/duhoc-mate-logo-new.png'
import LanguageSwitcher from './LanguageSwitcher'
import CommunityForum from './CommunityForum'
import PersonalDashboard from './PersonalDashboard'
import TemplateMarketplace from './TemplateMarketplace'
import type { RoomTemplate } from '../lib/communityTemplates'
import { supabase } from '../lib/supabase'
import { downscaleImageToDataUrl } from '../lib/image'
import { useAuth } from '../contexts/AuthContext'


type ActiveRoom = {
  id: string
  hostName: string
  memberCount: number
  currentSong?: string
  roomTitle?: string
  isPrivate?: boolean
  hostAvatarUrl?: string
  roomAvatarUrl?: string
  createdAt?: string
  lastActiveAt?: string
}
type RecentRoom = {
  id: string
  hostName: string
  currentSong?: string
  roomTitle?: string
  isPrivate?: boolean
  hostAvatarUrl?: string
  roomAvatarUrl?: string
}
type FriendStatus = { code: string; username: string; online: boolean; currentRoomId: string | null; currentSong: string | null }

type LandingPageProps = {
  username: string
  setUsername: (value: string) => void
  roomId: string
  setRoomId: (value: string) => void
  onlineUsersCount: number
  user: any
  profile: { id?: string; username?: string; city?: string; avatar_url?: string; is_admin?: boolean } | null
  signOut: () => void
  getAvatarColor: (name: string) => string
  handleCreateRoom: (
    seedTasks?: any[],
    roomTitle?: string,
    isPrivate?: boolean,
    password?: string,
    avatarUrl?: string
  ) => void | Promise<void>
  handleJoinRoom: (e?: React.FormEvent | string, enteredPassword?: string, isGuestConfirmed?: boolean, guestUsername?: string, isPrivateParam?: boolean) => void | Promise<void>
  handleJoinTemplateRoom: (template: RoomTemplate) => void
  templates: RoomTemplate[]
  activeRooms: ActiveRoom[]
  requestActiveRooms: () => void
  recentRooms: RecentRoom[]
  friendCode: string
  friendCodeCopied: boolean
  copyFriendCode: () => void
  friendInputCode: string
  setFriendInputCode: (value: string) => void
  handleAddFriend: (event: React.FormEvent) => void
  friendsWithStatus: FriendStatus[]
  showHelpBoard: boolean
  setShowHelpBoard: (show: boolean) => void
  isDarkMode: boolean
  toggleDarkMode: () => void
  onEnterAdmin: () => void
}

export default function LandingPage({
  username,
  setUsername,
  roomId,
  setRoomId,
  onlineUsersCount,
  user,
  profile,
  signOut,
  getAvatarColor,
  handleCreateRoom,
  handleJoinRoom,
  handleJoinTemplateRoom,
  templates,
  activeRooms,
  requestActiveRooms,
  recentRooms,
  friendCode,
  friendCodeCopied,
  copyFriendCode,
  friendInputCode,
  setFriendInputCode,
  handleAddFriend,
  friendsWithStatus,
  showHelpBoard,
  setShowHelpBoard,
  isDarkMode,
  toggleDarkMode,
  onEnterAdmin,
}: LandingPageProps) {
  const { t } = useTranslation()
  const [homeView, setHomeView] = useState<'rooms' | 'board' | 'dashboard'>(showHelpBoard ? 'board' : 'rooms')

  const [exchangeRate, setExchangeRate] = useState<string>('Đang tải...')
  const [weather, setWeather] = useState<{ temp: string; desc: string } | null>(null)

  type TickerPost = { id: string; display_name: string; title: string; is_anonymous: boolean }
  const [tickerPosts, setTickerPosts] = useState<TickerPost[]>([])
  const [tickerIndex, setTickerIndex] = useState(0)
  const [tickerPhase, setTickerPhase] = useState<'in' | 'show' | 'out'>('in')
  const tickerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { signInWithGoogle, updateProfile, user: authUser } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null)
  const [profileAvatarPreview, setProfileAvatarPreview] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [modalNickname, setModalNickname] = useState('')
  const [modalRoomTitle, setModalRoomTitle] = useState('')
  const [modalIsPrivate, setModalIsPrivate] = useState(true)
  const [modalPassword, setModalPassword] = useState('')

  const [showExploreFull, setShowExploreFull] = useState(false)
  const [exploreQuery, setExploreQuery] = useState('')
  const [exploreSort, setExploreSort] = useState<'members' | 'newest'>('members')
  const [explorePage, setExplorePage] = useState(1)
  const roomsPerPage = 9

  useEffect(() => {
    if (showHelpBoard) setHomeView('board')
  }, [showHelpBoard])

  useEffect(() => {
    if (window.location.hash === '#create-room') {
      setHomeView('rooms')
      setShowCreateModal(true)
    }
  }, [])

  const displayName = profile?.username || username || 'Bạn học'
  const savedAvatar = profile?.avatar_url || ''
  const profileModalAvatar = profileAvatarPreview || savedAvatar
  const isSignedIn = !!user

  useEffect(() => {
    if (showCreateModal) {
      const nextName = profile?.username || username || ''
      setModalNickname(nextName)
      setModalRoomTitle(nextName ? `Phòng của ${nextName}` : '')
    }
  }, [showCreateModal, username, profile])

  useEffect(() => {
    if (showProfileModal) {
      setProfileName(displayName)
      setProfileAvatarFile(null)
      setProfileAvatarPreview(profile?.avatar_url || '')
      setProfileError('')
    }
  }, [showProfileModal, displayName, profile])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredExploreRooms = useMemo(() => {
    const q = exploreQuery.trim().toLowerCase()
    let result = activeRooms.filter(room => {
      const haystack = [room.id, room.hostName, room.roomTitle || '', room.currentSong || ''].join(' ').toLowerCase()
      return !q || haystack.includes(q)
    })

    if (exploreSort === 'members') {
      result = [...result].sort((a, b) => (Number(b.memberCount) || 0) - (Number(a.memberCount) || 0))
    } else {
      const getTime = (r: ActiveRoom) => new Date(r.createdAt || r.lastActiveAt || 0).getTime()
      result = [...result].sort((a, b) => getTime(b) - getTime(a))
    }
    return result
  }, [activeRooms, exploreQuery, exploreSort])

  const totalExplorePages = Math.max(1, Math.ceil(filteredExploreRooms.length / roomsPerPage))
  const paginatedExploreRooms = filteredExploreRooms.slice((explorePage - 1) * roomsPerPage, explorePage * roomsPerPage)

  useEffect(() => {
    setExplorePage(1)
  }, [exploreQuery, exploreSort, showExploreFull])

  useEffect(() => {
    if (explorePage > totalExplorePages) setExplorePage(totalExplorePages)
  }, [explorePage, totalExplorePages])

  const handleProfileAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setProfileError('Vui lòng chọn file ảnh.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setProfileError('Ảnh tối đa 3MB.')
      return
    }
    setProfileError('')
    setProfileAvatarFile(file)
    setProfileAvatarPreview(URL.createObjectURL(file))
  }

  const handleSaveProfile = async () => {
    const nextName = profileName.trim()
    if (!nextName) {
      setProfileError('Vui lòng nhập biệt danh.')
      return
    }
    const profileId = authUser?.id || profile?.id || localStorage.getItem('forum_guest_id')
    if (!profileId) {
      setProfileError('Không xác định được hồ sơ. Vui lòng nhập tên trước.')
      return
    }

    setProfileSaving(true)
    setProfileError('')
    try {
      let avatarUrl = profile?.avatar_url || ''
      if (profileAvatarFile) {
        // Thử upload lên Supabase Storage trước (URL gọn nhẹ),
        // nếu lỗi (vd RLS chưa cấu hình) thì rớt về base64 đã thu nhỏ để vẫn hiện được ảnh.
        let uploaded = false
        if (supabase) {
          try {
            const extension = profileAvatarFile.name.split('.').pop()?.toLowerCase() || 'jpg'
            const folder = authUser ? authUser.id : `guests/${profileId}`
            const path = `${folder}/${Date.now()}.${extension}`
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(path, profileAvatarFile, { cacheControl: '3600', upsert: true })
            if (uploadError) throw uploadError
            const { data } = supabase.storage.from('avatars').getPublicUrl(path)
            avatarUrl = data.publicUrl
            uploaded = true
          } catch (storageErr) {
            console.warn('Upload avatar lên Storage thất bại, dùng base64:', storageErr)
          }
        }
        if (!uploaded) {
          avatarUrl = await downscaleImageToDataUrl(profileAvatarFile, 256, 0.85)
        }
      }

      await updateProfile({ username: nextName, avatar_url: avatarUrl })
      setUsername(nextName)
      localStorage.setItem('duhocmate_username', nextName)
      setShowProfileModal(false)
      setShowProfileMenu(false)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error && 'message' in error
            ? String((error as { message?: unknown }).message)
            : 'Không lưu được hồ sơ.'
      setProfileError(message)
    } finally {
      setProfileSaving(false)
    }
  }

  const handleRefreshRates = async () => {
    setExchangeRate('Đang tải...')
    let fetchedRateText: string | null = null

    try {
      const res = await fetch('/api/exchange-rate')
      if (res.ok) {
        const data = await res.json()
        if (data.rateText) {
          fetchedRateText = data.rateText
        }
      }
    } catch {
      // Server API unreachable or failed
    }

    if (!fetchedRateText) {
      const apis = [
        async () => {
          const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=KRW')
          if (!res.ok) throw new Error('Coinbase error')
          const json = await res.json()
          const val = parseFloat(json.data?.rates?.VND)
          if (!val || isNaN(val)) throw new Error('Invalid Coinbase data')
          return val
        },
        async () => {
          const res = await fetch('https://open.er-api.com/v6/latest/KRW')
          if (!res.ok) throw new Error('open.er-api error')
          const json = await res.json()
          const val = parseFloat(json.rates?.VND)
          if (!val || isNaN(val)) throw new Error('Invalid open.er-api data')
          return val
        },
        async () => {
          const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/krw.json')
          if (!res.ok) throw new Error('fawazahmed0 error')
          const json = await res.json()
          const val = parseFloat(json.krw?.vnd)
          if (!val || isNaN(val)) throw new Error('Invalid fawazahmed0 data')
          return val
        }
      ]

      for (const apiFn of apis) {
        try {
          const rate = await apiFn()
          if (rate > 0) {
            const rate1000 = (1000 * rate).toFixed(0)
            const formatted = Number(rate1000).toLocaleString('vi-VN')
            fetchedRateText = `1,000 ₩ ≈ ${formatted} ₫`
            break
          }
        } catch {
          // try next API
        }
      }
    }

    setExchangeRate(fetchedRateText || '1,000 ₩ ≈ 17.780 ₫')

    try {
      const res = await fetch('https://wttr.in/Seoul?format=j1')
      const data = await res.json()
      const current = data.current_condition?.[0]
      if (current) {
        setWeather({
          temp: `${current.temp_C}°C`,
          desc: current.weatherDesc?.[0]?.value || 'N/A'
        })
      }
    } catch {
      setWeather({ temp: '?°C', desc: 'Không lấy được' })
    }
  }

  useEffect(() => {
    handleRefreshRates()
    const refreshTimer = window.setInterval(handleRefreshRates, 15 * 60 * 1000)

    return () => window.clearInterval(refreshTimer)
  }, [])

  useEffect(() => {
    const fetchTickerPosts = async () => {
      try {
        if (supabase) {
          const { data } = await supabase
            .from('community_posts')
            .select('id, display_name, title, is_anonymous')
            .order('created_at', { ascending: false })
            .limit(20)
          if (data && data.length > 0) {
            setTickerPosts(data as TickerPost[])
            return
          }
        }
      } catch {
        // Fallback below
      }
      setTickerPosts([
        { id: '1', display_name: 'Minh Anh', title: 'Cần người đi cùng lên Cục XNC Suwon', is_anonymous: false },
        { id: '2', display_name: 'Goz', title: 'Tìm bạn mua chung gia vị Việt ở Itaewon', is_anonymous: false },
        { id: '3', display_name: 'Thu Trang', title: 'Job làm thêm cuối tuần tại nhà hàng', is_anonymous: false },
      ])
    }
    fetchTickerPosts()
  }, [])

  useEffect(() => {
    if (tickerPosts.length === 0) return

    const runTicker = () => {
      setTickerPhase('in')
      tickerTimerRef.current = setTimeout(() => {
        setTickerPhase('show')
        tickerTimerRef.current = setTimeout(() => {
          setTickerPhase('out')
          tickerTimerRef.current = setTimeout(() => {
            setTickerIndex((prev) => (prev + 1) % tickerPosts.length)
          }, 350)
        }, 2200)
      }, 350)
    }

    runTicker()
    return () => {
      if (tickerTimerRef.current) clearTimeout(tickerTimerRef.current)
    }
  }, [tickerIndex, tickerPosts])

  return (
    <div className="relative isolate min-h-screen w-full overflow-x-hidden bg-transparent text-brand-brown-dark">
      {/* Lá»›p ná» n trang trÃ­ â€” gradient blobs má»  + lÆ°á»›i cháº¥m máº£nh (tá»‘i giáº£n, cÃ³ chiá» u sÃ¢u) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle,rgba(76,55,49,0.035)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_76%)]" />
      </div>
      <header className="sticky top-0 z-50 bg-brand-cream/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="landing-header-inner mx-auto flex max-w-[1720px] items-center justify-between px-5 py-3 md:px-10 xl:px-12 2xl:py-4">
          <div className="flex items-center gap-3">
            <img src={duhocMateLogo} alt="Duhoc Mate Logo" className="h-10 w-10 rounded-2xl object-cover bg-white shadow-sm ring-1 ring-black/[0.04] 2xl:h-11 2xl:w-11" />
            <div>
              <p className="font-display text-lg font-black leading-none xl:text-xl">Duhoc Mate</p>
              <p className="mt-1 hidden text-xs font-bold text-brand-brown-light sm:block">
                {onlineUsersCount > 0 ? `${onlineUsersCount} ${t('landing.onlineNow')}` : t('landing.statusReady')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshRates}
              title="Bấm để cập nhật tỷ giá ngay"
              className="hidden cursor-pointer items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-brand-brown-dark shadow-sm hover:bg-stone-50 transition-colors lg:flex border border-black/[0.04]"
            >
              <Wallet size={13} className="text-amber-600" />
              <span>{exchangeRate}</span>
            </button>
            {weather && (
              <div className="hidden items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-brand-brown-dark shadow-sm lg:flex border border-black/[0.04]">
                <CloudSun size={13} className="text-brand-terracotta" />
                <span>Seoul: {weather.temp}</span>
                <span className="text-brand-brown-light/70">· {weather.desc}</span>
              </div>
            )}
            <span className="hidden items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-brand-brown-light shadow-sm md:flex">
              <Clock size={13} />
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} {profile?.city || 'Seoul'}
            </span>

            {profile?.is_admin && (
              <button
                type="button"
                onClick={onEnterAdmin}
                className="flex h-10 items-center gap-1.5 rounded-full border border-red-100 bg-red-50/50 px-3 sm:px-4 text-xs font-black text-red-600 shadow-sm transition hover:bg-red-50 cursor-pointer"
                title="Quản trị hệ thống"
              >
                <ShieldCheck size={14} className="shrink-0" />
                <span className="hidden sm:inline">Quản trị</span>
              </button>
            )}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#0f172a] text-brand-brown-dark dark:text-[#f8fafc] shadow-sm transition hover:border-brand-terracotta-light hover:shadow-md cursor-pointer"
              title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {profile ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(value => !value)}
                  className="flex h-10 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-2.5 pr-4 text-sm font-black text-brand-brown-dark shadow-sm transition hover:border-brand-terracotta-light hover:shadow-md"
                >
                  <span className={`grid h-7 w-7 overflow-hidden rounded-full border border-black/[0.05] text-xs font-black ${savedAvatar ? 'bg-white' : getAvatarColor(displayName)}`}>
                    {savedAvatar ? (
                      <img src={savedAvatar} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center">{displayName.substring(0, 2).toUpperCase()}</span>
                    )}
                  </span>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-12 z-50 w-48 rounded-[18px] border border-black/[0.06] bg-white p-2 shadow-[0_18px_50px_rgba(76,55,49,0.12)]">
                    <button
                      type="button"
                      onClick={() => {
                        setHomeView('dashboard')
                        setShowHelpBoard(false)
                        setShowExploreFull(false)
                        setShowProfileMenu(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold text-brand-brown-dark transition hover:bg-[#fbf6ef]"
                    >
                      <LayoutDashboard size={16} className="text-brand-brown-light" />
                      Dashboard học tập
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileModal(true)
                        setShowProfileMenu(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold text-brand-brown-dark transition hover:bg-[#fbf6ef]"
                    >
                      <Settings size={16} className="text-brand-brown-light" />
                      Hồ sơ của tôi
                    </button>
                    <div className="my-1 h-px bg-black/[0.06]" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false)
                        signOut()
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-500 transition hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={async () => {
                  const { error } = await signInWithGoogle()
                  if (error) alert('Lỗi đăng nhập Google: ' + error.message)
                }}
                className="whitespace-nowrap rounded-full border border-black/[0.08] bg-white px-4 py-2 text-xs font-black text-brand-brown-dark shadow-sm hover:border-brand-terracotta-light"
              >
                {t('nav.login')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="landing-main mx-auto max-w-[1720px] px-5 py-2 md:px-10 xl:px-12 2xl:py-4">
        {/* Sub-Header Navigation Tab Bar */}
        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:grid lg:grid-cols-[1.05fr_0.9fr_0.95fr] lg:gap-8 2xl:mb-5">
          <div className="flex gap-5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:col-span-2">
            <button
              onClick={() => {
                setHomeView('rooms')
                setShowHelpBoard(false)
              }}
              className={`shrink-0 whitespace-nowrap pb-2 text-sm font-black transition-all cursor-pointer relative group ${homeView === 'rooms'
                  ? 'text-brand-brown-dark'
                  : 'text-brand-brown-light hover:text-brand-brown-dark'
                }`}
            >
              <span className="relative z-10">{t('landing.nav.rooms')}</span>
              {homeView === 'rooms' ? (
                <span className="absolute bottom-1 left-0 right-0 h-[7px] bg-brand-terracotta/75 rounded-[8px_100%_12px_95%] skew-x-[-6deg] animate-marker-draw z-0" />
              ) : (
                <span className="absolute bottom-1 left-0 right-0 h-[7px] bg-brand-terracotta/20 rounded-[8px_100%_12px_95%] skew-x-[-6deg] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200 z-0" />
              )}
            </button>
            <button
              onClick={() => {
                setHomeView('board')
                setShowHelpBoard(true)
              }}
              className={`shrink-0 whitespace-nowrap pb-2 text-sm font-black transition-all cursor-pointer relative group ${homeView === 'board'
                  ? 'text-brand-brown-dark'
                  : 'text-brand-brown-light hover:text-brand-brown-dark'
                }`}
            >
              <span className="relative z-10">{t('landing.nav.board')}</span>
              {homeView === 'board' ? (
                <span className="absolute bottom-1 left-0 right-0 h-[7px] bg-brand-terracotta/75 rounded-[8px_100%_12px_95%] skew-x-[-6deg] animate-marker-draw z-0" />
              ) : (
                <span className="absolute bottom-1 left-0 right-0 h-[7px] bg-brand-terracotta/20 rounded-[8px_100%_12px_95%] skew-x-[-6deg] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200 z-0" />
              )}
            </button>
            <a
              href="https://app.duhocmate.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 whitespace-nowrap pb-2 text-sm font-black text-brand-brown-light hover:text-brand-brown-dark transition-all inline-flex items-center gap-1.5 relative group"
            >
              <span className="relative z-10">{t('landing.nav.salary')}</span>
              <span className="absolute bottom-1 left-0 right-0 h-[7px] bg-brand-terracotta/20 rounded-[8px_100%_12px_95%] skew-x-[-6deg] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200 z-0" />
            </a>
            <a
              href="https://chu-viet.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 whitespace-nowrap pb-2 text-sm font-black text-brand-brown-light hover:text-brand-brown-dark transition-all inline-flex items-center gap-1.5 relative group"
            >
              <span className="relative z-10">{t('landing.nav.handwriting')}</span>
              <span className="absolute bottom-1 left-0 right-0 h-[7px] bg-brand-terracotta/20 rounded-[8px_100%_12px_95%] skew-x-[-6deg] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200 z-0" />
            </a>
          </div>

        </div>

        {homeView === 'board' ? (
          <section className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-sm flex flex-col min-h-[calc(100svh-118px)]">
            <CommunityForum
              currentUserId={user?.id || ''}
              username={profile?.username || username || 'Bạn học'}
              isAdmin={!!profile?.is_admin}
              onBackToLobby={() => {
                setHomeView('rooms')
                setShowHelpBoard(false)
              }}
            />
          </section>
        ) : homeView === 'dashboard' ? (
          <PersonalDashboard
            profile={profile}
            username={username}
            onStartRoom={() => {
              setHomeView('rooms')
              setShowHelpBoard(false)
            }}
            onOpenTopikRoom={() => {
              setHomeView('rooms')
              setShowHelpBoard(false)
            }}
          />
        ) : showExploreFull ? (
          <section className="w-full py-4 animate-custom-fade-in">
            {/* Header row with KHÃM PHÃ badge and Quay láº¡i button */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta/25 bg-brand-terracotta/5 px-3.5 py-1 text-xs font-black text-brand-terracotta uppercase tracking-wider">
                <Globe2 size={13} />
                Khám phá
              </div>
              <button
                type="button"
                onClick={() => setShowExploreFull(false)}
                className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-4 py-2 text-xs font-black text-brand-brown-light hover:text-brand-brown-dark transition cursor-pointer hover:border-brand-terracotta-light"
              >
                <ArrowLeft size={14} />
                Quay lại trang chủ
              </button>
            </div>

            {/* Titles */}
            <h2 className="mt-5 font-display text-4xl font-black leading-[1.1] text-brand-brown-dark sm:text-5xl">
              Khám phá các phòng <br />
              <span className="text-brand-terracotta">học cùng nhau</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-brand-brown-light/80">
              Tìm phòng học, ôn TOPIK, nghe nhạc hoặc làm việc chung với cộng đồng Duhoc Mate. Phòng đang có người sẽ được ưu tiên hiển thị trước.
            </p>

            {/* Search and Filters row */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown-light" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phòng, mã phòng hoặc người tạo..."
                  value={exploreQuery}
                  onChange={(e) => setExploreQuery(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-black/[0.08] bg-[#FAF6F0] px-11 text-sm font-bold text-brand-brown-dark outline-none focus:bg-white focus:border-brand-terracotta-light focus:ring-2 focus:ring-brand-terracotta/20 transition"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExploreSort('members')}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-black transition cursor-pointer ${
                    exploreSort === 'members'
                      ? 'bg-brand-terracotta text-white shadow-md shadow-brand-terracotta/10'
                      : 'bg-white border border-black/[0.06] text-brand-brown-light hover:text-brand-brown-dark'
                  }`}
                >
                  <TrendingUp size={13} strokeWidth={2.5} />
                  Đông nhất
                </button>
                <button
                  type="button"
                  onClick={() => setExploreSort('newest')}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-black transition cursor-pointer ${
                    exploreSort === 'newest'
                      ? 'bg-brand-terracotta text-white shadow-md shadow-brand-terracotta/10'
                      : 'bg-white border border-black/[0.06] text-brand-brown-light hover:text-brand-brown-dark'
                  }`}
                >
                  <CalendarDays size={13} strokeWidth={2.5} />
                  Mới nhất
                </button>
              </div>
            </div>

            {/* Room cards grid */}
            {filteredExploreRooms.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-brand-terracotta-light/45 bg-[#fbf6ef] p-12 text-center">
                <Globe2 size={40} className="mx-auto text-brand-terracotta/55" />
                <p className="mt-4 text-base font-black text-brand-brown-dark">Không tìm thấy phòng phù hợp</p>
                <p className="mt-1.5 text-xs font-bold leading-relaxed text-brand-brown-light">
                  Không tìm thấy phòng nào hoạt động khớp với từ khóa tìm kiếm. Bạn có thể tự tạo một phòng mới!
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedExploreRooms.map((room: ActiveRoom, index: number) => {
                  const finalAvatarUrl = room.roomAvatarUrl || room.hostAvatarUrl || '';
                  const hasAvatar = !!finalAvatarUrl;
                  const firstLetter = room.hostName ? room.hostName.substring(0, 2).toUpperCase() : 'BH';
                  const onlineCount = Number(room.memberCount) || 0;
                  const isLive = onlineCount > 0;
                  return (
                    <div
                      key={room.id}
                      style={{ animationDelay: `${index * 50}ms` }}
                      className="animate-custom-scale-up group flex flex-col rounded-[24px] border border-black/[0.05] bg-white p-6 shadow-[0_8px_30px_rgba(76,55,49,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-terracotta-light/40 hover:shadow-[0_15px_45px_rgba(76,55,49,0.08)]"
                    >
                      {/* Top section: Avatar + Title & ID + Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div className="h-12 w-12 shrink-0 rounded-2xl border border-black/[0.05] bg-brand-cream overflow-hidden flex items-center justify-center font-display font-black text-sm">
                            {hasAvatar ? (
                              <img src={finalAvatarUrl} alt={room.hostName} className="h-full w-full object-cover" />
                            ) : (
                              <div className={`h-full w-full flex items-center justify-center ${getAvatarColor(room.hostName)}`}>
                                {firstLetter}
                              </div>
                            )}
                          </div>
                          {/* Title & Host info */}
                          <div className="min-w-0">
                            <h3 className="truncate font-display font-black text-base text-brand-brown-dark leading-tight" title={room.roomTitle || `Phòng của ${room.hostName}`}>
                              {room.roomTitle || `Phòng của ${room.hostName}`}
                            </h3>
                            <p className="truncate text-[11px] font-bold text-brand-brown-light/75 mt-1">
                              {room.hostName} • <span className="font-mono text-brand-terracotta">{room.id}</span>
                            </p>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="shrink-0">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-600 border border-emerald-500/10 whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              LIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-600 border border-orange-500/10 whitespace-nowrap">
                              Sẵn sàng
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-black/[0.05] my-5" />

                      {/* Bottom section: Member Count + Action link */}
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs font-bold text-brand-brown-light/80 flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-brown-light/40" />
                          {onlineCount} người
                        </span>

                        <button
                          type="button"
                          onClick={() => handleJoinRoom(room.id, undefined, undefined, undefined, room.isPrivate)}
                          className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-brand-terracotta group-hover:text-brand-brown-dark transition cursor-pointer active:scale-95"
                        >
                          Vào phòng
                          <span className="text-sm font-light select-none transition-transform group-hover:translate-x-1 duration-200">→</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalExplorePages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setExplorePage(page => Math.max(1, page - 1))}
                  disabled={explorePage === 1}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-black/[0.06] bg-white text-brand-brown-light shadow-sm transition hover:text-brand-brown-dark disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalExplorePages }, (_, index) => index + 1).map(page => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setExplorePage(page)}
                    className={`h-9 min-w-9 rounded-xl px-3 text-sm font-black transition ${
                      explorePage === page
                        ? 'bg-brand-terracotta text-white shadow-md shadow-brand-terracotta/15'
                        : 'border border-black/[0.06] bg-white text-brand-brown-light hover:text-brand-brown-dark'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setExplorePage(page => Math.min(totalExplorePages, page + 1))}
                  disabled={explorePage === totalExplorePages}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-black/[0.06] bg-white text-brand-brown-light shadow-sm transition hover:text-brand-brown-dark disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </section>
        ) : (
          <section className="landing-hero-grid relative mt-1 grid min-w-0 gap-6 lg:min-h-[calc(100svh-118px)] lg:grid-cols-[minmax(0,1fr)_minmax(360px,410px)] lg:items-start xl:gap-8 2xl:min-h-[calc(100svh-142px)] 2xl:grid-cols-[minmax(460px,0.9fr)_minmax(430px,0.88fr)_minmax(390px,430px)] 2xl:gap-9 lg:pt-6 2xl:pt-9">
            <div className="relative flex min-w-0 items-start pt-3 pb-1 lg:pt-5 lg:pb-2 2xl:pt-8 2xl:pb-4">
              <div className="relative z-10 min-w-0 max-w-[620px] xl:max-w-[500px] 2xl:max-w-[610px]">
                <div
                  style={{ animationDelay: '0ms' }}
                  className="inline-flex animate-fade-slide-down items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-terracotta"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-terracotta animate-pulse" />
                  {t('landing.realtimeSync')}
                </div>

                <h1
                  style={{ animationDelay: '100ms' }}
                  className="landing-hero-title mt-4 animate-fade-slide-down font-display text-4xl font-black leading-[1.03] text-brand-brown-dark sm:text-5xl lg:text-[54px] xl:text-[60px] 2xl:mt-6 2xl:text-[78px]"
                >
                  {/* Mobile version */}
                  <span className="block lg:hidden">
                    {t('landing.heroMobile')}
                  </span>

                  {/* Desktop version */}
                  <span className="hidden lg:block">
                    <span className="lg:whitespace-nowrap">{t('landing.heroDesktopLine1')}</span> <br />
                    <span className="text-brand-terracotta lg:whitespace-nowrap">{t('landing.heroDesktopLine2')}</span>
                  </span>
                </h1>
                <p
                  style={{ animationDelay: '200ms' }}
                  className="landing-hero-subtitle mt-4 animate-fade-slide-down max-w-[34rem] text-base font-semibold leading-relaxed text-brand-brown-dark/75 sm:text-lg 2xl:mt-6 2xl:max-w-lg 2xl:text-xl"
                >
                  {t('landing.heroCopy')}
                </p>

                {/* Hai nÃºt chÃ­nh theo nhá»‹p landing cozy */}
                <div
                  style={{ animationDelay: '300ms' }}
                  className="landing-hero-buttons relative z-20 mt-5 animate-fade-slide-down flex w-full max-w-[520px] flex-col gap-3 md:flex-row 2xl:mt-6 2xl:max-w-[570px]"
                >
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-brand-terracotta px-6 text-base font-black text-white shadow-md shadow-brand-terracotta/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-brown-dark hover:shadow-lg hover:shadow-brand-terracotta/25 active:translate-y-0 active:scale-[0.98] md:flex-[1.08] cursor-pointer 2xl:h-14"
                  >
                    <Plus size={18} />
                    <span className="whitespace-nowrap">{t('landing.createStudyRoom')}</span>
                  </button>

                  <div className="flex h-12 w-full items-center rounded-[14px] border border-black/[0.1] bg-white px-5 shadow-sm transition hover:border-brand-terracotta-light sm:flex-1 2xl:h-14">
                    <input
                      type="text"
                      placeholder={t('landing.joinCodePlaceholder')}
                      value={roomId}
                      onChange={(event) => setRoomId(event.target.value.toUpperCase())}
                      onKeyDown={(event) => event.key === 'Enter' && handleJoinRoom()}
                      className="min-w-0 flex-1 bg-transparent text-sm font-bold text-brand-brown-dark outline-none placeholder:font-bold placeholder:text-brand-brown-light/70"
                    />
                    <button onClick={() => handleJoinRoom()} className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fbf6ef] text-brand-terracotta transition hover:bg-brand-terracotta hover:text-white" title="Vào phòng">
                      <LogIn size={17} />
                    </button>
                  </div>
                </div>

                {/* Badges flex row */}
                <div
                  style={{ animationDelay: '400ms' }}
                  className="landing-hero-badges relative z-20 mt-4 flex max-w-[520px] animate-fade-slide-down flex-wrap gap-2 2xl:mt-5 2xl:max-w-[570px]"
                >
                  {[
                    {
                      icon: <Music2 size={15} className="text-brand-terracotta" strokeWidth={2.5} />,
                      label: t('landing.badgeMusic')
                    },
                    {
                      icon: <UsersRound size={15} className="text-brand-terracotta" strokeWidth={2.5} />,
                      label: t('landing.badgeTogether')
                    },
                    {
                      icon: <Timer size={15} className="text-brand-terracotta" strokeWidth={2.5} />,
                      label: t('landing.badgeRealtime')
                    }
                  ].map(item => (
                    <span key={item.label} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-1.5 text-xs font-bold text-brand-brown-light shadow-sm 2xl:py-2">
                      {item.icon}
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Cá»™t 2: Minh há»a 3D */}
            <div className="hidden min-w-0 items-start justify-center py-1 2xl:flex 2xl:py-4">
              <div
                style={{ animationDelay: '350ms' }}
                className="landing-hero-visual relative z-0 w-full max-w-[420px] translate-y-6 rotate-[-3deg] animate-fade-slide-down transition-transform duration-500 ease-out hover:rotate-[-1.25deg] hover:scale-[1.01] 2xl:max-w-[560px] 2xl:translate-y-7"
              >
                <img
                  src={studyLounge3d}
                  alt="Minh họa học tập"
                  className="aspect-[1.22/1] w-full rounded-[26px] border border-black/[0.04] object-cover shadow-[0_22px_56px_rgba(76,55,49,0.12)]"
                  style={{ filter: 'brightness(1.08) saturate(0.82)' }}
                />
              </div>
            </div>

            <div className="relative z-10 min-w-0 flex-1 xl:pt-2 2xl:pt-0">
              <TemplateMarketplace
                templates={templates}
                activeRooms={activeRooms}
                recentRooms={recentRooms}
                friendCode={friendCode}
                friendCodeCopied={friendCodeCopied}
                friendInputCode={friendInputCode}
                friendsWithStatus={friendsWithStatus}
                username={username}
                currentUserAvatarUrl={profile?.avatar_url || ''}
                onJoinTemplateRoom={handleJoinTemplateRoom}
                onJoinRoom={handleJoinRoom}
                onRefreshRooms={() => {
                  requestActiveRooms();
                  setShowExploreFull(true);
                }}
                copyFriendCode={copyFriendCode}
                setFriendInputCode={setFriendInputCode}
                handleAddFriend={handleAddFriend}
                getAvatarColor={getAvatarColor}
                activityTicker={tickerPosts.length > 0 ? (
                  <div className="activity-ticker flex h-8 items-center overflow-hidden rounded-full border border-black/[0.05] bg-[#fbf6ef] px-4 py-1.5 shadow-xs">
                    <button
                      onClick={() => {
                        setShowHelpBoard(true)
                      }}
                      className={`ticker-inner ticker-${tickerPhase} ticker-clickable flex w-full items-center gap-2 text-left`}
                    >
                      <span className="ticker-icon flex items-center text-brand-terracotta">
                        <Megaphone size={12} strokeWidth={2.5} />
                      </span>
                      <span className="ticker-author shrink-0 text-xs font-bold text-brand-brown-dark">
                        {tickerPosts[tickerIndex]?.is_anonymous ? 'Ẩn danh' : (tickerPosts[tickerIndex]?.display_name ?? '')}
                      </span>
                      <span className="ticker-sep font-bold text-brand-terracotta-light">·</span>
                      <span className="ticker-text truncate text-xs font-semibold text-brand-brown-light">
                        {tickerPosts[tickerIndex]?.title}
                      </span>
                    </button>
                  </div>
                ) : null}
              />
            </div>
          </section>
        )}
      </main>

      {/* Modal táº¡o phÃ²ng má»›i */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#fbf6ef] p-4">
          {/* Concentric Circle Background */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="absolute h-[980px] w-[980px] rounded-full border border-brand-brown-light/[0.16]" />
            <div className="absolute h-[720px] w-[720px] rounded-full border border-brand-brown-light/[0.13]" />
            <div className="absolute h-[430px] w-[430px] rounded-full border border-brand-brown-light/[0.12]" />
            <div className="absolute left-[52%] top-[-12rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[#f4dfbd]/25 blur-3xl" />
          </div>

          <img
            src={createRoomScene}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[7vh] left-[4vw] hidden w-[32vw] max-w-[540px] rotate-[-4deg] rounded-[28px] border border-white/70 object-cover opacity-90 shadow-[0_28px_80px_rgba(76,55,49,0.12)] xl:block"
          />
          <img
            src={createRoomSceneSecondary}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-[5vw] top-[9vh] hidden w-[24vw] max-w-[390px] rotate-[4deg] rounded-[26px] border border-white/70 object-cover opacity-80 shadow-[0_24px_70px_rgba(76,55,49,0.10)] 2xl:block"
          />

          <div className="relative z-10 w-full max-w-[480px] text-center">
            {/* Logo and Back button */}
            <div className="mb-4 flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-black text-brand-brown-dark shadow-sm border border-black/[0.04] hover:bg-brand-light transition cursor-pointer"
              >
                <ArrowLeft size={13} />
                {t('landing.createModal.back')}
              </button>

              <div className="flex items-center gap-2.5 font-display text-lg font-black text-brand-brown-dark">
                <img src={duhocMateLogo} alt="Duhoc Mate Logo" className="h-9 w-9 rounded-[14px] object-cover shadow-sm ring-1 ring-black/[0.04]" />
                <span className="leading-none">Duhoc Mate</span>
              </div>

              <div className="w-20" /> {/* Spacer */}
            </div>

            {/* Modal Card */}
            <div className="rounded-[32px] bg-white p-8 shadow-2xl border border-black/[0.03]">
              <h2 className="font-display text-[28px] font-extrabold leading-tight text-brand-brown-dark">{t('landing.createModal.title')}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-brand-brown-light/75">{t('landing.createModal.subtitle')}</p>

              {!isSignedIn ? (
                <>
              {/* Google Login button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { error } = await signInWithGoogle();
                    if (error) {
                      alert('Lỗi đăng nhập Google: ' + error.message);
                    }
                  } catch (error) {
                    const err = error instanceof Error ? error : new Error('Không thể mở Google OAuth');
                    alert('Lỗi đăng nhập: ' + err.message);
                  }
                }}
                className="mt-6 flex w-full h-12 items-center justify-center gap-3 rounded-2xl border border-[#ECE6DB] bg-white text-sm font-bold text-brand-brown-dark hover:bg-brand-light hover:border-brand-terracotta-light transition cursor-pointer shadow-xs"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98.96 12 .96c-4.97 0-9.25 2.85-11.3 7.02l3.77 2.92C5.35 7.64 8.43 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.29 1.48-1.14 2.73-2.43 3.58l3.77 2.92c2.2-2.03 3.69-5.02 3.69-8.66z" />
                  <path fill="#FBBC05" d="M4.47 10.9c-.24-.72-.37-1.48-.37-2.27s.13-1.55.37-2.27L.7 5.44C-.13 7.09-.6 8.97-.6 10.9s.47 3.81 1.3 5.46l3.77-2.92z" />
                  <path fill="#34A853" d="M12 23.04c3.24 0 5.97-1.07 7.96-2.91l-3.77-2.92c-1.05.7-2.39 1.12-3.83 1.12-3.57 0-6.65-2.6-7.73-5.86L.86 15.39c2.05 4.17 6.33 7.02 11.14 7.02z" />
                </svg>
                {t('landing.createModal.google')}
              </button>

              {/* Divider */}
              <div className="my-6 flex items-center justify-center gap-3">
                <div className="h-px flex-1 bg-black/[0.06]" />
                <span className="text-[10px] font-black tracking-widest text-brand-brown-light/60">{t('landing.createModal.divider')}</span>
                <div className="h-px flex-1 bg-black/[0.06]" />
              </div>
                </>
              ) : (
                <div className="mt-6 mb-6 flex h-11 items-center justify-center gap-2 rounded-[14px] border border-brand-terracotta-light/35 bg-[#fbf6ef] px-4 text-sm font-semibold text-brand-brown-dark">
                  <span className={`grid h-6 w-6 overflow-hidden rounded-full border border-black/[0.05] text-[10px] ${savedAvatar ? 'bg-white' : getAvatarColor(displayName)}`}>
                    {savedAvatar ? (
                      <img src={savedAvatar} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center">{displayName.substring(0, 1).toUpperCase()}</span>
                    )}
                  </span>
                  <span className="truncate">Đã đăng nhập: {displayName}</span>
                </div>
              )}

              {/* Nickname input */}
              <div className="mt-5 text-left">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-brown-light/80">{t('landing.createModal.nickname')}</label>
                <input
                  type="text"
                  value={modalNickname}
                  onChange={(e) => {
                    setModalNickname(e.target.value);
                    if (!isSignedIn) setUsername(e.target.value);
                  }}
                  readOnly={isSignedIn}
                  placeholder={t('landing.createModal.nicknamePlaceholder')}
                  className={`h-14 w-full rounded-2xl border border-[#ECE6DB] px-5 text-[15px] font-semibold text-brand-brown-dark outline-none transition placeholder:font-semibold placeholder:text-brand-brown-light/55 ${isSignedIn ? 'bg-[#fbf6ef] cursor-default' : 'bg-[#FAF6F0] focus:bg-white focus:border-[#D6CAB2]'}`}
                />
                <span className="mt-2 block text-[11px] font-medium italic text-brand-brown-light/65">
                  {isSignedIn ? '* Tên gọi được đồng bộ từ hồ sơ của bạn.' : t('landing.createModal.nicknameNote')}
                </span>
              </div>

              {/* Room Name input */}
              <div className="text-left mt-4">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-brown-light/80">{t('landing.createModal.roomName')}</label>
                <input
                  type="text"
                  value={modalRoomTitle}
                  onChange={(e) => setModalRoomTitle(e.target.value)}
                  placeholder={t('landing.createModal.roomPlaceholder')}
                  className="h-14 w-full rounded-2xl border border-[#ECE6DB] bg-[#FAF6F0] px-5 text-[15px] font-semibold text-brand-brown-dark outline-none transition placeholder:font-semibold placeholder:text-brand-brown-light/55 focus:border-[#D6CAB2] focus:bg-white"
                />
              </div>

              {/* Mode & Password */}
              <div className="grid grid-cols-2 gap-4 mt-4 text-left">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-brown-light/80">{t('landing.createModal.mode')}</label>
                  <div className="flex gap-1 bg-[#FAF6F0] border border-[#ECE6DB] rounded-xl p-1 h-12 items-center">
                    <button
                      type="button"
                      onClick={() => setModalIsPrivate(true)}
                      className={`flex-1 flex h-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${modalIsPrivate ? 'bg-white text-brand-brown-dark shadow-sm border border-black/[0.04]' : 'text-brand-brown-light hover:text-brand-brown-dark'
                        }`}
                    >
                      <LockKeyhole size={14} /> {t('landing.createModal.private')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalIsPrivate(false)}
                      className={`flex-1 flex h-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${!modalIsPrivate ? 'bg-white text-brand-brown-dark shadow-sm border border-black/[0.04]' : 'text-brand-brown-light hover:text-brand-brown-dark'
                        }`}
                    >
                      <Globe2 size={14} /> {t('landing.createModal.public')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-brown-light/80">{t('landing.createModal.password')}</label>
                  <input
                    type="password"
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    disabled={!modalIsPrivate}
                    placeholder={modalIsPrivate ? t('landing.createModal.passwordRequired') : t('landing.createModal.noPassword')}
                    className={`w-full h-12 rounded-xl border px-4 text-sm font-semibold text-brand-brown-dark outline-none transition placeholder:font-semibold placeholder:text-brand-brown-light/55 ${modalIsPrivate
                        ? 'bg-[#FAF6F0] border-[#ECE6DB] focus:bg-white focus:border-[#D6CAB2]'
                        : 'bg-[#F2EDF0] border-transparent text-gray-400 cursor-not-allowed'
                      }`}
                  />
                </div>
              </div>

              {/* Create Action Button */}
              <button
                type="button"
                onClick={() => {
                  if (!modalNickname.trim()) return alert(t('landing.createModal.nameAlert'));
                  if (modalIsPrivate && !modalPassword.trim()) return alert(t('landing.createModal.passwordAlert'));

                  handleCreateRoom(
                    [],
                    modalRoomTitle.trim() || `Phòng của ${modalNickname}`,
                    modalIsPrivate,
                    modalPassword,
                    profile?.avatar_url || ''
                  );
                  setShowCreateModal(false);
                }}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[#AB8B7C] text-[15px] font-bold text-white shadow-md transition hover:bg-brand-brown-dark hover:shadow-lg active:scale-[0.98] cursor-pointer"
              >
                {t('landing.createModal.submit')}
              </button>

            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[430px] rounded-[30px] bg-white p-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.22)]">
            <h2 className="font-display text-2xl font-black text-brand-brown-dark">Chỉnh sửa Hồ Sơ</h2>

            <div className="mt-7 flex justify-center">
              <label className="group relative block cursor-pointer">
                <span className={`grid h-24 w-24 overflow-hidden rounded-full border-4 border-white text-3xl font-black shadow-[0_12px_28px_rgba(76,55,49,0.15)] ${profileModalAvatar ? 'bg-white' : getAvatarColor(profileName || displayName)}`}>
                  {profileModalAvatar ? (
                    <img src={profileModalAvatar} alt={profileName || displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center">{(profileName || displayName).substring(0, 1).toUpperCase()}</span>
                  )}
                </span>
                <span className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-brand-terracotta text-white shadow-md transition group-hover:bg-brand-brown-dark">
                  <Camera size={16} />
                </span>
                <input type="file" accept="image/*" onChange={handleProfileAvatarChange} className="sr-only" />
              </label>
            </div>

            <div className="mt-7 text-left">
              <label className="block text-[11px] font-black uppercase tracking-wider text-brand-brown-light">Biệt danh</label>
              <input
                value={profileName}
                onChange={event => setProfileName(event.target.value)}
                className="mt-2 h-14 w-full rounded-[16px] border border-[#ded3c8] bg-[#fbf6ef] px-4 text-center text-base font-black text-brand-brown-dark outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-200"
                placeholder="Tên hiển thị"
              />
            </div>

            <label className="mt-4 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[15px] border border-dashed border-brand-terracotta-light bg-[#fbf6ef] text-sm font-black text-brand-terracotta transition hover:bg-white">
              <Upload size={16} />
              Chọn ảnh đại diện
              <input type="file" accept="image/*" onChange={handleProfileAvatarChange} className="sr-only" />
            </label>

            {profileError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-left text-xs font-bold text-red-600">{profileError}</p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="h-12 rounded-[16px] bg-[#f5f0ea] text-sm font-black text-brand-brown-light transition hover:bg-[#eee5dc]"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="h-12 rounded-[16px] bg-brand-terracotta text-sm font-black text-white shadow-md shadow-brand-terracotta/20 transition hover:bg-brand-brown-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileSaving ? 'Đang lưu...' : 'Lưu lại'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
