import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Sparkles,
} from 'lucide-react'
import {
  generateGrammarBundle,
  validateAiGrammarBundle,
  type AiGrammarBundle,
  type AiGrammarValidation,
} from '../lib/aiService'
import {
  TOPIK_GRAMMAR_TARGETS,
  loadPublishedGrammarCounts,
  publishGrammarBundleDirect,
} from '../lib/topikContentStorage'

type GeneratedItem = {
  id: string
  level: number
  bundle: AiGrammarBundle
  validation: AiGrammarValidation
  publishedId?: string
  saving?: boolean
  error?: string
}

type Props = {
  existingTitles: string[]
}

const levels = [1, 2, 3, 4, 5, 6]
const grammarTypes = [
  { value: 'general', label: 'Tổng hợp' },
  { value: 'connector', label: 'Nối câu' },
  { value: 'tense-aspect', label: 'Thì và trạng thái' },
  { value: 'honorific', label: 'Kính ngữ' },
  { value: 'comparison', label: 'So sánh' },
  { value: 'academic', label: 'Học thuật' },
]

export default function TopikGrammarGenerator({ existingTitles }: Props) {
  const [level, setLevel] = useState(1)
  const [grammarType, setGrammarType] = useState('general')
  const [topic, setTopic] = useState('')
  const [batchSize, setBatchSize] = useState(1)
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [generated, setGenerated] = useState<GeneratedItem[]>([])
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    loadPublishedGrammarCounts().then(next => {
      if (!cancelled) setCounts(next)
    })
    return () => { cancelled = true }
  }, [])

  const handleGenerate = async () => {
    if (generating) return
    setGenerating(true)
    setError('')
    setGenerated([])
    const nextItems: GeneratedItem[] = []

    try {
      for (let index = 0; index < batchSize; index += 1) {
        setProgress(`Đang tạo và lưu mẫu ${index + 1}/${batchSize}...`)
        const duplicateGuard = [...existingTitles, ...nextItems.map(item => item.bundle.pattern.title)]
        const bundle = await generateGrammarBundle(level, grammarType, topic, duplicateGuard)
        const item: GeneratedItem = {
          id: `${Date.now()}-${index}`,
          level,
          bundle,
          validation: validateAiGrammarBundle(bundle, duplicateGuard),
          saving: true,
        }
        nextItems.push(item)
        setGenerated([...nextItems])
        const published = await publishGrammarBundleDirect(level, bundle)
        item.saving = false
        item.publishedId = published.id
        setGenerated([...nextItems])
      }
      setCounts(await loadPublishedGrammarCounts())
      setProgress(`Đã tạo và lưu ${nextItems.length} mẫu vào database.`)
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Không thể tạo nội dung lúc này.'
      nextItems.forEach(item => {
        if (item.saving) {
          item.saving = false
          item.error = message
        }
      })
      setGenerated([...nextItems])
      setError(message)
      setProgress('')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-brand-terracotta-light/20 bg-white/95 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-brand-terracotta">
              <span className="text-xs font-black uppercase">Xưởng nội dung TOPIK</span>
            </div>
            <h3 className="mt-2 text-2xl font-black text-brand-brown-dark">Tạo bộ ngữ pháp chuẩn 10 + 5</h3>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
            <div className="text-xs font-black text-emerald-700">TOPIK {level}</div>
            <div className="mt-1 text-lg font-black text-emerald-900">
              {counts[level] || 0}/{TOPIK_GRAMMAR_TARGETS[level]}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.4fr_160px]">
          <label className="space-y-1.5">
            <span className="text-xs font-black text-brand-brown-light">Cấp độ</span>
            <select
              value={level}
              onChange={event => setLevel(Number(event.target.value))}
              className="w-full rounded-xl border border-brand-terracotta-light/20 bg-white px-3 py-2.5 text-sm font-bold text-brand-brown-dark outline-none focus:border-brand-terracotta"
            >
              {levels.map(item => <option key={item} value={item}>TOPIK {item}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-black text-brand-brown-light">Nhóm ngữ pháp</span>
            <select
              value={grammarType}
              onChange={event => setGrammarType(event.target.value)}
              className="w-full rounded-xl border border-brand-terracotta-light/20 bg-white px-3 py-2.5 text-sm font-bold text-brand-brown-dark outline-none focus:border-brand-terracotta"
            >
              {grammarTypes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-black text-brand-brown-light">Chủ đề ưu tiên</span>
            <input
              value={topic}
              onChange={event => setTopic(event.target.value)}
              maxLength={120}
              placeholder="Ví dụ: trường học, công việc, tin tức..."
              className="w-full rounded-xl border border-brand-terracotta-light/20 bg-white px-3 py-2.5 text-sm font-bold text-brand-brown-dark outline-none placeholder:font-medium placeholder:text-brand-brown-light/50 focus:border-brand-terracotta"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-black text-brand-brown-light">Số mẫu/lần</span>
            <select
              value={batchSize}
              onChange={event => setBatchSize(Number(event.target.value))}
              className="w-full rounded-xl border border-brand-terracotta-light/20 bg-white px-3 py-2.5 text-sm font-bold text-brand-brown-dark outline-none focus:border-brand-terracotta"
            >
              {[1, 2, 3].map(item => <option key={item} value={item}>{item} mẫu</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-brand-brown-light">
            AI tự kiểm tra trùng và lưu thẳng nội dung đạt chuẩn vào database.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-terracotta px-5 py-2.5 text-sm font-black text-white transition hover:bg-brand-brown-dark disabled:cursor-wait disabled:opacity-60"
          >
            {generating && <LoaderCircle size={16} className="animate-spin" />}
            {generating ? progress || 'Đang tạo...' : 'Tạo bộ nội dung'}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map(item => {
          const current = counts[item] || 0
          const target = TOPIK_GRAMMAR_TARGETS[item]
          const percent = Math.min(100, Math.round((current / target) * 100))
          return (
            <button
              key={item}
              onClick={() => setLevel(item)}
              className="rounded-2xl border border-brand-terracotta-light/15 bg-white/90 p-4 text-left shadow-sm transition hover:border-brand-terracotta"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-brand-brown-dark">TOPIK {item}</span>
                <span className="text-xs font-black text-brand-terracotta">{current}/{target}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-light">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
              </div>
            </button>
          )
        })}
      </section>

      {generated.length > 0 && (
        <section className="space-y-3">
          {generated.map(item => {
            const pattern = item.bundle.pattern
            return (
              <article key={item.id} className="rounded-3xl border border-brand-terracotta-light/20 bg-white/95 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-black text-brand-terracotta">TOPIK {item.level}</span>
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-700">{pattern.grammar_type}</span>
                    </div>
                    <h4 className="mt-2 text-xl font-black text-brand-brown-dark">{pattern.title}</h4>
                    <p className="mt-1 text-sm font-bold text-brand-brown-light">{pattern.formula}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                      {item.validation.practiceCount} luyện tập
                    </span>
                    <span className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
                      {item.validation.gameCount} game
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-brand-light/60 p-4">
                    <div className="text-xs font-black uppercase text-brand-brown-light">Nghĩa</div>
                    <p className="mt-1 font-bold text-brand-brown-dark">{pattern.meaning_vi}</p>
                    <p className="mt-1 text-sm text-brand-brown-light">{pattern.meaning_en}</p>
                  </div>
                  <div className="rounded-2xl bg-red-50 p-4">
                    <div className="text-xs font-black uppercase text-red-500">Lỗi thường gặp</div>
                    <p className="mt-1 text-sm font-semibold text-red-700">{pattern.common_mistake}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-black">
                    {item.validation.valid ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 size={15} /> Đạt kiểm tra tự động</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600"><AlertCircle size={15} /> Chưa đạt chuẩn</span>
                    )}
                    {item.publishedId && <span className="inline-flex items-center gap-1 text-sky-700"><CheckCircle2 size={15} /> Đã lưu database</span>}
                  </div>
                  {item.saving && <span className="inline-flex items-center gap-2 text-sm font-black text-brand-terracotta"><LoaderCircle size={15} className="animate-spin" /> Đang lưu...</span>}
                </div>
                {item.error && <p className="mt-3 text-sm font-semibold text-red-600">{item.error}</p>}
              </article>
            )
          })}
        </section>
      )}

    </div>
  )
}
