import { Crown, LogOut, Share2, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import duhocMateLogo from '../assets/duhoc-mate-logo-new.png'
import LanguageSwitcher from './LanguageSwitcher'

type HeaderMember = {
  id: string
  username: string
  isHost: boolean
  friendCode?: string
}

type RoomHeaderProps = {
  roomId: string
  copied: boolean
  members: HeaderMember[]
  currentSocketId?: string
  isHost: boolean
  onCopyRoomId: () => void
  onLeaveRoom: () => void
  onAddFriend: (member: HeaderMember) => void
  onTransferHost: (memberId?: string) => void
}

const initials = (name: string) => name.trim().slice(0, 2).toUpperCase() || 'DM'

export default function RoomHeader({
  roomId,
  copied,
  members,
  currentSocketId,
  isHost,
  onCopyRoomId,
  onLeaveRoom,
  onAddFriend,
  onTransferHost,
}: RoomHeaderProps) {
  const { t } = useTranslation()
  const [showMembers, setShowMembers] = useState(false)

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-brand-terracotta-light/20 bg-white/75 px-5 py-3 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-2">
          <img
            src={duhocMateLogo}
            alt="Duhoc Mate"
            className="h-9 w-9 min-w-9 shrink-0 rounded-[14px] object-cover shadow-sm ring-1 ring-black/[0.05]"
          />
          <span className="hidden font-display text-lg font-black text-brand-brown-dark sm:inline">
            Duhoc Mate
          </span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMembers(prev => !prev)}
            className="flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-white px-3 py-2 text-xs font-black text-brand-brown-dark shadow-sm transition hover:bg-brand-light whitespace-nowrap"
          >
            <Users size={15} className="text-brand-terracotta shrink-0" />
            <span className="hidden sm:inline">Bạn học</span>
            <span className="rounded-full bg-brand-terracotta/10 px-1.5 py-0.5 text-[10px] text-brand-terracotta">
              {members.length}
            </span>
            <span className="hidden -space-x-2 sm:flex">
              {members.slice(0, 3).map(member => (
                <span key={member.id} className="relative">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-brand-terracotta-light text-[9px] font-black text-brand-brown-dark ${
                      member.isHost ? 'ring-1 ring-amber-400' : ''
                    }`}
                    title={member.username + (member.isHost ? ' (Host)' : '')}
                  >
                    {initials(member.username)}
                  </span>
                  {member.isHost && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-amber-400 text-[6px]">
                      👑
                    </span>
                  )}
                </span>
              ))}
            </span>
          </button>

          {showMembers && (
            <div className="absolute left-0 top-12 z-50 w-80 rounded-3xl border border-brand-terracotta-light/20 bg-white p-3 shadow-2xl shadow-brand-brown-dark/10">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-black uppercase tracking-wider text-brand-brown-light">Danh sách bạn học</p>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                  {members.length} online
                </span>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between gap-3 rounded-2xl border border-brand-terracotta-light/10 bg-brand-light/35 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-white font-display text-xs font-black text-brand-brown-dark shadow-sm">
                          {initials(member.username)}
                        </div>
                        {member.isHost && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-400 text-[10px] text-white shadow-sm ring-1 ring-white">
                            👑
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="truncate text-sm font-black text-brand-brown-dark">{member.username}</p>
                          {member.isHost && (
                            <Crown size={12} className="text-amber-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-brand-brown-light">
                          {member.id === currentSocketId
                            ? (member.isHost ? 'Bạn (Host)' : 'Bạn')
                            : member.isHost ? 'Host' : 'Bạn học'}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {member.id !== currentSocketId && (
                        <button
                          type="button"
                          onClick={() => onAddFriend(member)}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-brand-terracotta-light/20 bg-white text-brand-terracotta transition hover:bg-brand-terracotta hover:text-white"
                          title="Thêm bạn"
                        >
                          <UserPlus size={14} />
                        </button>
                      )}
                      {isHost && member.id !== currentSocketId && (
                        <button
                          type="button"
                          onClick={() => onTransferHost(member.id)}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100"
                          title="Chuyển host"
                        >
                          <Crown size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-brand-light px-3 py-2 text-xs font-black text-brand-brown-dark whitespace-nowrap">
          <span className="hidden text-brand-brown-light sm:inline">Mã phòng:</span>
          <span className="font-mono text-brand-terracotta">{roomId}</span>
          <button
            type="button"
            onClick={onCopyRoomId}
            className="rounded-full p-1 text-brand-brown-light transition hover:bg-white hover:text-brand-brown-dark"
            aria-label="Sao chép mã phòng"
          >
            <Share2 size={15} />
          </button>
          {copied && <span className="text-green-600">{t('room.copied')}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher compact />
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-brand-light px-4 py-2.5 text-sm font-bold text-brand-brown-dark transition hover:bg-brand-terracotta-light/40"
        >
          <LogOut size={16} />
          <span className="hidden md:inline">{t('room.leaveRoom')}</span>
        </button>
      </div>
    </header>
  )
}
