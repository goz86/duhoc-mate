import type React from 'react'
import { Clock, Coffee, Copy, LogIn, Plus, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const firstOnlineFriend = friendsWithStatus.find(friend => friend.online && friend.currentRoomId)

  // Trang chủ giờ là lobby: tạo phòng nhanh ở trên, các phòng 24/24 là nội dung chính.
  return (
    <div className="min-h-screen w-full bg-[#faf7f2] text-brand-brown-dark">
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#faf7f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-terracotta text-white shadow-sm">
              <Sparkles size={17} />
            </div>
            <div>
              <p className="font-display text-base font-black leading-none">Duhoc Mate</p>
              <p className="mt-1 text-[11px] font-bold text-brand-brown-light">{onlineUsersCount} bạn đang học online</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 text-xs font-bold text-brand-brown-light md:flex">
              <Clock size={13} />
              {new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false })} KST
            </span>
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${getAvatarColor(profile?.username || username)}`}>
                  {(profile?.username || username).substring(0, 2).toUpperCase()}
                </div>
                <button onClick={signOut} className="rounded-lg px-3 py-2 text-xs font-black text-brand-brown-light hover:bg-white">
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true) }}
                  className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-xs font-black text-brand-brown-dark hover:border-brand-terracotta-light"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setShowAuthModal(true) }}
                  className="rounded-lg bg-brand-brown-dark px-3 py-2 text-xs font-black text-white hover:bg-brand-terracotta"
                >
                  {t('nav.register')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase text-brand-terracotta">Study command</p>
                  <h1 className="mt-1 font-display text-2xl font-black sm:text-3xl">
                    Hôm nay bạn muốn học cùng ai?
                  </h1>
                  <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-brand-brown-light">
                    Vào phòng 24/24, tạo phòng riêng hoặc nhập mã phòng của bạn bè.
                  </p>
                </div>
                <div className="hidden rounded-lg bg-[#f7f1ea] px-3 py-2 text-xs font-black text-brand-brown-light sm:block">
                  Study first, social second
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-black uppercase text-brand-brown-light">{t('landing.yourName')}</span>
                  <input
                    type="text"
                    placeholder={t('landing.namePlaceholder')}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="h-11 w-full rounded-xl border border-brand-terracotta-light/40 bg-[#faf7f2] px-4 text-sm font-bold text-brand-brown-dark outline-none transition focus:border-brand-terracotta-light focus:bg-white focus:ring-2 focus:ring-brand-terracotta/25"
                  />
                </label>

                <div className="flex items-end gap-2">
                  <button
                    onClick={handleCreateRoom}
                    className="h-11 rounded-xl bg-brand-terracotta px-4 text-sm font-black text-white shadow-sm transition hover:bg-brand-brown-dark"
                  >
                    <span className="inline-flex items-center gap-1.5"><Plus size={16} /> Tạo phòng</span>
                  </button>
                  <div className="flex h-11 overflow-hidden rounded-xl border border-brand-terracotta-light/40 bg-[#faf7f2]">
                    <input
                      type="text"
                      placeholder="Mã phòng"
                      value={roomId}
                      onChange={(event) => setRoomId(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleJoinRoom()}
                      className="w-28 bg-transparent px-3 text-center text-xs font-black uppercase text-brand-brown-dark outline-none"
                    />
                    <button onClick={() => handleJoinRoom()} className="border-l border-brand-terracotta-light/30 px-3 text-brand-terracotta hover:bg-white" title="Vào phòng">
                      <LogIn size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase text-brand-terracotta">Korea life</p>
                <h2 className="mt-1 font-display text-base font-black">Bảng hỗ trợ</h2>
                <p className="mt-1 text-sm leading-relaxed text-brand-brown-light">Nhà ở, việc làm, di chuyển, khẩn cấp và hỏi đáp cộng đồng.</p>
              </div>
              <button
                onClick={() => setShowHelpBoard(!showHelpBoard)}
                className="rounded-lg bg-brand-brown-dark px-3 py-2 text-xs font-black text-white hover:bg-brand-terracotta"
              >
                {showHelpBoard ? 'Ẩn' : 'Mở'}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-brand-brown-light">
              <span className="rounded-lg bg-[#faf7f2] px-3 py-2">Nhà ở</span>
              <span className="rounded-lg bg-[#faf7f2] px-3 py-2">Việc làm</span>
              <span className="rounded-lg bg-[#faf7f2] px-3 py-2">Di chuyển</span>
              <span className="rounded-lg bg-[#faf7f2] px-3 py-2">Khẩn cấp</span>
            </div>
          </aside>
        </section>

        {showHelpBoard && (
          <section className="mt-5 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
            <QuickHelpBoard />
          </section>
        )}

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <TemplateMarketplace
              templates={templates}
              activeRooms={activeRooms}
              onJoinTemplateRoom={handleJoinTemplateRoom}
              onJoinRoom={handleJoinRoom}
              onRefreshRooms={requestActiveRooms}
            />
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
              <h2 className="font-display text-base font-black">Phòng gần đây</h2>
              <div className="mt-3 space-y-2">
                {recentRooms.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-brand-terracotta-light/40 bg-[#faf7f2] p-4 text-center">
                    <Coffee size={22} className="mx-auto text-brand-terracotta/50" />
                    <p className="mt-2 text-xs font-bold text-brand-brown-light">{t('landing.noRecent')}</p>
                  </div>
                ) : (
                  recentRooms.slice(0, 4).map((room) => (
                    <button
                      key={room.id}
                      onClick={() => handleJoinRoom(room.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-black/[0.06] px-3 py-3 text-left hover:bg-[#faf7f2]"
                    >
                      <span className="text-sm font-black">{room.hostName}</span>
                      <span className="rounded-md bg-[#faf7f2] px-2 py-1 text-[10px] font-black text-brand-terracotta">{room.id}</span>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-black">{t('landing.friendsTitle')}</h2>
                {firstOnlineFriend && (
                  <button onClick={() => handleJoinRoom(firstOnlineFriend.currentRoomId || undefined)} className="text-xs font-black text-brand-terracotta">
                    Vào cùng
                  </button>
                )}
              </div>

              <div className="mt-3 rounded-xl border border-dashed border-brand-terracotta-light/35 bg-[#faf7f2] p-3">
                <p className="text-[10px] font-black uppercase text-brand-brown-light">{t('landing.friendCode')}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-black">{friendCode}</p>
                  <button onClick={copyFriendCode} className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1.5 text-[11px] font-black text-brand-terracotta">
                    <Copy size={12} />
                    {friendCodeCopied ? t('landing.copied') : t('landing.copyCode')}
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddFriend} className="mt-3 flex gap-2">
                <input
                  value={friendInputCode}
                  onChange={(event) => setFriendInputCode(event.target.value)}
                  placeholder="Nhập mã bạn bè"
                  className="min-w-0 flex-1 rounded-lg border border-black/[0.08] bg-[#faf7f2] px-3 py-2 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-brand-terracotta/25"
                />
                <button className="rounded-lg bg-brand-terracotta px-3 py-2 text-xs font-black text-white">Thêm</button>
              </form>

              <div className="mt-3 space-y-2">
                {friendsWithStatus.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-brand-terracotta-light/35 bg-[#faf7f2] p-4 text-center text-xs font-bold text-brand-brown-light">
                    Chưa có bạn bè nào.
                  </p>
                ) : (
                  friendsWithStatus.slice(0, 4).map((friend) => (
                    <button
                      key={friend.code}
                      onClick={() => friend.online && friend.currentRoomId && handleJoinRoom(friend.currentRoomId)}
                      className="flex w-full items-center gap-3 rounded-xl border border-black/[0.06] px-3 py-2 text-left hover:bg-[#faf7f2]"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-black ${getAvatarColor(friend.username)}`}>
                        {friend.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black">{friend.username}</p>
                        <p className="truncate text-[10px] font-bold text-brand-brown-light">{friend.online ? friend.currentSong || t('landing.online') : t('landing.offline')}</p>
                      </div>
                      <span className={`h-2 w-2 rounded-full ${friend.online ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                    </button>
                  ))
                )}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  )
}
