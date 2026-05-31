import {
  BookOpen,
  Coffee,
  Crown,
  Flame,
  Heart,
  Keyboard,
  Laugh,
  MicOff,
  Moon,
  Pause,
  Phone,
  PhoneOff,
  Play,
  RotateCcw,
  Timer,
  Users,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type StudyMember = {
  id: string
  username: string
  isHost: boolean
  avatarUrl?: string
  role?: string
}

type PomodoroState = {
  timeLeft: number
  duration: number
  isRunning: boolean
  isBreak: boolean
  lastUpdated?: number
}

type StudyTableSeat = {
  memberId: string
  username: string
  isHost: boolean
  joinedAt: number
  active?: boolean
  status?: string
  personalPomodoro?: PomodoroState
}

type StudyTableReaction = {
  id: string
  memberId: string
  label: string
  createdAt: number
  senderId?: string
  senderName?: string
}

type StudyTableState = {
  seats?: Record<string, StudyTableSeat>
  reactions?: StudyTableReaction[]
}

type ChatMessage = {
  id: string
  sender: string
  senderId?: string
  text: string
  timestamp: string
  sentAt?: number  // unix ms
}

type StudyTableStageProps = {
  members: StudyMember[]
  username: string
  currentSocketId?: string
  studyTable?: StudyTableState
  jitsiActive: boolean
  pomodoro: PomodoroState
  chatMessages?: ChatMessage[]
  onToggleJitsi: () => void
  onControlPomodoro: (action: 'start' | 'pause' | 'reset', isBreak?: boolean) => void
  onStudyReaction?: (label: string, targetMemberId?: string) => void
  onPersonalPomodoro?: (action: 'start' | 'pause' | 'reset', isBreak?: boolean) => void
  clockOffset?: number
}

const seatPalette = [
  { avatar: 'from-[#5F9EA0] via-[#3F8F91] to-[#2F6F73]', desk: 'from-[#BEE7E8] to-[#E7F6F2]', accent: '#28BFB0' },
  { avatar: 'from-[#D79575] via-[#BE7566] to-[#8F544B]', desk: 'from-[#FFE2D4] to-[#FFF5EA]', accent: '#C56F5F' },
  { avatar: 'from-[#8EA36B] via-[#738D56] to-[#516B45]', desk: 'from-[#DDECC8] to-[#F7F2D7]', accent: '#7B9F56' },
  { avatar: 'from-[#D6A85F] via-[#BD8545] to-[#8C5F3D]', desk: 'from-[#FFE6B8] to-[#FFF7DE]', accent: '#D4943B' },
]

const statusCycle: Array<{ label: string; Icon: LucideIcon; tone: string }> = [
  { label: 'đang gõ phím', Icon: Keyboard, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' },
  { label: 'tập trung sâu', Icon: VolumeX, tone: 'text-sky-700 bg-sky-50 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30' },
  { label: 'đang đọc tài liệu', Icon: BookOpen, tone: 'text-amber-700 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' },
  { label: 'nghỉ một chút', Icon: Coffee, tone: 'text-orange-700 bg-orange-50 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30' },
  { label: 'away', Icon: Moon, tone: 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800/40' },
]

const reactionOptions: Array<{ label: string; Icon: LucideIcon; tone: string }> = [
  { label: 'Cố lên', Icon: Flame, tone: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30' },
  { label: 'Nghỉ chút', Icon: Coffee, tone: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30' },
  { label: 'Thích', Icon: Heart, tone: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30' },
  { label: 'Haha', Icon: Laugh, tone: 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30' },
]

const initials = (name: string) => name.trim().slice(0, 2).toUpperCase() || 'DM'

// hash ổn định từ id → seed cho hướng bay reaction (không đổi mỗi render)
const hashSeed = (str: string) => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

const formatMinuteTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`
}

const formatDeskTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`
    : `${minutes}:${rest.toString().padStart(2, '0')}`
}

export default function StudyTableStage({
  members,
  username,
  currentSocketId = '',
  studyTable,
  jitsiActive,
  pomodoro,
  chatMessages = [],
  onToggleJitsi,
  onControlPomodoro,
  onStudyReaction,
  onPersonalPomodoro,
  clockOffset = 0,
}: StudyTableStageProps) {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => Date.now())
  const [seatFilter, setSeatFilter] = useState<'all' | 'focus' | 'break'>('all')

  const myMember = members.find(m => m.id === currentSocketId)
  const myRole = myMember?.role || (myMember?.isHost ? 'host' : 'member')
  const canControlPomodoro = myRole === 'host' || myRole === 'cohost'

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const seats = useMemo(() => {
    const serverSeats = studyTable?.seats || {}
    const baseMembers = members.length > 0
      ? members
      : [{ id: currentSocketId || 'local-preview', username: username || 'Bạn học', isHost: true }]

    return baseMembers.map(member => {
      const serverSeat = serverSeats[member.id]

      return {
        ...member,
        study: serverSeat || {
          memberId: member.id,
          username: member.username,
          isHost: member.isHost,
          joinedAt: now,
          active: true,
          status: 'focus',
          personalPomodoro: {
            timeLeft: 25 * 60,
            duration: 25 * 60,
            isRunning: false,
            isBreak: false,
          },
        },
      }
    }).filter(member => member.study.active !== false)
  }, [currentSocketId, members, now, studyTable?.seats, username])

  const sortedSeats = useMemo(() => {
    return [...seats].sort((a, b) => {
      if (a.id === currentSocketId) return -1
      if (b.id === currentSocketId) return 1
      if (a.isHost !== b.isHost) return a.isHost ? -1 : 1
      const aRunning = a.study.personalPomodoro?.isRunning ? 1 : 0
      const bRunning = b.study.personalPomodoro?.isRunning ? 1 : 0
      return bRunning - aRunning
    })
  }, [currentSocketId, seats])

  const focusCount = seats.filter(member => member.study.personalPomodoro?.isRunning && !member.study.personalPomodoro?.isBreak).length
  const breakCount = seats.filter(member => member.study.personalPomodoro?.isBreak).length
  const filteredSeats = useMemo(() => {
    if (seatFilter === 'focus') {
      return sortedSeats.filter(member => member.study.personalPomodoro?.isRunning && !member.study.personalPomodoro?.isBreak)
    }
    if (seatFilter === 'break') {
      return sortedSeats.filter(member => member.study.personalPomodoro?.isBreak)
    }
    return sortedSeats
  }, [seatFilter, sortedSeats])

  const layoutMode = seats.length >= 13 ? 'micro' : seats.length >= 7 ? 'dense' : seats.length >= 3 ? 'compact' : 'roomy'
  const isCrowded = layoutMode === 'dense' || layoutMode === 'micro'
  const isMicro = layoutMode === 'micro'
  const gridClass = layoutMode === 'micro'
    ? 'grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]'
    : layoutMode === 'dense'
      ? 'grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]'
      : layoutMode === 'compact'
        ? 'grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]'
        : 'grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(min(100%,260px),320px))]'

  const visibleReactions = useMemo(() => {
    const serverNow = now + clockOffset
    const cutoff = serverNow - 3800
    return (studyTable?.reactions || []).filter(reaction => reaction.createdAt >= cutoff)
  }, [now, studyTable?.reactions, clockOffset])

  // Chat bubbles: show last message per sender for 3s (dùng sentAt ms, fallback id prefix)
  const chatBubbles = useMemo(() => {
    const bubbles: Record<string, string> = {}
    const serverNow = now + clockOffset
    const cutoff = serverNow - 3000
    chatMessages.forEach(msg => {
      if (!msg.senderId) return
      // sentAt là unix ms từ server; nếu không có thì parse từ id "timestamp-random"
      const msgTime = msg.sentAt ?? parseInt(msg.id?.split('-')[0] ?? '0', 10)
      if (msgTime >= cutoff) {
        bubbles[msg.senderId] = msg.text
      }
    })
    return bubbles
  }, [chatMessages, now, clockOffset])

  const handleReaction = (option: typeof reactionOptions[number], targetMemberId: string) => {
    onStudyReaction?.(option.label, targetMemberId)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-black leading-tight text-brand-brown-dark">Bàn học chung</h2>
          <p className="mt-1 text-sm leading-relaxed text-brand-brown-light">
            Cùng ngồi học, theo dõi thời gian hiện diện, Pomodoro cá nhân và gửi biểu cảm động viên cho nhau.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
            <MicOff size={14} />
            Mặc định tắt mic
          </span>
          <button
            type="button"
            onClick={onToggleJitsi}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black text-white transition ${
              jitsiActive ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-terracotta hover:bg-brand-brown-dark'
            }`}
          >
            {jitsiActive ? <PhoneOff size={14} /> : <Phone size={14} />}
            {jitsiActive ? 'Rời bàn học' : 'Ngồi vào bàn'}
          </button>
        </div>
      </div>

      <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="relative min-h-[360px] rounded-[28px] border border-brand-terracotta-light/20 bg-[#FDF8F0] p-3 shadow-[0_24px_70px_rgba(76,55,49,0.08)] sm:min-h-[430px] sm:p-5 xl:min-h-[460px]">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] study-stage-overlay" />
          <div className="pointer-events-none absolute inset-x-4 bottom-4 top-8 rounded-[30px] border border-white/50 bg-white/20 [background-image:linear-gradient(rgba(167,122,108,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(167,122,108,0.07)_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="relative z-10 flex min-h-[330px] flex-col sm:min-h-[390px] xl:min-h-[420px]">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-white/70 px-3 py-1.5 text-[11px] font-black text-brand-brown-light">
                <Users size={13} />
                {seats.length} ghế đang học
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[11px] font-black text-sky-700">
                <Timer size={13} />
                {focusCount} đang Pomodoro
              </span>
              {isCrowded && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-700">
                  <Users size={13} />
                  Chế độ phòng đông
                </span>
              )}
              <div className="ml-0 flex w-full gap-1 rounded-2xl border border-brand-terracotta-light/15 bg-white/70 p-1 sm:ml-auto sm:w-auto">
                {[
                  { key: 'all', label: 'Tất cả', count: seats.length },
                  { key: 'focus', label: 'Focus', count: focusCount },
                  { key: 'break', label: 'Nghỉ', count: breakCount },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSeatFilter(item.key as typeof seatFilter)}
                    className={`flex-1 rounded-xl px-2.5 py-1.5 text-[10px] font-black transition sm:flex-none ${
                      seatFilter === item.key
                        ? 'bg-brand-terracotta text-white shadow-sm'
                        : 'text-brand-brown-light hover:bg-brand-light'
                    }`}
                  >
                    {item.label} <span className="opacity-75">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              {/* overflow-visible để chat bubble không bị cắt bởi card bên trên */}
              <div className={`relative grid max-h-[min(62vh,620px)] w-full ${gridClass} content-start gap-2 overflow-y-auto overflow-x-visible pr-1 sm:gap-3 xl:gap-4`}>
                {filteredSeats.length === 0 && (
                  <div className="col-span-full rounded-3xl border border-dashed border-brand-terracotta-light/35 bg-white/65 px-5 py-8 text-center">
                    <p className="font-display text-sm font-black text-brand-brown-dark">Chưa có ai trong nhóm này</p>
                    <p className="mt-1 text-xs font-bold text-brand-brown-light">Đổi bộ lọc để xem các ghế khác trong phòng.</p>
                  </div>
                )}
                {filteredSeats.map((member, index) => {
                  const palette = seatPalette[index % seatPalette.length]
                  // Elapsed time: trừ đi tổng thời gian nghỉ (rời bàn / tab ẩn)
                  const totalPausedMs = (member.study as any).totalPausedMs || 0
                  const pausedSince = (member.study as any).pausedSince
                  const isSeated = member.study.active !== false
                  const serverNow = now + clockOffset
                  const rawMs = isSeated
                    ? serverNow - (member.study.joinedAt || serverNow) - totalPausedMs
                    : (pausedSince || serverNow) - (member.study.joinedAt || serverNow) - totalPausedMs
                  const elapsed = Math.max(0, Math.floor(rawMs / 1000))

                  // Chat bubble for this member
                  const chatBubble = chatBubbles[member.id]

                  const personal = member.study.personalPomodoro || {
                    timeLeft: 25 * 60,
                    duration: 25 * 60,
                    isRunning: false,
                    isBreak: false,
                  }
                  const isPersonalBreak = personal.isBreak
                  const personalLeft = Math.max(0, personal.timeLeft)
                  const personalProgress = personal.duration > 0
                    ? ((personal.duration - personalLeft) / personal.duration) * 100
                    : 0
                  const status = personal.isRunning
                    ? { label: 'Tập trung', Icon: statusCycle[1].Icon, tone: 'text-sky-700 bg-sky-50 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30' }
                    : personal.isBreak
                      ? { label: 'Giải lao', Icon: statusCycle[3].Icon, tone: 'text-amber-700 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' }
                      : { label: 'Sẵn sàng', Icon: statusCycle[0].Icon, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' }
                  const isLocal = member.id === currentSocketId || member.username === username
                  const activeReactions = visibleReactions.filter(item => item.memberId === member.id)

                  return (
                    <article
                      key={member.id}
                      className={`group relative w-full rounded-[22px] border border-white/70 bg-white/86 shadow-[0_14px_32px_rgba(76,55,49,0.10)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(76,55,49,0.13)] ${isMicro ? 'p-2.5' : isCrowded ? 'p-3' : 'p-3.5'}`}
                    >
                      {/* Chat bubble – overlay bên trong card, không gây layout shift */}
                      {chatBubble && (
                        <div className="absolute inset-x-3 top-3 z-40 flex animate-fade-in items-center justify-center">
                          <div className="max-w-full truncate rounded-2xl border border-white/80 bg-white/95 px-3 py-1.5 text-[11px] font-bold text-brand-brown-dark shadow-lg backdrop-blur-sm">
                            💬 {chatBubble}
                          </div>
                        </div>
                      )}

                      <div className={`absolute inset-x-3 top-3 ${isMicro ? 'h-14' : isCrowded ? 'h-16' : 'h-20'} rounded-[20px] bg-gradient-to-br ${palette.desk} desk-overlay`} />
                      {!isMicro && (
                        <>
                          <div className="absolute right-4 top-4 h-6 w-12 rounded-full border border-white/70 bg-white/65" />
                          <div className="absolute right-6 top-6 h-1.5 w-7 rounded-full bg-brand-terracotta-light/60" />
                        </>
                      )}

                      <div className="relative">

                        {/* Reaction bubbles – bắn tung toé nhẹ nhàng, neo giữa card để không bị box trên che */}
                        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[45] h-0 w-0 -translate-y-1/2">
                          {activeReactions.map((reaction, reactionIndex) => {
                            const reactionMeta = reactionOptions.find(option => option.label === reaction.label) || reactionOptions[0]
                            const ReactionIcon = reactionMeta.Icon
                            // hướng bay ngẫu nhiên nhưng ổn định theo id (không nhảy mỗi render)
                            const seed = hashSeed(reaction.id)
                            const tx = ((seed % 131) - 65)               // -65..65 px (toé ngang)
                            const ty = -18 - (Math.floor(seed / 7) % 46) // bay lên vừa: -18..-64 px (ở trong card)
                            const rot = ((seed % 25) - 12)               // -12..12 deg

                            return (
                              <span
                                key={reaction.id}
                                className={`study-reaction-scatter absolute left-0 top-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black shadow-md ${reactionMeta.tone}`}
                                style={{
                                  ['--tx' as string]: `${tx}px`,
                                  ['--ty' as string]: `${ty}px`,
                                  ['--rot' as string]: `${rot}deg`,
                                  animationDelay: `${reactionIndex * 90}ms`,
                                }}
                              >
                                {reaction.senderName && (
                                  <span className="font-bold">{reaction.senderName}</span>
                                )}
                                <span className="opacity-80">· {reaction.label}</span>
                                <ReactionIcon size={11} />
                              </span>
                            )
                          })}
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <div
                              className={`${isMicro ? 'h-11 w-11 rounded-[16px] p-1' : isCrowded ? 'h-14 w-14 rounded-[20px] p-1.5' : 'h-[68px] w-[68px] rounded-[22px] p-1.5'} grid place-items-center bg-white shadow-[0_10px_22px_rgba(76,55,49,0.13)]`}
                              style={{
                                background: `conic-gradient(${palette.accent} ${personalProgress * 3.6}deg, rgba(228,193,181,0.32) 0deg)`,
                              }}
                            >
                              {member.avatarUrl ? (
                                <img
                                  src={member.avatarUrl}
                                  alt={member.username}
                                  className={`${isMicro ? 'rounded-[13px]' : 'rounded-[18px]'} h-full w-full object-cover`}
                                  onError={e => {
                                    const img = e.target as HTMLImageElement
                                    img.style.display = 'none'
                                    const fb = img.nextElementSibling as HTMLElement | null
                                    if (fb) fb.style.display = 'grid'
                                  }}
                                />
                              ) : null}
                              <div
                                className={`grid h-full w-full place-items-center ${isMicro ? 'rounded-[13px] text-base' : 'rounded-[18px] text-2xl'} bg-gradient-to-br ${palette.avatar} font-display font-black text-white shadow-inner`}
                                style={{ display: member.avatarUrl ? 'none' : 'grid' }}
                              >
                                {initials(member.username)}
                              </div>
                            </div>
                            {member.isHost && (
                              <span className={`${isMicro ? 'h-5 w-5' : 'h-6 w-6'} absolute -right-1 -top-1 grid place-items-center rounded-full border-2 border-white bg-amber-400 text-white shadow-md`}>
                                <Crown size={isMicro ? 10 : 12} />
                              </span>
                            )}
                            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]" />
                          </div>

                          <div className={`min-w-0 flex-1 ${isMicro ? 'pt-0.5' : 'pt-2'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className={`truncate font-display font-black text-brand-brown-dark ${isMicro ? 'text-xs' : 'text-sm'}`}>
                                  {member.username}{isLocal ? ' (Bạn)' : ''}
                                </h3>
                                <p className="mt-0.5 truncate text-[10px] font-bold text-brand-brown-light">
                                  {member.isHost ? 'Chủ bàn học' : member.role === 'cohost' ? 'Co-host' : member.role === 'moderator' ? 'Mod' : 'Bạn học'}
                                </p>
                              </div>
                              <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${isMicro ? 'hidden lg:inline-flex' : ''} ${isPersonalBreak ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
                                {isPersonalBreak ? 'Break' : 'Focus'}
                              </span>
                            </div>

                            <div className={`${isMicro ? 'mt-1 px-2 py-1' : 'mt-2 px-2.5 py-1.5'} inline-flex max-w-full items-center gap-1.5 rounded-full border text-[10px] font-black ${status.tone}`}>
                              <span>{personal.isRunning ? '🎯' : personal.isBreak ? '☕' : '📖'}</span>
                              <span className="truncate">{status.label}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`${isMicro ? 'mt-3 gap-1.5' : 'mt-4 gap-2'} grid grid-cols-2`}>
                          {/* Ngồi bàn timer */}
                          <div className={`${isMicro ? 'px-2 py-1.5' : 'px-3 py-2'} rounded-xl border border-brand-terracotta-light/20 bg-white/70`}>
                            <p className="truncate text-[9px] font-black uppercase text-brand-brown-light">Ngồi bàn</p>
                            <p className={`${isMicro ? 'text-xs' : 'text-base'} mt-0.5 font-display font-black tabular-nums text-brand-brown-dark`}>
                              {isSeated ? formatDeskTime(elapsed) : <span className="text-slate-400">—</span>}
                            </p>
                          </div>

                          {/* Pomo riêng – controls bên trong box */}
                          <div className={`${isMicro ? 'px-2 py-1.5' : 'px-3 py-2'} rounded-xl border border-brand-terracotta-light/20 bg-white/70`}>
                            <div className="flex items-center justify-between">
                              <p className="truncate text-[9px] font-black uppercase text-brand-brown-light">Pomo riêng</p>
                              {isLocal && onPersonalPomodoro && !isMicro && (
                                <div className="flex gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => onPersonalPomodoro(personal.isRunning ? 'pause' : 'start')}
                                    className={`grid h-5 w-5 place-items-center rounded-full transition ${
                                      personal.isRunning
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    }`}
                                    title={personal.isRunning ? 'Tạm dừng' : 'Bắt đầu'}
                                  >
                                    {personal.isRunning ? <Pause size={9} /> : <Play size={9} />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onPersonalPomodoro('reset', false)}
                                    className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                                    title="Reset"
                                  >
                                    <RotateCcw size={9} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className={`${isMicro ? 'text-xs' : 'text-base'} mt-0.5 font-display font-black tabular-nums text-brand-brown-dark`}>
                              {formatMinuteTime(personalLeft)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-terracotta-light/25">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${isPersonalBreak ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.max(6, personalProgress)}%` }}
                          />
                        </div>

                        {/* Reactions — chỉ hiện trên card của NGƯỜI KHÁC */}
                        {!isLocal && !isMicro && (
                          <div className={`mt-3 flex flex-wrap gap-1.5 ${isCrowded ? 'max-h-8 overflow-hidden' : ''}`}>
                            {reactionOptions.map(option => {
                              const OptionIcon = option.Icon
                              return (
                                <button
                                  key={option.label}
                                  type="button"
                                  onClick={() => handleReaction(option, member.id)}
                                  className={`inline-flex items-center gap-1 rounded-full border ${isCrowded ? 'px-1.5 py-1' : 'px-2 py-1'} text-[9px] font-black transition hover:-translate-y-0.5 hover:shadow-sm active:scale-95 ${option.tone}`}
                                  title={`Gửi ${option.label} cho ${member.username}`}
                                >
                                  <OptionIcon size={10} />
                                  <span className={isCrowded ? 'sr-only' : ''}>{option.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-[28px] border border-brand-terracotta-light/20 bg-white/88 p-4 shadow-[0_18px_44px_rgba(76,55,49,0.08)] backdrop-blur">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-terracotta text-white">
              <Timer size={18} />
            </span>
            <div>
              <p className="text-sm font-black text-brand-brown-dark">Pomodoro nhóm</p>
              <p className="text-[11px] font-bold text-brand-brown-light">Nhịp chung của phòng</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-brand-terracotta-light/20 bg-brand-light/50 p-5 text-center">
            <p className="mb-1 text-[10px] font-black uppercase text-brand-terracotta">
              {pomodoro.isBreak ? t('pomodoro.break') : t('pomodoro.focus')}
            </p>
            <p className="font-display text-4xl font-black tabular-nums text-brand-brown-dark">
              {formatMinuteTime(pomodoro.timeLeft)}
            </p>
            <p className="mt-1 text-[11px] font-bold text-brand-brown-light">
              {pomodoro.isRunning ? t('pomodoro.running') : t('pomodoro.paused')}
            </p>
          </div>

          {canControlPomodoro && (
            <div className="mt-4 grid gap-2 animate-fadeIn">
              {pomodoro.isRunning ? (
                <button type="button" onClick={() => onControlPomodoro('pause')} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-amber-600">
                  <Pause size={14} /> {t('pomodoro.pause')}
                </button>
              ) : (
                <button type="button" onClick={() => onControlPomodoro('start')} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-green-600">
                  <Play size={14} /> {t('pomodoro.start')}
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onControlPomodoro('reset', false)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-terracotta-light/20 bg-white px-3 py-2.5 text-[11px] font-black text-brand-brown-dark transition hover:bg-brand-light">
                  <RotateCcw size={13} /> 25 phút
                </button>
                <button type="button" onClick={() => onControlPomodoro('reset', true)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-terracotta-light/20 bg-white px-3 py-2.5 text-[11px] font-black text-brand-brown-dark transition hover:bg-brand-light">
                  <Coffee size={13} /> 5 phút
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">
              <Users size={13} className="mr-1 inline" />
              {seats.length} bạn đang hiện diện trong bàn học.
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
