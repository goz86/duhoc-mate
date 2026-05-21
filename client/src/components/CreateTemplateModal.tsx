import { useState } from 'react'
import { X } from 'lucide-react'
import type { IdeaTask, RoomTemplate } from '../lib/communityTemplates'

type Props = {
  open: boolean
  tasks: IdeaTask[]
  creatorName: string
  onClose: () => void
  onSave: (template: Omit<RoomTemplate, 'id' | 'createdAt' | 'uses'>) => Promise<void>
}

export default function CreateTemplateModal({ open, tasks, creatorName, onClose, onSave }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<RoomTemplate['category']>('study')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      title: title.trim(),
      description: description.trim() || 'Template được tạo từ một phòng học Duhoc Mate.',
      category,
      creatorName,
      tasks,
      playlist: [],
      tags: [category, 'community', 'room-template'],
    })
    setSaving(false)
    setTitle('')
    setDescription('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/35 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-brand-light p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display font-black text-xl text-brand-brown-dark">Tạo template từ phòng</h2>
            <p className="text-sm text-brand-brown-light mt-1">
              Lưu Idea Board hiện tại để người khác có thể tạo phòng từ mẫu này.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-brand-light transition">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="Tên template, ví dụ Room ôn TOPIK cuối tuần"
            className="w-full rounded-xl border border-brand-terracotta-light/30 bg-brand-cream px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-terracotta/30"
            required
          />
          <textarea
            value={description}
            onChange={event => setDescription(event.target.value)}
            placeholder="Mô tả ngắn: template này giúp ai, dùng trong bao lâu, mục tiêu là gì?"
            rows={3}
            className="w-full rounded-xl border border-brand-terracotta-light/30 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-terracotta/30 resize-none"
          />
          <select
            value={category}
            onChange={event => setCategory(event.target.value as RoomTemplate['category'])}
            className="w-full rounded-xl border border-brand-terracotta-light/30 bg-white px-4 py-3 text-sm font-bold text-brand-brown-light outline-none focus:ring-2 focus:ring-brand-terracotta/30"
          >
            <option value="study">Học nhóm</option>
            <option value="topik">TOPIK</option>
            <option value="life">Mới sang Hàn</option>
            <option value="listening">Luyện nghe</option>
            <option value="job">Việc làm</option>
            <option value="money">Tài chính</option>
          </select>
        </div>

        <div className="rounded-xl bg-brand-light/60 border border-brand-light p-3 text-sm text-brand-brown-light">
          Template sẽ lưu <span className="font-black text-brand-brown-dark">{tasks.length}</span> task từ Idea Board hiện tại.
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-brand-light px-4 py-2.5 text-sm font-black text-brand-brown-light hover:bg-brand-light transition">
            Hủy
          </button>
          <button disabled={saving} className="rounded-xl bg-brand-terracotta px-4 py-2.5 text-sm font-black text-white hover:bg-brand-brown-dark transition disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Lưu template'}
          </button>
        </div>
      </form>
    </div>
  )
}
