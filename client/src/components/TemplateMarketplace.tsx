import { useMemo, useState } from 'react'
import { BookOpen, BriefcaseBusiness, CheckCircle2, Coins, Headphones, Plane, Search, Users } from 'lucide-react'
import type { RoomTemplate } from '../lib/communityTemplates'

type ActiveRoom = { id: string; hostName: string; memberCount: number; currentSong?: string }

type Props = {
  templates: RoomTemplate[]
  activeRooms: ActiveRoom[]
  onJoinTemplateRoom: (template: RoomTemplate) => void
  onJoinRoom: (roomId: string) => void
  onRefreshRooms: () => void
}

const categoryMeta = {
  topik: { label: 'TOPIK', icon: BookOpen, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
  life: { label: 'Mới sang Hàn', icon: Plane, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  listening: { label: 'Luyện nghe', icon: Headphones, tone: 'bg-violet-50 text-violet-700 border-violet-100' },
  job: { label: 'Việc làm', icon: BriefcaseBusiness, tone: 'bg-orange-50 text-orange-700 border-orange-100' },
  study: { label: 'Học nhóm', icon: Users, tone: 'bg-rose-50 text-rose-700 border-rose-100' },
  money: { label: 'Tài chính', icon: Coins, tone: 'bg-teal-50 text-teal-700 border-teal-100' },
}

export const getTemplateRoomId = (template: RoomTemplate) => {
  const fixedIds: Record<string, string> = {
    'seed-topik-30': 'TOPIK30',
    'seed-korea-checklist': 'KOREALIFE',
    'seed-listening': 'LISTENKR',
    'seed-job': 'JOBKR',
    'seed-evening': 'EVENING',
    'seed-savings': 'SAVINGS',
  }

  if (fixedIds[template.id]) return fixedIds[template.id]
  return template.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase() || template.id.slice(0, 8).toUpperCase()
}

export default function TemplateMarketplace({ templates, activeRooms, onJoinTemplateRoom, onJoinRoom, onRefreshRooms }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | RoomTemplate['category']>('all')

  // Những template cũ giờ là phòng công khai 24/24, lọc giống lobby để người dùng tìm nhanh.
  const publicRooms = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter(template => {
      const matchesCategory = category === 'all' || template.category === category
      const haystack = [template.title, template.description, ...template.tags].join(' ').toLowerCase()
      return matchesCategory && (!q || haystack.includes(q))
    })
  }, [templates, query, category])

  const publicRoomIds = useMemo(() => new Set(templates.map(template => getTemplateRoomId(template))), [templates])
  const userRooms = activeRooms.filter(room => !publicRoomIds.has(room.id))

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase text-brand-terracotta">Study lobby</p>
          <h2 className="mt-1 font-display text-xl font-black text-brand-brown-dark">Phòng đang hoạt động</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-brand-brown-light">
            Các phòng chủ đề luôn mở 24/24. Vào thẳng phòng phù hợp, không cần tạo lại từ đầu.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <label className="relative block w-full md:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown-light" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Tìm TOPIK, job, tiết kiệm..."
              className="h-10 w-full rounded-xl border border-black/[0.08] bg-[#faf7f2] px-9 text-sm font-bold text-brand-brown-dark outline-none transition focus:border-brand-terracotta-light focus:bg-white focus:ring-2 focus:ring-brand-terracotta/20"
            />
          </label>
          <button onClick={onRefreshRooms} className="h-10 rounded-xl border border-black/[0.08] bg-white px-3 text-xs font-black text-brand-brown-light hover:border-brand-terracotta-light">
            Làm mới
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategory('all')}
          className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-black transition ${category === 'all' ? 'border-brand-brown-dark bg-brand-brown-dark text-white' : 'border-black/[0.06] bg-[#faf7f2] text-brand-brown-light hover:bg-white'}`}
        >
          Tất cả
        </button>
        {(Object.keys(categoryMeta) as RoomTemplate['category'][]).map(key => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-black transition ${category === key ? 'border-brand-brown-dark bg-brand-brown-dark text-white' : 'border-black/[0.06] bg-[#faf7f2] text-brand-brown-light hover:bg-white'}`}
          >
            {categoryMeta[key].label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {publicRooms.slice(0, 6).map(template => {
          const meta = categoryMeta[template.category]
          const Icon = meta.icon
          const fixedRoomId = getTemplateRoomId(template)
          const liveRoom = activeRooms.find(room => room.id === fixedRoomId)
          const memberCount = liveRoom?.memberCount ?? 0

          return (
            <article key={template.id} className="group rounded-xl border border-black/[0.06] bg-[#fffdfb] p-4 transition hover:-translate-y-0.5 hover:border-brand-terracotta-light hover:bg-white hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border ${meta.tone}`}>
                  <Icon size={18} />
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  24/24
                </div>
              </div>

              <h3 className="mt-4 font-display text-base font-black leading-tight text-brand-brown-dark">{template.title}</h3>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-relaxed text-brand-brown-light">{template.description}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-[#faf7f2] px-2 py-1 text-[10px] font-black text-brand-terracotta">{fixedRoomId}</span>
                {template.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="rounded-md bg-[#faf7f2] px-2 py-1 text-[10px] font-bold text-brand-brown-light">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-brown-light">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  {memberCount ? `${memberCount} người trong phòng` : 'Đang mở sẵn'}
                </span>
                <button
                  onClick={() => onJoinTemplateRoom(template)}
                  className="rounded-lg bg-brand-terracotta px-3 py-2 text-xs font-black text-white transition hover:bg-brand-brown-dark"
                >
                  Vào phòng
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {userRooms.length > 0 && (
        <div className="mt-5 border-t border-black/[0.06] pt-4">
          <h3 className="font-display text-sm font-black text-brand-brown-dark">Phòng người dùng đang mở</h3>
          <div className="mt-3 grid gap-2">
            {userRooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => onJoinRoom(room.id)}
                  className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-[#faf7f2] px-4 py-3 text-left transition hover:border-brand-terracotta-light hover:bg-white"
                >
                  <span>
                    <span className="block text-sm font-black text-brand-brown-dark">Phòng của {room.hostName}</span>
                    <span className="mt-1 block text-xs font-bold text-brand-brown-light">{room.memberCount} người · {room.currentSong || 'Study room'}</span>
                  </span>
                  <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-brand-terracotta">{room.id}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </section>
  )
}
