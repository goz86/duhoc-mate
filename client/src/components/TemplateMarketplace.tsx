import type React from 'react'
import { useMemo, useState } from 'react'
import { Clock, Compass, Copy, Globe2, Headphones, LockKeyhole, Search, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RoomTemplate } from '../lib/communityTemplates'
import { getTemplateRoomId, seedRoomIds } from '../lib/templateRooms'

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
  memberCount?: number
  currentSong?: string
  roomTitle?: string
  isPrivate?: boolean
  hostAvatarUrl?: string
  roomAvatarUrl?: string
}

type FriendStatus = { code: string; username: string; online: boolean; currentRoomId: string | null; currentSong: string | null }
type LobbyTab = 'recent' | 'explore' | 'friends'

type Props = {
  templates: RoomTemplate[]
  activeRooms: ActiveRoom[]
  recentRooms: RecentRoom[]
  friendCode: string
  friendCodeCopied: boolean
  friendInputCode: string
  friendsWithStatus: FriendStatus[]
  username: string
  currentUserAvatarUrl?: string
  onJoinTemplateRoom: (template: RoomTemplate) => void | Promise<void>
  onJoinRoom: (roomId: string, password?: string, isGuestConfirmed?: boolean, guestUsername?: string, isPrivateParam?: boolean) => void | Promise<void>
  onRefreshRooms: () => void
  copyFriendCode: () => void
  setFriendInputCode: (value: string) => void
  handleAddFriend: (event: React.FormEvent) => void
  getAvatarColor: (name: string) => string
  activityTicker?: React.ReactNode
}

