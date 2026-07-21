import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import {
  Brain,
  Gamepad2,
  Headphones,
  Layers3,
  Play,
  RotateCcw,
  Timer,
  Trophy,
  Users,
  Volume2,
  Zap,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  addTopikMistake,
  loadTopikMistakes,
  syncTopikMistakes,
  type TopikMistake,
} from '../lib/topikMistakes'
import type { TopikErrorType, TopikRoomGameType } from '../lib/topikGrammar'
import type { Member } from '../types'

type MatchCard = {
  id: string
  pairId: string
  type: 'ko' | 'vi'
  text: string
  level: number
  matchedBy?: string
  matchedByName?: string
}

type MatchPlayer = {
  memberId: string
  username: string
  ready: boolean
  joinedAt: number
}

type ArenaScore = {
  memberId: string
  username: string
  score: number
  matches?: number
  correct?: number
  wrong?: number
  games?: number
  fastestMs?: number | null
  lastMatchedAt?: number | null
}

type MatchState = {
  status: 'idle' | 'playing' | 'round-ended'
  round: number
  durationSec: number
  roundStartedAt: number
  roundEndsAt: number
  cards: MatchCard[]
  matchedPairIds: string[]
  players: MatchPlayer[]
  leaderboard: ArenaScore[]
  lastResult: any
  wordBankSize: number
}

