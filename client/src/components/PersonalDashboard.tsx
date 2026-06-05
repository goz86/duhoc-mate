import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Flame,
  Gamepad2,
  GraduationCap,
  ListChecks,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Trophy,
} from 'lucide-react'
import { loadTopikMistakes, syncTopikMistakes, type TopikMistake } from '../lib/topikMistakes'
import type { TopikErrorType } from '../lib/topikGrammar'

const STUDY_SESSION_HISTORY_KEY = 'duhocmate_study_session_history'
const COACH_PROFILE_KEY = 'duhocmate_topik_coach_profile_v1'
const DAILY_PROGRESS_KEY = 'duhocmate_topik_daily_progress_v1'

type Profile = {
  id?: string
  username?: string
}

type CoachProfile = {
  targetLevel: number
  days: number
  examDate: string
  startedAt: string
}

type StudySession = {
  minutes?: number
  pomodoros?: number
  notes?: number
  leftAt?: string
}

type Mission = {
  id: string
  title: string
  detail: string
  minutes: number
  accent: string
}

type Props = {
  profile: Profile | null
  username: string
  onStartRoom: () => void
  onOpenTopikRoom?: () => void
}

const ERROR_LABELS: Record<TopikErrorType, string> = {
  vocabulary: 'Sai từ vựng',
  grammar_connector: 'Sai ngữ pháp nối câu',
  honorific: 'Sai kính ngữ',
  reading: 'Sai đọc hiểu',
  similar_meaning: 'Nhầm nghĩa gần giống',
}

const DEFAULT_PROFILE: CoachProfile = {
  targetLevel: 3,
  days: 30,
  examDate: '',
  startedAt: new Date().toISOString(),
}

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const todayKey = () => new Date().toISOString().slice(0, 10)

const daysBetween = (from: Date, to: Date) => {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((end - start) / 86400000)
}

