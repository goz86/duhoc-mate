import type React from 'react'
import { Clock, LogIn, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import studyLounge3d from '../assets/study-lounge-3d.png'
import duhocMateLogo from '../assets/duhoc-mate-logo.png'
import LanguageSwitcher from './LanguageSwitcher'
import QuickHelpBoard from './QuickHelpBoard'
import TemplateMarketplace from './TemplateMarketplace'
import type { RoomTemplate } from '../lib/communityTemplates'

type AuthMode = 'login' | 'register'

type ActiveRoom = { id: string; hostName: string; memberCount: number; currentSong?: string }
type RecentRoom = { id: string; hostName: string; currentSong?: string }
type FriendStatus = { code: string; username: string; online: boolean; currentRoomId: string | null; currentSong: string | null }

type LandingPageProps = {
  username: string
  setUsername: (value: string) => void
  roomId: string
  setRoomId: (value: string) => void
  onlineUsersCount: number
  user: unknown
  profile: { username?: string } | null
  signOut: () => void
  setAuthMode: (mode: AuthMode) => void
  setShowAuthModal: (show: boolean) => void
  getAvatarColor: (name: string) => string
  handleCreateRoom: () => void
  handleJoinRoom: (roomId?: string) => void
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

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#fbf6ef] text-brand-brown-dark">
      <header className="sticky top-0 z-50 border-b border-black/[0.05] bg-[#fbf6ef]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1560px] items-center justify-between px-5 py-4 xl:px-8">
          <div className="flex items-center gap-3">
            <img src={duhocMateLogo} alt="Duhoc Mate Logo" className="h-10 w-10 rounded-xl object-cover shadow-sm bg-white border border-black/[0.04]" />
            <div>
              <p className="font-display text-lg font-black leading-none">Duhoc Mate</p>
              <p className="mt-1 hidden text-xs font-bold text-brand-brown-light sm:block">{onlineUsersCount} bạn đang học online</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-brand-brown-light shadow-sm md:flex">
              <Clock size={13} />
              {new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false })} KST
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

      <main className="mx-auto max-w-[1560px] px-5 py-8 xl:px-8">
        {/* Sub-Header Navigation Tab Bar */}
        <div className="mb-6 flex gap-5 overflow-x-auto border-b border-black/[0.06] pb-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:mb-8 sm:gap-6 sm:pb-4 [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setShowHelpBoard(false)}
            className={`shrink-0 whitespace-nowrap pb-2.5 text-sm font-black transition-all cursor-pointer relative ${
              !showHelpBoard
                ? 'text-brand-brown-dark border-b-2 border-brand-terracotta'
                : 'text-brand-brown-light hover:text-brand-brown-dark'
            }`}
          >
            🏫 Phòng học đồng bộ
          </button>
          <button
            onClick={() => setShowHelpBoard(true)}
            className={`shrink-0 whitespace-nowrap pb-2.5 text-sm font-black transition-all cursor-pointer relative ${
              showHelpBoard
                ? 'text-brand-brown-dark border-b-2 border-brand-terracotta'
                : 'text-brand-brown-light hover:text-brand-brown-dark'
            }`}
          >
            🇰🇷 Hỗ trợ đời sống Hàn Quốc
          </button>
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 whitespace-nowrap pb-2.5 text-sm font-black text-brand-brown-light hover:text-brand-brown-dark transition-all inline-flex items-center gap-1.5"
          >
            💳 Tính lương Alba <span className="text-[10px]">↗</span>
          </a>
        </div>

        {showHelpBoard ? (
          <section className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-sm">
            <QuickHelpBoard />
          </section>
        ) : (
          <section className="relative mt-2 grid min-w-0 gap-8 lg:mt-4 lg:min-h-[560px] lg:grid-cols-[1fr_0.6fr] lg:items-stretch">
            <div className="relative flex min-w-0 items-center py-2 lg:py-6">
              <div className="relative z-10 min-w-0 lg:max-w-[480px]">
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-terracotta">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-terracotta animate-pulse" />
                  REAL-TIME SYNC
                </div>

                <h1 className="mt-5 font-display text-4xl font-black leading-[1.07] tracking-tight text-brand-brown-dark sm:text-5xl lg:mt-6 lg:text-[52px] lg:leading-[1.05]">
                  <span className="lg:whitespace-nowrap">Cùng nhau học tập</span> <br />
                  <span className="text-brand-terracotta">sẻ chia hành trình</span>
                </h1>
                <p className="mt-4 max-w-md text-sm font-semibold leading-relaxed text-brand-brown-dark/75 sm:text-base lg:mt-5">
                  Tạo phòng học, nghe nhạc YouTube đồng bộ, mở Idea Board và vào phòng TOPIK 24/24.
                </p>

                {/* Tên của bạn input inline */}
                <div className="mt-7 flex w-fit items-center gap-2.5 rounded-full border border-black/[0.05] bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-brown-light">{t('landing.yourName')}</span>
                  <input
                    type="text"
                    placeholder={t('landing.namePlaceholder')}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-32 bg-transparent text-xs font-bold text-brand-brown-dark outline-none focus:ring-0"
                  />
                </div>

                {/* Hai nút pill lớn bằng nhau (phong cách Lissenly) */}
                <div className="relative z-20 mt-4 flex w-full max-w-md flex-col gap-3 sm:max-w-lg sm:flex-row">
                  <button
                    onClick={handleCreateRoom}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-terracotta px-6 text-base font-black text-white shadow-lg shadow-brand-terracotta/25 transition hover:bg-brand-brown-dark sm:flex-1"
                  >
                    <Plus size={18} />
                    Tạo phòng học
                  </button>

                  <div className="flex h-14 w-full items-center rounded-full border border-black/[0.1] bg-white px-5 shadow-sm transition hover:border-brand-terracotta-light sm:flex-1">
                    <input
                      type="text"
                      placeholder="Tham gia phòng mã ẩn"
                      value={roomId}
                      onChange={(event) => setRoomId(event.target.value.toUpperCase())}
                      onKeyDown={(event) => event.key === 'Enter' && handleJoinRoom()}
                      className="min-w-0 flex-1 bg-transparent text-sm font-bold text-brand-brown-dark outline-none placeholder:font-bold placeholder:text-brand-brown-light/70"
                    />
                    <button onClick={() => handleJoinRoom()} className="ml-2 shrink-0 text-brand-terracotta transition hover:text-brand-brown-dark" title="Vào phòng">
                      <LogIn size={17} />
                    </button>
                  </div>
                </div>

                {/* Badges flex row */}
                <div className="relative z-20 mt-5 flex flex-wrap gap-2">
                  {[
                    {
                      icon: (
                        <svg className="h-[15px] w-[15px] text-brand-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <circle cx="12" cy="12" r="9" />
                          <circle cx="12" cy="12" r="3" />
                          <path strokeLinecap="round" d="M12 7a5 5 0 0 1 5 5" />
                        </svg>
                      ),
                      label: 'YouTube Music'
                    },
                    {
                      icon: (
                        <svg className="h-[15px] w-[15px] text-brand-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ),
                      label: 'Học cùng nhau'
                    },
                    {
                      icon: (
                        <svg className="h-[15px] w-[15px] text-brand-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <circle cx="12" cy="12" r="9" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2M12 19v2M3 12h2M19 12h2" />
                        </svg>
                      ),
                      label: 'Đồng bộ thời gian thực'
                    }
                  ].map(item => (
                    <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-black/[0.05] bg-white/90 px-3.5 py-2 text-xs font-bold text-brand-brown-light shadow-sm">
                      {item.icon}
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Minh họa 3D — ẩn trên mobile, neo góc dưới-phải cột trái, đè sau các nút (phong cách Lissenly) */}
              <img
                src={studyLounge3d}
                alt="Minh họa học tập"
                className="pointer-events-none absolute bottom-0 right-0 z-0 hidden w-[300px] object-contain drop-shadow-[0_35px_50px_rgba(76,55,49,0.18)] lg:block xl:right-[-24px] xl:w-[340px]"
              />
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
                onJoinTemplateRoom={handleJoinTemplateRoom}
                onJoinRoom={handleJoinRoom}
                onRefreshRooms={requestActiveRooms}
                copyFriendCode={copyFriendCode}
                setFriendInputCode={setFriendInputCode}
                handleAddFriend={handleAddFriend}
                getAvatarColor={getAvatarColor}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
