import type React from 'react'
import { useMemo, useState } from 'react'
import { BookOpen, Clock, Copy, RefreshCw, Search } from 'lucide-react'
import type { RoomTemplate } from '../lib/communityTemplates'
import { seedRoomIds } from '../lib/templateRooms'

type ActiveRoom = { id: string; hostName: string; memberCount: number; currentSong?: string }
type RecentRoom = { id: string; hostName: string; currentSong?: string }
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
  onJoinTemplateRoom: (template: RoomTemplate) => void
  onJoinRoom: (roomId: string) => void
  onRefreshRooms: () => void
  copyFriendCode: () => void
  setFriendInputCode: (value: string) => void
  handleAddFriend: (event: React.FormEvent) => void
  getAvatarColor: (name: string) => string
}

export default function TemplateMarketplace({
  templates,
  activeRooms,
  recentRooms,
  friendCode,
  friendCodeCopied,
  friendInputCode,
  friendsWithStatus,
  onJoinTemplateRoom,
  onJoinRoom,
  onRefreshRooms,
  copyFriendCode,
  setFriendInputCode,
  handleAddFriend,
  getAvatarColor,
}: Props) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<LobbyTab>('explore')

  // Chỉ giữ một phòng 24/24 do hệ thống mở sẵn: TOPIK 30 ngày.
  const topikTemplate = useMemo(() => templates.find(template => template.id === 'seed-topik-30'), [templates])

  const visibleRecentRooms = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recentRooms.filter(room => {
      const haystack = [room.id, room.hostName, room.currentSong || ''].join(' ').toLowerCase()
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
    return activeRooms.filter(room => {
      if (seedRoomIds.has(room.id)) return false
      const haystack = [room.id, room.hostName, room.currentSong || ''].join(' ').toLowerCase()
      return !q || haystack.includes(q)
    })
  }, [activeRooms, query])

  const tabClass = (tab: LobbyTab) =>
    `rounded-xl px-3 py-2 transition ${activeTab === tab ? 'bg-white text-brand-terracotta shadow-sm' : 'hover:bg-white/70'}`

  const placeholder = {
    recent: 'Tìm phòng gần đây...',
    explore: 'Tìm phòng, chủ đề hoặc mã phòng...',
    friends: 'Tìm bạn bè...',
  }[activeTab]

  return (
    <section className="flex min-h-[430px] flex-col rounded-[28px] border border-black/[0.07] bg-white/84 p-5 shadow-[0_30px_90px_rgba(76,55,49,0.12)] backdrop-blur-xl">
      <div className="rounded-2xl border border-black/[0.06] bg-[#fbf6ef] p-1">
        <div className="grid grid-cols-3 gap-1 text-xs font-black text-brand-brown-light">
          <button type="button" onClick={() => setActiveTab('recent')} className={tabClass('recent')}>
            Gần đây
          </button>
          <button type="button" onClick={() => setActiveTab('explore')} className={tabClass('explore')}>
            Khám phá
          </button>
          <button type="button" onClick={() => setActiveTab('friends')} className={tabClass('friends')}>
            Bạn bè
          </button>
        </div>
      </div>

      <label className="relative mt-4 block">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown-light" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-2xl border border-black/[0.08] bg-[#fbf6ef] px-11 text-sm font-bold text-brand-brown-dark outline-none transition focus:border-brand-terracotta-light focus:bg-white focus:ring-2 focus:ring-brand-terracotta/20"
        />
      </label>

      <div className="mt-5 h-[230px] space-y-3 overflow-y-auto pr-1">
        {activeTab === 'recent' && visibleRecentRooms.length === 0 && (
          <div className="h-full rounded-2xl border border-dashed border-brand-terracotta-light/45 bg-[#fbf6ef] p-6 text-center">
            <Clock size={26} className="mx-auto text-brand-terracotta/60" />
            <p className="mt-3 text-sm font-black text-brand-brown-dark">Chưa có phòng gần đây</p>
            <p className="mt-1 text-xs font-bold leading-relaxed text-brand-brown-light">
              Khi bạn vào phòng 24/24 hoặc nhập mã phòng, lịch sử sẽ hiện ở đây.
            </p>
          </div>
        )}

        {activeTab === 'recent' && visibleRecentRooms.map(room => (
          <button
            key={room.id}
            onClick={() => onJoinRoom(room.id)}
            className="flex w-full items-center justify-between rounded-2xl border border-black/[0.06] bg-white px-4 py-3 text-left transition hover:border-brand-terracotta-light hover:shadow-sm"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-brand-brown-dark">{room.hostName}</span>
              <span className="mt-1 block truncate text-xs font-bold text-brand-brown-light">{room.currentSong || 'Phòng học tập'} · {room.id}</span>
            </span>
            <span className="rounded-xl bg-[#fbf6ef] px-3 py-2 text-[11px] font-black uppercase text-brand-terracotta">Vào</span>
          </button>
        ))}

        {activeTab === 'explore' && topikTemplate && (
          <article className="group flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-3 py-3 transition hover:border-brand-terracotta-light hover:shadow-sm">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700">
              <BookOpen size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-display text-sm font-black text-brand-brown-dark">{topikTemplate.title}</h3>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">24/24</span>
              </div>
              <p className="mt-1 truncate text-xs font-bold text-brand-brown-light">
                TOPIK30 · Đang mở sẵn · TOPIK
              </p>
            </div>

            <button
              onClick={() => onJoinTemplateRoom(topikTemplate)}
              className="flex-shrink-0 rounded-xl px-3 py-2 text-[11px] font-black uppercase text-brand-terracotta transition hover:bg-[#fbf6ef]"
            >
              Vào phòng
            </button>
          </article>
        )}

        {activeTab === 'explore' && visibleUserRooms.map(room => (
          <button
            key={room.id}
            onClick={() => onJoinRoom(room.id)}
            className="flex w-full items-center justify-between rounded-2xl border border-black/[0.06] bg-white px-4 py-3 text-left transition hover:border-brand-terracotta-light hover:shadow-sm"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-brand-brown-dark">Phòng của {room.hostName}</span>
              <span className="mt-1 block truncate text-xs font-bold text-brand-brown-light">{room.memberCount} người · {room.currentSong || 'Study room'}</span>
            </span>
            <span className="rounded-lg bg-[#fbf6ef] px-2 py-1 text-[10px] font-black text-brand-terracotta">{room.id}</span>
          </button>
        ))}

        {activeTab === 'friends' && (
          <>
            <div className="rounded-2xl border border-dashed border-brand-terracotta-light/35 bg-[#fbf6ef] p-4">
              <p className="text-[10px] font-black uppercase text-brand-brown-light">Mã bạn bè của bạn</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="font-mono text-sm font-black text-brand-brown-dark">{friendCode}</p>
                <button onClick={copyFriendCode} className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-[11px] font-black text-brand-terracotta shadow-sm">
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
              <p className="rounded-2xl border border-dashed border-brand-terracotta-light/35 bg-[#fbf6ef] p-5 text-center text-xs font-bold text-brand-brown-light">
                Chưa có bạn bè nào.
              </p>
            ) : (
              visibleFriends.map(friend => (
                <button
                  key={friend.code}
                  onClick={() => friend.online && friend.currentRoomId && onJoinRoom(friend.currentRoomId)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-3 py-3 text-left transition hover:border-brand-terracotta-light hover:shadow-sm"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-black ${getAvatarColor(friend.username)}`}>
                    {friend.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-brand-brown-dark">{friend.username}</p>
                    <p className="truncate text-xs font-bold text-brand-brown-light">
                      {friend.online ? friend.currentSong || 'Đang online' : 'Offline'}
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
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl border border-black/[0.06] bg-[#fbf6ef] px-4 py-3 text-sm font-black text-brand-terracotta transition hover:bg-white"
      >
        <RefreshCw size={15} />
        Cập nhật danh sách phòng
      </button>
    </section>
  )
}
