import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, Plus, Save, Sparkles, Trash2 } from 'lucide-react'
import type { IdeaStatus, IdeaTask } from '../lib/communityTemplates'
import { createIdeaTask } from '../lib/communityTemplates'

type Props = {
  tasks: IdeaTask[]
  members: Array<{ username: string }>
  onChange: (tasks: IdeaTask[]) => void
  onCreateTemplate: () => void
}

const columns: Array<{ key: IdeaStatus; title: string; hint: string }> = [
  { key: 'todo', title: 'Cần làm', hint: 'Ý tưởng và việc mới' },
  { key: 'doing', title: 'Đang làm', hint: 'Việc đang tập trung' },
  { key: 'done', title: 'Hoàn thành', hint: 'Đã xong hoặc đã review' },
]

const statusClass: Record<IdeaStatus, string> = {
  todo: 'border-slate-200 bg-slate-50/80',
  doing: 'border-amber-200 bg-amber-50/80',
  done: 'border-emerald-200 bg-emerald-50/80',
}

export default function IdeaBoard({ tasks, members, onChange, onCreateTemplate }: Props) {
  const [title, setTitle] = useState('')
  const [owner, setOwner] = useState('')

  const counts = useMemo(() => ({
    todo: tasks.filter(task => task.status === 'todo').length,
    doing: tasks.filter(task => task.status === 'doing').length,
    done: tasks.filter(task => task.status === 'done').length,
  }), [tasks])

  const addTask = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    onChange([createIdeaTask(title.trim(), 'todo', owner), ...tasks])
    setTitle('')
  }

  const updateTask = (id: string, patch: Partial<IdeaTask>) => {
    onChange(tasks.map(task => task.id === id ? { ...task, ...patch } : task))
  }

  const removeTask = (id: string) => {
    onChange(tasks.filter(task => task.id !== id))
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-3">
        <div>
          <h2 className="font-display font-black text-xl text-brand-brown-dark flex items-center gap-2">
            <ClipboardList size={22} className="text-brand-terracotta" />
            Idea Board
          </h2>
          <p className="text-sm text-brand-brown-light mt-1">
            Biến mục tiêu của phòng thành checklist, giao việc và lưu lại thành template cho cộng đồng.
          </p>
        </div>

        <button
          onClick={onCreateTemplate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-brown-dark px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-brand-terracotta transition"
        >
          <Save size={16} />
          Tạo template từ phòng
        </button>
      </div>

      <form onSubmit={addTask} className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2 rounded-xl border border-brand-light bg-white p-3 shadow-sm">
        <input
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Thêm việc: ví dụ Luyện nghe 20 phút, làm ARC, viết CV..."
          className="rounded-lg border border-brand-terracotta-light/30 bg-brand-cream px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-terracotta/30"
        />
        <select
          value={owner}
          onChange={event => setOwner(event.target.value)}
          className="rounded-lg border border-brand-terracotta-light/30 bg-white px-3 py-2.5 text-sm font-bold text-brand-brown-light outline-none focus:ring-2 focus:ring-brand-terracotta/30"
        >
          <option value="">Chưa giao</option>
          {members.map(member => (
            <option key={member.username} value={member.username}>{member.username}</option>
          ))}
        </select>
        <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-terracotta px-4 py-2.5 text-sm font-black text-white hover:bg-brand-brown-dark transition">
          <Plus size={16} />
          Thêm
        </button>
      </form>

      {tasks.length === 0 ? (
        <div className="flex-1 min-h-[300px] rounded-2xl border-2 border-dashed border-brand-terracotta-light/30 bg-white/60 flex flex-col items-center justify-center gap-3 text-center p-8">
          <Sparkles size={36} className="text-brand-terracotta/40" />
          <div>
            <p className="font-display font-black text-brand-brown-dark">Chưa có ý tưởng nào trong phòng</p>
            <p className="text-sm text-brand-brown-light mt-1">Thêm task đầu tiên hoặc dùng template từ trang chủ.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {columns.map(column => (
            <section key={column.key} className={`rounded-xl border p-3 ${statusClass[column.key]}`}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-display font-black text-sm text-brand-brown-dark">{column.title}</h3>
                  <p className="text-[11px] font-medium text-brand-brown-light">{column.hint}</p>
                </div>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-brand-brown-light border border-white/80">
                  {counts[column.key]}
                </span>
              </div>

              <div className="space-y-2 min-h-[220px]">
                {tasks.filter(task => task.status === column.key).map(task => (
                  <article key={task.id} className="rounded-lg border border-white/80 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-brand-brown-dark leading-snug">{task.title}</h4>
                        {task.note && <p className="text-xs text-brand-brown-light mt-1">{task.note}</p>}
                      </div>
                      <button
                        onClick={() => removeTask(task.id)}
                        className="p-1 rounded-md text-brand-brown-light hover:bg-red-50 hover:text-red-600 transition"
                        title="Xóa task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <select
                        value={task.status}
                        onChange={event => updateTask(task.id, { status: event.target.value as IdeaStatus })}
                        className="rounded-md border border-brand-light bg-brand-cream px-2 py-1.5 text-[11px] font-black text-brand-brown-light outline-none"
                      >
                        <option value="todo">Cần làm</option>
                        <option value="doing">Đang làm</option>
                        <option value="done">Hoàn thành</option>
                      </select>
                      <input
                        value={task.owner || ''}
                        onChange={event => updateTask(task.id, { owner: event.target.value })}
                        placeholder="Người phụ trách"
                        className="min-w-0 flex-1 rounded-md border border-brand-light bg-white px-2 py-1.5 text-[11px] font-bold text-brand-brown-light outline-none"
                      />
                    </div>

                    {task.status === 'done' && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                        <CheckCircle2 size={12} />
                        Đã hoàn thành
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
