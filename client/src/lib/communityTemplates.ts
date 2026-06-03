import { supabase } from './supabase'

export type IdeaStatus = 'todo' | 'doing' | 'done'

export type IdeaTask = {
  id: string
  title: string
  note?: string
  status: IdeaStatus
  owner?: string
  due?: string
}

export type RoomTemplate = {
  id: string
  title: string
  description: string
  category: 'topik' | 'life' | 'listening' | 'job' | 'study' | 'money'
  roomAvatarUrl?: string
  creatorName: string
  createdAt: string
  tasks: IdeaTask[]
  playlist?: Array<{ title: string; videoId?: string }>
  tags: string[]
  uses: number
}

const templateStorageKey = 'duhocmate_room_templates'
const taskStorageKey = (roomId: string) => `duhocmate_idea_tasks_${roomId}`

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const seedTemplates: RoomTemplate[] = [
  {
    id: 'seed-topik-30',
    title: 'Phòng ôn TOPIK 30 ngày',
    description: 'Lộ trình học từ vựng, nghe, đọc và mock test mỗi tuần.',
    category: 'topik',
    roomAvatarUrl: '/topik-room-avatar.svg',
    creatorName: 'Duhoc Mate',
    createdAt: new Date().toISOString(),
    tags: ['TOPIK', '30 ngày', 'flashcard'],
    uses: 128,
    tasks: [
      { id: uid(), title: 'Chọn level TOPIK mục tiêu', status: 'todo', note: 'Ghi rõ TOPIK I/II và điểm mong muốn.' },
      { id: uid(), title: 'Học 30 từ mới mỗi ngày', status: 'todo', note: 'Đánh dấu từ chưa nhớ vào cột Doing.' },
      { id: uid(), title: 'Luyện nghe 20 phút', status: 'todo' },
      { id: uid(), title: 'Mock test cuối tuần', status: 'todo', due: 'Chủ nhật' },
    ],
  },
  {
    id: 'seed-korea-checklist',
    title: 'Checklist mới sang Hàn',
    description: 'Những việc cần làm trong 2 tuần đầu: sim, bank, ARC, nhà ở.',
    category: 'life',
    creatorName: 'Duhoc Mate',
    createdAt: new Date().toISOString(),
    tags: ['định cư', 'ARC', 'bank'],
    uses: 96,
    tasks: [
      { id: uid(), title: 'Mua sim và đăng ký data', status: 'todo' },
      { id: uid(), title: 'Mở tài khoản ngân hàng', status: 'todo' },
      { id: uid(), title: 'Đặt lịch làm ARC', status: 'todo' },
      { id: uid(), title: 'Lưu số điện thoại khẩn cấp', status: 'todo' },
    ],
  },
  {
    id: 'seed-listening',
    title: 'Room luyện nghe tiếng Hàn',
    description: 'Nghe chủ động theo video, shadowing và ghi lại cụm từ hay.',
    category: 'listening',
    creatorName: 'Duhoc Mate',
    createdAt: new Date().toISOString(),
    tags: ['nghe', 'shadowing', 'YouTube'],
    uses: 74,
    tasks: [
      { id: uid(), title: 'Chọn 3 video nghe trong tuần', status: 'todo' },
      { id: uid(), title: 'Shadowing 10 phút mỗi buổi', status: 'todo' },
      { id: uid(), title: 'Ghi 15 cụm từ mới', status: 'todo' },
    ],
    playlist: [{ title: 'Korean listening practice' }, { title: 'Korean daily conversation' }],
  },
  {
    id: 'seed-job',
    title: 'Room săn job part-time',
    description: 'Chuẩn bị CV, câu giới thiệu, nơi tìm việc và lịch follow-up.',
    category: 'job',
    creatorName: 'Duhoc Mate',
    createdAt: new Date().toISOString(),
    tags: ['job', 'CV', 'Kakao'],
    uses: 52,
    tasks: [
      { id: uid(), title: 'Viết CV tiếng Hàn 1 trang', status: 'todo' },
      { id: uid(), title: 'Soạn câu tự giới thiệu 30 giây', status: 'todo' },
      { id: uid(), title: 'Tìm 10 quán/cửa hàng gần nhà', status: 'todo' },
      { id: uid(), title: 'Theo dõi lịch phỏng vấn', status: 'todo' },
    ],
  },
  {
    id: 'seed-evening',
    title: 'Room học nhóm buổi tối',
    description: 'Phòng học nhẹ nhàng 90 phút với Pomodoro, nhạc nền và check-in.',
    category: 'study',
    creatorName: 'Duhoc Mate',
    createdAt: new Date().toISOString(),
    tags: ['study room', 'Pomodoro', 'evening'],
    uses: 141,
    tasks: [
      { id: uid(), title: 'Check-in mục tiêu tối nay', status: 'todo' },
      { id: uid(), title: 'Pomodoro 25 phút lần 1', status: 'todo' },
      { id: uid(), title: 'Pomodoro 25 phút lần 2', status: 'todo' },
      { id: uid(), title: 'Tổng kết 3 dòng', status: 'todo' },
    ],
  },
  {
    id: 'seed-savings',
    title: 'Kế hoạch tiết kiệm tiền/tháng',
    description: 'Theo dõi tiền nhà, ăn uống, đi lại và mục tiêu tiết kiệm.',
    category: 'money',
    creatorName: 'Duhoc Mate',
    createdAt: new Date().toISOString(),
    tags: ['budget', 'KRW', 'tiết kiệm'],
    uses: 63,
    tasks: [
      { id: uid(), title: 'Đặt mục tiêu tiết kiệm tháng này', status: 'todo' },
      { id: uid(), title: 'Liệt kê chi phí cố định', status: 'todo' },
      { id: uid(), title: 'Theo dõi chi tiêu ăn uống', status: 'todo' },
      { id: uid(), title: 'Review ngân sách mỗi Chủ nhật', status: 'todo' },
    ],
  },
]

