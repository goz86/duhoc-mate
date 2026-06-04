import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react'
import {
  approveGrammarSubmission,
  deletePublishedGrammarPattern,
  loadPublishedAiGrammarPatterns,
  loadPendingGrammarSubmissions,
  rejectGrammarSubmission,
  type PublishedAiGrammar,
  type TopikContentSubmission,
} from '../lib/topikContentStorage'

export default function TopikContentReview() {
  const [submissions, setSubmissions] = useState<TopikContentSubmission[]>([])
  const [published, setPublished] = useState<PublishedAiGrammar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const loadSubmissions = async () => {
    setLoading(true)
    setError('')
    try {
      const [nextSubmissions, nextPublished] = await Promise.all([
        loadPendingGrammarSubmissions(),
        loadPublishedAiGrammarPatterns(),
      ])
      setSubmissions(nextSubmissions)
      setPublished(nextPublished)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Không thể tải hàng chờ duyệt.')
    } finally {
      setLoading(false)
    }
  }

  const removePublished = async (grammar: PublishedAiGrammar) => {
    if (reviewingId || !confirm(`Xóa mẫu "${grammar.title}" và toàn bộ câu hỏi liên quan?`)) return
    setReviewingId(grammar.id)
    setError('')
    try {
      await deletePublishedGrammarPattern(grammar.id)
      setPublished(current => current.filter(item => item.id !== grammar.id))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Không thể xóa nội dung.')
    } finally {
      setReviewingId(null)
    }
  }

  useEffect(() => {
    loadSubmissions()
  }, [])

  const approve = async (submission: TopikContentSubmission) => {
    if (reviewingId) return
    setReviewingId(submission.id)
    setError('')
    try {
      await approveGrammarSubmission(submission.id)
      setSubmissions(current => current.filter(item => item.id !== submission.id))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Không thể duyệt nội dung.')
    } finally {
      setReviewingId(null)
    }
  }

  const reject = async (submission: TopikContentSubmission) => {
    if (reviewingId) return
    const note = (notes[submission.id] || '').trim()
    if (!note) {
      setError('Hãy ghi lý do để người tạo biết cần sửa phần nào.')
      return
    }
    setReviewingId(submission.id)
    setError('')
    try {
      await rejectGrammarSubmission(submission.id, note)
      setSubmissions(current => current.filter(item => item.id !== submission.id))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Không thể từ chối nội dung.')
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-3xl border border-brand-terracotta-light/15 bg-white/85 p-4 shadow-sm dark:bg-brand-panel/85">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand-terracotta" />
            <h3 className="text-lg font-black text-brand-brown-dark">Duyệt nội dung TOPIK</h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-brand-brown-light">
            Chỉ xuất bản mẫu đúng cấp độ, tự nhiên và có đủ 10 câu luyện tập + 5 câu game.
          </p>
        </div>
        <button
          onClick={loadSubmissions}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-terracotta-light/20 bg-white px-3 py-2 text-xs font-black text-brand-brown-dark transition hover:bg-brand-light disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid min-h-56 place-items-center">
          <LoaderCircle size={26} className="animate-spin text-brand-terracotta" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-brand-terracotta-light/30 bg-white/70 p-6 text-center">
          <div>
            <CheckCircle2 size={42} className="mx-auto text-emerald-500" />
            <h3 className="mt-3 font-black text-brand-brown-dark">Hàng chờ đã sạch</h3>
            <p className="mt-1 text-xs text-brand-brown-light">Chưa có mẫu ngữ pháp mới cần duyệt.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(submission => {
            const grammar = submission.grammar_payload
            const validationErrors = Array.isArray(submission.validation_report?.errors)
              ? submission.validation_report.errors
              : []
            const isExpanded = expandedId === submission.id
            const isReviewing = reviewingId === submission.id
            const practiceCount = submission.questions_payload.filter(question => question.usage === 'practice').length
            const gameCount = submission.questions_payload.filter(question => question.usage === 'game').length

            return (
              <article key={submission.id} className="rounded-3xl border border-brand-terracotta-light/15 bg-white/90 p-4 shadow-sm dark:bg-brand-panel/90">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-brand-light px-2.5 py-1 text-[10px] font-black text-brand-terracotta">
                        TOPIK {submission.level}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                        {practiceCount} luyện tập
                      </span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">
                        {gameCount} game
                      </span>
                    </div>
                    <h4 className="mt-2 text-lg font-black text-brand-brown-dark">{String(grammar.title || 'Mẫu ngữ pháp')}</h4>
                    <p className="mt-1 text-xs font-bold text-brand-brown-light">{String(grammar.formula || '')}</p>
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : submission.id)}
                    className="rounded-full border border-brand-terracotta-light/15 bg-white p-2 text-brand-brown-light transition hover:bg-brand-light"
                    title={isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                <p className="mt-3 text-sm font-semibold text-brand-brown-dark">{String(grammar.meaning_vi || '')}</p>

                {isExpanded && (
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-brand-light/60 p-3">
                        <div className="text-[10px] font-black uppercase text-brand-brown-light">Ví dụ Hàn - Việt</div>
                        <div className="mt-2 space-y-2">
                          {(Array.isArray(grammar.examples) ? grammar.examples : []).slice(0, 4).map((example: any, index: number) => (
                            <div key={`${submission.id}-example-${index}`}>
                              <p className="text-xs font-black text-brand-brown-dark">{String(example.ko || '')}</p>
                              <p className="text-[11px] text-brand-brown-light">{String(example.vi || '')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-red-50 p-3">
                        <div className="text-[10px] font-black uppercase text-red-500">Lỗi thường gặp</div>
                        <p className="mt-2 text-xs font-semibold leading-relaxed text-red-700">{String(grammar.common_mistake || '')}</p>
                      </div>
                    </div>

                    {validationErrors.length > 0 && (
                      <div className="rounded-2xl bg-amber-50 p-3">
                        <div className="text-[10px] font-black uppercase text-amber-700">Cảnh báo validator</div>
                        {validationErrors.map((validationError: string) => (
                          <p key={validationError} className="mt-1 text-xs font-semibold text-amber-800">• {validationError}</p>
                        ))}
                      </div>
                    )}

                    <div className="rounded-2xl border border-brand-terracotta-light/15 bg-white p-3">
                      <div className="text-[10px] font-black uppercase text-brand-brown-light">Kiểm nhanh câu hỏi</div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {submission.questions_payload.slice(0, 6).map((question, index) => (
                          <div key={String(question.id || index)} className="rounded-xl bg-brand-light/50 p-2.5">
                            <p className="line-clamp-2 text-xs font-bold text-brand-brown-dark">{String(question.prompt || '')}</p>
                            <p className="mt-1 text-[10px] font-black text-emerald-700">
                              Đáp án: {Array.isArray(question.options) ? String(question.options[Number(question.answer_index)] || '') : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <input
                    value={notes[submission.id] || ''}
                    onChange={event => setNotes(current => ({ ...current, [submission.id]: event.target.value }))}
                    maxLength={300}
                    placeholder="Lý do nếu cần trả lại..."
                    className="rounded-xl border border-brand-terracotta-light/20 bg-white px-3 py-2 text-xs font-semibold text-brand-brown-dark outline-none placeholder:text-brand-brown-light/50 focus:border-brand-terracotta"
                  />
                  <button
                    onClick={() => reject(submission)}
                    disabled={isReviewing}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    Trả lại
                  </button>
                  <button
                    onClick={() => approve(submission)}
                    disabled={isReviewing}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {isReviewing ? <LoaderCircle size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Duyệt và xuất bản
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {!loading && (
        <section className="mt-5">
          <div className="mb-3">
            <h3 className="font-black text-brand-brown-dark">Nội dung AI đã xuất bản</h3>
            <p className="mt-1 text-xs text-brand-brown-light">Hậu kiểm và xóa mẫu sai cùng toàn bộ câu hỏi liên quan.</p>
          </div>
          {published.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-brand-terracotta-light/25 bg-white/70 p-4 text-center text-xs font-semibold text-brand-brown-light">
              Chưa có mẫu AI nào được xuất bản.
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {published.map(grammar => (
                <article key={grammar.id} className="rounded-2xl border border-brand-terracotta-light/15 bg-white/90 p-3 shadow-sm dark:bg-brand-panel/90">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-brand-light px-2 py-1 text-[10px] font-black text-brand-terracotta">TOPIK {grammar.level}</span>
                        <span className="text-[10px] font-bold text-brand-brown-light">{grammar.source}</span>
                      </div>
                      <h4 className="mt-2 truncate text-sm font-black text-brand-brown-dark">{grammar.title}</h4>
                      <p className="mt-1 truncate text-xs font-semibold text-brand-brown-light">{grammar.formula}</p>
                      <p className="mt-2 line-clamp-2 text-xs text-brand-brown-light">{grammar.meaning_vi}</p>
                    </div>
                    <button
                      onClick={() => removePublished(grammar)}
                      disabled={reviewingId === grammar.id}
                      className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      title="Xóa mẫu và câu hỏi"
                    >
                      {reviewingId === grammar.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
