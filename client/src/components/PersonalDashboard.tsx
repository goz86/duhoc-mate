import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Flame,
  Gamepad2,
  GraduationCap,
  ListChecks,
  Play,
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
  iconColor: string
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
      .map(session => (session.leftAt ? new Date(session.leftAt).toISOString().slice(0, 10) : ''))
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
      accent: 'bg-amber-50 text-amber-800 border-amber-200/60',
      iconColor: 'text-amber-600',
    },
    {
      id: 'grammar',
      title: `2 mẫu ngữ pháp TOPIK ${level}`,
      detail:
        topWeakness === 'grammar_connector'
          ? 'Tập trung nối câu và sắc thái nguyên nhân/kết quả.'
          : 'Đọc công thức, ví dụ và lỗi hay nhầm.',
      minutes: 10,
      accent: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'mini-test',
      title: 'Đề ngắn 5 câu',
      detail: `AI Coach ưu tiên nhóm yếu: ${weaknessLabel}.`,
      minutes: 7,
      accent: 'bg-indigo-50 text-indigo-800 border-indigo-200/60',
      iconColor: 'text-indigo-600',
    },
    {
      id: 'arena',
      title: 'Game ôn nhanh',
      detail: 'Ghép thẻ hoặc Grammar Race để củng cố kiến thức hôm nay.',
      minutes: 5,
      accent: 'bg-rose-50 text-rose-800 border-rose-200/60',
      iconColor: 'text-rose-600',
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

  // Clean display name calculation (fallback if name is single character or empty)
  const rawName = (profile?.username || username || '').trim()
  const displayName = rawName.length > 1 ? rawName : 'Bạn'

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

  const handleAction = () => {
    if (onOpenTopikRoom) {
      onOpenTopikRoom()
    } else {
      onStartRoom()
    }
  }

  return (
    <section className="animate-custom-fade-in mx-auto max-w-7xl pb-10">
      {/* Outer Container with sleek minimalist border & backdrop */}
      <div className="space-y-6 rounded-[32px] border border-stone-200/70 bg-stone-50/40 p-4 sm:p-6 lg:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.03)] backdrop-blur-sm">
        
        {/* ── 1. Hero Header & Quick Stats Row ── */}
        <div className="grid gap-5 lg:grid-cols-12 lg:items-center">
          {/* Main Welcome Card */}
          <div className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm sm:p-7 lg:col-span-7">
            <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-brand-terracotta/10 to-amber-200/20 blur-2xl" />
            
            <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-terracotta/20 bg-brand-terracotta/8 px-3 py-1 text-xs font-bold text-brand-terracotta">
                  <span>Lộ trình cá nhân hóa</span>
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
                  Lộ trình học của {displayName}
                </h1>
                <p className="mt-1.5 text-xs font-medium text-stone-500 leading-relaxed max-w-md">
                  Mục tiêu TOPIK, streak và bài tập hàng ngày được tự động điều chỉnh theo tiến độ của bạn.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAction}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand-terracotta px-5 py-3 text-sm font-bold text-white shadow-md shadow-brand-terracotta/25 transition duration-200 hover:bg-brand-terracotta-dark active:scale-[0.98]"
              >
                <Play size={15} fill="currentColor" />
                <span>Học 30 phút</span>
              </button>
            </div>

            {/* Overall Progress Bar */}
            <div className="mt-6 border-t border-stone-100 pt-4">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span>Tiến độ ngày {planDay}/{coachProfile.days}</span>
                <span className="font-black text-brand-terracotta">{planPct}%</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-stone-100 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-terracotta to-amber-500 transition-all duration-500"
                  style={{ width: `${planPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4 Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-5 lg:grid-cols-2">
            <StatCard
              icon={<Flame size={18} className="text-amber-500" />}
              bgIcon="bg-amber-50"
              label="Streak"
              value={`${stats.streak} ngày`}
            />
            <StatCard
              icon={<Timer size={18} className="text-sky-500" />}
              bgIcon="bg-sky-50"
              label="Tổng thời gian"
              value={`${stats.totalHours}h`}
            />
            <StatCard
              icon={<Target size={18} className="text-brand-terracotta" />}
              bgIcon="bg-brand-terracotta/10"
              label="Mục tiêu"
              value={`TOPIK ${coachProfile.targetLevel}`}
            />
            <StatCard
              icon={<CalendarDays size={18} className="text-emerald-500" />}
              bgIcon="bg-emerald-50"
              label="Ngày còn lại"
              value={daysLeft === null ? '--' : `${daysLeft} ngày`}
            />
          </div>
        </div>

        {/* ── 2. Core 3-Column Dashboard ── */}
        <div className="grid gap-5 lg:grid-cols-12">
          
          {/* Column 1: Mục tiêu TOPIK (3 cols) */}
          <div className="flex flex-col justify-between rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm lg:col-span-3">
            <div>
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-stone-100 text-stone-700">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-stone-900">Mục tiêu TOPIK</h2>
                  <p className="text-[11px] font-medium text-stone-400">Tùy chỉnh kế hoạch</p>
                </div>
              </div>

              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Cấp độ mục tiêu</label>
                  <select
                    value={coachProfile.targetLevel}
                    onChange={e => saveCoachProfile({ targetLevel: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs font-bold text-stone-800 outline-none transition focus:border-brand-terracotta focus:bg-white"
                  >
                    {[2, 3, 4, 5, 6].map(level => (
                      <option key={level} value={level}>TOPIK {level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Số ngày ôn tập</label>
                  <input
                    type="number"
                    min={7}
                    max={180}
                    value={coachProfile.days}
                    onChange={e => saveCoachProfile({ days: Math.max(7, Math.min(180, Number(e.target.value) || 30)) })}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs font-bold text-stone-800 outline-none transition focus:border-brand-terracotta focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Ngày thi dự kiến</label>
                  <input
                    type="date"
                    value={coachProfile.examDate}
                    onChange={e => saveCoachProfile({ examDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs font-bold text-stone-800 outline-none transition focus:border-brand-terracotta focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Smart Hint Box */}
            <div className="mt-4 rounded-2xl border border-brand-terracotta/15 bg-brand-terracotta/5 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-terracotta">
                <span>Gợi ý hôm nay</span>
              </div>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-stone-600">
                Ngày {planDay}/{coachProfile.days}: Tập trung {topWeakness?.label || 'ôn đều các kỹ năng'}.
              </p>
            </div>
          </div>

          {/* Column 2: Nhiệm vụ hôm nay (6 cols) */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm lg:col-span-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <ListChecks size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-stone-900">Nhiệm vụ hôm nay</h2>
                  <p className="text-[11px] font-medium text-stone-400">
                    Hoàn thành {completedToday.length}/{missions.length} mục (~30 phút)
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600 border border-emerald-200/50">
                {completionPct}%
              </span>
            </div>

            {/* Progress line */}
            <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>

            {/* Mission List */}
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {missions.map(mission => {
                const done = completedToday.includes(mission.id)
                return (
                  <button
                    key={mission.id}
                    type="button"
                    onClick={() => toggleMission(mission.id)}
                    className={`group relative text-left rounded-2xl border p-3.5 transition duration-150 ${
                      done
                        ? 'border-emerald-200 bg-emerald-50/40 text-stone-600'
                        : 'border-stone-200/70 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${mission.accent}`}>
                        <Clock size={10} />
                        {mission.minutes}p
                      </span>
                      {done ? (
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Circle size={18} className="text-stone-300 transition group-hover:text-stone-400 shrink-0" />
                      )}
                    </div>
                    <p className={`mt-2 text-xs font-bold ${done ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                      {mission.title}
                    </p>
                    <p className="mt-1 text-[11px] font-normal leading-relaxed text-stone-500 line-clamp-2">
                      {mission.detail}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Column 3: Bản đồ điểm yếu (3 cols) */}
          <div className="flex flex-col justify-between rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm lg:col-span-3">
            <div>
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-sky-50 text-sky-600">
                  <BarChart3 size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-stone-900">Bản đồ điểm yếu</h2>
                  <p className="text-[11px] font-medium text-stone-400">Thống kê lỗi sai</p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {weaknessSummary.map(item => {
                  const max = Math.max(1, weaknessSummary[0]?.count || 1)
                  const percent = Math.max(4, (item.count / max) * 100)
                  return (
                    <div key={item.errorType} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                        <span>{item.label}</span>
                        <span className="text-stone-500">{item.count}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recommended Review Box */}
            <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5">
              <span className="text-[11px] font-bold text-sky-800">Bài chữa lỗi 10 phút</span>
              <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-stone-600">
                {topWeakness
                  ? `Nên ưu tiên chữa nhóm: ${topWeakness.label}.`
                  : 'Sẽ tự động thống kê khi bạn luyện bài đầu tiên.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── 3. Bottom Row: Arena/Game & Bộ đang học dở ── */}
        <div className="grid gap-5 lg:grid-cols-12">
          
          {/* Arena / Game Cards (6 cols) */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm lg:col-span-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-50 text-purple-600">
                  <Gamepad2 size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-stone-900">TOPIK Arena & Game</h2>
                  <p className="text-[11px] font-medium text-stone-400">Ôn luyện tương tác</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { title: 'Ghép thẻ', status: 'Sẵn sàng', active: true, action: handleAction },
                { title: 'Grammar Race', status: 'Sẵn sàng', active: true, action: handleAction },
                { title: 'Boss 10 câu', status: 'Sắp mở', active: false, action: undefined },
                { title: 'Sprint 7 ngày', status: 'Sắp mở', active: false, action: undefined },
              ].map((item, idx) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.action}
                  disabled={!item.active}
                  className={`group text-left rounded-2xl border p-3.5 transition duration-150 ${
                    item.active
                      ? 'border-stone-200/80 bg-stone-50/50 hover:border-brand-terracotta/40 hover:bg-white active:scale-[0.98]'
                      : 'border-stone-100 bg-stone-50/20 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Trophy size={15} className={idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-emerald-500' : 'text-stone-400'} />
                    {item.active && <ChevronRight size={14} className="text-stone-400 group-hover:text-brand-terracotta transition" />}
                  </div>
                  <p className="mt-2.5 text-xs font-bold text-stone-800">{item.title}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-stone-400">{item.status}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Bộ đang học dở & Actions (6 cols) */}
          <div className="flex flex-col justify-between rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm lg:col-span-6">
            <div>
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-stone-900">Bộ đang học dở</h2>
                  <p className="text-[11px] font-medium text-stone-400">Tiếp tục nội dung đã lưu</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MiniProgress
                  title={`Từ vựng TOPIK ${coachProfile.targetLevel}`}
                  value={Math.min(100, completedToday.includes('vocab') ? 70 : 45)}
                />
                <MiniProgress
                  title={`Ngữ pháp TOPIK ${coachProfile.targetLevel}`}
                  value={Math.min(100, completedToday.includes('grammar') ? 62 : 38)}
                />
                <MiniProgress
                  title="Luyện đề ngắn"
                  value={Math.min(100, completedToday.includes('mini-test') ? 55 : 22)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={handleAction}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-terracotta px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-terracotta-dark active:scale-[0.98]"
              >
                <Target size={15} />
                <span>Vào TOPIK</span>
              </button>
              <button
                type="button"
                onClick={onStartRoom}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-[0.98]"
              >
                <RotateCcw size={15} />
                <span>Mở phòng học nhóm</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}

/* ── Minimalist Sub-Components ── */

function StatCard({
  icon,
  bgIcon,
  label,
  value,
}: {
  icon: ReactNode
  bgIcon: string
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-sm transition hover:border-stone-300">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${bgIcon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide truncate">{label}</p>
        <p className="text-sm font-black text-stone-900 truncate">{value}</p>
      </div>
    </div>
  )
}

function MiniProgress({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-stone-50/40 p-3">
      <p className="text-xs font-bold text-stone-800 truncate">{title}</p>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-200/60">
        <div
          className="h-full rounded-full bg-brand-terracotta transition-all duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] font-extrabold text-stone-500">{value}% hoàn thành</p>
    </div>
  )
}
