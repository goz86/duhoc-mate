import type React from 'react'
import { Clock, Home, LogIn, Map, Music2, Plus, Sparkles, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import studyLounge from '../assets/study-lounge.svg'
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
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 xl:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-terracotta text-white shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-display text-lg font-black leading-none">Duhoc Mate</p>
              <p className="mt-1 text-xs font-bold text-brand-brown-light">{onlineUsersCount} bạn đang học online</p>
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
                  className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-xs font-black text-brand-brown-dark shadow-sm hover:border-brand-terracotta-light"
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

      <main className="mx-auto max-w-[1500px] px-5 py-8 xl:px-8">
        <section className="rounded-3xl border border-black/[0.06] bg-white/78 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase text-brand-terracotta">Hỗ trợ đời sống</p>
              <h2 className="mt-1 font-display text-xl font-black">Bảng hỗ trợ cuộc sống Hàn Quốc</h2>
              <p className="mt-1 text-sm leading-relaxed text-brand-brown-light">
                Nhà ở, việc làm, di chuyển, khẩn cấp và hỏi đáp cộng đồng.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="grid grid-cols-2 gap-2 text-xs font-black text-brand-brown-light sm:flex">
                <span className="inline-flex items-center gap-1 rounded-xl bg-[#faf7f2] px-3 py-2"><Home size={13} /> Nhà ở</span>
                <span className="rounded-xl bg-[#faf7f2] px-3 py-2">Việc làm</span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-[#faf7f2] px-3 py-2"><Map size={13} /> Di chuyển</span>
                <span className="rounded-xl bg-[#faf7f2] px-3 py-2">Khẩn cấp</span>
              </div>
              <button
                onClick={() => setShowHelpBoard(!showHelpBoard)}
                className="rounded-xl bg-brand-brown-dark px-4 py-3 text-xs font-black text-white hover:bg-brand-terracotta"
              >
                {showHelpBoard ? 'Ẩn bảng' : 'Mở bảng'}
              </button>
            </div>
          </div>
        </section>

        {showHelpBoard && (
          <section className="mt-5 overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-sm">
            <QuickHelpBoard />
          </section>
        )}

        <section className="relative mt-8 grid min-h-[620px] min-w-0 gap-8 overflow-hidden lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="relative z-10 min-w-0 py-8 lg:py-12">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-brand-terracotta">
              <span className="h-2 w-2 rounded-full bg-brand-terracotta" />
              Phòng học đồng bộ
            </div>

            <div className="mt-8 max-w-3xl">
              <h1 className="font-display text-4xl font-black leading-[1.05] text-brand-brown-dark sm:text-6xl lg:text-7xl">
                Học cùng nhau, nhẹ hơn mỗi ngày.
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-brand-brown-dark/78">
                Tạo phòng học, nghe nhạc YouTube đồng bộ, mở Idea Board và vào phòng TOPIK 24/24.
              </p>
            </div>

            <div className="relative mt-8 max-w-3xl">
              <img
                src={studyLounge}
                alt="Minh họa bàn học trực tuyến"
                className="pointer-events-none absolute left-[52%] top-6 z-0 hidden w-[470px] rounded-[30px] opacity-70 shadow-[0_28px_80px_rgba(83,61,54,0.08)] lg:block xl:left-[56%]"
              />

              <div className="relative z-10 grid w-full max-w-xl gap-3 rounded-3xl border border-black/[0.06] bg-white/82 p-3 shadow-[0_22px_70px_rgba(76,55,49,0.10)] backdrop-blur-xl sm:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="mb-1.5 block px-1 text-[11px] font-black uppercase text-brand-brown-light">{t('landing.yourName')}</span>
                  <input
                    type="text"
                    placeholder={t('landing.namePlaceholder')}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-brand-terracotta-light/40 bg-[#fffaf5] px-4 text-sm font-bold text-brand-brown-dark outline-none transition focus:border-brand-terracotta-light focus:bg-white focus:ring-2 focus:ring-brand-terracotta/20"
                  />
                </label>

                <div className="flex flex-wrap items-end gap-2">
                  <button
                    onClick={handleCreateRoom}
                    className="h-12 flex-1 rounded-2xl bg-brand-terracotta px-5 text-sm font-black text-white shadow-lg shadow-brand-terracotta/20 transition hover:bg-brand-brown-dark sm:flex-none"
                  >
                    <span className="inline-flex items-center gap-2"><Plus size={17} /> Tạo phòng</span>
                  </button>
                  <div className="flex h-12 overflow-hidden rounded-2xl border border-brand-terracotta-light/40 bg-[#fffaf5]">
                    <input
                      type="text"
                      placeholder="Mã phòng"
                      value={roomId}
                      onChange={(event) => setRoomId(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleJoinRoom()}
                      className="w-32 bg-transparent px-3 text-center text-xs font-black uppercase text-brand-brown-dark outline-none"
                    />
                    <button onClick={() => handleJoinRoom()} className="border-l border-brand-terracotta-light/30 px-3 text-brand-terracotta hover:bg-white" title="Vào phòng">
                      <LogIn size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-6 flex flex-wrap gap-3">
                {[
                  { icon: Music2, label: 'Nhạc YouTube' },
                  { icon: Users, label: 'Học cùng nhau' },
                  { icon: Clock, label: 'Pomodoro & bảng ý tưởng' },
                ].map(item => {
                  const Icon = item.icon
                  return (
                    <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/84 px-4 py-2 text-sm font-bold text-brand-brown-light shadow-sm">
                      <Icon size={15} className="text-brand-terracotta" />
                      {item.label}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="relative z-10 min-w-0">
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
      </main>
    </div>
  )
}