const getStreak = (sessions: StudySession[]) => {
  const studiedDays = new Set(
    sessions
      .map(session => session.leftAt ? new Date(session.leftAt).toISOString().slice(0, 10) : '')
      .filter(Boolean)
  )
  let streak = 0
  const cursor = new Date()
  while (studiedDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

const buildMissions = (profile: CoachProfile, topWeakness?: TopikErrorType): Mission[] => {
  const level = profile.targetLevel
  const weaknessLabel = topWeakness ? ERROR_LABELS[topWeakness] : 'cân bằng kỹ năng'
  return [
    {
      id: 'vocab',
      title: `10 từ vựng TOPIK ${level}`,
      detail: topWeakness === 'vocabulary' ? 'Ưu tiên từ gần nghĩa và từ hay nhầm.' : 'Ôn từ theo level mục tiêu.',
      minutes: 8,
      accent: 'bg-sky-50 text-sky-700 border-sky-100',
    },
    {
      id: 'grammar',
      title: `2 mẫu ngữ pháp TOPIK ${level}`,
      detail: topWeakness === 'grammar_connector' ? 'Tập trung nối câu và sắc thái nguyên nhân/kết quả.' : 'Đọc công thức, ví dụ và lỗi hay nhầm.',
      minutes: 10,
      accent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      id: 'mini-test',
      title: 'Đề ngắn 5 câu',
      detail: `AI Coach ưu tiên nhóm yếu: ${weaknessLabel}.`,
      minutes: 7,
      accent: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      id: 'arena',
      title: 'Game ôn nhanh',
      detail: 'Ghép thẻ hoặc Grammar Race để khóa lại kiến thức hôm nay.',
      minutes: 5,
      accent: 'bg-rose-50 text-rose-700 border-rose-100',
    },
  ]
}

export default function PersonalDashboard({ profile, username, onStartRoom, onOpenTopikRoom }: Props) {
  const [coachProfile, setCoachProfile] = useState<CoachProfile>(() => readJson(COACH_PROFILE_KEY, DEFAULT_PROFILE))
  const [mistakes, setMistakes] = useState<TopikMistake[]>(() => loadTopikMistakes())
  const [completed, setCompleted] = useState<Record<string, string[]>>(() => readJson(DAILY_PROGRESS_KEY, {}))

  useEffect(() => {
    let mounted = true
    syncTopikMistakes(profile?.id).then(next => {
      if (mounted) setMistakes(next)
    })
    return () => {
      mounted = false
    }
  }, [profile?.id])

  const sessions = useMemo(() => readJson<StudySession[]>(STUDY_SESSION_HISTORY_KEY, []), [])
  const stats = useMemo(() => {
    const totalMinutes = sessions.reduce((sum, session) => sum + (Number(session.minutes) || 0), 0)
    const totalPomodoros = sessions.reduce((sum, session) => sum + (Number(session.pomodoros) || 0), 0)
    const totalNotes = sessions.reduce((sum, session) => sum + (Number(session.notes) || 0), 0)
    return {
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalPomodoros,
      totalNotes,
      streak: getStreak(sessions),
    }
  }, [sessions])

  const weaknessSummary = useMemo(() => {
    const counts = new Map<TopikErrorType, number>()
    for (const mistake of mistakes) {
      counts.set(mistake.errorType, (counts.get(mistake.errorType) || 0) + mistake.wrongCount)
    }
    return (Object.keys(ERROR_LABELS) as TopikErrorType[])
      .map(errorType => ({ errorType, label: ERROR_LABELS[errorType], count: counts.get(errorType) || 0 }))
      .sort((a, b) => b.count - a.count)
  }, [mistakes])

  const topWeakness = weaknessSummary.find(item => item.count > 0)
  const missions = useMemo(() => buildMissions(coachProfile, topWeakness?.errorType), [coachProfile, topWeakness?.errorType])
  const today = todayKey()
  const completedToday = completed[today] || []
  const completionPct = Math.round((completedToday.length / missions.length) * 100)
  const daysLeft = coachProfile.examDate ? Math.max(0, daysBetween(new Date(), new Date(coachProfile.examDate))) : null
  const planDay = Math.min(coachProfile.days, Math.max(1, daysBetween(new Date(coachProfile.startedAt), new Date()) + 1))
  const planPct = Math.round((planDay / coachProfile.days) * 100)

  const saveCoachProfile = (patch: Partial<CoachProfile>) => {
    const next = { ...coachProfile, ...patch }
    setCoachProfile(next)
    localStorage.setItem(COACH_PROFILE_KEY, JSON.stringify(next))
  }

  const toggleMission = (id: string) => {
    const current = completed[today] || []
    const nextDay = current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    const next = { ...completed, [today]: nextDay }
    setCompleted(next)
    localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(next))
  }

  return (
    <section className="animate-custom-fade-in pb-8">
      <div className="relative overflow-hidden rounded-[32px] border border-black/[0.06] bg-[#fffdf9] p-4 shadow-[0_20px_70px_rgba(76,55,49,0.10)] md:p-6 xl:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_18%_0%,rgba(180,125,105,0.18),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(125,211,252,0.18),transparent_32%)]" />
        <div className="relative grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-stretch">
          <div className="rounded-[26px] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur md:p-6">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-brand-terracotta/20 bg-brand-terracotta/5 px-3 py-1 text-xs font-black text-brand-terracotta">
              <Sparkles size={14} />
              <span className="truncate">Lộ trình TOPIK</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-black leading-tight text-brand-brown-dark md:text-5xl">
              Lộ trình hôm nay của {profile?.username || username || 'bạn'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-brand-brown-light">
              Dashboard gom mục tiêu TOPIK, streak học, lỗi sai và nhiệm vụ mỗi ngày để web tự điều chỉnh bài học tiếp theo.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <div className="flex items-center justify-between text-xs font-black text-brand-brown-dark">
                  <span>Tiến độ lộ trình ngày {planDay}/{coachProfile.days}</span>
                  <span>{planPct}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-brand-light">
                  <div className="h-full rounded-full bg-brand-terracotta transition-all" style={{ width: `${planPct}%` }} />
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenTopikRoom || onStartRoom}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-brown-dark px-4 text-sm font-black text-white shadow-sm transition hover:bg-brand-terracotta"
              >
                <Target size={16} />
                Học 30 phút
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-[26px] border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur sm:grid-cols-4 xl:grid-cols-2">
            <Metric icon={<Flame size={16} />} label="Streak" value={`${stats.streak} ngày`} />
            <Metric icon={<Timer size={16} />} label="Tổng học" value={`${stats.totalHours}h`} />
            <Metric icon={<Target size={16} />} label="TOPIK" value={`Level ${coachProfile.targetLevel}`} />
            <Metric icon={<CalendarDays size={16} />} label="Còn lại" value={daysLeft === null ? '--' : `${daysLeft} ngày`} />
          </div>
        </div>

        <div className="relative mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.35fr_0.85fr]">
          <div className="rounded-[24px] border border-brand-terracotta-light/20 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-brand-terracotta" />
              <h2 className="text-sm font-black text-brand-brown-dark">Mục tiêu TOPIK</h2>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[11px] font-black uppercase text-brand-brown-light">Mục tiêu</span>
                <select
                  value={coachProfile.targetLevel}
                  onChange={event => saveCoachProfile({ targetLevel: Number(event.target.value) })}
                  className="mt-1 w-full rounded-2xl border border-black/[0.08] bg-white px-3 py-2 text-sm font-black text-brand-brown-dark outline-none focus:border-brand-terracotta"
                >
                  {[2, 3, 4, 5, 6].map(level => <option key={level} value={level}>TOPIK {level}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-black uppercase text-brand-brown-light">Số ngày ôn</span>
                <input
                  type="number"
                  min={7}
                  max={180}
                  value={coachProfile.days}
                  onChange={event => saveCoachProfile({ days: Math.max(7, Math.min(180, Number(event.target.value) || 30)) })}
                  className="mt-1 w-full rounded-2xl border border-black/[0.08] bg-white px-3 py-2 text-sm font-black text-brand-brown-dark outline-none focus:border-brand-terracotta"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-black uppercase text-brand-brown-light">Ngày thi</span>
                <input
                  type="date"
                  value={coachProfile.examDate}
                  onChange={event => saveCoachProfile({ examDate: event.target.value })}
                  className="mt-1 w-full rounded-2xl border border-black/[0.08] bg-white px-3 py-2 text-sm font-black text-brand-brown-dark outline-none focus:border-brand-terracotta"
                />
              </label>
              <div className="rounded-2xl border border-white bg-white/80 p-3 text-xs font-bold text-brand-brown-light">
                Ngày {planDay}/{coachProfile.days}: ưu tiên {topWeakness?.label || 'ôn đều từ vựng, ngữ pháp và đọc hiểu'}.
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-brand-terracotta-light/20 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ListChecks size={18} className="text-brand-terracotta" />
                  <h2 className="text-sm font-black text-brand-brown-dark">Nhiệm vụ hôm nay</h2>
                </div>
                <p className="mt-1 text-xs font-semibold text-brand-brown-light">Hoàn thành {completedToday.length}/{missions.length} mục · khoảng 30 phút.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{completionPct}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-brand-light">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completionPct}%` }} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {missions.map(mission => {
                const done = completedToday.includes(mission.id)
                return (
                  <button
                    key={mission.id}
                    type="button"
                    onClick={() => toggleMission(mission.id)}
                    className={`text-left rounded-2xl border p-3 transition active:scale-[0.99] ${done ? 'border-emerald-200 bg-emerald-50/80' : 'border-black/[0.06] bg-white hover:border-brand-terracotta-light'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${mission.accent}`}>{mission.minutes} phút</span>
                      <CheckCircle2 size={17} className={done ? 'text-emerald-600' : 'text-brand-brown-light/35'} />
                    </div>
                    <p className="mt-2 text-sm font-black text-brand-brown-dark">{mission.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-brand-brown-light">{mission.detail}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-sky-100 bg-[#f8fbff] p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-sky-700" />
              <h2 className="text-sm font-black text-brand-brown-dark">Bản đồ điểm yếu</h2>
            </div>
            <div className="mt-4 space-y-3">
              {weaknessSummary.map(item => {
                const max = Math.max(1, weaknessSummary[0]?.count || 1)
                return (
                  <div key={item.errorType}>
                    <div className="flex items-center justify-between text-xs font-black text-brand-brown-dark">
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-sky-100 bg-white/80 p-3">
              <p className="text-xs font-black text-sky-700">Bài chữa lỗi 10 phút</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-brand-brown-light">
                {topWeakness ? `Tối nay nên chữa nhóm: ${topWeakness.label}.` : 'Sẽ tự tạo khi bạn có lỗi sai đầu tiên trong TOPIK Arena.'}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[24px] border border-brand-terracotta-light/20 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-600" />
              <h2 className="text-sm font-black text-brand-brown-dark">Arena/Game</h2>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {['Ghép thẻ', 'Grammar Race', 'Boss 10 câu', 'Sprint 7 ngày'].map((label, index) => (
                <div key={label} className="rounded-2xl border border-black/[0.06] bg-[#fffaf4] p-3">
                  <Gamepad2 size={16} className={index === 2 ? 'text-rose-600' : 'text-brand-terracotta'} />
                  <p className="mt-2 text-xs font-black text-brand-brown-dark">{label}</p>
                  <p className="mt-1 text-[11px] font-bold text-brand-brown-light">{index < 2 ? 'Đã sẵn sàng' : 'Sắp mở'}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-brand-terracotta-light/20 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-emerald-700" />
              <h2 className="text-sm font-black text-brand-brown-dark">Bộ đang học dở</h2>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <MiniProgress title={`Từ vựng TOPIK ${coachProfile.targetLevel}`} value={Math.min(100, completedToday.includes('vocab') ? 70 : 45)} />
              <MiniProgress title={`Ngữ pháp TOPIK ${coachProfile.targetLevel}`} value={Math.min(100, completedToday.includes('grammar') ? 62 : 38)} />
              <MiniProgress title="Luyện đề ngắn" value={Math.min(100, completedToday.includes('mini-test') ? 55 : 22)} />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={onOpenTopikRoom || onStartRoom} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-terracotta px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-brand-terracotta-dark">
                <Target size={16} />
                Vào TOPIK
              </button>
              <button type="button" onClick={onStartRoom} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/[0.08] bg-white px-4 py-2 text-sm font-black text-brand-brown-dark transition hover:border-brand-terracotta-light">
                <RotateCcw size={16} />
                Mở phòng học
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-3 py-3 shadow-sm">
      <div className="flex items-center gap-1.5 text-brand-terracotta">{icon}<span className="text-[10px] font-black uppercase text-brand-brown-light">{label}</span></div>
      <p className="mt-1 text-lg font-black text-brand-brown-dark">{value}</p>
    </div>
  )
}

function MiniProgress({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-[#fffaf4] p-3">
      <p className="text-xs font-black text-brand-brown-dark">{title}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-terracotta" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-2 text-[11px] font-bold text-brand-brown-light">{value}% hoàn thành</p>
    </div>
  )
}
