import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Gamepad2,
  ListChecks,
  RotateCcw,
  Sparkles,
  Timer,
  Trash2,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react'
import TopikGrammarGenerator from './TopikGrammarGenerator'
import {
  ERROR_TYPE_LABELS,
  ROOM_GAME_LABELS,
  TOPIK_GRAMMAR_PATTERNS,
  TOPIK_PRACTICE_QUESTIONS,
  type TopikPracticeQuestion,
  type TopikRoomGameType,
} from '../lib/topikGrammar'
import {
  addTopikMistake,
  clearTopikMistakes,
  loadTopikMistakes,
  removeTopikMistake,
  syncTopikMistakes,
  type TopikMistake,
} from '../lib/topikMistakes'
import {
  loadPublishedGrammarPatterns,
  loadPublishedQuestionBank,
  pickQuestionSession,
} from '../lib/topikContentStorage'
import { useAuth } from '../contexts/AuthContext'

type LabView = 'grammar' | 'practice' | 'mistakes' | 'room-games' | 'ai-generator'

type RoomGameQuestion = Omit<TopikPracticeQuestion, 'answerIndex'> & {
  answerIndex?: number
}

type RoomGameState = {
  status: 'idle' | 'question' | 'revealed' | 'finished'
  gameType: TopikRoomGameType | null
  round: number
  totalRounds: number
  question: RoomGameQuestion | null
  roundStartedAt: number
  leaderboard: Array<{
    memberId: string
    username: string
    score: number
    correct: number
    answeredAt?: number
  }>
  answers: Record<string, { optionIndex: number; correct: boolean; answeredAt: number }>
}

type Props = {
  roomId: string
  socket: any
}

const levelOptions = [1, 2, 3, 4, 5, 6]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function optionClass(isSelected: boolean, isCorrect: boolean, isWrong: boolean, isRevealed: boolean) {
  if (isRevealed && isCorrect) return 'border-emerald-300 bg-emerald-50 text-emerald-800'
  if (isRevealed && isWrong) return 'border-red-300 bg-red-50 text-red-700'
  if (isSelected) return 'border-brand-terracotta bg-brand-terracotta/10 text-brand-brown-dark'
  return 'border-brand-terracotta-light/20 bg-white hover:bg-brand-light/70 text-brand-brown-dark'
}

