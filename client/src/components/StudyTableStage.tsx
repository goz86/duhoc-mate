import {
  BookOpen,
  Brain,
  CheckCircle2,
  Coffee,
  Crown,
  Flame,
  Heart,
  Keyboard,
  MicOff,
  Moon,
  Pause,
  Phone,
  PhoneOff,
  Play,
  RotateCcw,
  SmilePlus,
  Sparkles,
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
}

type PomodoroState = {
  timeLeft: number
  duration: number
  isRunning: boolean
  isBreak: boolean
}

type StudyTableStageProps = {
  members: StudyMember[]
  username: string
  jitsiActive: boolean
  pomodoro: PomodoroState
  onToggleJitsi: () => void
  onControlPomodoro: (action: 'start' | 'pause' | 'reset', isBreak?: boolean) => void
}

type DeskReaction = {
  id: string
  memberId: string
  label: string
  Icon: LucideIcon
  tone: string
}

const seatPalette = [
  { avatar: 'from-[#5F9EA0] via-[#3F8F91] to-[#2F6F73]', desk: 'from-[#BEE7E8] to-[#E7F6F2]', accent: '#28BFB0' },
  { avatar: 'from-[#D79575] via-[#BE7566] to-[#8F544B]', desk: 'from-[#FFE2D4] to-[#FFF5EA]', accent: '#C56F5F' },
  { avatar: 'from-[#8EA36B] via-[#738D56] to-[#516B45]', desk: 'from-[#DDECC8] to-[#F7F2D7]', accent: '#7B9F56' },
  { avatar: 'from-[#D6A85F] via-[#BD8545] to-[#8C5F3D]', desk: 'from-[#FFE6B8] to-[#FFF7DE]', accent: '#D4943B' },
]

