import { Coffee, Keyboard, MicOff, Moon, Phone, PhoneOff, Users, VolumeX } from 'lucide-react'

type StudyMember = {
  id: string
  username: string
  isHost: boolean
}

type StudyTableStageProps = {
  members: StudyMember[]
  username: string
  jitsiActive: boolean
  onToggleJitsi: () => void
}

const statusCycle = [
  { label: 'đang gõ phím', icon: Keyboard, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
  { label: 'đang tập trung', icon: VolumeX, tone: 'text-blue-700 bg-blue-50 border-blue-100' },
  { label: 'giải lao', icon: Coffee, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
  { label: 'away', icon: Moon, tone: 'text-slate-600 bg-slate-50 border-slate-100' },
]

const initials = (name: string) => name.trim().slice(0, 2).toUpperCase() || 'DM'

export default function StudyTableStage({
  members,
  username,
  jitsiActive,
  onToggleJitsi,
}: StudyTableStageProps) {
  const seats = members.length > 0
    ? members
    : [{ id: 'local-preview', username: username || 'Bạn', isHost: true }]

  const layoutClass = seats.length === 1
    ? 'grid-cols-1 max-w-sm mx-auto'
    : seats.length <= 4
      ? 'grid-cols-2 max-w-2xl mx-auto'
      : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-black text-xl text-brand-brown-dark">Bàn học ảo</h2>
          <p className="text-sm text-brand-brown-light mt-1">
            Không cần bật cam. Mỗi người vẫn có một ghế, trạng thái và cảm giác đang ngồi học cùng nhau.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
            <MicOff size={14} />
            Mặc định tắt mic
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
            <Users size={14} />
            Phòng học im lặng
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

      <div className="relative flex-1 min-h-[430px] rounded-2xl border border-brand-terracotta-light/20 bg-gradient-to-br from-white via-brand-cream to-emerald-50/50 overflow-hidden p-4 sm:p-6">
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-36 rounded-[999px] bg-brand-brown-dark/90 shadow-2xl border border-white/30 hidden md:block">
          <div className="absolute inset-3 rounded-[999px] border border-white/10" />
          <div className="absolute left-1/2 top-1/2 h-16 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-sm" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-white text-sm font-black">Silent Study Table</p>
            <p className="text-white/50 text-[11px] font-bold mt-1">{seats.length} ghế đang có người</p>
          </div>
        </div>

        <div className={`relative z-10 grid ${layoutClass} gap-3 content-center min-h-[380px]`}>
          {seats.map((member, index) => {
            const status = statusCycle[index % statusCycle.length]
            const StatusIcon = status.icon
            const isLocal = member.username === username

            return (
              <article
                key={member.id}
                className={`rounded-2xl border bg-white/90 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md ${
                  seats.length === 1 ? 'min-h-[260px] flex flex-col justify-center' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`${seats.length === 1 ? 'w-24 h-24 text-4xl' : 'w-14 h-14 text-lg'} rounded-2xl bg-gradient-to-br from-brand-terracotta to-teal-600 text-white flex items-center justify-center font-display font-black shadow-md`}>
                      {initials(member.username)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-black text-brand-brown-dark truncate">
                        {member.username}{isLocal ? ' (Bạn)' : ''}
                      </h3>
                      <p className="text-[11px] font-bold text-brand-brown-light mt-0.5">
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

                <div className="mt-4 h-2 rounded-full bg-brand-light overflow-hidden">
                  <div className="h-full rounded-full bg-brand-terracotta" style={{ width: `${72 - (index % 4) * 11}%` }} />
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-light bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-brand-brown-dark">Kênh âm thanh im lặng</p>
          <p className="text-xs text-brand-brown-light mt-1">
            Chế độ này ưu tiên body-doubling im lặng. Bật cam/mic sẽ được mở sau bằng lớp riêng, không chen vào bàn học.
          </p>
        </div>
        <div className="text-xs font-black text-brand-brown-light">
          {jitsiActive ? 'Đã kết nối bàn học' : 'Chưa kết nối'}
        </div>
      </div>
    </div>
  )
}
