import { useMemo, useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, ClipboardList, Plus, Sparkles, Trash2, UserRound, ChevronDown } from 'lucide-react'
import confetti from 'canvas-confetti'
import type { IdeaStatus, IdeaTask } from '../lib/communityTemplates'
import { createIdeaTask } from '../lib/communityTemplates'

interface Option {
  value: string
  label: string
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  className = '',
  size = 'md',
}: {
  value: string
  onChange: (val: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(o => o.value === value)

  useEffect(() => {
    if (!isOpen) return
    const handleClose = () => setIsOpen(false)
    document.addEventListener('click', handleClose)
    return () => document.removeEventListener('click', handleClose)
  }, [isOpen])

  const btnPadding = size === 'sm' ? 'px-2.5 py-1.5 text-[11px] font-black' : 'px-3 py-3 text-sm font-bold'
  const dropdownMargin = size === 'sm' ? 'mt-1' : 'mt-1.5'

  return (
    <div className={`relative ${className}`} onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 rounded-xl border border-brand-terracotta-light/35 bg-white text-brand-brown-light focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30 transition-all hover:border-brand-terracotta cursor-pointer ${btnPadding}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={size === 'sm' ? 12 : 14} className="shrink-0 text-brand-brown-light" />
      </button>
      
      {isOpen && (
        <div className={`absolute left-0 right-0 top-full z-50 max-h-60 overflow-y-auto rounded-xl border border-brand-terracotta-light/20 bg-white p-1 shadow-lg animate-fade-slide-down ${dropdownMargin}`}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                opt.value === value
                  ? 'bg-brand-terracotta text-white'
                  : 'text-brand-brown-light hover:bg-[#FAF6F0] hover:text-brand-terracotta'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type Props = {
  tasks: IdeaTask[]
  members: Array<{ username: string }>
  onChange: (tasks: IdeaTask[]) => void
  onCreateTemplate?: () => void
}

const columns: Array<{ key: IdeaStatus; title: string; hint: string; tone: string }> = [
  { key: 'todo', title: 'Cần làm', hint: 'Ý tưởng và việc mới', tone: 'border-slate-200 bg-slate-50/80' },
  { key: 'doing', title: 'Đang làm', hint: 'Việc đang tập trung', tone: 'border-amber-200 bg-amber-50/80' },
  { key: 'done', title: 'Hoàn thành', hint: 'Đã xong hoặc đã review', tone: 'border-emerald-200 bg-emerald-50/80' },
]

const workflowSteps = [
  'Ghi ý tưởng',
  'Giao người làm',
  'Đang làm',
  'Review',
  'Hoàn thành',
]

export default function IdeaBoard({ tasks, members, onChange }: Props) {
  const [title, setTitle] = useState('')
  const [owner, setOwner] = useState('')
  const [activeColumn, setActiveColumn] = useState<IdeaStatus>('todo')

  const prevTasksRef = useRef<IdeaTask[]>([])

  useEffect(() => {
    if (prevTasksRef.current.length > 0 && tasks.length > 0) {
      const hasNewlyDone = tasks.some(task => {
        if (task.status !== 'done') return false
        const prev = prevTasksRef.current.find(t => t.id === task.id)
        return !prev || prev.status !== 'done'
      })

      if (hasNewlyDone) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a65b46', '#d97d65', '#8c6239', '#bf8f63', '#f2d5a3']
        })
        setTimeout(() => {
          confetti({
            particleCount: 70,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#a65b46', '#d97d65', '#8c6239']
          })
        }, 200)
        setTimeout(() => {
          confetti({
            particleCount: 70,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#bf8f63', '#f2d5a3', '#d9a773']
          })
        }, 400)
      }
    }
    prevTasksRef.current = tasks
  }, [tasks])

  const counts = useMemo(() => ({
    todo: tasks.filter(task => task.status === 'todo').length,
    doing: tasks.filter(task => task.status === 'doing').length,
    done: tasks.filter(task => task.status === 'done').length,
  }), [tasks])

  const activeStep = useMemo(() => {
    if (counts.done > 0) return 4
    if (counts.doing > 0) return 2
    if (tasks.some(task => task.owner)) return 1
    return tasks.length > 0 ? 1 : 0
  }, [counts.doing, counts.done, tasks])

  const completionPercent = tasks.length ? Math.round((counts.done / tasks.length) * 100) : 0

  const addTask = (event?: FormEvent) => {
    event?.preventDefault()
    if (!title.trim()) return
    onChange([createIdeaTask(title.trim(), 'todo', owner), ...tasks])
    setTitle('')
    setActiveColumn('todo')
  }

  const updateTask = (id: string, patch: Partial<IdeaTask>) => {
    onChange(tasks.map(task => task.id === id ? { ...task, ...patch } : task))
    if (patch.status) setActiveColumn(patch.status)
  }

  const removeTask = (id: string) => {
    onChange(tasks.filter(task => task.id !== id))
  }

  const visibleColumns = columns.filter(column => column.key === activeColumn)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto rounded-[28px] bg-[#FDF8F0] p-3 sm:p-5 custom-scrollbar">
      <div className="flex flex-col gap-4">
        <div className="rounded-[28px] border border-brand-terracotta-light/25 bg-white/85 p-4 shadow-[0_24px_70px_rgba(76,55,49,0.10)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 gap-3 justify-center sm:justify-start items-center w-full">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-terracotta text-white shadow-lg shadow-brand-terracotta/20">
                <ClipboardList size={25} />
              </div>
              <div className="min-w-0 hidden sm:block">
                <h2 className="font-display text-xl font-black leading-tight text-brand-brown-dark sm:text-2xl">Bảng ý tưởng của phòng</h2>
                <p className="mt-1 text-sm leading-relaxed text-brand-brown-light">
                  Biến mục tiêu thành việc nhỏ, giao người làm và lưu lại thành template cho cộng đồng.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pb-1">
            <div className="relative grid grid-cols-5 items-start gap-1 px-1 w-full">
              <div className="absolute left-[10%] right-[10%] top-4 sm:top-6 h-1 rounded-full bg-brand-terracotta-light/35" />
              <div
                className="absolute left-[10%] top-4 sm:top-6 h-1 rounded-full bg-brand-terracotta transition-all"
                style={{ width: `${Math.min(activeStep, 4) * 20}%` }}
              />
              {workflowSteps.map((step, stepIndex) => {
                const isDone = stepIndex < activeStep
                const isActive = stepIndex === activeStep

                return (
                  <div key={step} className="relative z-10 flex flex-col items-center text-center">
                    <div className="relative flex items-center justify-center h-8 w-8 sm:h-12 sm:w-12">
                      {isActive && (
                        <>
                          <div className="absolute inset-0 rounded-full bg-brand-terracotta/15 animate-ping-slow pointer-events-none -m-0.5" />
                          <div className="absolute inset-0 rounded-full border border-dashed border-brand-terracotta animate-spin-slow pointer-events-none -m-1 sm:-m-1.5" />
                        </>
                      )}
                      <span className={`grid h-7 w-7 sm:h-11 sm:w-11 place-items-center rounded-full border-2 sm:border-4 shadow-sm transition-all duration-300 ${isDone ? 'border-brand-terracotta bg-brand-terracotta text-white' : isActive ? 'border-brand-terracotta-light bg-white text-brand-terracotta' : 'border-brand-terracotta-light/45 bg-white text-brand-brown-light'}`}>
                        {isDone && <CheckCircle2 size={12} className="sm:hidden" />}
                        {isDone && <CheckCircle2 size={17} className="hidden sm:block" />}
                        {!isDone && <span className="text-[10px] sm:text-sm font-black">{stepIndex + 1}</span>}
                      </span>
                    </div>
                    <span className={`mt-2 text-[9px] sm:text-[11px] font-black ${isActive ? 'text-brand-terracotta' : 'text-brand-brown-light'}`}>
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <form onSubmit={addTask} className="grid grid-cols-1 gap-2 rounded-2xl border border-brand-terracotta-light/20 bg-white/85 p-3 shadow-sm md:grid-cols-[1fr_180px_auto]">
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="Thêm mục tiêu học: làm ARC, nghe 20 phút, viết CV..."
            className="rounded-xl border border-brand-terracotta-light/30 bg-brand-cream px-3 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-terracotta/30"
          />
          <CustomSelect
            value={owner}
            onChange={setOwner}
            placeholder="Giao người làm"
            options={[
              { value: '', label: 'Chưa giao' },
              ...members.map(member => ({ value: member.username, label: member.username }))
            ]}
          />
          <button className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-terracotta px-4 py-3 text-sm font-black text-white transition hover:bg-brand-brown-dark">
            <Plus size={16} />
            Thêm
          </button>
        </form>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-terracotta-light/20 bg-white/85 p-2 sm:p-4 text-center shadow-sm">
            <div className="text-[9px] sm:text-xs font-black uppercase text-brand-brown-light">
              Tổng việc
            </div>
            <p className="mt-1 sm:mt-2 font-display text-xl sm:text-2xl font-black text-brand-brown-dark">{tasks.length}</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-terracotta-light/20 bg-white/85 p-2 sm:p-4 text-center shadow-sm">
            <div className="text-[9px] sm:text-xs font-black uppercase text-brand-brown-light">
              Đang làm
            </div>
            <p className="mt-1 sm:mt-2 font-display text-xl sm:text-2xl font-black text-brand-brown-dark">{counts.doing}</p>
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-brand-terracotta-light/20 bg-white/85 p-2 sm:p-4 shadow-sm">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-[9px] sm:text-xs font-black uppercase text-brand-brown-light">
                Hoàn thành
              </div>
              <p className="mt-1 sm:mt-2 font-display text-xl sm:text-2xl font-black text-brand-terracotta">{completionPercent}%</p>
            </div>
            <div className="mt-2 sm:mt-3 h-1.5 sm:h-2 rounded-full bg-brand-terracotta-light/30">
              <div className="h-full rounded-full bg-brand-terracotta transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 xl:hidden">
          {columns.map(column => (
            <button
              key={column.key}
              type="button"
              onClick={() => setActiveColumn(column.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${activeColumn === column.key ? 'bg-brand-terracotta text-white shadow-sm' : 'bg-white/85 text-brand-brown-light'}`}
            >
              {column.title} ({counts[column.key]})
            </button>
          ))}
        </div>

        {tasks.length === 0 ? (
          <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-brand-terracotta-light/30 bg-white/70 p-8 text-center">
            <Sparkles size={36} className="text-brand-terracotta/45" />
            <div>
              <p className="font-display font-black text-brand-brown-dark">Chưa có ý tưởng nào trong phòng</p>
              <p className="mt-1 text-sm text-brand-brown-light">Thêm task đầu tiên hoặc chọn chip gợi ý ở trên.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:hidden">
            {visibleColumns.map(column => (
              <BoardColumn
                key={column.key}
                column={column}
                tasks={tasks}
                count={counts[column.key]}
                updateTask={updateTask}
                removeTask={removeTask}
              />
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <div className="hidden gap-3 xl:grid xl:grid-cols-3">
            {columns.map(column => (
              <BoardColumn
                key={column.key}
                column={column}
                tasks={tasks}
                count={counts[column.key]}
                updateTask={updateTask}
                removeTask={removeTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BoardColumn({
  column,
  tasks,
  count,
  updateTask,
  removeTask,
}: {
  column: typeof columns[number]
  tasks: IdeaTask[]
  count: number
  updateTask: (id: string, patch: Partial<IdeaTask>) => void
  removeTask: (id: string) => void
}) {
  const columnTasks = tasks.filter(task => task.status === column.key)

  return (
              <section key={column.key} className={`rounded-2xl border p-3 ${column.tone}`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm font-black text-brand-brown-dark">{column.title}</h3>
                    <p className="text-[11px] font-medium text-brand-brown-light">{column.hint}</p>
                  </div>
                  <span className="rounded-lg border border-white/80 bg-white px-2 py-1 text-xs font-black text-brand-brown-light">
                    {count}
                  </span>
                </div>

                <div className="min-h-[220px] space-y-2">
                  {columnTasks.length === 0 && (
                    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-white bg-white/45 p-4 text-center text-xs font-bold text-brand-brown-light">
                      Chưa có việc ở bước này
                    </div>
                  )}

                  {columnTasks.map(task => (
                    <article key={task.id} className="rounded-xl border border-white/80 bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold leading-snug text-brand-brown-dark">{task.title}</h4>
                          {task.note && <p className="mt-1 text-xs text-brand-brown-light">{task.note}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          className="rounded-md p-1 text-brand-brown-light transition hover:bg-red-50 hover:text-red-600"
                          title="Xóa task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <CustomSelect
                          value={task.status}
                          onChange={val => updateTask(task.id, { status: val as IdeaStatus })}
                          options={[
                            { value: 'todo', label: 'Cần làm' },
                            { value: 'doing', label: 'Đang làm' },
                            { value: 'done', label: 'Hoàn thành' }
                          ]}
                          size="sm"
                          className="w-[110px]"
                        />
                        <label className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-brand-light bg-white px-2 py-1.5 text-[11px] font-bold text-brand-brown-light">
                          <UserRound size={12} className="shrink-0" />
                          <input
                            value={task.owner || ''}
                            onChange={event => updateTask(task.id, { owner: event.target.value })}
                            placeholder="Người phụ trách"
                            className="min-w-0 flex-1 bg-transparent outline-none"
                          />
                        </label>
                      </div>

                      {task.status === 'done' && (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                          <CheckCircle2 size={12} />
                          Đã hoàn thành
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
  )
}
