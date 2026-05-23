import React, { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Clock,
  CloudSun,
  Globe2,
  LockKeyhole,
  LogIn,
  Megaphone,
  Music2,
  Plus,
  RefreshCw,
  Timer,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import studyLounge3d from '../assets/study-lounge-3d-new.png'
import createRoomScene from '../assets/create-room-scene.png'
import createRoomSceneSecondary from '../assets/create-room-scene-secondary.png'
import duhocMateLogo from '../assets/duhoc-mate-logo-new.png'
import LanguageSwitcher from './LanguageSwitcher'
import QuickHelpBoard from './QuickHelpBoard'
import TemplateMarketplace from './TemplateMarketplace'
import type { RoomTemplate } from '../lib/communityTemplates'
import { supabase } from '../lib/supabase'
import type { HelpPost } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type AuthMode = 'login' | 'register'

type ActiveRoom = {
  id: string
  hostName: string
  memberCount: number
  currentSong?: string
  roomTitle?: string
  isPrivate?: boolean
  hostAvatarUrl?: string
}
type RecentRoom = {
  id: string
  hostName: string
  currentSong?: string
  roomTitle?: string
  isPrivate?: boolean
  hostAvatarUrl?: string
}
type FriendStatus = { code: string; username: string; online: boolean; currentRoomId: string | null; currentSong: string | null }

type LandingPageProps = {
  username: string
  setUsername: (value: string) => void
  roomId: string
  setRoomId: (value: string) => void
  onlineUsersCount: number
  user: unknown
  profile: { username?: string; city?: string; avatar_url?: string } | null
  signOut: () => void
  setAuthMode: (mode: AuthMode) => void
  setShowAuthModal: (show: boolean) => void
  getAvatarColor: (name: string) => string
  handleCreateRoom: (
    seedTasks?: any[],
    roomTitle?: string,
    isPrivate?: boolean,
    password?: string,
    avatarUrl?: string
  ) => void
  handleJoinRoom: (e?: React.FormEvent | string, enteredPassword?: string) => void
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
  setAuthMode,
  setShowAuthModal,
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
}: LandingPageProps) {
  const { t } = useTranslation()

  const [exchangeRate, setExchangeRate] = useState<string>('Đang tải...')
  const [weather, setWeather] = useState<{ temp: string; desc: string } | null>(null)

  const [tickerPosts, setTickerPosts] = useState<HelpPost[]>([])
  const [tickerIndex, setTickerIndex] = useState(0)
  const [tickerPhase, setTickerPhase] = useState<'in' | 'show' | 'out'>('in')
  const tickerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  const { signInWithGoogle } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [modalNickname, setModalNickname] = useState('')
  const [modalRoomTitle, setModalRoomTitle] = useState('')
  const [modalIsPrivate, setModalIsPrivate] = useState(true)
  const [modalPassword, setModalPassword] = useState('')

  useEffect(() => {
    if (showCreateModal) {
      setModalNickname(username || profile?.username || '')
      setModalRoomTitle(profile?.username ? `Phòng của ${profile.username}` : '')
    }
  }, [showCreateModal, username, profile])

  const handleRefreshRates = async () => {
    setExchangeRate('Đang tải...')
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/KRW')
      const data = await res.json()
      const vndRate = data.rates?.VND
      if (vndRate) {
        const rate1000 = (1000 * vndRate).toFixed(0)
        setExchangeRate(`1,000 ₩ ≈ ${Number(rate1000).toLocaleString('vi-VN')} ₫`)
      }
    } catch {
      setExchangeRate('1,000 ₩ ≈ 17,800 ₫')
    }

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
    if (showHelpBoard) {
      handleRefreshRates()
    }
  }, [showHelpBoard])

  useEffect(() => {
    const fetchTickerPosts = async () => {
      try {
        if (supabase) {
          const { data } = await supabase
            .from('help_posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(15)
          if (data && data.length > 0) {
            setTickerPosts(data as HelpPost[])
            return
          }
        }
      } catch {
        // Fallback below
      }
      setTickerPosts([
        { id: '1', user_id: 'demo', username: 'Minh Anh', title: 'Cần người đi cùng lên Cục XNC Suwon', content: '', category: 'transport', city: 'Suwon', created_at: new Date().toISOString() },
        { id: '2', user_id: 'demo', username: 'Goz', title: 'Tìm bạn mua chung gia vị Việt ở Itaewon', content: '', category: 'food', city: 'Seoul', created_at: new Date().toISOString() },
        { id: '3', user_id: 'demo', username: 'Thu Trang', title: 'Job làm thêm cuối tuần tại nhà hàng', content: '', category: 'job', city: 'Gyeonggi', created_at: new Date().toISOString() },
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
    <div className="relative isolate min-h-screen w-full overflow-x-hidden bg-[#fbf6ef] text-brand-brown-dark">
      {/* Lớp nền trang trí — gradient blobs mờ + lưới chấm mảnh (tối giản, có chiều sâu) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-28 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[#f4dfbd]/35 blur-3xl" />
        <div className="absolute right-[-10rem] top-1/3 h-[26rem] w-[26rem] rounded-full bg-brand-terracotta/[0.07] blur-3xl" />
        <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle,rgba(76,55,49,0.035)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      </div>
      <header className="sticky top-0 z-50 bg-[#fbf6ef]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-3 md:px-10 xl:px-12 2xl:py-5">
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
            {showHelpBoard && (
              <>
                <div className="hidden items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-brand-brown-dark shadow-sm lg:flex border border-black/[0.04]">
                  <Wallet size={13} className="text-amber-600" />
                  <span>{exchangeRate}</span>
                </div>
                {weather && (
                  <div className="hidden items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-brand-brown-dark shadow-sm lg:flex border border-black/[0.04]">
                    <CloudSun size={13} className="text-brand-terracotta" />
                    <span>Seoul: {weather.temp}</span>
                    <span className="text-brand-brown-light/70">· {weather.desc}</span>
                  </div>
                )}
                <button
                  onClick={handleRefreshRates}
                  className="hidden p-2 rounded-full bg-white hover:bg-brand-light text-brand-brown-light hover:text-brand-brown-dark transition shadow-sm lg:block border border-black/[0.04] cursor-pointer"
                  title="Cập nhật tỷ giá & thời tiết"
                >
                  <RefreshCw size={13} />
                </button>
              </>
            )}
            <span className="hidden items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-brand-brown-light shadow-sm md:flex">
              <Clock size={13} />
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} {profile?.city || 'Seoul'}
            </span>
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-black ${getAvatarColor(profile?.username || username)}`}>
                  {(profile?.username || username).substring(0, 2).toUpperCase()}
                </div>
                <button onClick={signOut} className="rounded-full px-4 py-2 text-xs font-black text-brand-brown-light hover:bg-white">
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true) }}
                  className="whitespace-nowrap rounded-full border border-black/[0.08] bg-white px-4 py-2 text-xs font-black text-brand-brown-dark shadow-sm hover:border-brand-terracotta-light"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setShowAuthModal(true) }}
                  className="hidden rounded-full bg-brand-brown-dark px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-brand-terracotta sm:block"
                >
                  {t('nav.register')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1510px] px-5 py-2 md:px-10 xl:px-12 2xl:max-w-[1640px] 2xl:py-5">
        {/* Sub-Header Navigation Tab Bar */}
        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:grid lg:grid-cols-[1.05fr_0.9fr_0.95fr] lg:gap-8 2xl:mb-5">
          <div className="flex gap-5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:col-span-2">
            <button
              onClick={() => setShowHelpBoard(false)}
              className={`shrink-0 whitespace-nowrap pb-2 text-sm font-black transition-all cursor-pointer relative ${!showHelpBoard
                  ? 'text-brand-brown-dark border-b-2 border-brand-terracotta'
                  : 'text-brand-brown-light hover:text-brand-brown-dark'
                }`}
            >
              {t('landing.nav.rooms')}
            </button>
            <button
              onClick={() => setShowHelpBoard(true)}
              className={`shrink-0 whitespace-nowrap pb-2 text-sm font-black transition-all cursor-pointer relative ${showHelpBoard
                  ? 'text-brand-brown-dark border-b-2 border-brand-terracotta'
                  : 'text-brand-brown-light hover:text-brand-brown-dark'
                }`}
            >
              {t('landing.nav.board')}
            </button>
            <a
              href="https://www.duhocmate.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 whitespace-nowrap pb-2 text-sm font-black text-brand-brown-light hover:text-brand-brown-dark transition-all inline-flex items-center gap-1.5"
            >
              {t('landing.nav.salary')}
            </a>
          </div>

        </div>

        {showHelpBoard ? (
          <section className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-sm">
            <QuickHelpBoard initialExpandedPostId={selectedPostId} />
          </section>
        ) : (
          <section className="relative mt-1 grid min-w-0 gap-5 lg:min-h-[calc(100svh-116px)] lg:grid-cols-[minmax(0,1fr)_minmax(360px,410px)] lg:items-start xl:gap-7 2xl:grid-cols-[0.98fr_0.95fr_0.9fr] 2xl:min-h-[calc(100svh-150px)] 2xl:gap-11 lg:pt-6 2xl:pt-10">
            <div className="relative flex min-w-0 items-start pt-3 pb-1 lg:pt-6 lg:pb-2 2xl:pt-8 2xl:pb-4">
              <div className="relative z-10 min-w-0 lg:max-w-[620px] xl:max-w-[560px] 2xl:max-w-[620px]">
                <div
                  style={{ animationDelay: '0ms' }}
                  className="inline-flex animate-fade-slide-down items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-terracotta"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-terracotta animate-pulse" />
                  {t('landing.realtimeSync')}
                </div>

                <h1
                  style={{ animationDelay: '100ms' }}
                  className="landing-hero-title mt-4 animate-fade-slide-down font-display text-5xl font-black leading-[1.02] tracking-tight text-brand-brown-dark sm:text-6xl lg:text-[54px] xl:text-[68px] 2xl:mt-6 2xl:text-[80px]"
                >
                  <span className="xl:whitespace-nowrap">{t('landing.heroLine1')}</span> <br />
                  <span className="text-brand-terracotta">{t('landing.heroLine2')}</span>
                </h1>
                <p
                  style={{ animationDelay: '200ms' }}
                  className="landing-hero-subtitle mt-4 animate-fade-slide-down max-w-md text-base font-semibold leading-relaxed text-brand-brown-dark/75 sm:text-lg 2xl:mt-6 2xl:max-w-lg 2xl:text-xl"
                >
                  {t('landing.heroCopy')}
                </p>

                {/* Hai nút chính theo nhịp landing cozy */}
                <div
                  style={{ animationDelay: '300ms' }}
                  className="relative z-20 mt-4 animate-fade-slide-down flex w-full max-w-[540px] flex-col gap-3 md:flex-row 2xl:mt-5 2xl:max-w-[590px]"
                >
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-brand-terracotta px-6 text-base font-black text-white shadow-lg shadow-brand-terracotta/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-brown-dark hover:shadow-xl hover:shadow-brand-terracotta/30 active:translate-y-0 active:scale-[0.98] md:flex-[1.08] cursor-pointer 2xl:h-14"
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
                  className="relative z-20 mt-3 grid max-w-[540px] animate-fade-slide-down grid-cols-1 gap-2 md:grid-cols-3 2xl:mt-5 2xl:max-w-[590px]"
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

            {/* Cột 2: Minh họa 3D */}
            <div className="hidden 2xl:flex items-center justify-center py-1 lg:py-2 2xl:py-4">
              <div
                style={{ animationDelay: '350ms' }}
                className="relative z-0 -ml-20 w-full max-w-[470px] translate-y-5 rotate-[-2.5deg] animate-fade-slide-down transition-transform duration-500 ease-out hover:rotate-[-1deg] hover:scale-[1.015] xl:-ml-24 2xl:-ml-28 2xl:max-w-[620px] 2xl:translate-y-8"
              >
                <img
                  src={studyLounge3d}
                  alt="Minh họa học tập"
                  className="w-full rounded-[30px] border border-black/[0.04] object-cover shadow-[0_30px_80px_rgba(76,55,49,0.16)]"
                />
              </div>
            </div>

            <div className="relative z-10 min-w-0 flex-1">
              <TemplateMarketplace
                templates={templates}
                activeRooms={activeRooms}
                recentRooms={recentRooms}
                friendCode={friendCode}
                friendCodeCopied={friendCodeCopied}
                friendInputCode={friendInputCode}
                friendsWithStatus={friendsWithStatus}
                username={username}
                onJoinTemplateRoom={handleJoinTemplateRoom}
                onJoinRoom={handleJoinRoom}
                onRefreshRooms={requestActiveRooms}
                copyFriendCode={copyFriendCode}
                setFriendInputCode={setFriendInputCode}
                handleAddFriend={handleAddFriend}
                getAvatarColor={getAvatarColor}
                activityTicker={tickerPosts.length > 0 ? (
                  <div className="activity-ticker flex h-8 items-center overflow-hidden rounded-full border border-black/[0.05] bg-[#fbf6ef] px-4 py-1.5 shadow-xs">
                    <button
                      onClick={() => {
                        setSelectedPostId(tickerPosts[tickerIndex]?.id)
                        setShowHelpBoard(true)
                      }}
                      className={`ticker-inner ticker-${tickerPhase} ticker-clickable flex w-full items-center gap-2 text-left`}
                    >
                      <span className="ticker-icon flex items-center text-brand-terracotta">
                        <Megaphone size={12} strokeWidth={2.5} />
                      </span>
                      <span className="ticker-author shrink-0 text-xs font-bold text-brand-brown-dark">{tickerPosts[tickerIndex]?.username}</span>
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

      {/* Modal tạo phòng mới */}
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
              <h2 className="font-display font-black text-2xl text-brand-brown-dark tracking-tight">{t('landing.createModal.title')}</h2>
              <p className="text-xs font-semibold text-brand-brown-light/75 mt-1">{t('landing.createModal.subtitle')}</p>

              {/* Google Login button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                  } catch (err: any) {
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

              {/* Nickname input */}
              <div className="text-left">
                <label className="block text-[10px] font-black tracking-wider text-brand-brown-light/75 uppercase mb-1.5">{t('landing.createModal.nickname')}</label>
                <input
                  type="text"
                  value={modalNickname}
                  onChange={(e) => {
                    setModalNickname(e.target.value);
                    setUsername(e.target.value);
                  }}
                  placeholder={t('landing.createModal.nicknamePlaceholder')}
                  className="w-full h-12 rounded-xl bg-[#FAF6F0] border border-[#ECE6DB] px-4 text-sm font-bold text-brand-brown-dark outline-none focus:bg-white focus:border-[#D6CAB2] transition"
                />
                <span className="block text-[10px] font-bold text-brand-brown-light/60 italic mt-1.5">{t('landing.createModal.nicknameNote')}</span>
              </div>

              {/* Room Name input */}
              <div className="text-left mt-4">
                <label className="block text-[10px] font-black tracking-wider text-brand-brown-light/75 uppercase mb-1.5">{t('landing.createModal.roomName')}</label>
                <input
                  type="text"
                  value={modalRoomTitle}
                  onChange={(e) => setModalRoomTitle(e.target.value)}
                  placeholder={t('landing.createModal.roomPlaceholder')}
                  className="w-full h-12 rounded-xl bg-[#FAF6F0] border border-[#ECE6DB] px-4 text-sm font-bold text-brand-brown-dark outline-none focus:bg-white focus:border-[#D6CAB2] transition"
                />
              </div>

              {/* Mode & Password */}
              <div className="grid grid-cols-2 gap-4 mt-4 text-left">
                <div>
                  <label className="block text-[10px] font-black tracking-wider text-brand-brown-light/75 uppercase mb-1.5">{t('landing.createModal.mode')}</label>
                  <div className="flex gap-1 bg-[#FAF6F0] border border-[#ECE6DB] rounded-xl p-1 h-12 items-center">
                    <button
                      type="button"
                      onClick={() => setModalIsPrivate(true)}
                      className={`flex-1 flex h-full items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${modalIsPrivate ? 'bg-white text-brand-brown-dark shadow-sm border border-black/[0.04]' : 'text-brand-brown-light hover:text-brand-brown-dark'
                        }`}
                    >
                      <LockKeyhole size={14} /> {t('landing.createModal.private')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalIsPrivate(false)}
                      className={`flex-1 flex h-full items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${!modalIsPrivate ? 'bg-white text-brand-brown-dark shadow-sm border border-black/[0.04]' : 'text-brand-brown-light hover:text-brand-brown-dark'
                        }`}
                    >
                      <Globe2 size={14} /> {t('landing.createModal.public')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black tracking-wider text-brand-brown-light/75 uppercase mb-1.5">{t('landing.createModal.password')}</label>
                  <input
                    type="password"
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    disabled={!modalIsPrivate}
                    placeholder={modalIsPrivate ? t('landing.createModal.passwordRequired') : t('landing.createModal.noPassword')}
                    className={`w-full h-12 rounded-xl border px-4 text-sm font-bold text-brand-brown-dark outline-none transition ${modalIsPrivate
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
                className="mt-6 flex w-full h-12 items-center justify-center rounded-2xl bg-[#AB8B7C] text-sm font-black text-white hover:bg-brand-brown-dark shadow-md hover:shadow-lg transition cursor-pointer active:scale-[0.98]"
              >
                {t('landing.createModal.submit')}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