const statusCycle: Array<{ label: string; Icon: LucideIcon; tone: string }> = [
  { label: 'đang gõ phím', Icon: Keyboard, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
  { label: 'tập trung sâu', Icon: VolumeX, tone: 'text-sky-700 bg-sky-50 border-sky-100' },
  { label: 'đang đọc tài liệu', Icon: BookOpen, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
  { label: 'nghỉ một chút', Icon: Coffee, tone: 'text-orange-700 bg-orange-50 border-orange-100' },
  { label: 'away', Icon: Moon, tone: 'text-slate-600 bg-slate-50 border-slate-100' },
]

const reactionOptions: Array<{ label: string; Icon: LucideIcon; tone: string }> = [
  { label: 'Cố lên', Icon: Flame, tone: 'bg-orange-50 text-orange-700 border-orange-100' },
  { label: 'Tuyệt', Icon: Sparkles, tone: 'bg-amber-50 text-amber-700 border-amber-100' },
  { label: 'Ổn định', Icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { label: 'Nghỉ chút', Icon: Coffee, tone: 'bg-sky-50 text-sky-700 border-sky-100' },
  { label: 'Thích', Icon: Heart, tone: 'bg-rose-50 text-rose-700 border-rose-100' },
]

const hashString = (value: string) =>
  value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)

const initials = (name: string) => name.trim().slice(0, 2).toUpperCase() || 'DM'

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
  jitsiActive,
  pomodoro,
  onToggleJitsi,
  onControlPomodoro,
}: StudyTableStageProps) {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => Date.now())
  const [reactions, setReactions] = useState<DeskReaction[]>([])
  const mountedAt = useMemo(() => Date.now(), [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const seats = members.length > 0
    ? members
    : [{ id: 'local-preview', username: username || 'Bạn học', isHost: true }]

  const roomMood = pomodoro.isBreak
    ? { label: 'Break room', Icon: Coffee, tone: 'bg-amber-50 text-amber-700 border-amber-100' }
    : pomodoro.isRunning
      ? { label: 'Deep focus', Icon: Brain, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
      : { label: 'Ready', Icon: Timer, tone: 'bg-brand-light text-brand-brown-dark border-brand-terracotta-light/20' }
  const isCrowded = seats.length > 6

  const handleReaction = (memberId: string, option: typeof reactionOptions[number]) => {
    const reaction = {
      id: `${memberId}-${option.label}-${Date.now()}`,
      memberId,
      label: option.label,
      Icon: option.Icon,
      tone: option.tone,
    }

    setReactions(prev => [...prev.slice(-9), reaction])
    window.setTimeout(() => {
      setReactions(prev => prev.filter(item => item.id !== reaction.id))
    }, 2600)
  }

  const RoomMoodIcon = roomMood.Icon

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-black leading-tight text-brand-brown-dark">Bàn học sống</h2>
          <p className="mt-1 text-sm leading-relaxed text-brand-brown-light">
            Mỗi bạn là một nhân vật ngồi vào bàn riêng, có thời gian hiện diện, Pomodoro cá nhân và biểu cảm động viên từ cả phòng.
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
        <section className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-brand-terracotta-light/20 bg-[#FDF8F0] p-3 shadow-[0_24px_70px_rgba(76,55,49,0.08)] sm:min-h-[430px] sm:p-5 xl:min-h-[460px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(125,211,199,0.22),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(242,182,109,0.20),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(250,246,240,0.42))]" />
          <div className="pointer-events-none absolute inset-x-4 bottom-4 top-20 rounded-[30px] border border-white/50 bg-white/20 [background-image:linear-gradient(rgba(167,122,108,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(167,122,108,0.07)_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="pointer-events-none absolute right-4 top-4 hidden rounded-2xl border border-white/70 bg-white/55 px-3 py-2 shadow-sm md:block">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.16)]" />
              <span className="text-[11px] font-black uppercase text-brand-brown-light">silent presence</span>
            </div>
          </div>

          <div className="relative z-10 flex min-h-[330px] flex-col sm:min-h-[390px] xl:min-h-[420px]">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black ${roomMood.tone}`}>
                <RoomMoodIcon size={13} />
                {roomMood.label}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-white/70 px-3 py-1.5 text-[11px] font-black text-brand-brown-light">
                <Users size={13} />
                {seats.length} ghế đang học
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta-light/20 bg-white/70 px-3 py-1.5 text-[11px] font-black text-brand-brown-light">
                <SmilePlus size={13} />
                Biểu cảm nhanh
              </span>
              {isCrowded && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-700">
                  <Users size={13} />
                  Chế độ phòng đông
                </span>
              )}
            </div>

            <div className="relative min-h-0 flex-1">
              <div className="relative grid max-h-[min(62vh,620px)] w-full grid-cols-[repeat(auto-fill,minmax(min(100%,260px),320px))] content-start justify-start gap-3 overflow-y-auto pr-1 xl:gap-4">
                {seats.map((member, index) => {
                  const palette = seatPalette[index % seatPalette.length]
                  const seed = hashString(member.id || member.username)
                  const elapsed = Math.floor((now - mountedAt) / 1000) + 420 + seed * 7 + index * 260
                  const personalCycle = 30 * 60
                  const cyclePosition = (elapsed + index * 137) % personalCycle
                  const isPersonalBreak = cyclePosition >= 25 * 60
                  const personalLeft = isPersonalBreak ? personalCycle - cyclePosition : 25 * 60 - cyclePosition
                  const personalProgress = isPersonalBreak
                    ? ((5 * 60 - personalLeft) / (5 * 60)) * 100
                    : ((25 * 60 - personalLeft) / (25 * 60)) * 100
                  const status = statusCycle[(index + Math.floor(elapsed / 300)) % statusCycle.length]
                  const isLocal = member.username === username
                  const StatusIcon = status.Icon
                  const activeReactions = reactions.filter(item => item.memberId === member.id)

                  return (
                    <article
                      key={member.id}
                      className={`group relative w-full overflow-hidden rounded-[22px] border border-white/70 bg-white/86 shadow-[0_14px_32px_rgba(76,55,49,0.10)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(76,55,49,0.13)] ${isCrowded ? 'p-3' : 'p-3.5'}`}
                    >
                      <div className={`absolute inset-x-3 top-3 h-20 rounded-[20px] bg-gradient-to-br ${palette.desk} opacity-85`} />
                      <div className="absolute right-4 top-4 h-6 w-12 rounded-full border border-white/70 bg-white/65" />
                      <div className="absolute right-6 top-6 h-1.5 w-7 rounded-full bg-brand-terracotta-light/60" />

                      <div className="relative">
                        <div className="absolute left-1/2 top-0 z-20 flex -translate-x-1/2 -translate-y-2 flex-col items-center gap-1">
                          {activeReactions.map((reaction, reactionIndex) => {
                            const ReactionIcon = reaction.Icon

                            return (
                              <span
                                key={reaction.id}
                                className={`study-reaction-bubble inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black shadow-sm ${reaction.tone}`}
                                style={{ animationDelay: `${reactionIndex * 80}ms` }}
                              >
                                <ReactionIcon size={11} />
                                {reaction.label}
                              </span>
                            )
                          })}
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <div
                              className={`${isCrowded ? 'h-[62px] w-[62px]' : 'h-[68px] w-[68px]'} grid place-items-center rounded-[22px] bg-white p-1.5 shadow-[0_10px_22px_rgba(76,55,49,0.13)]`}
                              style={{
                                background: `conic-gradient(${palette.accent} ${personalProgress * 3.6}deg, rgba(228,193,181,0.32) 0deg)`,
                              }}
                            >
                              <div className={`grid h-full w-full place-items-center rounded-[18px] bg-gradient-to-br ${palette.avatar} font-display text-2xl font-black text-white shadow-inner`}>
                                {initials(member.username)}
                              </div>
                            </div>
                            {member.isHost && (
                              <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-amber-400 text-white shadow-md">
                                <Crown size={12} />
                              </span>
                            )}
                            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]" />
                          </div>

                          <div className="min-w-0 flex-1 pt-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate font-display text-sm font-black text-brand-brown-dark">
                                  {member.username}{isLocal ? ' (Bạn)' : ''}
                                </h3>
                                <p className="mt-0.5 text-[10px] font-bold text-brand-brown-light">
                                  {member.isHost ? 'Chủ bàn học' : 'Bạn học'}
                                </p>
                              </div>
                              <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${isPersonalBreak ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
                                {isPersonalBreak ? 'Break' : 'Focus'}
                              </span>
                            </div>

                            <div className={`mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-black ${status.tone}`}>
                              <StatusIcon size={11} className="shrink-0" />
                              <span className="truncate">{status.label}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-brand-terracotta-light/20 bg-white/70 px-3 py-2">
                            <p className="text-[9px] font-black uppercase text-brand-brown-light">Ngồi bàn</p>
                            <p className="mt-0.5 font-display text-base font-black tabular-nums text-brand-brown-dark">{formatDeskTime(elapsed)}</p>
                          </div>
                          <div className="rounded-xl border border-brand-terracotta-light/20 bg-white/70 px-3 py-2">
                            <p className="text-[9px] font-black uppercase text-brand-brown-light">Pomo riêng</p>
                            <p className="mt-0.5 font-display text-base font-black tabular-nums text-brand-brown-dark">{formatMinuteTime(personalLeft)}</p>
                          </div>
                        </div>

                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-terracotta-light/25">
                          <div
                            className={`h-full rounded-full ${isPersonalBreak ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.max(6, personalProgress)}%` }}
                          />
                        </div>

                        <div className={`mt-3 flex flex-wrap gap-1.5 ${isCrowded ? 'max-h-8 overflow-hidden' : ''}`}>
                          {reactionOptions.map(option => {
                            const OptionIcon = option.Icon

                            return (
                              <button
                                key={option.label}
                                type="button"
                                onClick={() => handleReaction(member.id, option)}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black transition hover:-translate-y-0.5 hover:shadow-sm ${option.tone}`}
                                title={`Gửi biểu cảm: ${option.label}`}
                              >
                                <OptionIcon size={10} />
                                <span>{option.label}</span>
                              </button>
                            )
                          })}
                        </div>
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

          <div className="mt-4 grid gap-2">
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

          <div className="mt-4 space-y-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">
              <Users size={13} className="mr-1 inline" />
              {seats.length} bạn đang hiện diện trong bàn học.
            </div>
            <div className="rounded-2xl border border-brand-terracotta-light/20 bg-brand-light/45 px-3 py-3">
              <p className="text-[11px] font-black uppercase text-brand-brown-light">Ý tưởng tiếp theo</p>
              <p className="mt-1 text-xs font-bold leading-relaxed text-brand-brown-dark">
                Khi duyệt UI này, mình có thể nối backend để lưu giờ ngồi bàn, Pomodoro riêng và biểu cảm realtime cho mọi người.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
