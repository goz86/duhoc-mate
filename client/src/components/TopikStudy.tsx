import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, ChevronRight, Calendar, RotateCcw, BookOpen,
  CheckCircle2, XCircle, Volume2, Settings, Loader2,
  Plus, Zap, Key,
} from 'lucide-react'
import {
  generateExample, generateNewWords, hasApiKey, getApiKey, setApiKey,
  type AiGeneratedExample,
} from '../lib/aiService'
import {
  saveWords, getWordsByLevel, getAllSavedKoWords, seedShuffle,
  saveExamDate as saveExamDateToDb, loadExamDate,
  type TopikWord,
} from '../lib/topikStorage'

interface TopikCard {
  id: number
  ko: string
  vi: string
  en: string
  level: number
  example?: string
  isAi?: boolean // Được tạo bởi AI
}

// ── Bộ từ vựng TOPIK tĩnh (70 từ core) ─────────────────────────
const VOCAB_BANK: TopikCard[] = [
  // Level 1
  { id: 1, ko: '안녕하세요', vi: 'Xin chào (lịch sự)', en: 'Hello (formal)', level: 1, example: '안녕하세요! 반갑습니다.' },
  { id: 2, ko: '감사합니다', vi: 'Cảm ơn', en: 'Thank you', level: 1, example: '도와주셔서 감사합니다.' },
  { id: 3, ko: '죄송합니다', vi: 'Xin lỗi', en: 'I\'m sorry', level: 1, example: '늦어서 죄송합니다.' },
  { id: 4, ko: '이름', vi: 'Tên', en: 'Name', level: 1, example: '이름이 뭐예요?' },
  { id: 5, ko: '학교', vi: 'Trường học', en: 'School', level: 1, example: '저는 학교에 가요.' },
  { id: 6, ko: '선생님', vi: 'Giáo viên/Thầy cô', en: 'Teacher', level: 1, example: '우리 선생님은 아주 친절해요.' },
  { id: 7, ko: '친구', vi: 'Bạn bè', en: 'Friend', level: 1, example: '주말에 친구를 만나요.' },
  { id: 8, ko: '음식', vi: 'Thức ăn/Đồ ăn', en: 'Food', level: 1, example: '매운 음식을 잘 먹어요.' },
  { id: 9, ko: '가족', vi: 'Gia đình', en: 'Family', level: 1, example: '가족과 같이 살고 있어요.' },
  { id: 10, ko: '물', vi: 'Nước', en: 'Water', level: 1, example: '시원한 물 한 잔 주세요.' },
  { id: 11, ko: '책', vi: 'Sách', en: 'Book', level: 1, example: '매일 도서관에서 책을 읽어요.' },
  { id: 12, ko: '공부', vi: 'Học tập', en: 'Study', level: 1, example: '한국어 공부가 재미있어요.' },
  { id: 13, ko: '집', vi: 'Nhà', en: 'Home/House', level: 1, example: '학교가 집에서 가까워요.' },
  // Level 2
  { id: 14, ko: '여행', vi: 'Du lịch', en: 'Travel', level: 2, example: '한국 여행이 즐거워요.' },
  { id: 15, ko: '날씨', vi: 'Thời tiết', en: 'Weather', level: 2, example: '오늘 날씨가 어때요?' },
  { id: 16, ko: '교통', vi: 'Giao thông', en: 'Traffic/Transportation', level: 2, example: '출퇴근 시간에는 교통이 복잡해요.' },
  { id: 17, ko: '문화', vi: 'Văn hóa', en: 'Culture', level: 2, example: '서로 다른 문화를 이해해야 해요.' },
  { id: 18, ko: '경험', vi: 'Kinh nghiệm/Trải nghiệm', en: 'Experience', level: 2, example: '해외 경험은 아주 소중합니다.' },
  { id: 19, ko: '비교', vi: 'So sánh', en: 'Comparison', level: 2, example: '가격과 품질을 비교해 보세요.' },
  { id: 20, ko: '도서관', vi: 'Thư viện', en: 'Library', level: 2, example: '주말에 도서관에 갈 약속이 있어요.' },
  { id: 21, ko: '계절', vi: 'Mùa', en: 'Season', level: 2, example: '한국은 사계절이 뚜렷해요.' },
  { id: 22, ko: '준비', vi: 'Chuẩn bị', en: 'Preparation', level: 2, example: '시험 공부를 열심히 준비해요.' },
  { id: 23, ko: '예약', vi: 'Đặt chỗ/Đặt trước', en: 'Reservation', level: 2, example: '식당 예약을 확인해 주세요.' },
  { id: 24, ko: '약속', vi: 'Cuộc hẹn/Lời hứa', en: 'Appointment/Promise', level: 2, example: '오늘 친구와 약속이 있어요.' },
  { id: 25, ko: '취미', vi: 'Sở thích', en: 'Hobby', level: 2, example: '제 취미는 음악 감상입니다.' },
  { id: 26, ko: '계획', vi: 'Kế hoạch', en: 'Plan', level: 2, example: '방학 계획을 세우고 있어요.' },
  // Level 3
  { id: 27, ko: '환경', vi: 'Môi trường', en: 'Environment', level: 3, example: '환경 보호가 중요합니다.' },
  { id: 28, ko: '경제', vi: 'Kinh tế', en: 'Economy', level: 3, example: '세계 경제가 빠르게 변화하고 있다.' },
  { id: 29, ko: '사회', vi: 'Xã hội', en: 'Society', level: 3, example: '고령화 사회에 대비해야 합니다.' },
  { id: 30, ko: '정치', vi: 'Chính trị', en: 'Politics', level: 3, example: '사람들은 정치에 관심이 많다.' },
  { id: 31, ko: '과학기술', vi: 'Khoa học kỹ thuật', en: 'Science and Technology', level: 3, example: '과학기술의 발달이 삶을 윤택하게 만든다.' },
  { id: 32, ko: '전통', vi: 'Truyền thống', en: 'Tradition', level: 3, example: '전통 문화를 보존해야 한다.' },
  { id: 33, ko: '광고', vi: 'Quảng cáo', en: 'Advertisement', level: 3, example: '인터넷 광고가 늘어나고 있다.' },
  { id: 34, ko: '설명', vi: 'Giải thích', en: 'Explanation', level: 3, example: '사용 방법을 자세히 설명해 주세요.' },
  { id: 35, ko: '상황', vi: 'Tình huống/Hoàn cảnh', en: 'Situation', level: 3, example: '급한 상황에서는 먼저 전화를 하세요.' },
  { id: 36, ko: '노력', vi: 'Nỗ lực/Cố gắng', en: 'Effort', level: 3, example: '꿈을 이루기 위해 끊임없이 노력한다.' },
  { id: 37, ko: '태도', vi: 'Thái độ', en: 'Attitude', level: 3, example: '긍정적인 태도가 성공을 이끈다.' },
  { id: 38, ko: '역할', vi: 'Vai trò', en: 'Role', level: 3, example: '부모의 역할은 자녀 교육에 매우 중요하다.' },
  // Level 4
  { id: 39, ko: '복지', vi: 'Phúc lợi', en: 'Welfare', level: 4, example: '노인 복지 제도를 개선해야 합니다.' },
  { id: 40, ko: '소통', vi: 'Giao tiếp/Thông tin', en: 'Communication', level: 4, example: '세대 간의 소통이 필요한 시점이다.' },
  { id: 41, ko: '혁신', vi: 'Đổi mới/Cách mạng', en: 'Innovation', level: 4, example: '기업들은 기술 혁신을 추구하고 있다.' },
  { id: 42, ko: '갈등', vi: 'Mâu thuẫn/Xung đột', en: 'Conflict', level: 4, example: '의견 차이로 인한 갈등을 해결해야 한다.' },
  { id: 43, ko: '부작용', vi: 'Tác dụng phụ', en: 'Side Effect', level: 4, example: '이 약은 약간의 부작용이 있을 수 있다.' },
  { id: 44, ko: '유행', vi: 'Trào lưu/Thịnh hành', en: 'Trend/Fashion', level: 4, example: '요즘 젊은이들 사이에서 유행하는 패션이다.' },
  { id: 45, ko: '가치관', vi: 'Quan niệm giá trị', en: 'Values', level: 4, example: '사람마다 삶의 가치관이 다릅니다.' },
  { id: 46, ko: '집중력', vi: 'Khả năng tập trung', en: 'Concentration', level: 4, example: '소음이 많으면 집중력이 떨어진다.' },
  { id: 47, ko: '효율적', vi: 'Hiệu quả/Tính hiệu suất', en: 'Efficient', level: 4, example: '시간을 효율적으로 활용해야 합니다.' },
  { id: 48, ko: '다양성', vi: 'Tính đa dạng', en: 'Diversity', level: 4, example: '문화의 다양성을 존중해야 한다.' },
  { id: 49, ko: '대중매체', vi: 'Phương tiện truyền thông đại chúng', en: 'Mass Media', level: 4, example: '대중매체는 여론 형성에 큰 영향을 준다.' },
  // Level 5
  { id: 50, ko: '논리적', vi: 'Có logic/Hợp lý', en: 'Logical', level: 5, example: '자신의 생각을 논리적으로 설명해야 한다.' },
  { id: 51, ko: '상호작용', vi: 'Tương tác qua lại', en: 'Interaction', level: 5, example: '인간과 환경은 끊임없이 상호작용한다.' },
  { id: 52, ko: '공동체', vi: 'Cộng đồng', en: 'Community', level: 5, example: '공동체 의식을 함양하는 것이 시급하다.' },
  { id: 53, ko: '정체성', vi: 'Bản sắc/Danh tính', en: 'Identity', level: 5, example: '자아 정체성을 확립하는 시기이다.' },
  { id: 54, ko: '타협', vi: 'Thỏa hiệp', en: 'Compromise', level: 5, example: '갈등 해결을 위해 상호 타협이 필요하다.' },
  { id: 55, ko: '기득권', vi: 'Quyền lợi sẵn có/Đặc quyền', en: 'Vested Interest', level: 5, example: '기득권을 내려놓고 대화에 임해야 한다.' },
  { id: 56, ko: '민주주의', vi: 'Chủ nghĩa dân chủ', en: 'Democracy', level: 5, example: '민주주의의 핵심은 국민의 주권이다.' },
  { id: 57, ko: '세계화', vi: 'Toàn cầu hóa', en: 'Globalization', level: 5, example: '세계화 흐름 속에서 경쟁력을 갖추어야 한다.' },
  { id: 58, ko: '지속가능', vi: 'Bền vững/Có thể duy trì', en: 'Sustainable', level: 5, example: '지속가능한 개발을 목표로 삼아야 한다.' },
  { id: 59, ko: '창의성', vi: 'Tính sáng tạo', en: 'Creativity', level: 5, example: '미래 사회는 인재의 창의성을 요구한다.' },
  // Level 6
  { id: 60, ko: '패러다임', vi: 'Mô thức/Paradigm', en: 'Paradigm', level: 6, example: '기술 혁신이 새로운 패러다임을 열었다.' },
  { id: 61, ko: '내재화', vi: 'Nội tâm hóa', en: 'Internalization', level: 6, example: '도덕적 가치관의 내재화가 필요하다.' },
  { id: 62, ko: '초월', vi: 'Siêu việt/Vượt trội', en: 'Transcendence', level: 6, example: '시공간을 초월한 예술적 명작이다.' },
  { id: 63, ko: '헤게모니', vi: 'Bá quyền/Hegemony', en: 'Hegemony', level: 6, example: '그 나라는 문화적 헤게모니를 쥐고 있다.' },
  { id: 64, ko: '구조주의', vi: 'Chủ nghĩa cấu trúc', en: 'Structuralism', level: 6, example: '구조주의 철학은 현대 사상에 깊은 영향을 주었다.' },
  { id: 65, ko: '인문학적', vi: 'Thuộc về nhân văn', en: 'Humanistic', level: 6, example: '인문학적 소양을 기르는 교육이 강조된다.' },
  { id: 66, ko: '통섭', vi: 'Liên ngành/Consilience', en: 'Consilience', level: 6, example: '과학과 예술의 학문적 통섭이 시도되고 있다.' },
  { id: 67, ko: '인과관계', vi: 'Quan hệ nhân quả', en: 'Causal Relationship', level: 6, example: '두 사건 사이의 인과관계를 밝혀내야 한다.' },
  { id: 68, ko: '형이상학', vi: 'Hình nhi thượng học/Metaphysics', en: 'Metaphysics', level: 6, example: '그 이론은 형이상학적 영역에 가깝다.' },
  { id: 69, ko: '상대주의', vi: 'Chủ nghĩa tương đối', en: 'Relativism', level: 6, example: '문화 상대주의적 입장을 견지해야 한다.' },
]

