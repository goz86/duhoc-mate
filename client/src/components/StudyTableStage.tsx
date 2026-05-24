import { Coffee, Keyboard, MicOff, Moon, Pause, Phone, PhoneOff, Play, RotateCcw, Timer, Users, VolumeX } from 'lucide-react'
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

const statusCycle = [
  { label: 'đang gõ phím', icon: Keyboard, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
  { label: 'đang tập trung', icon: VolumeX, tone: 'text-blue-700 bg-blue-50 border-blue-100' },
  { label: 'giải lao', icon: Coffee, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
  { label: 'away', icon: Moon, tone: 'text-slate-600 bg-slate-50 border-slate-100' },
]

const initials = (name: string) => name.trim().slice(0, 2).toUpperCase() || 'DM'

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`
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
  const seats = members.length > 0
    ? members
    : [{ id: 'local-preview', username: username || 'Bạn', isHost: true }]

  const layoutClass = seats.length === 1
    ? 'grid-cols-1 max-w-sm mx-auto'
    : seats.length <= 4
      ? 'grid-cols-2 max-w-2xl mx-auto'
      : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <h2 className="font-display text-xl font-black text-brand-brown-dark">Bàn học</h2>
          <p className="mt-1 max-w-2xl text-sm text-brand-brown-light">
            Một góc học chung nhẹ nhàng: thấy ai đang ở bàn, bật Pomodoro chung và giữ nhạc YouTube chạy nền.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
            <MicOff size={14} />
            Mặc định tắt mic
          </span>
          <button
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

      <div className="grid flex-1 gap-4 xl:grid-cols-[1fr_260px]">
        <div className="relative min-h-[430px] overflow-hidden rounded-2xl border border-brand-terracotta-light/20 bg-gradient-to-br from-white via-brand-cream to-emerald-50/50 p-4 sm:p-6">
          <div className="absolute inset-x-8 top-1/2 hidden h-36 -translate-y-1/2 rounded-[999px] border border-white/30 bg-brand-brown-dark/90 shadow-2xl md:block">
            <div className="absolute inset-3 rounded-[999px] border border-white/10" />
            <div className="absolute left-1/2 top-1/2 h-16 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-sm" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-sm font-black text-white">Silent Study Table</p>
              <p className="mt-1 text-[11px] font-bold text-white/50">{seats.length} ghế đang có người</p>
            </div>
          </div>

          <div className={`relative z-10 grid min-h-[380px] content-center gap-3 ${layoutClass}`}>
            {seats.map((member, index) => {
              const status = statusCycle[index % statusCycle.length]
              const StatusIcon = status.icon
              const isLocal = member.username === username

              return (
                <article
                  key={member.id}
                  className={`rounded-2xl border bg-white/90 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md ${
                    seats.length === 1 ? 'flex min-h-[260px] flex-col justify-center' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`${seats.length === 1 ? 'h-24 w-24 text-4xl' : 'h-14 w-14 text-lg'} flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-terracotta to-teal-600 font-display font-black text-white shadow-md`}>
                        {initials(member.username)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-display font-black text-brand-brown-dark">
                          {member.username}{isLocal ? ' (Bạn)' : ''}
                        </h3>
                        <p className="mt-0.5 text-[11px] font-bold text-brand-brown-light">
                          {member.isHost ? 'Chủ bàn học' : 'Bạn học'}
                        </p>
                      </div>
                    </div>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.18)]" />
                  </div>

                  <div className={`mt-4 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-black ${status.tone}`}>
                    <StatusIcon size={13} />
                    {status.label}
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <aside className="rounded-2xl border border-brand-terracotta-light/20 bg-white/85 p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Timer size={18} className="text-brand-terracotta" />
            <div>
              <p className="text-sm font-black text-brand-brown-dark">Pomodoro nhóm</p>
              <p className="text-[11px] font-bold text-brand-brown-light">Tích hợp ngay trên bàn học</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-terracotta-light/20 bg-brand-light/40 p-5 text-center">
            <p className="mb-1 text-[10px] font-black uppercase text-brand-terracotta">
              {pomodoro.isBreak ? t('pomodoro.break') : t('pomodoro.focus')}
            </p>
            <p className="font-display text-4xl font-black tabular-nums text-brand-brown-dark">
              {formatTime(pomodoro.timeLeft)}
            </p>
            <p className="mt-1 text-[11px] font-bold text-brand-brown-light">
              {pomodoro.isRunning ? t('pomodoro.running') : t('pomodoro.paused')}
            </p>
          </div>

          <div className="mt-4 grid gap-2">
            {pomodoro.isRunning ? (
              <button onClick={() => onControlPomodoro('pause')} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-amber-600">
                <Pause size={14} /> {t('pomodoro.pause')}
              </button>
            ) : (
              <button onClick={() => onControlPomodoro('start')} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-green-600">
                <Play size={14} /> {t('pomodoro.start')}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onControlPomodoro('reset', false)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-terracotta-light/20 bg-white px-3 py-2.5 text-[11px] font-black text-brand-brown-dark transition hover:bg-brand-light">
                <RotateCcw size={13} /> 25 phút
              </button>
              <button onClick={() => onControlPomodoro('reset', true)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-terracotta-light/20 bg-white px-3 py-2.5 text-[11px] font-black text-brand-brown-dark transition hover:bg-brand-light">
                <Coffee size={13} /> 5 phút
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700">
            <Users size={13} className="mr-1 inline" />
            {seats.length} bạn đang trong phòng.
          </div>
        </aside>
      </div>
    </div>
  )
}