export default function TopikGrammarLab({ roomId, socket }: Props) {
  const { user } = useAuth()
  const userId = user?.id || null
  const [view, setView] = useState<LabView>('grammar')
  const [level, setLevel] = useState(3)
  const [grammarPatterns, setGrammarPatterns] = useState(TOPIK_GRAMMAR_PATTERNS)
  const [questionBank, setQuestionBank] = useState(TOPIK_PRACTICE_QUESTIONS)
  const patterns = useMemo(() => grammarPatterns.filter(pattern => pattern.level === level), [grammarPatterns, level])
  const [selectedPatternId, setSelectedPatternId] = useState(() => patterns[0]?.id || TOPIK_GRAMMAR_PATTERNS[0]?.id)
  const selectedPattern = useMemo(
    () => grammarPatterns.find(pattern => pattern.id === selectedPatternId) || patterns[0],
    [grammarPatterns, patterns, selectedPatternId]
  )

  const [practiceQuestions, setPracticeQuestions] = useState<TopikPracticeQuestion[]>([])
  const [practiceIndex, setPracticeIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [practiceScore, setPracticeScore] = useState(0)
  const recentPracticeIdsRef = useRef<string[]>([])
  const [mistakes, setMistakes] = useState<TopikMistake[]>(() => loadTopikMistakes())

  const [roomGame, setRoomGame] = useState<RoomGameState | null>(null)
  const [roomSelections, setRoomSelections] = useState<Record<string, number>>({})
  const savedRoomMistakesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    Promise.all([loadPublishedGrammarPatterns(), loadPublishedQuestionBank()]).then(([nextPatterns, nextQuestions]) => {
      if (cancelled) return
      setGrammarPatterns(nextPatterns)
      setQuestionBank(nextQuestions)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    recentPracticeIdsRef.current = []
    setPracticeQuestions([])
    setPracticeIndex(0)
    setSelectedAnswer(null)
    setPracticeScore(0)
  }, [roomId])

  useEffect(() => {
    let cancelled = false
    syncTopikMistakes(userId).then(nextMistakes => {
      if (!cancelled) setMistakes(nextMistakes)
    })
    return () => { cancelled = true }
  }, [userId])

  useEffect(() => {
    if (patterns.length && !patterns.some(pattern => pattern.id === selectedPatternId)) {
      setSelectedPatternId(patterns[0].id)
    }
  }, [patterns, selectedPatternId])

  useEffect(() => {
    if (!socket || !roomId) return
    const handleSync = (state: RoomGameState) => {
      setRoomGame(state)
      if (state.status === 'idle' || state.status === 'finished') {
        setRoomSelections({})
        savedRoomMistakesRef.current.clear()
      }
    }
    socket.on('topik-game-sync', handleSync)
    socket.emit('topik-game-subscribe', { roomId })
    return () => {
      socket.off('topik-game-sync', handleSync)
    }
  }, [roomId, socket])

  const saveMistake = useCallback((question: TopikPracticeQuestion | RoomGameQuestion, optionIndex: number, source: TopikMistake['source']) => {
    if (typeof question.answerIndex !== 'number') return
    const added = addTopikMistake({
      source,
      questionId: question.id,
      level: question.level,
      category: question.category,
      errorType: question.errorType,
      prompt: question.prompt,
      userAnswer: question.options[optionIndex] || '',
      correctAnswer: question.options[question.answerIndex] || '',
      explanation: question.explanation,
    }, userId)
    setMistakes(prev => [added, ...prev.filter(item => !(item.questionId === question.id && item.source === source))])
  }, [userId])

  useEffect(() => {
    const question = roomGame?.question
    if (!question || typeof question.answerIndex !== 'number') return
    const selected = roomSelections[question.id]
    if (selected === undefined || selected === question.answerIndex) return
    const mistakeKey = `room-${question.id}-${roomGame.round}`
    if (savedRoomMistakesRef.current.has(mistakeKey)) return
    savedRoomMistakesRef.current.add(mistakeKey)
    saveMistake(question, selected, 'room-game')
  }, [roomGame, roomSelections, saveMistake])

  const startPractice = useCallback((patternId?: string) => {
    const session = pickQuestionSession(questionBank, level, patternId, 5, recentPracticeIdsRef.current)
    recentPracticeIdsRef.current = session.map(question => question.id)
    setPracticeQuestions(session)
    setPracticeIndex(0)
    setSelectedAnswer(null)
    setPracticeScore(0)
    setView('practice')
  }, [level, questionBank])

  const currentPracticeQuestion = practiceQuestions[practiceIndex]
  const isPracticeComplete = practiceQuestions.length > 0 && practiceIndex >= practiceQuestions.length

  const choosePracticeAnswer = (optionIndex: number) => {
    if (!currentPracticeQuestion || selectedAnswer !== null) return
    setSelectedAnswer(optionIndex)
    if (optionIndex === currentPracticeQuestion.answerIndex) {
      setPracticeScore(score => score + 1)
    } else {
      saveMistake(currentPracticeQuestion, optionIndex, 'quick-practice')
    }
  }

  const nextPracticeQuestion = () => {
    if (practiceIndex + 1 >= practiceQuestions.length) {
      setPracticeIndex(practiceQuestions.length)
      setSelectedAnswer(null)
      return
    }
    setPracticeIndex(index => index + 1)
    setSelectedAnswer(null)
  }

  const deleteMistake = (id: string) => {
    removeTopikMistake(id, userId)
    setMistakes(loadTopikMistakes())
  }

  const resetMistakes = () => {
    clearTopikMistakes(userId)
    setMistakes([])
  }

  const startRoomGame = (gameType: TopikRoomGameType) => {
    setRoomSelections({})
    savedRoomMistakesRef.current.clear()
    socket?.emit('topik-game-action', {
      roomId,
      type: 'start',
      payload: { gameType, totalRounds: ROOM_GAME_LABELS[gameType].rounds },
    })
  }

  const answerRoomGame = (optionIndex: number) => {
    const question = roomGame?.question
    if (!question || roomSelections[question.id] !== undefined) return
    setRoomSelections(prev => ({ ...prev, [question.id]: optionIndex }))
    socket?.emit('topik-game-action', {
      roomId,
      type: 'answer',
      payload: { optionIndex },
    })
  }

  const nextRoomRound = () => {
    socket?.emit('topik-game-action', { roomId, type: 'next' })
  }

  const resetRoomGame = () => {
    setRoomSelections({})
    savedRoomMistakesRef.current.clear()
    socket?.emit('topik-game-action', { roomId, type: 'reset' })
  }

  const groupedMistakes = useMemo(() => {
    return mistakes.reduce<Record<string, TopikMistake[]>>((acc, mistake) => {
      const label = ERROR_TYPE_LABELS[mistake.errorType]
      acc[label] = acc[label] || []
      acc[label].push(mistake)
      return acc
    }, {})
  }, [mistakes])

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-center gap-1 rounded-full bg-brand-light/60 p-1 w-fit mx-auto">
        {[
          { key: 'grammar' as const, label: 'Ngữ pháp', icon: BookOpen },
          { key: 'practice' as const, label: 'Luyện nhanh', icon: ListChecks },
          { key: 'mistakes' as const, label: `Sổ lỗi sai (${mistakes.length})`, icon: AlertCircle },
          { key: 'room-games' as const, label: 'Chơi game', icon: Gamepad2 },
          { key: 'ai-generator' as const, label: 'Tạo ngữ pháp', icon: BookOpen },
        ].map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black transition',
                view === item.key
                  ? 'bg-white text-brand-terracotta shadow-sm'
                  : 'text-brand-brown-light hover:text-brand-brown-dark'
              )}
            >
              <Icon size={15} />
              {item.label}
            </button>
          )
        })}
      </div>

      {(view === 'grammar' || view === 'practice') && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm font-bold text-brand-brown-light">TOPIK:</span>
          {levelOptions.map(nextLevel => (
            <button
              key={nextLevel}
              onClick={() => setLevel(nextLevel)}
              className={cx(
                'h-9 w-9 rounded-full border text-sm font-black transition',
                level === nextLevel
                  ? 'border-brand-terracotta bg-brand-terracotta text-white shadow-md'
                  : 'border-brand-terracotta-light/20 bg-white text-brand-brown-dark hover:bg-brand-light'
              )}
            >
              {nextLevel}
            </button>
          ))}
        </div>
      )}

      {view === 'grammar' && selectedPattern && (
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-brand-terracotta-light/20 bg-white/90 p-3 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-170px)]">
            <div className="mb-3 px-2 text-xs font-black uppercase text-brand-brown-light">Mẫu ngữ pháp TOPIK {level}</div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 custom-scrollbar lg:max-h-[calc(100vh-230px)]">
              {patterns.map(pattern => (
                <button
                  key={pattern.id}
                  onClick={() => setSelectedPatternId(pattern.id)}
                  className={cx(
                    'w-full rounded-2xl border p-3 text-left transition',
                    selectedPatternId === pattern.id
                      ? 'border-brand-terracotta bg-brand-terracotta/10'
                      : 'border-brand-terracotta-light/15 bg-white hover:bg-brand-light/50'
                  )}
                >
                  <div className="font-black text-brand-brown-dark">{pattern.title}</div>
                  <div className="mt-1 text-xs font-bold text-brand-brown-light">{pattern.formula}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-brand-terracotta-light/20 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="inline-flex rounded-full bg-brand-light px-3 py-1 text-xs font-black text-brand-terracotta">
                  TOPIK {selectedPattern.level}
                </div>
                <h3 className="mt-3 text-3xl font-black text-brand-brown-dark">{selectedPattern.title}</h3>
                <p className="mt-1 text-sm font-bold text-brand-brown-light">{selectedPattern.formula}</p>
              </div>
              <button
                onClick={() => startPractice(selectedPattern.id)}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600"
              >
                Luyện nhanh 5 câu
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-brand-light/60 p-4">
                <div className="text-xs font-black uppercase text-brand-brown-light">Nghĩa tiếng Việt</div>
                <p className="mt-2 text-base font-bold text-brand-brown-dark">{selectedPattern.meaningVi}</p>
                <p className="mt-1 text-sm text-brand-brown-light">{selectedPattern.meaningEn}</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-4">
                <div className="text-xs font-black uppercase text-red-500">Lỗi hay nhầm</div>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-red-700">{selectedPattern.commonMistake}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="text-xs font-black uppercase text-brand-brown-light">Ví dụ Hàn - Việt</div>
              {selectedPattern.examples.map(example => (
                <div key={example.ko} className="rounded-2xl border border-brand-terracotta-light/15 bg-white p-4">
                  <p className="text-lg font-black text-brand-brown-dark">{example.ko}</p>
                  <p className="mt-1 text-sm font-semibold text-brand-brown-light">{example.vi}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'practice' && (
        <div className="mx-auto max-w-2xl rounded-3xl border border-brand-terracotta-light/20 bg-white/95 p-5 shadow-sm">
          {practiceQuestions.length === 0 ? (
            <div className="py-8 text-center">
              <ListChecks size={38} className="mx-auto text-brand-terracotta/60" />
              <h3 className="mt-3 text-xl font-black text-brand-brown-dark">Luyện nhanh 5 câu</h3>
              <p className="mt-1 text-sm text-brand-brown-light">Chọn cấp độ hoặc một mẫu ngữ pháp, hệ thống sẽ chấm và lưu lỗi sai.</p>
              <button
                onClick={() => startPractice()}
                className="mt-5 rounded-2xl bg-brand-terracotta px-5 py-2.5 text-sm font-black text-white transition hover:bg-brand-brown-dark"
              >
                Bắt đầu luyện
              </button>
            </div>
          ) : isPracticeComplete ? (
            <div className="py-8 text-center">
              <Trophy size={44} className="mx-auto text-amber-500" />
              <h3 className="mt-3 text-2xl font-black text-brand-brown-dark">Hoàn thành</h3>
              <p className="mt-2 text-sm font-bold text-brand-brown-light">
                Điểm của bạn: {practiceScore}/{practiceQuestions.length}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button onClick={() => startPractice()} className="rounded-2xl bg-brand-terracotta px-4 py-2 text-sm font-black text-white">
                  Làm bộ khác
                </button>
                <button onClick={() => setView('mistakes')} className="rounded-2xl border border-brand-terracotta-light/30 bg-white px-4 py-2 text-sm font-black text-brand-brown-dark">
                  Xem lỗi sai
                </button>
              </div>
            </div>
          ) : currentPracticeQuestion ? (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase text-brand-brown-light">Câu {practiceIndex + 1}/{practiceQuestions.length}</div>
                  <div className="mt-1 text-sm font-bold text-emerald-600">Đúng {practiceScore}</div>
                </div>
                <button onClick={() => startPractice()} className="rounded-full p-2 text-brand-brown-light hover:bg-brand-light">
                  <RotateCcw size={17} />
                </button>
              </div>

              <QuestionBlock
                question={currentPracticeQuestion}
                selectedIndex={selectedAnswer}
                revealed={selectedAnswer !== null}
                onChoose={choosePracticeAnswer}
              />

              {selectedAnswer !== null && (
                <div className="mt-4 rounded-2xl bg-brand-light/70 p-4">
                  <div className="flex items-start gap-2">
                    {selectedAnswer === currentPracticeQuestion.answerIndex ? (
                      <CheckCircle2 size={18} className="mt-0.5 text-emerald-600" />
                    ) : (
                      <XCircle size={18} className="mt-0.5 text-red-500" />
                    )}
                    <p className="text-sm font-semibold text-brand-brown-dark">{currentPracticeQuestion.explanation}</p>
                  </div>
                  <button onClick={nextPracticeQuestion} className="mt-4 rounded-xl bg-brand-brown-dark px-4 py-2 text-sm font-black text-white">
                    Câu tiếp theo
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {view === 'mistakes' && (
        <div className="rounded-3xl border border-brand-terracotta-light/20 bg-white/95 p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-black text-brand-brown-dark">Sổ lỗi sai</h3>
              <p className="text-sm text-brand-brown-light">Tự gom lỗi theo dạng để ôn lại đúng điểm yếu.</p>
            </div>
            {mistakes.length > 0 && (
              <button onClick={resetMistakes} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-black text-red-600">
                <Trash2 size={15} />
                Xóa tất cả
              </button>
            )}
          </div>

          {mistakes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-brand-terracotta-light/30 py-12 text-center">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              <p className="mt-3 font-black text-brand-brown-dark">Chưa có lỗi sai nào</p>
              <p className="text-sm text-brand-brown-light">Khi chọn sai trong luyện nhanh hoặc game phòng, câu đó sẽ tự vào đây.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedMistakes).map(([group, items]) => (
                <section key={group}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-black text-brand-terracotta">{group}</span>
                    <span className="text-xs font-bold text-brand-brown-light">{items.length} câu</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {items.map(item => (
                      <div key={item.id} className="rounded-2xl border border-brand-terracotta-light/15 bg-white p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-black text-brand-brown-dark">{item.prompt}</p>
                          <button onClick={() => deleteMistake(item.id)} className="rounded-full p-1.5 text-brand-brown-light hover:bg-red-50 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-red-600">Bạn chọn: <b>{item.userAnswer}</b></p>
                        <p className="text-sm text-emerald-700">Đáp án đúng: <b>{item.correctAnswer}</b></p>
                        {item.wrongCount > 1 && (
                          <p className="mt-1 text-xs font-black text-amber-700">Đã sai {item.wrongCount} lần</p>
                        )}
                        <p className="mt-2 text-xs font-semibold leading-relaxed text-brand-brown-light">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'room-games' && (
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-brand-terracotta-light/20 bg-white/95 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Users size={18} className="text-brand-terracotta" />
              <h3 className="text-xl font-black text-brand-brown-dark">Game trong phòng</h3>
            </div>
            <div className="space-y-3">
              {(Object.keys(ROOM_GAME_LABELS) as TopikRoomGameType[]).map(gameType => (
                <button
                  key={gameType}
                  type="button"
                  onClick={() => startRoomGame(gameType)}
                  className="w-full cursor-pointer rounded-2xl border border-brand-terracotta-light/20 bg-white p-4 text-left transition hover:border-brand-terracotta hover:bg-brand-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-terracotta/35"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black text-brand-brown-dark">{ROOM_GAME_LABELS[gameType].title}</span>
                    <span className="rounded-full bg-brand-light px-2 py-1 text-[11px] font-black text-brand-terracotta">{ROOM_GAME_LABELS[gameType].rounds} vòng</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-brand-brown-light">{ROOM_GAME_LABELS[gameType].description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-brand-terracotta-light/20 bg-white/95 p-5 shadow-sm">
            {!roomGame || roomGame.status === 'idle' ? (
              <div className="flex min-h-[330px] flex-col items-center justify-center text-center">
                <Gamepad2 size={48} className="text-brand-terracotta/60" />
                <h3 className="mt-3 text-2xl font-black text-brand-brown-dark">Chọn một game để bắt đầu</h3>
                <p className="mt-1 max-w-md text-sm text-brand-brown-light">Câu hỏi, đáp án và bảng điểm sẽ đồng bộ realtime cho mọi người trong phòng.</p>
              </div>
            ) : (
              <RoomGameBoard
                state={roomGame}
                selectedIndex={roomGame.question ? roomSelections[roomGame.question.id] : undefined}
                onAnswer={answerRoomGame}
                onNext={nextRoomRound}
                onReset={resetRoomGame}
              />
            )}
          </div>
        </div>
      )}

      {view === 'ai-generator' && (
        <TopikGrammarGenerator
          existingTitles={grammarPatterns.map(pattern => pattern.title)}
        />
      )}
    </div>
  )
}

function QuestionBlock({
  question,
  selectedIndex,
  revealed,
  onChoose,
}: {
  question: RoomGameQuestion
  selectedIndex?: number | null
  revealed: boolean
  onChoose: (index: number) => void
}) {
  return (
    <div>
      <div className="rounded-3xl bg-brand-light/70 p-5">
        <div className="mb-2 text-xs font-black uppercase text-brand-brown-light">Câu hỏi</div>
        <p className="text-xl font-black leading-relaxed text-brand-brown-dark">{question.prompt}</p>
      </div>
      <div className="mt-4 grid gap-2">
        {question.options.map((option, index) => {
          const isRevealed = revealed && typeof question.answerIndex === 'number'
          const isCorrect = isRevealed && index === question.answerIndex
          const isWrong = isRevealed && selectedIndex === index && index !== question.answerIndex
          return (
            <button
              key={`${question.id}-${option}`}
              disabled={revealed}
              onClick={() => onChoose(index)}
              className={cx(
                'rounded-2xl border px-4 py-3 text-left text-sm font-black transition disabled:cursor-default',
                optionClass(selectedIndex === index, isCorrect, isWrong, isRevealed)
              )}
            >
              <span className="mr-2 text-brand-brown-light">{String.fromCharCode(65 + index)}.</span>
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RoomGameBoard({
  state,
  selectedIndex,
  onAnswer,
  onNext,
  onReset,
}: {
  state: RoomGameState
  selectedIndex?: number
  onAnswer: (index: number) => void
  onNext: () => void
  onReset: () => void
}) {
  const gameLabel = state.gameType ? ROOM_GAME_LABELS[state.gameType] : null
  const revealed = state.status === 'revealed' || state.status === 'finished'
  const question = state.question

  if (state.status === 'finished') {
    return (
      <div className="text-center">
        <Trophy size={52} className="mx-auto text-amber-500" />
        <h3 className="mt-3 text-3xl font-black text-brand-brown-dark">Kết thúc game</h3>
        <Leaderboard leaderboard={state.leaderboard} />
        <button onClick={onReset} className="mt-5 rounded-2xl bg-brand-terracotta px-5 py-2.5 text-sm font-black text-white">
          Chơi ván mới
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1 text-xs font-black text-brand-terracotta">
              <Timer size={13} />
              Vòng {state.round}/{state.totalRounds}
            </div>
            <h3 className="mt-2 text-2xl font-black text-brand-brown-dark">{gameLabel?.title || 'TOPIK Game'}</h3>
          </div>
          <button onClick={onReset} className="rounded-full border border-brand-terracotta-light/20 bg-white p-2 text-brand-brown-light hover:bg-brand-light">
            <RotateCcw size={17} />
          </button>
        </div>

        {question && (
          <>
            <QuestionBlock
              question={question}
              selectedIndex={selectedIndex}
              revealed={revealed}
              onChoose={onAnswer}
            />
            {selectedIndex !== undefined && !revealed && (
              <div className="mt-4 rounded-2xl bg-sky-50 p-3 text-sm font-bold text-sky-700">
                Đã gửi đáp án. Chờ mọi người hoặc hết giờ để hiện đáp án.
              </div>
            )}
            {revealed && typeof question.answerIndex === 'number' && (
              <div className="mt-4 rounded-2xl bg-brand-light/70 p-4">
                <p className="text-sm font-semibold text-brand-brown-dark">{question.explanation}</p>
                <button onClick={onNext} className="mt-4 rounded-xl bg-brand-brown-dark px-4 py-2 text-sm font-black text-white">
                  {state.round >= state.totalRounds ? 'Xem kết quả' : 'Câu tiếp theo'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Leaderboard leaderboard={state.leaderboard} />
    </div>
  )
}

function Leaderboard({ leaderboard }: { leaderboard: RoomGameState['leaderboard'] }) {
  return (
    <aside className="rounded-3xl bg-brand-light/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-brand-brown-dark">
        <Trophy size={16} className="text-amber-500" />
        Bảng xếp hạng
      </div>
      {leaderboard.length === 0 ? (
        <p className="text-sm text-brand-brown-light">Chưa có người chơi ghi điểm.</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((player, index) => (
            <div key={player.memberId} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-brand-brown-dark">
                  #{index + 1} {player.username}
                </p>
                <p className="text-xs font-bold text-brand-brown-light">{player.correct} câu đúng</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{player.score}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