interface Props {
  roomId: string
  socket: any
}

export default function TopikStudy({ roomId, socket }: Props) {
  const { t, i18n } = useTranslation()
  const lang = ((i18n.resolvedLanguage || i18n.language).split('-')[0] || 'vi') as 'vi' | 'ko' | 'en'

  // ── Core states ────────────────────────────────────────────────
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [cardIndex, setCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [unknown, setUnknown] = useState<Set<number>>(new Set())
  const [examDate, setExamDate] = useState<string>('')
  const [showDateInput, setShowDateInput] = useState(false)
  const [activeTab, setActiveTab] = useState<'flashcard' | 'countdown'>('flashcard')

  // ── AI states ──────────────────────────────────────────────────
  const [aiWords, setAiWords] = useState<TopikCard[]>([])
  const [showAiSettings, setShowAiSettings] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(() => getApiKey())
  const [aiLoading, setAiLoading] = useState(false)
  const [aiGenLoading, setAiGenLoading] = useState(false)
  const [aiExample, setAiExample] = useState<AiGeneratedExample | null>(null)
  const [aiError, setAiError] = useState('')

  // ── Load exam date from database on mount ──────────────────────
  useEffect(() => {
    loadExamDate().then(date => {
      if (date) setExamDate(date)
    })
  }, [])

  // ── Load AI words from storage on level change ─────────────────
  useEffect(() => {
    let cancelled = false
    getWordsByLevel(selectedLevel).then(stored => {
      if (cancelled) return
      const mapped: TopikCard[] = stored.map((w, i) => ({
        id: 1000 + i + (selectedLevel * 100),
        ko: w.ko,
        vi: w.vi,
        en: w.en,
        level: w.level,
        example: w.example,
        isAi: true,
      }))
      setAiWords(mapped)
    })
    return () => { cancelled = true }
  }, [selectedLevel])

  // ── Merge static + AI, then seed-shuffle ──────────────────────
  const allCards = useMemo(() => {
    const staticCards = VOCAB_BANK.filter(c => c.level === selectedLevel)
    // Loại bỏ trùng lặp (AI trùng với static)
    const aiFiltered = aiWords.filter(
      ai => !staticCards.some(s => s.ko === ai.ko)
    )
    const merged = [...staticCards, ...aiFiltered]
    // Seed-shuffle theo roomId để đồng bộ thứ tự
    return seedShuffle(merged, roomId)
  }, [selectedLevel, aiWords, roomId])

  const currentCard = allCards[cardIndex]

  // ── Socket sync ────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return
    const handler = ({ level, index }: { level: number; index: number }) => {
      setSelectedLevel(level)
      setCardIndex(index)
      setShowAnswer(false)
      setAiExample(null)
    }
    socket.on('topik-sync', handler)
    return () => { socket.off('topik-sync', handler) }
  }, [socket])

  const syncToRoom = useCallback((level: number, index: number) => {
    socket?.emit('topik-action', { roomId, level, index })
  }, [socket, roomId])

  // ── Navigation ─────────────────────────────────────────────────
  const goNext = useCallback(() => {
    const next = (cardIndex + 1) % allCards.length
    setCardIndex(next)
    setShowAnswer(false)
    setAiExample(null)
    syncToRoom(selectedLevel, next)
  }, [cardIndex, allCards.length, selectedLevel, syncToRoom])

  const goPrev = useCallback(() => {
    const prev = (cardIndex - 1 + allCards.length) % allCards.length
    setCardIndex(prev)
    setShowAnswer(false)
    setAiExample(null)
    syncToRoom(selectedLevel, prev)
  }, [cardIndex, allCards.length, selectedLevel, syncToRoom])

  const playAudio = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ko-KR'
      const voices = window.speechSynthesis.getVoices()
      const koVoice = voices.find(voice => voice.lang.startsWith('ko'))
      if (koVoice) utterance.voice = koVoice
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const markKnown = () => {
    if (!currentCard) return
    setKnown(prev => new Set([...prev, currentCard.id]))
    setUnknown(prev => { const s = new Set(prev); s.delete(currentCard.id); return s })
    goNext()
  }

  const markUnknown = () => {
    if (!currentCard) return
    setUnknown(prev => new Set([...prev, currentCard.id]))
    setKnown(prev => { const s = new Set(prev); s.delete(currentCard.id); return s })
    goNext()
  }

  const reset = () => {
    setCardIndex(0)
    setShowAnswer(false)
    setKnown(new Set())
    setUnknown(new Set())
    setAiExample(null)
    syncToRoom(selectedLevel, 0)
  }

  const changeLevel = (level: number) => {
    setSelectedLevel(level)
    setCardIndex(0)
    setShowAnswer(false)
    setKnown(new Set())
    setUnknown(new Set())
    setAiExample(null)
    syncToRoom(level, 0)
  }

  const handleSaveExamDate = (date: string) => {
    setExamDate(date)
    saveExamDateToDb(date) // Lưu vào Supabase + localStorage
    setShowDateInput(false)
  }

  const daysUntilExam = examDate
    ? Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000)
    : null

  const progress = allCards.length > 0
    ? Math.round(((known.size + unknown.size) / allCards.length) * 100)
    : 0

  const getTranslation = (card: TopikCard) => {
    if (lang === 'ko') return card.en
    if (lang === 'en') return card.en
    return card.vi
  }

  // ── AI: Save API Key ──────────────────────────────────────────
  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput)
    setShowAiSettings(false)
    setAiError('')
  }

  // ── AI: Generate Example ──────────────────────────────────────
  const handleGenerateExample = async () => {
    if (!currentCard || !hasApiKey()) {
      setShowAiSettings(true)
      return
    }
    setAiLoading(true)
    setAiError('')
    try {
      const example = await generateExample(currentCard.ko)
      setAiExample(example)
    } catch (err: any) {
      setAiError(err.message || 'Lỗi tạo ví dụ')
    } finally {
      setAiLoading(false)
    }
  }

  // ── AI: Generate New Words ────────────────────────────────────
  const handleGenerateWords = async () => {
    if (!hasApiKey()) {
      setShowAiSettings(true)
      return
    }
    setAiGenLoading(true)
    setAiError('')
    try {
      // Lấy tất cả từ đã có để tránh trùng
      const existingKo = [
        ...VOCAB_BANK.map(w => w.ko),
        ...aiWords.map(w => w.ko),
        ...(await getAllSavedKoWords()),
      ]
      const uniqueExisting = [...new Set(existingKo)]

      const newWords = await generateNewWords(selectedLevel, uniqueExisting, 20)

      // Lưu vào storage
      const toSave: TopikWord[] = newWords.map(w => ({
        ko: w.ko,
        vi: w.vi,
        en: w.en,
        level: w.level,
        example: w.example,
      }))
      await saveWords(toSave)

      // Cập nhật UI
      const newCards: TopikCard[] = newWords.map((w, i) => ({
        id: 2000 + Date.now() + i,
        ko: w.ko,
        vi: w.vi,
        en: w.en,
        level: w.level,
        example: w.example,
        isAi: true,
      }))
      setAiWords(prev => [...prev, ...newCards])
    } catch (err: any) {
      setAiError(err.message || 'Lỗi tạo từ mới')
    } finally {
      setAiGenLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────
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
          <div className="flex items-center justify-center gap-2 flex-wrap">
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
            {/* AI Settings toggle */}
            <button
              onClick={() => setShowAiSettings(!showAiSettings)}
              className={`p-2 rounded-full transition cursor-pointer ml-1 ${
                hasApiKey()
                  ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                  : 'bg-brand-light hover:bg-brand-terracotta-light/30 text-brand-brown-light'
              }`}
              title="Cài đặt AI DeepSeek"
            >
              <Settings size={15} />
            </button>
          </div>

          {/* AI Settings Panel */}
          {showAiSettings && (
            <div className="ai-settings-panel p-4 w-full max-w-sm mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <Key size={16} className="text-brand-terracotta" />
                <span className="text-sm font-bold text-brand-brown-dark">DeepSeek API Key</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 px-3 py-2 rounded-xl border border-brand-terracotta-light/30 text-sm bg-white/80 text-brand-brown-dark focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 rounded-xl bg-brand-terracotta text-white text-sm font-bold hover:bg-brand-brown-dark transition cursor-pointer"
                >
                  Lưu
                </button>
              </div>
              {hasApiKey() && (
                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                  <CheckCircle2 size={12} /> API Key đã được lưu an toàn
                </p>
              )}
              <p className="text-xs text-brand-brown-light/70 mt-2">
                Key chỉ lưu trên trình duyệt của bạn, không gửi lên server.
              </p>
            </div>
          )}

          {/* AI Error */}
          {aiError && (
            <div className="w-full max-w-sm mx-auto px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
              ⚠️ {aiError}
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full max-w-sm mx-auto">
            <div className="flex justify-between text-xs text-brand-brown-light mb-1">
              <span>{t('topik.progress')}: {known.size + unknown.size}/{allCards.length}</span>
              <span className="text-emerald-600 font-bold">{known.size} ✓  <span className="text-red-400">{unknown.size} ✗</span></span>
            </div>
            <div className="h-2 bg-brand-light rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-brand-terracotta transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* AI word count indicator */}
            {aiWords.filter(w => w.level === selectedLevel).length > 0 && (
              <div className="flex items-center gap-1 mt-1.5 justify-end">
                <span className="topik-word-chip">
                  +{aiWords.filter(w => w.level === selectedLevel).length} từ AI
                </span>
              </div>
            )}
          </div>

          {/* ═══ Flashcard Pro ═══ */}
          {currentCard ? (
            <div className="flex flex-col items-center gap-4">
              <div
                className="flashcard-pro w-full max-w-sm shadow-xl border-2 border-brand-terracotta-light/20"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                <div className="flashcard-surface">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-brand-brown-light">
                    <span>TOPIK {selectedLevel} · {cardIndex + 1}/{allCards.length}</span>
                    {currentCard.isAi && (
                      <span className="topik-word-chip">
                        AI
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 justify-center">
                    <div className="text-4xl font-black text-brand-brown-dark text-center leading-normal">{currentCard.ko}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); playAudio(currentCard.ko); }}
                      className="p-2.5 rounded-full bg-brand-light/80 text-brand-terracotta hover:bg-brand-terracotta hover:text-white transition cursor-pointer active:scale-90 flex items-center justify-center shrink-0 border border-brand-terracotta-light/10 shadow-sm"
                      title="Phát âm"
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>

                  {!showAnswer && (
                    <div className="text-sm text-brand-brown-light/70 italic mt-1">{t('topik.show')} →</div>
                  )}
                </div>

                {/* Slide-up meaning panel */}
                <div className={`flashcard-meaning-panel ${showAnswer ? 'flashcard-meaning-panel-visible' : ''}`}>
                  <div className="text-center space-y-3 w-full my-auto flex flex-col items-center">
                    {/* Từ tiếng Hàn ban đầu để đối chiếu */}
                    <div className="flex items-center gap-2 mb-1 justify-center">
                      <span className="text-xl font-black text-brand-brown-dark">{currentCard.ko}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); playAudio(currentCard.ko); }}
                        className="p-1.5 rounded-full bg-brand-light text-brand-terracotta hover:bg-brand-terracotta hover:text-white transition cursor-pointer"
                        title="Phát âm"
                      >
                        <Volume2 size={12} />
                      </button>
                    </div>

                    <div className="text-2xl font-black text-brand-terracotta">{getTranslation(currentCard)}</div>
                    {currentCard.example && (
                      <div className="ai-example-bubble flex items-center gap-2 justify-center w-full max-w-[280px]">
                        <span className="text-xs text-brand-brown-light italic leading-relaxed text-center">
                          "{currentCard.example}"
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); playAudio(currentCard.example || ''); }}
                          className="p-1 rounded-full text-brand-terracotta/70 hover:text-brand-terracotta transition cursor-pointer active:scale-90 flex items-center justify-center shrink-0"
                          title="Phát âm câu ví dụ"
                        >
                          <Volume2 size={12} />
                        </button>
                      </div>
                    )}

                    {/* AI Example */}
                    {aiExample && (
                      <div className="ai-example-bubble text-left space-y-1 mt-2">
                        <div className="flex items-center gap-1 text-xs font-bold text-brand-terracotta">
                          AI Ví dụ
                        </div>
                        <p className="text-sm text-brand-brown-dark">🇰🇷 {aiExample.sentence}</p>
                        <p className="text-xs text-brand-brown-light">🇻🇳 {aiExample.meaning}</p>
                      </div>
                    )}

                    {/* AI Generate Example button */}
                    {showAnswer && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGenerateExample(); }}
                        disabled={aiLoading}
                        className="ai-glow-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-terracotta/10 hover:bg-brand-terracotta/20 text-brand-terracotta text-xs font-bold transition cursor-pointer mt-1 disabled:opacity-50"
                      >
                        {aiLoading ? (
                          <><Loader2 size={12} className="animate-spin" /> Đang tạo...</>
                        ) : (
                          <>Tạo ví dụ AI</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-1.5 sm:gap-3 w-full max-w-sm justify-center">
                <button 
                  onClick={goPrev} 
                  className="p-2 sm:p-3 rounded-full bg-white border border-brand-terracotta-light/20 hover:bg-brand-light transition cursor-pointer shadow-sm flex-shrink-0"
                >
                  <ChevronLeft size={16} className="text-brand-brown-dark sm:hidden" />
                  <ChevronLeft size={18} className="text-brand-brown-dark hidden sm:block" />
                </button>
                <button
                  onClick={markUnknown}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs sm:text-sm transition cursor-pointer border border-red-200 whitespace-nowrap"
                >
                  <XCircle size={14} className="sm:hidden" />
                  <XCircle size={16} className="hidden sm:block" /> 
                  <span>{t('topik.dontKnow')}</span>
                </button>
                <button
                  onClick={markKnown}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold text-xs sm:text-sm transition cursor-pointer border border-emerald-200 whitespace-nowrap"
                >
                  <CheckCircle2 size={14} className="sm:hidden" />
                  <CheckCircle2 size={16} className="hidden sm:block" /> 
                  <span>{t('topik.know')}</span>
                </button>
                <button 
                  onClick={goNext} 
                  className="p-2 sm:p-3 rounded-full bg-white border border-brand-terracotta-light/20 hover:bg-brand-light transition cursor-pointer shadow-sm flex-shrink-0"
                >
                  <ChevronRight size={16} className="text-brand-brown-dark sm:hidden" />
                  <ChevronRight size={18} className="text-brand-brown-dark hidden sm:block" />
                </button>
              </div>

              {/* AI Generate New Words button */}
              <button
                onClick={handleGenerateWords}
                disabled={aiGenLoading}
                className="ai-glow-btn flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-brand-terracotta to-brand-accent text-white text-sm font-bold transition cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiGenLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>AI đang tạo từ mới...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Tạo 20 từ mới bằng AI</span>
                    <Plus size={14} />
                  </>
                )}
              </button>

              {/* AI loading shimmer */}
              {aiGenLoading && (
                <div className="w-full max-w-sm space-y-2">
                  <div className="ai-shimmer h-10 w-full" />
                  <div className="ai-shimmer h-10 w-4/5" />
                  <div className="ai-shimmer h-10 w-3/5" />
                </div>
              )}

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
                  onChange={e => handleSaveExamDate(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-brand-terracotta-light/40 text-brand-brown-dark text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/40 bg-white"
                />
              </div>
            )}
          </div>

          {/* TOPIK Exam Schedule Info */}
          <div className="w-full max-w-sm p-4 rounded-2xl bg-brand-light/60 border border-brand-terracotta-light/20">
            <h4 className="font-bold text-sm text-brand-brown-dark mb-2">📅 Lịch thi TOPIK 2026</h4>
            <div className="space-y-1.5 text-xs text-brand-brown-light">
              <div className="flex justify-between"><span>TOPIK IBT 제14회</span><span className="font-bold text-brand-terracotta">09.12 (토)</span></div>
              <div className="flex justify-between"><span>TOPIK IBT 제15회</span><span className="font-bold text-brand-terracotta">10.24 (토)</span></div>
              <div className="flex justify-between"><span>TOPIK IBT 제16회</span><span className="font-bold text-brand-terracotta">11.28 (토)</span></div>
              <div className="flex justify-between"><span>TOPIK PBT 제108회</span><span className="font-bold text-brand-terracotta">10.18 (일)</span></div>
              <div className="flex justify-between"><span>TOPIK PBT 제109회</span><span className="font-bold text-brand-terracotta">11.15 (일)</span></div>
              <div className="flex justify-between mt-2 pt-2 border-t border-brand-terracotta-light/15"><span>Đăng ký online</span><span>topik.go.kr</span></div>
              <div className="flex justify-between"><span>Phí thi</span><span className="font-bold">55,000₩</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
