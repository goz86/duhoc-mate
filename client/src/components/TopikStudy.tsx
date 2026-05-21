import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, BookOpen, CheckCircle2, XCircle } from 'lucide-react'

interface TopikCard {
  id: number
  ko: string        // Tiếng Hàn
  vi: string        // Tiếng Việt
  en: string        // Tiếng Anh
  level: number     // 1-6 (TOPIK level)
  example?: string  // Ví dụ câu
}

// Bộ từ vựng TOPIK mẫu theo cấp độ
const VOCAB_BANK: TopikCard[] = [
  // Level 1
  { id: 1, ko: '안녕하세요', vi: 'Xin chào (lịch sự)', en: 'Hello (formal)', level: 1, example: '안녕하세요! 반갑습니다.' },
  { id: 2, ko: '감사합니다', vi: 'Cảm ơn', en: 'Thank you', level: 1, example: '도와주셔서 감사합니다.' },
  { id: 3, ko: '죄송합니다', vi: 'Xin lỗi', en: 'I\'m sorry', level: 1, example: '늦어서 죄송합니다.' },
  { id: 4, ko: '이름', vi: 'Tên', en: 'Name', level: 1, example: '이름이 뭐예요?' },
  { id: 5, ko: '학교', vi: 'Trường học', en: 'School', level: 1, example: '저는 학교에 가요.' },
  { id: 6, ko: '선생님', vi: 'Giáo viên/Thầy cô', en: 'Teacher', level: 1 },
  { id: 7, ko: '친구', vi: 'Bạn bè', en: 'Friend', level: 1 },
  { id: 8, ko: '음식', vi: 'Thức ăn/Đồ ăn', en: 'Food', level: 1 },
  // Level 2
  { id: 9, ko: '여행', vi: 'Du lịch', en: 'Travel', level: 2, example: '한국 여행이 즐거워요.' },
  { id: 10, ko: '날씨', vi: 'Thời tiết', en: 'Weather', level: 2, example: '오늘 날씨가 어때요?' },
  { id: 11, ko: '교통', vi: 'Giao thông', en: 'Traffic/Transportation', level: 2 },
  { id: 12, ko: '문화', vi: 'Văn hóa', en: 'Culture', level: 2 },
  { id: 13, ko: '경험', vi: 'Kinh nghiệm/Trải nghiệm', en: 'Experience', level: 2 },
  { id: 14, ko: '비교', vi: 'So sánh', en: 'Comparison', level: 2 },
  // Level 3
  { id: 15, ko: '환경', vi: 'Môi trường', en: 'Environment', level: 3, example: '환경 보호가 중요합니다.' },
  { id: 16, ko: '경제', vi: 'Kinh tế', en: 'Economy', level: 3 },
  { id: 17, ko: '사회', vi: 'Xã hội', en: 'Society', level: 3 },
  { id: 18, ko: '정치', vi: 'Chính trị', en: 'Politics', level: 3 },
  { id: 19, ko: '과학기술', vi: 'Khoa học kỹ thuật', en: 'Science and Technology', level: 3 },
  { id: 20, ko: '전통', vi: 'Truyền thống', en: 'Tradition', level: 3 },
  // Level 4
  { id: 21, ko: '복지', vi: 'Phúc lợi', en: 'Welfare', level: 4 },
  { id: 22, ko: '소통', vi: 'Giao tiếp/Thông tin', en: 'Communication', level: 4 },
  { id: 23, ko: '혁신', vi: 'Đổi mới/Cách mạng', en: 'Innovation', level: 4 },
  { id: 24, ko: '갈등', vi: 'Mâu thuẫn/Xung đột', en: 'Conflict', level: 4 },
  // Level 5-6
  { id: 25, ko: '논리적', vi: 'Có logic/Hợp lý', en: 'Logical', level: 5 },
  { id: 26, ko: '상호작용', vi: 'Tương tác', en: 'Interaction', level: 5 },
  { id: 27, ko: '패러다임', vi: 'Mô thức/Paradigm', en: 'Paradigm', level: 6 },
  { id: 28, ko: '내재화', vi: 'Nội tâm hóa', en: 'Internalization', level: 6 },
]

interface Props {
  roomId: string
  socket: any
}