const readLocalTemplates = () => {
  try {
    const raw = localStorage.getItem(templateStorageKey)
    const custom = raw ? JSON.parse(raw) as RoomTemplate[] : []
    return [...custom, ...seedTemplates]
  } catch {
    return seedTemplates
  }
}

export const loadTemplates = async (): Promise<RoomTemplate[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('room_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data?.length) {
        return [
          ...(data as any[]).map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            category: row.category,
            creatorName: row.creator_name || 'Duhoc Mate',
            createdAt: row.created_at,
            tasks: row.tasks || [],
            playlist: row.playlist || [],
            tags: row.tags || [],
            uses: row.uses || 0,
          })),
          ...seedTemplates,
        ]
      }
    } catch {
      // Local fallback keeps the UI usable before Supabase tables exist.
    }
  }
  return readLocalTemplates()
}

export const saveTemplate = async (template: Omit<RoomTemplate, 'id' | 'createdAt' | 'uses'>) => {
  const next: RoomTemplate = {
    ...template,
    id: uid(),
    createdAt: new Date().toISOString(),
    uses: 0,
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('room_templates')
        .insert({
          title: next.title,
          description: next.description,
          category: next.category,
          creator_name: next.creatorName,
          tasks: next.tasks,
          playlist: next.playlist || [],
          tags: next.tags,
          uses: next.uses,
        })
        .select()
        .single()

      if (!error && data) {
        return {
          ...next,
          id: data.id,
          createdAt: data.created_at,
        }
      }
    } catch {
      // Continue to local fallback.
    }
  }

  const current = readLocalTemplates().filter(t => !t.id.startsWith('seed-'))
  localStorage.setItem(templateStorageKey, JSON.stringify([next, ...current]))
  return next
}

export const loadRoomTasks = async (roomId: string): Promise<IdeaTask[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('room_idea_tasks')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (!error && data?.length) {
        return (data as any[]).map(row => ({
          id: row.id,
          title: row.title,
          note: row.note || '',
          status: row.status,
          owner: row.owner || '',
          due: row.due || '',
        }))
      }
    } catch {
      // Local fallback.
    }
  }

  try {
    const raw = localStorage.getItem(taskStorageKey(roomId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const saveRoomTasks = async (roomId: string, tasks: IdeaTask[]) => {
  localStorage.setItem(taskStorageKey(roomId), JSON.stringify(tasks))

  if (!supabase) return
  try {
    await supabase.from('room_idea_tasks').delete().eq('room_id', roomId)
    if (tasks.length) {
      await supabase.from('room_idea_tasks').insert(tasks.map(task => ({
        id: task.id,
        room_id: roomId,
        title: task.title,
        note: task.note || '',
        status: task.status,
        owner: task.owner || '',
        due: task.due || '',
      })))
    }
  } catch {
    // Local data is already saved.
  }
}

export const cloneTasks = (tasks: IdeaTask[]) => tasks.map(task => ({
  ...task,
  id: uid(),
  status: task.status || 'todo',
}))

export const createIdeaTask = (title: string, status: IdeaStatus = 'todo', owner = ''): IdeaTask => ({
  id: uid(),
  title,
  status,
  owner,
})