export default function TemplateMarketplace({
  templates,
  activeRooms,
  recentRooms,
  friendCode,
  friendCodeCopied,
  friendInputCode,
  friendsWithStatus,
  username,
  currentUserAvatarUrl,
  onJoinTemplateRoom,
  onJoinRoom,
  onRefreshRooms,
  copyFriendCode,
  setFriendInputCode,
  handleAddFriend,
  getAvatarColor,
  activityTicker,
}: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<LobbyTab>('explore')

  const topikTemplate = useMemo(() => templates.find(template => template.id === 'seed-topik-30'), [templates])
  const topikRoomId = topikTemplate ? getTemplateRoomId(topikTemplate) : 'TOPIK30'
  const topikActiveRoom = useMemo(
    () => activeRooms.find(room => room.id === topikRoomId),
    [activeRooms, topikRoomId]
  )
  const topikAvatarUrl = topikActiveRoom?.roomAvatarUrl || topikTemplate?.roomAvatarUrl || ''

  const visibleRecentRooms = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recentRooms.filter(room => {
      const haystack = [room.id, room.hostName, room.currentSong || '', room.roomTitle || ''].join(' ').toLowerCase()
      return !q || haystack.includes(q)
    })
  }, [recentRooms, query])

  const visibleFriends = useMemo(() => {
    const q = query.trim().toLowerCase()
    return friendsWithStatus.filter(friend => {
      const haystack = [friend.code, friend.username, friend.currentRoomId || '', friend.currentSong || ''].join(' ').toLowerCase()
      return !q || haystack.includes(q)
    })
  }, [friendsWithStatus, query])

  const visibleUserRooms = useMemo(() => {
    const q = query.trim().toLowerCase()
    return activeRooms
      .filter(room => {
        if (seedRoomIds.has(room.id)) return false
        const haystack = [room.id, room.hostName, room.currentSong || '', room.roomTitle || ''].join(' ').toLowerCase()
        return !q || haystack.includes(q)
      })
      .sort((a, b) => {
        const memberDiff = (b.memberCount || 0) - (a.memberCount || 0)
        if (memberDiff !== 0) return memberDiff
        return new Date(b.createdAt || b.lastActiveAt || 0).getTime() - new Date(a.createdAt || a.lastActiveAt || 0).getTime()
      })
  }, [activeRooms, query])

  const roomRole = (hostName: string) => hostName === username ? 'Chủ phòng' : 'Khách'
  const roomMeta = (hostName: string, memberCount?: number) => (
    <span className="inline-flex items-center gap-1">
      <span className="truncate">{hostName}</span>
      <span className="mx-0.5 text-black/10">|</span>
      <Users size={12} className="shrink-0" />
      <span>{memberCount ?? 0}</span>
      <span className="mx-0.5 text-black/10">|</span>
      <span className="shrink-0">{roomRole(hostName)}</span>
    </span>
  )
  const roomAvatarUrl = (hostName: string, avatarUrl?: string) =>
    avatarUrl || (hostName === username ? currentUserAvatarUrl || '' : '')

  const tabClass = (tab: LobbyTab) =>
    `inline-flex flex-1 items-center justify-center gap-1.5 rounded-[12px] px-2 sm:px-3 py-2 transition-all duration-200 whitespace-nowrap 2xl:py-2.5 ${activeTab === tab ? 'bg-white text-brand-brown-dark ring-2 ring-brand-brown-dark shadow-[0_1px_6px_rgba(76,55,49,0.08)]' : 'text-brand-brown-light hover:text-brand-brown-dark'}`

  const placeholder = {
    recent: t('landing.search.recent'),
    explore: t('landing.search.explore'),
    friends: t('landing.search.friends'),
  }[activeTab]

  return (
    <section className="landing-marketplace ml-auto flex h-[min(590px,calc(100svh-132px))] min-h-[500px] w-full max-w-[410px] flex-col gap-3 rounded-[24px] border border-black/[0.05] bg-white p-4 shadow-[0_18px_48px_rgba(76,55,49,0.07)] 2xl:h-[620px] 2xl:max-w-[430px] 2xl:gap-4 2xl:p-5">
      {activityTicker}

      <div className="rounded-[16px] border border-black/[0.05] bg-[#f7f2ec] p-1">
        <div className="flex gap-1 text-xs font-black">
          <button type="button" onClick={() => setActiveTab('recent')} className={tabClass('recent')}>
            <Clock size={13} />
            {t('landing.tabs.recent')}
          </button>
          <button type="button" onClick={() => setActiveTab('explore')} className={tabClass('explore')}>
            <Globe2 size={13} />
            {t('landing.tabs.explore')}
          </button>
          <button type="button" onClick={() => setActiveTab('friends')} className={tabClass('friends')}>
            <Headphones size={13} />
            {t('landing.tabs.friends')}
          </button>
        </div>
      </div>

      <label className="relative block">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown-light" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-[14px] border border-black/[0.08] bg-[#fbf6ef] px-11 text-sm font-bold text-brand-brown-dark outline-none transition focus:border-brand-terracotta-light focus:bg-white focus:ring-2 focus:ring-brand-terracotta/20"
        />
      </label>

      <div key={activeTab} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {activeTab === 'recent' && visibleRecentRooms.length === 0 && (
          <div className="h-full rounded-2xl border border-dashed border-brand-terracotta-light/45 bg-[#fbf6ef] p-6 text-center">
            <Clock size={26} className="mx-auto text-brand-terracotta/60" />
            <p className="mt-3 text-sm font-black text-brand-brown-dark">Chưa có phòng gần đây</p>
            <p className="mt-1 text-xs font-bold leading-relaxed text-brand-brown-light">
              Khi bạn vào phòng 24/24 hoặc nhập mã phòng, lịch sử sẽ hiện ở đây.
            </p>
          </div>
        )}

        {activeTab === 'recent' && visibleRecentRooms.map((room, index) => (
          <button
            key={room.id}
            onClick={() => onJoinRoom(room.id, undefined, undefined, undefined, room.isPrivate)}
            style={{ animationDelay: `${index * 50}ms` }}
            className="group animate-fade-slide-down flex w-full items-center gap-3 rounded-[15px] border border-black/[0.05] bg-white px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:shadow-sm"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-black/[0.06] bg-[#fbf6ef]">
              {roomAvatarUrl(room.hostName, room.roomAvatarUrl || room.hostAvatarUrl) ? (
                <img src={roomAvatarUrl(room.hostName, room.roomAvatarUrl || room.hostAvatarUrl)} alt={room.hostName} className="h-full w-full object-cover" />
              ) : (
                <div className={`flex h-full w-full items-center justify-center text-xs font-black ${getAvatarColor(room.hostName)}`}>
                  {room.hostName.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-black text-brand-brown-dark">{room.roomTitle || `Phòng của ${room.hostName}`}</p>
                {room.isPrivate && <LockKeyhole size={12} className="shrink-0 text-brand-terracotta" aria-label="Phòng riêng tư" />}
              </div>
              <p className="mt-0.5 truncate text-xs font-bold text-brand-brown-light/80">
                {roomMeta(room.hostName, room.memberCount)}
              </p>
            </div>
            <span className="flex-shrink-0 text-[11px] font-black uppercase text-brand-terracotta transition group-hover:text-brand-brown-dark">Vào phòng</span>
          </button>
        ))}

        {activeTab === 'explore' && topikTemplate && (
          <button
            type="button"
            onClick={() => onJoinTemplateRoom(topikTemplate)}
            style={{ animationDelay: '0ms' }}
            className="group animate-fade-slide-down flex w-full items-center gap-3 rounded-[15px] border border-black/[0.06] bg-white px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:shadow-sm"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-blue-100 bg-blue-50 text-blue-700">
              {topikAvatarUrl ? (
                <img src={topikAvatarUrl} alt="TOPIK" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-black">TOPIK</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-display text-sm font-black text-brand-brown-dark">Phòng ôn TOPIK</h3>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">24/24</span>
              </div>
              <p className="mt-1 truncate text-xs font-bold text-brand-brown-light">
                {roomMeta('Duhoc Mate', topikActiveRoom?.memberCount)}
              </p>
            </div>

            <span className="flex-shrink-0 rounded-xl px-3 py-2 text-[11px] font-black uppercase text-brand-terracotta transition group-hover:bg-[#fbf6ef] group-hover:text-brand-brown-dark">
              Vào phòng
            </span>
          </button>
        )}

        {activeTab === 'explore' && visibleUserRooms.map((room, index) => (
          <button
            key={room.id}
            onClick={() => onJoinRoom(room.id, undefined, undefined, undefined, room.isPrivate)}
            style={{ animationDelay: `${(index + (topikTemplate ? 1 : 0)) * 50}ms` }}
            className="group animate-fade-slide-down flex w-full items-center gap-3 rounded-[15px] border border-black/[0.05] bg-white px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:shadow-sm"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-black/[0.06] bg-[#fbf6ef]">
              {roomAvatarUrl(room.hostName, room.roomAvatarUrl || room.hostAvatarUrl) ? (
                <img src={roomAvatarUrl(room.hostName, room.roomAvatarUrl || room.hostAvatarUrl)} alt={room.hostName} className="h-full w-full object-cover" />
              ) : (
                <div className={`flex h-full w-full items-center justify-center text-xs font-black ${getAvatarColor(room.hostName)}`}>
                  {room.hostName.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-black text-brand-brown-dark">{room.roomTitle || `Phòng của ${room.hostName}`}</p>
                {room.isPrivate && <LockKeyhole size={12} className="shrink-0 text-brand-terracotta" aria-label="Phòng riêng tư" />}
              </div>
              <p className="mt-0.5 truncate text-xs font-bold text-brand-brown-light/80">
                {roomMeta(room.hostName, room.memberCount)}
              </p>
            </div>
            <span className="flex-shrink-0 text-[11px] font-black uppercase text-brand-terracotta transition group-hover:text-brand-brown-dark">Vào phòng</span>
          </button>
        ))}

        {activeTab === 'friends' && (
          <>
            <div className="rounded-[14px] border border-black/[0.06] bg-white px-3.5 py-3">
              <p className="text-[9px] font-black uppercase leading-none tracking-[0.08em] text-brand-brown-light">Mã bạn bè của bạn</p>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <p className="min-w-0 truncate font-mono text-[15px] font-black leading-none tracking-[0.22em] text-brand-brown-dark">{friendCode}</p>
                <button onClick={copyFriendCode} className="inline-flex h-8 flex-shrink-0 items-center gap-1 rounded-[10px] bg-brand-terracotta px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-brand-brown-dark">
                  <Copy size={12} />
                  {friendCodeCopied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            <form onSubmit={handleAddFriend} className="flex gap-2">
              <input
                value={friendInputCode}
                onChange={event => setFriendInputCode(event.target.value)}
                placeholder="Nhập mã bạn bè..."
                className="min-w-0 flex-1 rounded-xl border border-black/[0.08] bg-[#fbf6ef] px-3 py-2 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-brand-terracotta/25"
              />
              <button className="rounded-xl bg-brand-terracotta px-3 py-2 text-xs font-black text-white">Thêm</button>
            </form>

            {visibleFriends.length === 0 ? (
              <p className="rounded-[15px] border border-dashed border-brand-terracotta-light/35 bg-[#fbf6ef] p-5 text-center text-xs font-bold text-brand-brown-light">
                Chưa có bạn bè nào.
              </p>
            ) : (
              visibleFriends.map((friend, index) => (
                <button
                  key={friend.code}
                  onClick={() => friend.online && friend.currentRoomId && onJoinRoom(friend.currentRoomId)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="group animate-fade-slide-down flex w-full items-center gap-3 rounded-[15px] border border-black/[0.05] bg-white px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:shadow-sm"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-[14px] border text-xs font-black ${getAvatarColor(friend.username)}`}>
                    {friend.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-brand-brown-dark">{friend.username}</p>
                    <p className="truncate text-xs font-bold text-brand-brown-light">
                      <span className="inline-flex items-center gap-1">
                        <span className="truncate">{friend.username}</span>
                        <span className="mx-0.5 text-black/10">|</span>
                        <Users size={12} className="shrink-0" />
                        <span>{friend.currentRoomId ? 1 : 0}</span>
                        <span className="mx-0.5 text-black/10">|</span>
                        <span className="shrink-0">Khách</span>
                      </span>
                    </p>
                  </div>
                  <span className={`h-2.5 w-2.5 rounded-full ${friend.online ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                </button>
              ))
            )}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onRefreshRooms}
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-[14px] border border-black/[0.06] bg-[#fbf6ef] px-4 py-3 text-sm font-black text-brand-terracotta transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm active:translate-y-0"
      >
        <Compass size={15} strokeWidth={2.5} />
        {t('landing.expandExplore')}
      </button>
    </section>
  )
}
