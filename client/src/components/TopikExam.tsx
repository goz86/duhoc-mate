import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Play, Pause, ChevronLeft, ChevronRight,
  BookOpen, CheckCircle2, XCircle, AlertCircle, Clock, Volume2,
  Headphones, ArrowLeft, Send, CheckCircle, Info, Zap,
  Maximize2, X as XIcon, ZoomIn
} from 'lucide-react'
import {
  generateReadingExam, generateListeningExam, type AiGeneratedQuestion
} from '../lib/aiService'
import {
  saveExamToDb, loadExamsFromDb, loadExamQuestions, deleteExamFromDb,
  type TopikExam, type TopikExamQuestion
} from '../lib/topikStorage'
import ConfirmDialog from './modals/ConfirmDialog'

interface Props {
  roomId?: string
  isAdmin?: boolean
}

export default function TopikExamComponent({ roomId, isAdmin }: Props) {
  
  // ── States ──────────────────────────────────────────────────────
  const [exams, setExams] = useState<TopikExam[]>([])
  const [selectedExam, setSelectedExam] = useState<TopikExam | null>(null)
  const [questions, setQuestions] = useState<TopikExamQuestion[]>([])
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0)
  
  // CBT states
  const [answers, setAnswers] = useState<Record<number, number>>({}) // question_number -> chosen_option (1-4)
  const [isTesting, setIsTesting] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0) // seconds
  const [examTimer, setExamTimer] = useState<any>(null)
  
  // Audio state (for Listening CBT)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioSpeed, setAudioSpeed] = useState(1) // 0.75, 1, 1.25, 1.5
  const [playCount, setPlayCount] = useState<Record<number, number>>({}) // question_number -> played count
  
  // AI States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createCategory, setCreateCategory] = useState<'reading' | 'listening'>('reading')
  const [createLevel, setCreateLevel] = useState<number>(2) // TOPIK II by default
  const [aiLoading, setAiLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Image zoom state (cho đề thi dạng ảnh PDF)
  const [imageZoomed, setImageZoomed] = useState(false)

  // Custom Confirm State
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    message: string
    description?: string
    confirmText?: string
    variant?: 'danger' | 'warning' | 'info'
    onConfirm: () => void
  }>({
    open: false,
    message: '',
    onConfirm: () => {},
  })

  const showConfirm = useCallback((options: {
    message: string
    description?: string
    confirmText?: string
    variant?: 'danger' | 'warning' | 'info'
    onConfirm: () => void
  }) => {
    setConfirmState({
      open: true,
      message: options.message,
      description: options.description,
      confirmText: options.confirmText,
      variant: options.variant,
      onConfirm: options.onConfirm,
    })
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, open: false }))
  }, [])

  // ── Load exams on mount ─────────────────────────────────────────
  const fetchExams = useCallback(async () => {
    const list = await loadExamsFromDb()
    setExams(list)
  }, [])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  // ── Timer Effect ────────────────────────────────────────────────
  useEffect(() => {
    if (isTesting && timeLeft > 0 && !isFinished) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            handleFinishTest(true) // Auto-submit when time's up
            return 0
          }
          return prev - 1
        })
      }, 1000)
      setExamTimer(interval)
      return () => clearInterval(interval)
    }
  }, [isTesting, timeLeft, isFinished])

  // ── Web Speech TTS (for Listening Audio) ────────────────────────
  const stopAudio = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handlePlayAudio = (script: string, qNum: number) => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ Text-to-Speech phát âm.')
      return
    }

    const currentCount = playCount[qNum] || 0
    if (currentCount >= 2) {
      alert('Đề thi thật chỉ cho phép nghe tối đa 2 lần câu hỏi này.')
      return
    }

    if (isPlayingAudio) {
      stopAudio()
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(script)
    utterance.lang = 'ko-KR'
    utterance.rate = audioSpeed

    const voices = window.speechSynthesis.getVoices()
    const koVoice = voices.find(voice => voice.lang.startsWith('ko'))
    if (koVoice) utterance.voice = koVoice

    utterance.onend = () => {
      setIsPlayingAudio(false)
      setPlayCount(prev => ({
        ...prev,
        [qNum]: (prev[qNum] || 0) + 1
      }))
    }

    utterance.onerror = () => {
      setIsPlayingAudio(false)
    }

    setIsPlayingAudio(true)
    window.speechSynthesis.speak(utterance)
  }

  // ── CBT Actions ─────────────────────────────────────────────────
  const handleStartTest = async (exam: TopikExam) => {
    setSelectedExam(exam)
    setAiLoading(true)
    setErrorMsg('')
    try {
      const qList = await loadExamQuestions(exam.id!)
      if (qList.length === 0) {
        throw new Error('Đề thi này chưa có câu hỏi trong cơ sở dữ liệu.')
      }
      setQuestions(qList)
      setAnswers({})
      setPlayCount({})
      setActiveQuestionIdx(0)
      setIsTesting(true)
      setIsFinished(false)
      // Reading: 15 questions -> 30 mins (1800s); Listening: 10 questions -> 20 mins (1200s)
      setTimeLeft(exam.category === 'reading' ? 1800 : 1200)
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải đề thi')
    } finally {
      setAiLoading(false)
    }
  }

  const handleFinishTest = (auto = false) => {
    stopAudio()
    if (!auto && Object.keys(answers).length < questions.length) {
      showConfirm({
        message: 'Nộp bài thi thử?',
        description: 'Bạn vẫn chưa hoàn thành tất cả câu hỏi. Bạn có chắc chắn muốn nộp bài thi hiện tại không?',
        confirmText: 'Đồng ý nộp',
        variant: 'warning',
        onConfirm: () => {
          setIsFinished(true)
          if (examTimer) clearInterval(examTimer)
        }
      })
      return
    }
    setIsFinished(true)
    if (examTimer) clearInterval(examTimer)
  }

  const handleExitTest = () => {
    stopAudio()
    if (isTesting && !isFinished) {
      showConfirm({
        message: 'Thoát khỏi phòng thi?',
        description: 'Bạn có chắc chắn muốn rời đi? Toàn bộ kết quả bài thi hiện tại sẽ không được lưu lại.',
        confirmText: 'Đồng ý thoát',
        variant: 'danger',
        onConfirm: () => {
          setIsTesting(false)
          setIsFinished(false)
          setSelectedExam(null)
          setQuestions([])
        }
      })
      return
    }
    setIsTesting(false)
    setIsFinished(false)
    setSelectedExam(null)
    setQuestions([])
  }

  // ── AI Generate Mock Exam ──────────────────────────────────────
  const handleCreateAiExam = async () => {
    setAiLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const deviceId = roomId || localStorage.getItem('topik_device_id') || `user_${Date.now()}`
      const nextNum = exams.length + 1
      const examTitle = `Đề thi thử TOPIK ${createLevel === 1 ? 'I' : 'II'} ${createCategory === 'reading' ? 'Đọc' : 'Nghe'} - Số ${nextNum}`
      
      const newExam: TopikExam = {
        title: examTitle,
        category: createCategory,
        level: createLevel,
        created_by: deviceId
      }

      let generated: AiGeneratedQuestion[] = []
      if (createCategory === 'reading') {
        generated = await generateReadingExam(createLevel)
      } else {
        generated = await generateListeningExam(createLevel)
      }

      if (generated.length === 0) {
        throw new Error('AI không trả về câu hỏi hợp lệ.')
      }

      // Convert generated questions to storage format
      const questionsToSave: TopikExamQuestion[] = generated.map(q => ({
        question_number: q.question_number,
        question_type: q.question_type,
        instructions: q.instructions,
        passage: q.passage,
        question_text: q.question_text,
        options: q.options,
        correct_option: q.correct_option,
        explanation: q.explanation,
        audio_script: q.audio_script
      }))

      const saved = await saveExamToDb(newExam, questionsToSave)
      
      setSuccessMsg(`Đã tạo thành công đề thi thử số ${saved.exam_number}!`)
      setShowCreateModal(false)
      fetchExams()
    } catch (err: any) {
      console.error('[TopikExam] Lỗi tạo đề thi AI:', err)
      setErrorMsg(err.message || 'Không thể tạo đề thi thử bằng AI. Vui lòng thử lại.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    showConfirm({
      message: 'Xóa đề thi thử?',
      description: `Bạn có chắc chắn muốn xóa "${examTitle}" khỏi hệ thống không? Hành động này không thể hoàn tác.`,
      confirmText: 'Đồng ý xóa',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteExamFromDb(examId)
          setSuccessMsg('Đã xóa đề thi thử thành công!')
          fetchExams()
        } catch (err: any) {
          setErrorMsg(err.message || 'Lỗi khi xóa đề thi')
        }
      }
    })
  }

  // ── Calculate Score ─────────────────────────────────────────────
  const correctCount = questions.reduce((count, q) => {
    return answers[q.question_number] === q.correct_option ? count + 1 : count
  }, 0)
  const scorePercent = questions.length ? Math.round((correctCount / questions.length) * 100) : 0

  // ── Format Timer ────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="flex-1 flex flex-col gap-5 py-4 w-full">
      {errorMsg && (
        <div className="w-full max-w-2xl mx-auto px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <AlertCircle size={15} /> <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="w-full max-w-2xl mx-auto px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} /> <span>{successMsg}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CBT TEST ROOM (Đang thi thử hoặc Đã xong xem kết quả)
          ───────────────────────────────────────────────────────────── */}
      {isTesting && selectedExam && (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 px-3 sm:px-0">
          {/* Header thi thử */}
          <div className="flex flex-col gap-3 p-4 rounded-3xl border border-brand-terracotta-light/15 bg-white/95 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExitTest}
                  className="p-2 rounded-full hover:bg-brand-light text-brand-brown-light hover:text-brand-brown-dark transition cursor-pointer"
                  title="Thoát phòng thi"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="min-w-0">
                  <h3 className="font-display font-black text-base sm:text-lg text-brand-brown-dark leading-snug truncate">
                    {selectedExam.title}
                  </h3>
                  <p className="text-xs text-brand-brown-light uppercase tracking-wider font-bold">
                    CBT Mode · TOPIK {selectedExam.level === 1 ? 'I' : 'II'} {selectedExam.category === 'reading' ? 'Đọc' : 'Nghe'}
                  </p>
                </div>
              </div>

              {/* Đồng hồ & Nộp bài */}
              <div className="flex items-center gap-3 ml-auto">
                {!isFinished ? (
                  <>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-terracotta/10 text-brand-terracotta text-sm font-black border border-brand-terracotta/20 animate-pulse">
                      <Clock size={14} />
                      <span>{formatTime(timeLeft)}</span>
                    </div>
                    <button
                      onClick={() => handleFinishTest()}
                      className="px-4 py-2 rounded-full bg-brand-terracotta text-white text-xs font-black hover:bg-brand-brown-dark transition cursor-pointer shadow flex items-center gap-1.5"
                    >
                      <Send size={12} />
                      Nộp bài
                    </button>
                  </>
                ) : (
                  <div className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black border border-emerald-200">
                    Đã hoàn thành thi thử
                  </div>
                )}
              </div>
            </div>

            {/* Tiến độ hoàn thành bài thi */}
            <div className="w-full">
              <div className="flex justify-between text-[11px] font-bold text-brand-brown-light mb-1">
                <span>Tiến độ: {Object.keys(answers).length}/{questions.length} câu</span>
                <span>{Math.round((Object.keys(answers).length / questions.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-brand-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-brand-terracotta transition-all duration-300"
                  style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fullscreen Image Overlay */}
          {imageZoomed && questions[activeQuestionIdx]?.audio_script?.startsWith('/topik_exams/') && (
            <div
              className="fixed inset-0 z-[300] bg-black/90 flex items-start justify-center p-4 overflow-y-auto"
              onClick={() => setImageZoomed(false)}
            >
              <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setImageZoomed(false)}
                  className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                >
                  <XIcon size={20} />
                </button>
                <img
                  src={questions[activeQuestionIdx].audio_script!}
                  alt="Đề thi TOPIK"
                  className="w-full rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          )}

          {/* Khung thi chính */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4 items-start w-full">
            {/* Cột 1: Câu hỏi đang làm */}
            {questions[activeQuestionIdx] && (
              <div className="flex flex-col gap-4 w-full">
                {/* ── CHẾ ĐỘ ẢNH (Đề thi thực từ PDF) ───────────────── */}
                {questions[activeQuestionIdx].audio_script?.startsWith('/topik_exams/') ? (
                  <div className="flex flex-col gap-4 w-full">
                    {/* Khung ảnh đề thi */}
                    <div className="rounded-3xl border border-brand-terracotta-light/15 bg-white/95 shadow-md overflow-hidden">
                      {/* Toolbar ảnh */}
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-brand-terracotta-light/10 bg-brand-light/40">
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-brand-terracotta" />
                          <span className="text-xs font-black text-brand-brown-dark">
                            Câu {questions[activeQuestionIdx].question_number} — Đề thi chính thức TOPIK
                          </span>
                        </div>
                        <button
                          onClick={() => setImageZoomed(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-terracotta/10 hover:bg-brand-terracotta hover:text-white text-brand-terracotta text-[11px] font-black transition cursor-pointer"
                          title="Xem ảnh toàn màn hình"
                        >
                          <Maximize2 size={12} /> Toàn màn hình
                        </button>
                      </div>
                      {/* Ảnh đề thi (scrollable) */}
                      <div className="relative overflow-hidden" style={{ maxHeight: '65vh' }}>
                        <div className="overflow-y-auto" style={{ maxHeight: '65vh' }}>
                          <img
                            src={questions[activeQuestionIdx].audio_script!}
                            alt={`Đề thi TOPIK - Câu ${questions[activeQuestionIdx].question_number}`}
                            className="w-full object-contain select-none"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/topik_exams/placeholder.jpg'
                            }}
                          />
                        </div>
                        {/* Zoom hint */}
                        <button
                          onClick={() => setImageZoomed(true)}
                          className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition cursor-pointer shadow-lg"
                          title="Phóng to ảnh"
                        >
                          <ZoomIn size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Khung đáp án (riêng biệt bên dưới ảnh) */}
                    <div className="p-5 rounded-3xl border border-brand-terracotta-light/15 bg-white/95 shadow-md flex flex-col gap-3">
                      <p className="text-xs font-black text-brand-brown-light uppercase tracking-wider">
                        Chọn đáp án cho câu {questions[activeQuestionIdx].question_number}
                      </p>

                      {/* 4 Choices */}
                      <div className="flex flex-col gap-2.5">
                        {questions[activeQuestionIdx].options.map((opt, oIdx) => {
                          const optNum = oIdx + 1
                          const isSelected = answers[questions[activeQuestionIdx].question_number] === optNum
                          const isCorrect = questions[activeQuestionIdx].correct_option === optNum

                          let btnStyle = 'border-brand-terracotta-light/20 bg-white text-brand-brown-dark hover:bg-brand-light'
                          if (isTesting && !isFinished) {
                            if (isSelected) btnStyle = 'border-brand-terracotta bg-brand-terracotta text-white shadow-md'
                          } else if (isFinished) {
                            if (isCorrect) {
                              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                            } else if (isSelected) {
                              btnStyle = 'border-red-500 bg-red-50 text-red-800'
                            } else {
                              btnStyle = 'border-brand-terracotta-light/10 bg-white/50 text-brand-brown-light/60'
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={isFinished}
                              onClick={() => {
                                setAnswers(prev => ({
                                  ...prev,
                                  [questions[activeQuestionIdx].question_number]: optNum
                                }))
                              }}
                              className={`w-full text-left px-4 py-3 rounded-2xl border transition-all text-sm font-bold flex items-center gap-3 cursor-pointer ${btnStyle}`}
                            >
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black border flex-shrink-0 ${
                                isSelected ? 'bg-white/20 border-white' : 'border-brand-terracotta-light/20 bg-brand-cream/60'
                              }`}>
                                {['①','②','③','④'][oIdx]}
                              </span>
                              <span className="leading-snug">{opt}</span>
                              {isFinished && isCorrect && <CheckCircle size={14} className="ml-auto text-emerald-600 flex-shrink-0" />}
                              {isFinished && isSelected && !isCorrect && <XCircle size={14} className="ml-auto text-red-600 flex-shrink-0" />}
                            </button>
                          )
                        })}
                      </div>

                      {/* Giải nghĩa (Result Mode only) */}
                      {isFinished && questions[activeQuestionIdx].explanation && (
                        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex gap-2.5 items-start mt-1">
                          <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                          <div className="text-xs sm:text-sm text-emerald-800 leading-relaxed font-semibold">
                            <span className="font-black text-emerald-900 block mb-1">HƯỚNG DẪN GIẢI:</span>
                            {questions[activeQuestionIdx].explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ── CHẾ ĐỘ TEXT (Đề thi AI tạo) ───────────────── */
                  <div className="p-5 rounded-3xl border border-brand-terracotta-light/15 bg-white/95 shadow-md flex flex-col gap-4 min-h-[300px]">
                    {/* Instructions */}
                    <div className="p-3 rounded-2xl bg-brand-light/65 border border-brand-terracotta-light/10 text-xs sm:text-sm font-black text-brand-brown-dark leading-relaxed">
                      {questions[activeQuestionIdx].instructions}
                    </div>

                    {/* Audio Player (Dành cho phần thi Nghe) */}
                    {selectedExam.category === 'listening' && questions[activeQuestionIdx].audio_script && (
                      <div className="p-4 rounded-2xl bg-brand-cream border border-brand-terracotta-light/15 flex flex-col gap-3 items-center text-center">
                        <div className="flex items-center gap-2">
                          <Headphones size={20} className="text-brand-terracotta" />
                          <span className="text-xs font-black text-brand-brown-dark">
                            BĂNG NGHE TIẾNG HÀN (Speech API)
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handlePlayAudio(questions[activeQuestionIdx].audio_script!, questions[activeQuestionIdx].question_number)}
                            className={`p-3 rounded-full transition cursor-pointer active:scale-95 flex items-center justify-center shadow ${isPlayingAudio ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-brand-terracotta text-white hover:bg-brand-brown-dark'}`}
                            title={isPlayingAudio ? 'Dừng phát' : 'Phát kịch bản nghe'}
                          >
                            {isPlayingAudio ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                          </button>

                          <div className="flex gap-1 border border-brand-terracotta-light/20 bg-white p-0.5 rounded-xl">
                            {[0.75, 1, 1.25, 1.5].map(speed => (
                              <button
                                key={speed}
                                onClick={() => { setAudioSpeed(speed); stopAudio(); }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${audioSpeed === speed ? 'bg-brand-terracotta text-white' : 'text-brand-brown-light hover:bg-brand-light'}`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        </div>

                        <p className="text-[11px] font-bold text-brand-brown-light">
                          Lượt đã nghe: <span className="text-brand-terracotta font-black">{playCount[questions[activeQuestionIdx].question_number] || 0}</span> / 2 lần tối đa
                        </p>
                      </div>
                    )}

                    {/* Passage */}
                    {questions[activeQuestionIdx].passage && (
                      <div className="p-4 rounded-2xl bg-brand-light/35 border border-brand-terracotta-light/10 text-sm leading-relaxed text-brand-brown-dark font-medium whitespace-pre-wrap select-text">
                        {questions[activeQuestionIdx].passage}
                      </div>
                    )}

                    {/* Question Text */}
                    <div className="text-base sm:text-lg font-black text-brand-brown-dark py-2 border-b border-brand-terracotta-light/10 select-text">
                      {questions[activeQuestionIdx].question_number}. {questions[activeQuestionIdx].question_text}
                    </div>

                    {/* 4 Choices */}
                    <div className="flex flex-col gap-2.5">
                      {questions[activeQuestionIdx].options.map((opt, oIdx) => {
                        const optNum = oIdx + 1
                        const isSelected = answers[questions[activeQuestionIdx].question_number] === optNum
                        const isCorrect = questions[activeQuestionIdx].correct_option === optNum

                        let btnStyle = 'border-brand-terracotta-light/20 bg-white text-brand-brown-dark hover:bg-brand-light'
                        if (isTesting && !isFinished) {
                          if (isSelected) btnStyle = 'border-brand-terracotta bg-brand-terracotta text-white shadow-md'
                        } else if (isFinished) {
                          if (isCorrect) {
                            btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                          } else if (isSelected) {
                            btnStyle = 'border-red-500 bg-red-50 text-red-800'
                          } else {
                            btnStyle = 'border-brand-terracotta-light/10 bg-white/50 text-brand-brown-light/60'
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={isFinished}
                            onClick={() => {
                              setAnswers(prev => ({
                                ...prev,
                                [questions[activeQuestionIdx].question_number]: optNum
                              }))
                            }}
                            className={`w-full text-left px-4 py-3 rounded-2xl border transition-all text-sm font-bold flex items-center gap-3 cursor-pointer ${btnStyle}`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border ${isSelected ? 'bg-white/20 border-white' : 'border-brand-terracotta-light/20 bg-brand-cream/60'}`}>
                              {optNum}
                            </span>
                            <span>{opt}</span>
                            {isFinished && isCorrect && <CheckCircle size={14} className="ml-auto text-emerald-600 flex-shrink-0" />}
                            {isFinished && isSelected && !isCorrect && <XCircle size={14} className="ml-auto text-red-600 flex-shrink-0" />}
                          </button>
                        )
                      })}
                    </div>

                    {/* Giải nghĩa (Result Mode only) */}
                    {isFinished && questions[activeQuestionIdx].explanation && (
                      <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex gap-2.5 items-start mt-2">
                        <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm text-emerald-800 leading-relaxed font-semibold">
                          <span className="font-black text-emerald-900 block mb-1">HƯỚNG DẪN GIẢI:</span>
                          {questions[activeQuestionIdx].explanation}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Phím chuyển câu hỏi */}
                <div className="flex items-center justify-between">
                  <button
                    disabled={activeQuestionIdx === 0}
                    onClick={() => { stopAudio(); setImageZoomed(false); setActiveQuestionIdx(prev => prev - 1); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-brand-terracotta-light/20 hover:bg-brand-light text-brand-brown-dark font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <ChevronLeft size={14} /> Trước
                  </button>
                  <button
                    disabled={activeQuestionIdx === questions.length - 1}
                    onClick={() => { stopAudio(); setImageZoomed(false); setActiveQuestionIdx(prev => prev + 1); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-brand-terracotta-light/20 hover:bg-brand-light text-brand-brown-dark font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    Kế tiếp <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Cột 2: Bảng lưới câu hỏi (Sidebar) */}
            <div className="flex flex-col gap-3 p-4 rounded-3xl border border-brand-terracotta-light/15 bg-white/95 shadow-md">
              <h4 className="text-xs font-black text-brand-brown-dark uppercase tracking-wider text-center border-b border-brand-terracotta-light/10 pb-2">
                Bảng Câu Hỏi
              </h4>

              {/* Lưới các nút số */}
              <div className="grid grid-cols-5 gap-2 justify-items-center">
                {questions.map((q, idx) => {
                  const qNum = q.question_number
                  const hasAnswered = answers[qNum] !== undefined
                  const isActive = activeQuestionIdx === idx
                  
                  let btnStyle = 'border-brand-terracotta-light/25 text-brand-brown-light hover:bg-brand-light bg-white'
                  if (isTesting && !isFinished) {
                    if (isActive) btnStyle = 'border-brand-terracotta ring-2 ring-brand-terracotta/20 text-brand-terracotta font-black bg-brand-light/30'
                    else if (hasAnswered) btnStyle = 'bg-brand-terracotta border-brand-terracotta text-white'
                  } else if (isFinished) {
                    const isCorrect = answers[qNum] === q.correct_option
                    if (isActive) btnStyle = 'border-brand-brown-dark bg-brand-light text-brand-brown-dark font-black'
                    else if (isCorrect) btnStyle = 'bg-emerald-500 border-emerald-500 text-white'
                    else if (hasAnswered) btnStyle = 'bg-red-500 border-red-500 text-white'
                    else btnStyle = 'bg-gray-200 border-gray-300 text-gray-500'
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => { stopAudio(); setImageZoomed(false); setActiveQuestionIdx(idx); }}
                      className={`w-9 h-9 rounded-full border text-xs font-bold transition flex items-center justify-center cursor-pointer ${btnStyle}`}
                    >
                      {qNum}
                    </button>
                  )
                })}
              </div>

              {/* Chú dẫn màu kết quả (Result mode only) */}
              {isFinished && (
                <div className="flex flex-col gap-1.5 border-t border-brand-terracotta-light/10 pt-3 mt-1">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-brand-brown-light">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                    <span>Trả lời đúng</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-brand-brown-light">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-500" />
                    <span>Trả lời sai</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-brand-brown-light">
                    <span className="w-3.5 h-3.5 rounded-full bg-gray-200 border border-gray-300" />
                    <span>Bỏ qua/Không làm</span>
                  </div>
                </div>
              )}

              {/* Nộp bài thi ở kết quả */}
              {isFinished && (
                <div className="mt-3 p-3 rounded-2xl bg-brand-light/60 border border-brand-terracotta-light/10 text-center">
                  <p className="text-[11px] font-bold text-brand-brown-light">KẾT QUẢ CỦA BẠN</p>
                  <p className="text-xl font-black text-brand-terracotta mt-1">{correctCount}/{questions.length} đúng</p>
                  <p className="text-[10px] text-emerald-600 font-extrabold mt-0.5">{scorePercent}% Điểm đạt</p>
                  <button
                    onClick={handleExitTest}
                    className="w-full mt-3 py-2 rounded-xl bg-brand-brown-dark hover:bg-brand-terracotta text-white text-xs font-black transition cursor-pointer"
                  >
                    Trở về danh sách
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DASHBOARD ĐỀ THI (Danh sách đề thi và tạo đề AI)
          ───────────────────────────────────────────────────────────── */}
      {!isTesting && (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 px-3 sm:px-0">
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-3xl border border-brand-terracotta-light/15 bg-white/95 shadow-md backdrop-blur">
            <div>
              <h2 className="font-display font-black text-lg sm:text-xl text-brand-brown-dark">
                Kho Đề Luyện Thi Thử TOPIK
              </h2>
              <p className="text-xs text-brand-brown-light leading-relaxed mt-0.5">
                Các đề thi Topik chất lượng cao mô phỏng chuẩn kỳ thi do AI tự thiết kế và chia sẻ trong cộng đồng.
              </p>
            </div>

            {/* Nút Tạo Đề AI */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="ai-glow-btn flex items-center gap-1.5 px-4.5 py-2.5 rounded-full bg-gradient-to-r from-brand-terracotta to-brand-accent text-white text-xs font-black shadow-md hover:shadow-lg transition cursor-pointer select-none"
            >
              <Zap size={13} />
              Tạo đề thi mới bằng AI
            </button>
          </div>

          {/* Danh sách đề thi */}
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={36} className="animate-spin text-brand-terracotta" />
              <div className="text-center">
                <p className="text-sm font-black text-brand-brown-dark">AI ĐANG THIẾT KẾ ĐỀ THI...</p>
                <p className="text-xs text-brand-brown-light mt-1">Quá trình sinh 10-15 câu hỏi bám sát NIIED có thể mất 15-30 giây.</p>
              </div>
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-[28px] border-2 border-dashed border-brand-terracotta-light/35 bg-white/70 text-center">
              <BookOpen size={40} className="text-brand-terracotta/40" />
              <div>
                <p className="font-display font-black text-brand-brown-dark text-base">Hệ thống chưa có đề thi thử nào</p>
                <p className="text-xs text-brand-brown-light mt-1">Hãy nhấn nút bên trên để ra lệnh cho AI thiết kế bộ đề đầu tiên!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {exams.map(exam => {
                const isListening = exam.category === 'listening'
                
                return (
                  <div
                    key={exam.id}
                    className="p-4 rounded-3xl border border-brand-terracotta-light/15 bg-white/95 shadow hover:shadow-md transition flex flex-col justify-between min-h-[140px] relative overflow-hidden group"
                  >
                    {/* Background badge decorative */}
                    <div className="absolute top-0 right-0 p-6 bg-brand-light/20 rounded-bl-[40px] -mr-4 -mt-4 transition group-hover:bg-brand-terracotta-light/10" />

                    <div className="flex flex-col gap-1.5 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${isListening ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                          {isListening ? 'Listening' : 'Reading'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-brand-light text-brand-brown-dark">
                          TOPIK {exam.level === 1 ? 'I' : 'II'}
                        </span>
                      </div>
                      <h4 className="font-display font-black text-sm sm:text-base text-brand-brown-dark group-hover:text-brand-terracotta transition mt-1">
                        {exam.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between mt-4 relative z-10 border-t border-brand-terracotta-light/10 pt-3">
                      <p className="text-[10px] font-bold text-brand-brown-light truncate">
                        {isListening ? '10 câu hỏi nghe · 20p' : '15 câu hỏi đọc · 30p'}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteExam(exam.id!, exam.title)}
                            className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-500 text-red-500 hover:text-white text-[11px] font-black transition cursor-pointer flex items-center gap-1 border border-red-200/20"
                            title="Xóa đề thi này"
                          >
                            Xóa
                          </button>
                        )}
                        <button
                          onClick={() => handleStartTest(exam)}
                          className="px-3.5 py-1.5 rounded-full bg-brand-terracotta/10 hover:bg-brand-terracotta hover:text-white text-brand-terracotta text-[11px] font-black transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
                        >
                          {isListening ? <Volume2 size={12} /> : <BookOpen size={12} />}
                          Luyện đề
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          AI CREATE MOCK EXAM MODAL (Popup chọn đề thi sinh bằng AI)
          ───────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !aiLoading && setShowCreateModal(false)} />
          <div className="relative bg-brand-cream rounded-3xl shadow-2xl w-full max-w-sm border border-white/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-terracotta via-brand-accent to-brand-terracotta-light" />
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-brand-terracotta-light/15 pb-2.5">
                <Zap className="text-brand-terracotta" size={20} />
                <h3 className="font-display font-black text-base text-brand-brown-dark">
                  AI Tạo đề thi thử mới
                </h3>
              </div>

              {/* Loại phần thi */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-brand-brown-light">Phần thi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={aiLoading}
                    onClick={() => setCreateCategory('reading')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black text-center transition cursor-pointer ${createCategory === 'reading' ? 'bg-brand-terracotta text-white border-brand-terracotta' : 'bg-white border-brand-terracotta-light/20 text-brand-brown-light hover:bg-brand-light'}`}
                  >
                    Đọc hiểu (읽기)
                  </button>
                  <button
                    disabled={aiLoading}
                    onClick={() => setCreateCategory('listening')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black text-center transition cursor-pointer ${createCategory === 'listening' ? 'bg-brand-terracotta text-white border-brand-terracotta' : 'bg-white border-brand-terracotta-light/20 text-brand-brown-light hover:bg-brand-light'}`}
                  >
                    Nghe hiểu (듣기)
                  </button>
                </div>
              </div>

              {/* Phân cấp trình độ */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-brand-brown-light">Trình độ thi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={aiLoading}
                    onClick={() => setCreateLevel(1)}
                    className={`py-2 px-3 rounded-xl border text-xs font-black text-center transition cursor-pointer ${createLevel === 1 ? 'bg-brand-terracotta text-white border-brand-terracotta' : 'bg-white border-brand-terracotta-light/20 text-brand-brown-light hover:bg-brand-light'}`}
                  >
                    TOPIK I (Sơ cấp)
                  </button>
                  <button
                    disabled={aiLoading}
                    onClick={() => setCreateLevel(2)}
                    className={`py-2 px-3 rounded-xl border text-xs font-black text-center transition cursor-pointer ${createLevel === 2 ? 'bg-brand-terracotta text-white border-brand-terracotta' : 'bg-white border-brand-terracotta-light/20 text-brand-brown-light hover:bg-brand-light'}`}
                  >
                    TOPIK II (Trung-Cao)
                  </button>
                </div>
              </div>

              {/* Phím xác nhận */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-emerald-800">Preset chuẩn TOPIK thật</p>
                    <p className="mt-1 text-[11px] font-bold leading-relaxed text-emerald-700">
                      AI sẽ sinh theo ma trận dạng câu, độ khó tăng dần, 4 lựa chọn có nhiễu hợp lý, chỉ 1 đáp án đúng và JSON schema cố định.
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['NIIED style', 'Self-check', 'Local validation', createCategory === 'reading' ? '15 câu đọc' : '10 câu nghe'].map(item => (
                    <span key={item} className="rounded-full border border-emerald-200 bg-white/80 px-2 py-1 text-[10px] font-black text-emerald-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 border-t border-brand-terracotta-light/15 pt-3 mt-1.5">
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-brand-terracotta-light/20 bg-white hover:bg-brand-light text-brand-brown-light text-xs font-black transition cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={handleCreateAiExam}
                  className="flex-1 py-2.5 rounded-xl bg-brand-terracotta text-white text-xs font-black hover:bg-brand-brown-dark transition cursor-pointer flex items-center justify-center gap-1 shadow disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Zap size={12} />
                      Xác nhận tạo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        onConfirm={() => {
          confirmState.onConfirm()
          closeConfirm()
        }}
        onCancel={closeConfirm}
        variant={confirmState.variant}
      />
    </div>
  )
}