type RoomGameQuestion = {
  id: string
  level: number
  gameType?: TopikRoomGameType
  category: 'grammar' | 'vocabulary' | 'reading' | 'sentence'
  errorType: TopikErrorType
  prompt: string
  options: string[]
  answerIndex?: number
  explanation: string
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

type ArenaMode = 'match' | 'topik-master'
type QuizSubMode = 'mixed' | 'grammar' | 'listening' | 'boss'
type LeaderboardPeriod = 'room' | 'week' | 'month'

type VocabularyMatchGameProps = {
  roomId: string
  socket: Socket
  members: Member[]
}

const defaultMatchState: MatchState = {
  status: 'idle',
  round: 0,
  durationSec: 15,
  roundStartedAt: 0,
  roundEndsAt: 0,
  cards: [],
  matchedPairIds: [],
  players: [],
  leaderboard: [],
  lastResult: null,
  wordBankSize: 0,
}

const defaultRoomGameState: RoomGameState = {
  status: 'idle',
  gameType: null,
  round: 0,
  totalRounds: 0,
  question: null,
  roundStartedAt: 0,
  leaderboard: [],
  answers: {},
}

const durationOptions = [10, 15, 20]

const QUIZ_SUB_MODES = [
  {
    id: 'mixed',
    title: 'TOPIK Master (Hỗn hợp)',
    subtitle: 'Trắc nghiệm tổng hợp Từ vựng & Ngữ pháp (10 câu)',
    Icon: Trophy,
    gameType: 'topik-master' as const,
    rounds: 10,
  },
  {
    id: 'grammar',
    title: 'Grammar Race (Ngữ pháp)',
    subtitle: 'Chọn mẫu ngữ pháp đúng thật nhanh (5 câu)',
    Icon: Zap,
    gameType: 'grammar-race' as const,
    rounds: 5,
  },
  {
    id: 'listening',
    title: 'Nghe nhanh chọn nghĩa',
    subtitle: 'Nghe từ phát âm và chọn nghĩa tiếng Việt (5 câu)',
    Icon: Headphones,
    gameType: 'vocab-speed' as const,
    rounds: 5,
  },
  {
    id: 'boss',
    title: 'Boss round (Thử thách)',
    subtitle: 'Thử thách 10 câu nâng cao tính thời gian tốc độ',
    Icon: Brain,
    gameType: 'topik-master' as const,
    rounds: 10,
  },
] as const

const ERROR_LABELS: Record<TopikErrorType, string> = {
  vocabulary: 'Sai từ vựng',
  grammar_connector: 'Sai ngữ pháp nối câu',
  honorific: 'Sai kính ngữ',
  reading: 'Sai đọc hiểu',
  similar_meaning: 'Nhầm nghĩa gần giống',
}

const formatMs = (value: number | null | undefined) => {
  if (!value) return '--'
  return `${(value / 1000).toFixed(1)}s`
}

const optionTone = (index: number, selectedIndex: number | undefined, answerIndex: number | undefined, revealed: boolean) => {
  if (revealed && index === answerIndex) return 'border-green-300 bg-green-50 text-green-800'
  if (revealed && selectedIndex === index && index !== answerIndex) return 'border-red-300 bg-red-50 text-red-700'
  if (selectedIndex === index) return 'border-brand-terracotta bg-brand-terracotta/10 text-brand-brown-dark'
  return 'border-brand-terracotta-light/20 bg-white text-brand-brown-dark hover:border-brand-terracotta/35 hover:bg-brand-light/50'
}

export default function VocabularyMatchGame({ roomId, socket, members }: VocabularyMatchGameProps) {
  const { user } = useAuth()
  const userId = user?.id || null
  const [activeMode, setActiveMode] = useState<ArenaMode>('match')
  const [quizSubMode, setQuizSubMode] = useState<QuizSubMode>('mixed')
  const [matchGame, setMatchGame] = useState<MatchState>(defaultMatchState)
  const [roomGame, setRoomGame] = useState<RoomGameState>(defaultRoomGameState)
  const [selectedCard, setSelectedCard] = useState<MatchCard | null>(null)
  const [durationSec, setDurationSec] = useState(15)
  const [now, setNow] = useState(Date.now())
  const [roomSelections, setRoomSelections] = useState<Record<string, number>>({})
  const [mistakes, setMistakes] = useState<TopikMistake[]>(() => loadTopikMistakes())
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('room')
  const [periodLeaderboards, setPeriodLeaderboards] = useState<Record<'week' | 'month', ArenaScore[]>>({
    week: [],
    month: [],
  })
  const savedRoomMistakesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    syncTopikMistakes(userId).then(next => {
      if (!cancelled) setMistakes(next)
    })
    return () => { cancelled = true }
  }, [userId])

  useEffect(() => {
    const handleMatchSync = (nextState: MatchState) => {
      setMatchGame({ ...defaultMatchState, ...nextState })
      setDurationSec(nextState.durationSec || 15)
    }
    const handleTopikSync = (nextState: RoomGameState) => {
      setRoomGame({ ...defaultRoomGameState, ...nextState })
      if (nextState.status !== 'idle' && nextState.gameType) {
        if (nextState.gameType === 'grammar-race') {
          setQuizSubMode('grammar')
        } else if (nextState.gameType === 'vocab-speed') {
          setQuizSubMode('listening')
        } else if (nextState.gameType === 'topik-master') {
          setQuizSubMode(prev => (prev === 'boss' ? 'boss' : 'mixed'))
        }
      }
    }
    const handleArenaLeaderboard = ({ period, leaderboard }: { period: 'week' | 'month'; leaderboard: ArenaScore[] }) => {
      setPeriodLeaderboards(prev => ({ ...prev, [period]: leaderboard || [] }))
    }

    socket.emit('vocab-match-subscribe', { roomId })
    socket.emit('vocab-match-action', { roomId, type: 'join' })
    socket.emit('topik-game-subscribe', { roomId })
    socket.on('vocab-match-sync', handleMatchSync)
    socket.on('topik-game-sync', handleTopikSync)
    socket.on('topik-arena-leaderboard-sync', handleArenaLeaderboard)

    return () => {
      socket.off('vocab-match-sync', handleMatchSync)
      socket.off('topik-game-sync', handleTopikSync)
      socket.off('topik-arena-leaderboard-sync', handleArenaLeaderboard)
      socket.emit('vocab-match-action', { roomId, type: 'leave' })
    }
  }, [roomId, socket])

  useEffect(() => {
    if (matchGame.status !== 'playing') {
      setNow(Date.now())
      return
    }
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(timer)
  }, [matchGame.status, matchGame.roundEndsAt])

  useEffect(() => {
    setSelectedCard(null)
  }, [matchGame.round])

  useEffect(() => {
    if (activeMode !== 'topik-master' || quizSubMode !== 'listening') return
    const question = roomGame.question
    if (!question || roomGame.status !== 'question') return
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(question.prompt)
    utterance.lang = 'ko-KR'
    utterance.rate = 0.88
    synth.speak(utterance)
    return () => synth.cancel()
  }, [activeMode, quizSubMode, roomGame.question?.id, roomGame.status])

  useEffect(() => {
    const question = roomGame.question
    if (!question || roomGame.status !== 'revealed' || typeof question.answerIndex !== 'number') return
    const selectedIndex = roomSelections[question.id]
    if (selectedIndex === undefined || selectedIndex === question.answerIndex) return
    const key = `${question.id}:${selectedIndex}`
    if (savedRoomMistakesRef.current.has(key)) return
    savedRoomMistakesRef.current.add(key)
    const nextMistake = addTopikMistake({
      source: 'room-game',
      questionId: question.id,
      level: question.level,
      category: question.category,
      errorType: question.errorType,
      prompt: question.prompt,
      userAnswer: question.options[selectedIndex] || '',
      correctAnswer: question.options[question.answerIndex] || '',
      explanation: question.explanation || '',
    }, userId)
    setMistakes(prev => [nextMistake, ...prev.filter(item => !(item.questionId === nextMistake.questionId && item.source === nextMistake.source))])
  }, [roomGame.status, roomGame.question, roomSelections, userId])

  const matchedPairSet = useMemo(() => new Set(matchGame.matchedPairIds), [matchGame.matchedPairIds])
  const playerIds = useMemo(() => new Set(matchGame.players.map(player => player.memberId)), [matchGame.players])
  const currentPlayerName = useMemo(() => {
    return members.find(member => member.id === socket.id)?.username
      || matchGame.players.find(player => player.memberId === socket.id)?.username
      || 'Bạn'
  }, [matchGame.players, members, socket.id])
  const waitingMembers = useMemo(
    () => members.filter(member => playerIds.has(member.id)),
    [members, playerIds]
  )
  const remainingMs = matchGame.status === 'playing' ? Math.max(0, matchGame.roundEndsAt - now) : 0
  const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000))
  const progressPercent = matchGame.durationSec > 0
    ? Math.max(0, Math.min(100, (remainingSec / matchGame.durationSec) * 100))
    : 0
  const matchedCount = matchGame.matchedPairIds.length
  const totalPairs = Math.max(1, Math.floor(matchGame.cards.length / 2))
  const matchLeader = matchGame.leaderboard[0] || null
  const matchStatusLabel = matchGame.status === 'playing'
    ? `${remainingSec}s`
    : matchGame.status === 'round-ended'
      ? 'Kết thúc'
      : 'Đang chờ'

  const activeSubModeMeta = useMemo(() => {
    if (roomGame.status !== 'idle' && roomGame.gameType) {
      if (roomGame.gameType === 'grammar-race') return QUIZ_SUB_MODES[1]
      if (roomGame.gameType === 'vocab-speed') return QUIZ_SUB_MODES[2]
      return quizSubMode === 'boss' ? QUIZ_SUB_MODES[3] : QUIZ_SUB_MODES[0]
    }
    return QUIZ_SUB_MODES.find(sub => sub.id === quizSubMode) || QUIZ_SUB_MODES[0]
  }, [roomGame.status, roomGame.gameType, quizSubMode])
  const roomLeaderboard = activeMode === 'match' ? matchGame.leaderboard : roomGame.leaderboard
  const visibleLeaderboard = leaderboardPeriod === 'room'
    ? roomLeaderboard
    : periodLeaderboards[leaderboardPeriod]
  const weaknessSummary = useMemo(() => {
    const counts = new Map<TopikErrorType, number>()
    for (const mistake of mistakes) {
      counts.set(mistake.errorType, (counts.get(mistake.errorType) || 0) + mistake.wrongCount)
    }
    return (Object.keys(ERROR_LABELS) as TopikErrorType[])
      .map(errorType => ({ errorType, label: ERROR_LABELS[errorType], count: counts.get(errorType) || 0 }))
      .sort((a, b) => b.count - a.count)
  }, [mistakes])
  const topWeakness = weaknessSummary.find(item => item.count > 0)

  const emitMatchAction = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    socket.emit('vocab-match-action', { roomId, type, payload })
  }, [roomId, socket])

  const handleCardClick = useCallback((card: MatchCard) => {
    if (matchGame.status !== 'playing' || matchedPairSet.has(card.pairId)) return
    if (!selectedCard) {
      setSelectedCard(card)
      return
    }
    if (selectedCard.id === card.id) {
      setSelectedCard(null)
      return
    }
    if (selectedCard.type === card.type) {
      setSelectedCard(card)
      return
    }
    if (selectedCard.pairId === card.pairId) {
      const pairId = card.pairId
      setMatchGame(prev => {
        if (prev.status !== 'playing' || prev.matchedPairIds.includes(pairId)) return prev
        return {
          ...prev,
          matchedPairIds: [...prev.matchedPairIds, pairId],
          cards: prev.cards.map(item => (
            item.pairId === pairId
              ? { ...item, matchedBy: socket.id, matchedByName: currentPlayerName }
              : item
          )),
          lastResult: {
            type: 'match',
            memberId: socket.id,
            username: currentPlayerName,
            pairId,
            optimistic: true,
          },
        }
      })
    }
    emitMatchAction('match', { firstCardId: selectedCard.id, secondCardId: card.id })
    setSelectedCard(null)
  }, [currentPlayerName, emitMatchAction, matchGame.status, matchedPairSet, selectedCard, socket.id])

  const startMatchGame = useCallback(() => emitMatchAction('start', { durationSec }), [durationSec, emitMatchAction])
  const resetMatchGame = useCallback(() => emitMatchAction('reset'), [emitMatchAction])

  const startQuizGame = useCallback((subMode: QuizSubMode) => {
    const meta = QUIZ_SUB_MODES.find(item => item.id === subMode)
    if (!meta?.gameType) return
    setRoomSelections({})
    savedRoomMistakesRef.current.clear()
    socket.emit('topik-game-action', {
      roomId,
      type: 'start',
      payload: { gameType: meta.gameType, totalRounds: meta.rounds },
    })
  }, [roomId, socket])

  const answerQuiz = useCallback((optionIndex: number) => {
    const question = roomGame.question
    if (!question || roomSelections[question.id] !== undefined || roomGame.status !== 'question') return
    setRoomSelections(prev => ({ ...prev, [question.id]: optionIndex }))
    socket.emit('topik-game-action', {
      roomId,
      type: 'answer',
      payload: { optionIndex },
    })
  }, [roomGame.question, roomGame.status, roomId, roomSelections, socket])

  const nextQuizRound = useCallback(() => {
    socket.emit('topik-game-action', { roomId, type: 'next' })
    if (leaderboardPeriod !== 'room') {
      socket.emit('topik-arena-leaderboard', { period: leaderboardPeriod })
    }
  }, [leaderboardPeriod, roomId, socket])

  const resetQuizGame = useCallback(() => {
    setRoomSelections({})
    savedRoomMistakesRef.current.clear()
    socket.emit('topik-game-action', { roomId, type: 'reset' })
  }, [roomId, socket])

  const handleLeaderboardPeriodChange = useCallback((period: LeaderboardPeriod) => {
    setLeaderboardPeriod(period)
    if (period !== 'room') socket.emit('topik-arena-leaderboard', { period })
  }, [socket])

  const startActiveQuizGame = useCallback(() => startQuizGame(quizSubMode), [quizSubMode, startQuizGame])

  return (
    <div className="flex min-h-[560px] w-full min-w-0 flex-1 flex-col gap-4 text-brand-brown-dark animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[24px] border border-brand-terracotta-light/15 bg-white/90 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-terracotta text-white shadow-md shadow-brand-terracotta/15">
            <Gamepad2 size={20} />
          </span>
          <div>
            <h2 className="text-lg font-black leading-tight sm:text-xl">TOPIK Arena</h2>
            <p className="text-[11px] font-bold text-brand-brown-light">Đấu trường ôn luyện tiếng Hàn</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-light/60 px-3 py-1 text-[11px] font-black text-brand-brown-dark shadow-sm">
            <Users size={12} className="text-brand-terracotta" /> {members.length} người học
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-light/60 px-3 py-1 text-[11px] font-black text-brand-brown-dark shadow-sm">
            <Brain size={12} className="text-brand-terracotta" /> {mistakes.length} lỗi sai
          </span>
        </div>
      </div>

      <div className="flex justify-center sm:justify-start">
        <div className="flex rounded-2xl bg-brand-light/65 p-1 w-full sm:w-80 shadow-sm border border-brand-terracotta-light/5">
          {[
            { id: 'match', label: 'Ghép thẻ', Icon: Layers3 },
            { id: 'topik-master', label: 'TOPIK Master', Icon: Trophy }
          ].map(tab => {
            const Icon = tab.Icon
            const active = activeMode === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id as ArenaMode)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-all cursor-pointer active:scale-95 ${
                  active
                    ? 'bg-brand-terracotta text-white shadow-sm'
                    : 'text-brand-brown-light hover:text-brand-brown-dark'
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0">
          {activeMode === 'match' ? (
            <MemoMatchArenaPanel
              game={matchGame}
              durationSec={durationSec}
              setDurationSec={setDurationSec}
              matchedPairSet={matchedPairSet}
              selectedCard={selectedCard}
              waitingMembers={waitingMembers}
              members={members}
              totalPairs={totalPairs}
              matchedCount={matchedCount}
              progressPercent={progressPercent}
              statusLabel={matchStatusLabel}
              leader={matchLeader}
              onCardClick={handleCardClick}
              onStart={startMatchGame}
              onReset={resetMatchGame}
            />
          ) : (
            <MemoQuizArenaPanel
              mode={activeSubModeMeta}
              state={roomGame}
              selectedIndex={roomGame.question ? roomSelections[roomGame.question.id] : undefined}
              onStart={startActiveQuizGame}
              onAnswer={answerQuiz}
              onNext={nextQuizRound}
              onReset={resetQuizGame}
              onSubModeChange={setQuizSubMode}
            />
          )}
        </main>

        <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-3 xl:self-start">
          <MemoLeaderboardPanel
            period={leaderboardPeriod}
            onPeriodChange={handleLeaderboardPeriodChange}
            leaderboard={visibleLeaderboard}
          />
          <MemoWeaknessPanel weaknessSummary={weaknessSummary} mistakes={mistakes} topWeakness={topWeakness} />
        </aside>
      </div>
    </div>
  )
}

function MatchArenaPanel({
  game,
  durationSec,
  setDurationSec,
  matchedPairSet,
  selectedCard,
  waitingMembers,
  members,
  totalPairs,
  matchedCount,
  progressPercent,
  statusLabel,
  leader,
  onCardClick,
  onStart,
  onReset,
}: {
  game: MatchState
  durationSec: number
  setDurationSec: (value: number) => void
  matchedPairSet: Set<string>
  selectedCard: MatchCard | null
  waitingMembers: Member[]
  members: Member[]
  totalPairs: number
  matchedCount: number
  progressPercent: number
  statusLabel: string
  leader: ArenaScore | null
  onCardClick: (card: MatchCard) => void
  onStart: () => void
  onReset: () => void
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-[28px] border border-brand-terracotta-light/20 bg-white/88 p-3 shadow-sm sm:p-4 xl:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black">Ghép thẻ từ vựng</h3>
          <p className="text-[11px] font-bold text-brand-brown-light">
            Ghép các cặp từ Hàn - Việt tương ứng thật nhanh trước khi hết giờ.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-brand-terracotta-light/20 bg-brand-light/45 p-1">
            {durationOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setDurationSec(option)}
                disabled={game.status === 'playing'}
                className={`h-9 rounded-full px-3 text-xs font-black transition ${
                  durationSec === option
                    ? 'bg-white text-brand-terracotta shadow-sm'
                    : 'text-brand-brown-light hover:bg-white/70'
                }`}
              >
                {option}s
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onStart}
            disabled={game.status === 'playing'}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-green-500 px-4 text-sm font-black text-white shadow-lg shadow-green-500/20 transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-300 disabled:shadow-none"
          >
            {game.status !== 'playing' && <Play size={15} />}
            {game.status === 'playing' ? 'Đang chơi' : game.status === 'idle' ? 'Bắt đầu' : 'Round mới'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="grid h-10 w-10 place-items-center rounded-full border border-brand-terracotta-light/25 bg-white text-brand-brown-light transition hover:text-brand-terracotta"
            aria-label="Reset game"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-700">
            <Timer size={13} /> {statusLabel}
          </span>
          <span className="inline-flex items-center rounded-full border border-brand-terracotta-light/25 bg-brand-light/45 px-3 py-1.5 text-xs font-black text-brand-brown-light">
            Round {game.round || 1}
          </span>
        </div>
        <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-700">
          {matchedCount}/{totalPairs} cặp đúng
        </span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-brand-terracotta-light/15">
        <div
          className={`h-full rounded-full bg-green-500 ${
            game.status === 'playing' && progressPercent < 100 ? 'transition-[width] duration-1000 ease-linear' : ''
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {game.status === 'playing' && game.lastResult?.type === 'match' && (
        <div className="mb-4 inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-black text-green-700 shadow-sm">
          <Trophy size={14} className="shrink-0" />
          <span className="truncate">{game.lastResult.username || 'Bạn học'} vừa ghép đúng</span>
        </div>
      )}

      {game.status === 'idle' && (
        <div className="grid flex-1 place-items-center rounded-[24px] border border-dashed border-brand-terracotta-light/35 bg-brand-light/25 px-5 py-12 text-center">
          <div className="max-w-md">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white text-brand-terracotta shadow-sm">
              <Users size={26} />
            </div>
            <h3 className="mt-4 text-xl font-black">Chờ mọi người vào game</h3>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-brand-brown-light">
              Người trong phòng bấm tab này sẽ vào danh sách chờ. Bấm bắt đầu để mở round đầu tiên.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {(waitingMembers.length ? waitingMembers : members.slice(0, 4)).map(member => (
                <span key={member.id} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-brand-brown-light shadow-sm">
                  {member.username}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {game.status === 'round-ended' && (
        <div className="mb-4 rounded-[24px] border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400 text-white shadow-md shadow-amber-400/20">
                <Trophy size={20} />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-black text-brand-brown-dark">Round {game.round || 1} đã kết thúc</h3>
                <p className="mt-0.5 text-xs font-bold text-brand-brown-light">
                  {leader
                    ? `${leader.username} đang dẫn đầu với ${leader.score} điểm và ${leader.matches || 0} cặp đúng.`
                    : 'Chưa có cặp nào được ghép đúng trong round này.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onStart}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-terracotta px-4 text-sm font-black text-white shadow-md shadow-brand-terracotta/15 transition hover:bg-brand-brown-dark"
            >
              <Play size={15} /> Chơi round tiếp
            </button>
          </div>
        </div>
      )}

      {game.status !== 'idle' && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">
          {game.cards.map(card => {
            const matched = matchedPairSet.has(card.pairId)
            const selected = selectedCard?.id === card.id
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onCardClick(card)}
                disabled={matched || game.status !== 'playing'}
                  className={`group min-h-[112px] rounded-[22px] border p-3 text-center transition ${
                  matched
                    ? 'border-green-200 bg-green-50/90 text-green-700'
                    : selected
                      ? 'border-brand-terracotta bg-brand-terracotta text-white shadow-lg shadow-brand-terracotta/18'
                      : 'border-brand-terracotta-light/20 bg-white text-brand-brown-dark shadow-sm hover:-translate-y-0.5 hover:border-brand-terracotta/35 hover:shadow-md'
                }`}
              >
                <span className={`mx-auto mb-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ${
                  matched
                    ? 'bg-green-100 text-green-700'
                    : selected
                      ? 'bg-white/20 text-white'
                      : card.type === 'ko'
                        ? 'bg-sky-50 text-sky-700'
                        : 'bg-amber-50 text-amber-700'
                }`}>
                  TOPIK {card.level}
                </span>
                <span className="block break-words text-base font-black leading-snug sm:text-lg">
                  {card.text}
                </span>
                {matched && (
                  <span className="mt-2 block truncate text-[11px] font-bold text-green-600">
                    {card.matchedByName || 'Đã ghép'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

function QuizArenaPanel({
  mode,
  state,
  selectedIndex,
  onStart,
  onAnswer,
  onNext,
  onReset,
  onSubModeChange,
}: {
  mode: (typeof QUIZ_SUB_MODES)[number]
  state: RoomGameState
  selectedIndex?: number
  onStart: () => void
  onAnswer: (index: number) => void
  onNext: () => void
  onReset: () => void
  onSubModeChange?: (subMode: QuizSubMode) => void
}) {
  const revealed = state.status === 'revealed' || state.status === 'finished'
  const question = state.question
  const isFinished = state.status === 'finished'

  if (state.status === 'idle' || !question) {
    return (
      <section className="flex flex-col justify-center min-h-[460px] rounded-[28px] border border-brand-terracotta-light/15 bg-white/88 p-5 text-center shadow-sm xl:min-h-[500px]">
        <div className="mx-auto w-full max-w-md text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-terracotta text-white shadow-md shadow-brand-terracotta/15">
            <Trophy size={24} />
          </span>
          <h3 className="mt-4 text-xl font-black">TOPIK Master Quiz</h3>
          
          <div className="mt-6 text-left">
            <span className="block text-[10px] font-black uppercase tracking-wider text-brand-brown-light mb-2">Chọn chế độ thi đấu</span>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {QUIZ_SUB_MODES.map(sub => {
                const Icon = sub.Icon
                const active = mode.id === sub.id
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onSubModeChange?.(sub.id as QuizSubMode)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                      active
                        ? 'border-brand-terracotta bg-brand-terracotta text-white shadow-sm'
                        : 'border-brand-terracotta-light/15 bg-white text-brand-brown-light hover:border-brand-terracotta/30'
                    }`}
                  >
                    <Icon size={12} />
                    <span>{sub.title}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-xs font-bold text-brand-brown-light text-center sm:text-left min-h-[32px] leading-relaxed">
              {mode.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-green-500 px-6 text-sm font-black text-white shadow-lg shadow-green-500/20 transition hover:bg-green-600 active:scale-95 cursor-pointer"
          >
            <Play size={16} /> Bắt đầu đấu
          </button>
        </div>
      </section>
    )
  }

  if (isFinished) {
    return (
      <section className="rounded-[28px] border border-brand-terracotta-light/15 bg-white/88 p-5 text-center shadow-sm xl:min-h-[500px]">
        <Trophy size={54} className="mx-auto text-amber-500" />
        <h3 className="mt-3 text-3xl font-black text-brand-brown-dark">Kết thúc trận</h3>
        <p className="mt-1 text-sm font-semibold text-brand-brown-light">Điểm đã được lưu vào bảng xếp hạng nếu Supabase đã bật.</p>
        <div className="mx-auto mt-5 max-w-md space-y-2">
          {state.leaderboard.map((player, index) => (
            <div key={player.memberId} className="flex items-center justify-between rounded-2xl bg-brand-light/60 px-4 py-3">
              <span className="text-sm font-black">#{index + 1} {player.username}</span>
              <span className="text-sm font-black text-brand-terracotta">{player.score} điểm</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onStart}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-brand-terracotta px-5 text-sm font-black text-white shadow-md shadow-brand-terracotta/15"
        >
          <Play size={16} /> Chơi lại mode này
        </button>
      </section>
    )
  }

  return (
    <section className="rounded-[24px] border border-brand-terracotta-light/15 bg-white/88 p-4 shadow-sm xl:min-h-[500px] xl:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-black text-brand-brown-dark">{mode.title}</h3>
          <p className="mt-1 text-[11px] font-bold text-brand-brown-light">
            Vòng {state.round}/{state.totalRounds} · Chế độ {mode.id === 'boss' ? 'Boss' : mode.id === 'grammar' ? 'Ngữ pháp' : mode.id === 'listening' ? 'Luyện nghe' : 'Hỗn hợp'}
          </p>
        </div>
        <div className="flex gap-2">
          {mode.id === 'listening' && (
            <button
              type="button"
              onClick={() => {
                if (!question) return
                const utterance = new SpeechSynthesisUtterance(question.prompt)
                utterance.lang = 'ko-KR'
                utterance.rate = 0.88
                window.speechSynthesis?.speak(utterance)
              }}
              className="grid h-10 w-10 place-items-center rounded-full border border-sky-200 bg-sky-50 text-sky-700"
              aria-label="Nghe lại"
            >
              <Volume2 size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="grid h-10 w-10 place-items-center rounded-full border border-brand-terracotta-light/25 bg-white text-brand-brown-light transition hover:text-brand-terracotta"
            aria-label="Reset game"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="rounded-[24px] bg-brand-light/65 p-4">
        <div className="mb-2 text-xs font-black text-brand-brown-light">Câu hỏi</div>
        <p className="text-xl font-black leading-relaxed text-brand-brown-dark">{question.prompt}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {question.options.map((option, index) => (
          <button
            key={`${question.id}-${option}`}
            type="button"
            disabled={revealed}
            onClick={() => onAnswer(index)}
            className={`min-h-[88px] rounded-2xl border px-4 py-4 text-left text-sm font-black transition disabled:cursor-default ${optionTone(index, selectedIndex, question.answerIndex, revealed)}`}
          >
            <span className="mr-2 text-brand-brown-light">{String.fromCharCode(65 + index)}.</span>
            {option}
          </button>
        ))}
      </div>

      {selectedIndex !== undefined && !revealed && (
        <div className="mt-4 rounded-2xl bg-sky-50 p-3 text-sm font-bold text-sky-700">
          Đã gửi đáp án. Chờ mọi người trả lời hoặc hết giờ để hiện kết quả.
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
    </section>
  )
}

function LeaderboardPanel({
  period,
  onPeriodChange,
  leaderboard,
}: {
  period: LeaderboardPeriod
  onPeriodChange: (period: LeaderboardPeriod) => void
  leaderboard: ArenaScore[]
}) {
  return (
    <div className="rounded-[28px] border border-brand-terracotta-light/20 bg-white/88 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-black">
          <Trophy size={16} className="text-amber-500" /> Xếp hạng Arena
        </h3>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-1 rounded-full bg-brand-light/50 p-1">
        {[
          { key: 'room', label: 'Phòng' },
          { key: 'week', label: 'Tuần' },
          { key: 'month', label: 'Tháng' },
        ].map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => onPeriodChange(item.key as LeaderboardPeriod)}
            className={`h-8 rounded-full text-xs font-black transition ${
              period === item.key ? 'bg-white text-brand-terracotta shadow-sm' : 'text-brand-brown-light'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {leaderboard.length === 0 ? (
          <p className="rounded-2xl bg-brand-light/35 p-3 text-xs font-bold text-brand-brown-light">
            Chưa có điểm. Chơi một trận để mở bảng xếp hạng.
          </p>
        ) : (
          leaderboard.slice(0, 8).map((score, index) => (
            <div key={`${score.memberId}-${index}`} className="rounded-2xl border border-brand-terracotta-light/14 bg-brand-light/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${
                    index === 0 ? 'bg-amber-400 text-white' : 'bg-white text-brand-brown-light'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="min-w-0 truncate text-sm font-black">{score.username}</span>
                </div>
                <span className="text-sm font-black text-brand-terracotta">{score.score || 0}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-brand-brown-light">
                <span>Đúng {score.correct || score.matches || 0}</span>
                <span>Sai {score.wrong || 0}</span>
                <span>{score.games ? `${score.games} trận` : `Nhanh ${formatMs(score.fastestMs)}`}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function WeaknessPanel({
  weaknessSummary,
  mistakes,
  topWeakness,
}: {
  weaknessSummary: Array<{ errorType: TopikErrorType; label: string; count: number }>
  mistakes: TopikMistake[]
  topWeakness?: { label: string; count: number }
}) {
  const maxCount = Math.max(1, ...weaknessSummary.map(item => item.count))
  return (
    <div className="rounded-[28px] border border-brand-terracotta-light/20 bg-white/88 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-black">
        <Brain size={16} className="text-brand-terracotta" /> Sổ lỗi sai thông minh
      </h3>
      <p className="mt-1 text-xs font-semibold text-brand-brown-light">
        {topWeakness ? `Điểm yếu nổi bật: ${topWeakness.label}.` : 'Chơi quiz để hệ thống bắt đầu gom lỗi sai.'}
      </p>
      <div className="mt-3 space-y-2">
        {weaknessSummary.map(item => (
          <div key={item.errorType}>
            <div className="mb-1 flex items-center justify-between text-[11px] font-black">
              <span className="text-brand-brown-light">{item.label}</span>
              <span className="text-brand-terracotta">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-light">
              <div
                className="h-full rounded-full bg-brand-terracotta"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
        Bài chữa lỗi 10 phút: {mistakes.length ? 'sẵn sàng tạo từ lỗi gần nhất.' : 'sẽ mở sau khi có lỗi sai đầu tiên.'}
      </div>
    </div>
  )
}

const MemoMatchArenaPanel = memo(MatchArenaPanel)
const MemoQuizArenaPanel = memo(QuizArenaPanel)
const MemoLeaderboardPanel = memo(LeaderboardPanel)
const MemoWeaknessPanel = memo(WeaknessPanel)

/*
function PetPanel({ level, xp, topWeakness }: { level: number; xp: number; topWeakness?: string }) {
  return (
    <div className="rounded-[28px] border border-brand-terracotta-light/20 bg-white/88 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-amber-100 to-rose-100 text-2xl shadow-inner">
          <Heart size={25} className="text-rose-500" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-black">Pet học tập Lv.{level}</h3>
          <p className="mt-0.5 text-xs font-semibold text-brand-brown-light">
            {topWeakness ? `Đang nhắc bạn ôn: ${topWeakness}` : 'Đang vui vì bạn học đều.'}
          </p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-light">
        <div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.max(8, Math.min(100, xp))}%` }} />
      </div>
    </div>
  )
}

function CommunityFlashcardPanel() {
  return (
    <div className="rounded-[28px] border border-brand-terracotta-light/20 bg-white/88 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-black">
        <BookOpen size={16} className="text-sky-600" /> Flashcard cộng đồng
      </h3>
      <div className="mt-3 grid gap-2 text-xs font-bold text-brand-brown-light">
        <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">Public bộ từ/ngữ pháp để mọi người save.</div>
        <div className="rounded-2xl bg-brand-light/45 p-3">Vote, fork và đề xuất vào kho TOPIK chính.</div>
        <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">Admin duyệt bộ tốt trước khi đưa vào kho chung.</div>
      </div>
    </div>
  )
}
*/