export default function TopikStudy({ roomId, socket }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'vi' | 'ko' | 'en'

  const [selectedLevel, setSelectedLevel] = useState(1)
  const [cardIndex, setCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [unknown, setUnknown] = useState<Set<number>>(new Set())
  const [examDate, setExamDate] = useState<string>(() => localStorage.getItem('topik_exam_date') || '')
  const [showDateInput, setShowDateInput] = useState(false)
  const [activeTab, setActiveTab] = useState<'flashcard' | 'countdown'>('flashcard')

  const filteredCards = VOCAB_BANK.filter(c => c.level === selectedLevel)
  const currentCard = filteredCards[cardIndex]

  // Đồng bộ thẻ với phòng học qua socket
  useEffect(() => {
    if (!socket) return
    const handler = ({ level, index }: { level: number; index: number }) => {
      setSelectedLevel(level)
      setCardIndex(index)
      setShowAnswer(false)
    }
    socket.on('topik-sync', handler)
    return () => { socket.off('topik-sync', handler) }
  }, [socket])

  const syncToRoom = (level: number, index: number) => {
    socket?.emit('topik-action', { roomId, level, index })
  }

  const goNext = () => {
    const next = (cardIndex + 1) % filteredCards.length
    setCardIndex(next)
    setShowAnswer(false)
    syncToRoom(selectedLevel, next)
  }

  const goPrev = () => {
    const prev = (cardIndex - 1 + filteredCards.length) % filteredCards.length
    setCardIndex(prev)
    setShowAnswer(false)
    syncToRoom(selectedLevel, prev)
  }

  const markKnown = () => {
    setKnown(prev => new Set([...prev, currentCard.id]))
    setUnknown(prev => { const s = new Set(prev); s.delete(currentCard.id); return s })
    goNext()
  }

  const markUnknown = () => {
    setUnknown(prev => new Set([...prev, currentCard.id]))
    setKnown(prev => { const s = new Set(prev); s.delete(currentCard.id); return s })
    goNext()
  }

  const reset = () => {
    setCardIndex(0)
    setShowAnswer(false)
    setKnown(new Set())
    setUnknown(new Set())
    syncToRoom(selectedLevel, 0)
  }

  const changeLevel = (level: number) => {
    setSelectedLevel(level)
    setCardIndex(0)
    setShowAnswer(false)
    setKnown(new Set())
    setUnknown(new Set())
    syncToRoom(level, 0)
  }

  const saveExamDate = (date: string) => {
    setExamDate(date)
    localStorage.setItem('topik_exam_date', date)
    setShowDateInput(false)
  }

  const daysUntilExam = examDate
    ? Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000)
    : null

  const progress = filteredCards.length > 0
    ? Math.round(((known.size + unknown.size) / filteredCards.length) * 100)
    : 0

  const getTranslation = (card: TopikCard) => {
    if (lang === 'ko') return card.en
    if (lang === 'en') return card.en
    return card.vi
  }

  return (
    <div className="flex-1 flex flex-col gap-5 py-4">
      {/* Tab: Flashcard / Countdown */}
      <div className="flex gap-1 p-1 bg-brand-light/60 rounded-full w-fit mx-auto">
        <button
          onClick={() => setActiveTab('flashcard')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition cursor-pointer ${activeTab === 'flashcard' ? 'bg-white text-brand-terracotta shadow-sm' : 'text-brand-brown-light hover:text-brand-brown-dark'}`}
        >
          <BookOpen size={15} /> {t('topik.flashcard')}
        </button>
        <button
          onClick={() => setActiveTab('countdown')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition cursor-pointer ${activeTab === 'countdown' ? 'bg-white text-brand-terracotta shadow-sm' : 'text-brand-brown-light hover:text-brand-brown-dark'}`}
        >
          <Calendar size={15} /> {t('topik.countdown')}
        </button>
      </div>

      {activeTab === 'flashcard' && (
        <>
          {/* Level selector */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-bold text-brand-brown-light">{t('topik.level')}:</span>
            {[1, 2, 3, 4, 5, 6].map(lvl => (
              <button
                key={lvl}
                onClick={() => changeLevel(lvl)}
                className={`w-9 h-9 rounded-full text-sm font-black transition cursor-pointer border ${
                  selectedLevel === lvl
                    ? 'bg-brand-terracotta text-white border-brand-terracotta shadow-md'
                    : 'bg-white border-brand-terracotta-light/20 text-brand-brown-dark hover:bg-brand-light'
                }`}
              >
                {lvl}
              </button>
            ))}
            <button onClick={reset} className="p-2 rounded-full hover:bg-brand-light transition cursor-pointer ml-2" title="Reset">
              <RotateCcw size={15} className="text-brand-brown-light" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-sm mx-auto">
            <div className="flex justify-between text-xs text-brand-brown-light mb-1">
              <span>{t('topik.progress')}: {known.size + unknown.size}/{filteredCards.length}</span>
              <span className="text-emerald-600 font-bold">{known.size} ✓  <span className="text-red-400">{unknown.size} ✗</span></span>
            </div>
            <div className="h-2 bg-brand-light rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-brand-terracotta transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Flashcard */}
          {currentCard ? (
            <div className="flex flex-col items-center gap-4">
              <div
                className={`w-full max-w-sm min-h-[200px] rounded-3xl shadow-xl border-2 flex flex-col items-center justify-center gap-3 p-8 cursor-pointer transition-all select-none ${
                  showAnswer
                    ? 'bg-gradient-to-br from-brand-terracotta-light/30 to-brand-accent/20 border-brand-terracotta/30'
                    : 'bg-white border-brand-terracotta-light/20 hover:shadow-2xl hover:border-brand-terracotta/30'
                }`}
                onClick={() => setShowAnswer(!showAnswer)}
              >
                <div className="text-xs font-bold uppercase text-brand-brown-light">
                  TOPIK {selectedLevel} · {cardIndex + 1}/{filteredCards.length}
                </div>
                <div className="text-4xl font-black text-brand-brown-dark text-center">{currentCard.ko}</div>

                {showAnswer ? (
                  <div className="text-center space-y-2 animate-fade-in">
                    <div className="text-xl font-bold text-brand-terracotta">{getTranslation(currentCard)}</div>
                    {currentCard.example && (
                      <div className="text-sm text-brand-brown-light italic bg-brand-light/50 px-3 py-2 rounded-xl">
                        "{currentCard.example}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-brand-brown-light/70 italic mt-1">{t('topik.show')} →</div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-3">
                <button onClick={goPrev} className="p-3 rounded-full bg-white border border-brand-terracotta-light/20 hover:bg-brand-light transition cursor-pointer shadow-sm">
                  <ChevronLeft size={18} className="text-brand-brown-dark" />
                </button>
                <button
                  onClick={markUnknown}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-red-100 hover:bg-red-200 text-red-700 font-bold text-sm transition cursor-pointer border border-red-200"
                >
                  <XCircle size={16} /> {t('topik.dontKnow')}
                </button>
                <button
                  onClick={markKnown}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold text-sm transition cursor-pointer border border-emerald-200"
                >
                  <CheckCircle2 size={16} /> {t('topik.know')}
                </button>
                <button onClick={goNext} className="p-3 rounded-full bg-white border border-brand-terracotta-light/20 hover:bg-brand-light transition cursor-pointer shadow-sm">
                  <ChevronRight size={18} className="text-brand-brown-dark" />
                </button>
              </div>

              <p className="text-xs text-brand-brown-light text-center">
                {t('topik.sync')}
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-brand-brown-light">
              <BookOpen size={36} className="mx-auto mb-2 text-brand-terracotta-light/40" />
              <p className="text-sm">Không có từ vựng cho cấp độ này.</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'countdown' && (
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Countdown Display */}
          <div className="text-center space-y-4">
            <div className="text-sm font-bold text-brand-brown-light uppercase">{t('topik.examDate')}</div>

            {daysUntilExam !== null && daysUntilExam >= 0 ? (
              <div className="space-y-2">
                <div className="text-7xl font-black text-brand-terracotta tabular-nums">{daysUntilExam}</div>
                <div className="text-xl font-bold text-brand-brown-dark">{t('topik.days')}</div>
                <div className="text-sm text-brand-brown-light">{new Date(examDate).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            ) : daysUntilExam !== null && daysUntilExam < 0 ? (
              <div className="text-center space-y-2">
                <div className="text-5xl">🎉</div>
                <div className="text-xl font-bold text-brand-brown-dark">Kỳ thi đã qua!</div>
                <div className="text-sm text-brand-brown-light">Hy vọng bạn làm tốt!</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-32 h-32 rounded-full border-4 border-dashed border-brand-terracotta-light/40 flex items-center justify-center mx-auto">
                  <Calendar size={36} className="text-brand-terracotta/40" />
                </div>
                <p className="text-sm text-brand-brown-light">Chưa đặt ngày thi TOPIK</p>
              </div>
            )}

            <button
              onClick={() => setShowDateInput(!showDateInput)}
              className="px-5 py-2.5 rounded-xl bg-brand-terracotta hover:bg-brand-brown-dark text-white text-sm font-bold transition cursor-pointer shadow-sm"
            >
              {t('topik.setDate')}
            </button>

            {showDateInput && (
              <div className="flex gap-2 justify-center">
                <input
                  type="date"
                  defaultValue={examDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => saveExamDate(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-brand-terracotta-light/40 text-brand-brown-dark text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/40 bg-white"
                />
              </div>
            )}
          </div>

          {/* TOPIK Exam Schedule Info */}
          <div className="w-full max-w-sm p-4 rounded-2xl bg-brand-light/60 border border-brand-terracotta-light/20">
            <h4 className="font-bold text-sm text-brand-brown-dark mb-2">📅 Lịch thi TOPIK 2024-2025</h4>
            <div className="space-y-1.5 text-xs text-brand-brown-light">
              <div className="flex justify-between"><span>TOPIK I & II</span><span className="font-bold text-brand-terracotta">Tháng 4, 7, 10, 11</span></div>
              <div className="flex justify-between"><span>Đăng ký online</span><span>topik.go.kr</span></div>
              <div className="flex justify-between"><span>Phí thi</span><span>40,000₩</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
