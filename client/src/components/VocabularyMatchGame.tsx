import { useEffect, useMemo, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { Gamepad2, Play, RotateCcw, Timer, Trophy, Users } from 'lucide-react'
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

type MatchScore = {
  memberId: string
  username: string
  score: number
  matches: number
  wrong: number
  fastestMs: number | null
  lastMatchedAt: number | null
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
  leaderboard: MatchScore[]
  lastResult: any
  wordBankSize: number
}

type VocabularyMatchGameProps = {
  roomId: string
  socket: Socket
  members: Member[]
}

const defaultState: MatchState = {
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
  wordBankSize: 0
}

const durationOptions = [10, 15, 20]

const formatMs = (value: number | null) => {
  if (!value) return '--'
  return `${(value / 1000).toFixed(1)}s`
}

export default function VocabularyMatchGame({ roomId, socket, members }: VocabularyMatchGameProps) {
  const [game, setGame] = useState<MatchState>(defaultState)
  const [selectedCard, setSelectedCard] = useState<MatchCard | null>(null)
  const [durationSec, setDurationSec] = useState(15)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const handleSync = (nextState: MatchState) => {
      setGame({ ...defaultState, ...nextState })
      setDurationSec(nextState.durationSec || 15)
    }

    socket.emit('vocab-match-subscribe', { roomId })
    socket.emit('vocab-match-action', { roomId, type: 'join' })
    socket.on('vocab-match-sync', handleSync)

    return () => {
      socket.off('vocab-match-sync', handleSync)
      socket.emit('vocab-match-action', { roomId, type: 'leave' })
    }
  }, [roomId, socket])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 300)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setSelectedCard(null)
  }, [game.round])

  const matchedPairSet = useMemo(() => new Set(game.matchedPairIds), [game.matchedPairIds])
  const playerIds = useMemo(() => new Set(game.players.map(player => player.memberId)), [game.players])
  const waitingMembers = useMemo(
    () => members.filter(member => playerIds.has(member.id)),
    [members, playerIds]
  )
  const remainingMs = game.status === 'playing' ? Math.max(0, game.roundEndsAt - now) : 0
  const remainingSec = Math.ceil(remainingMs / 1000)
  const progressPercent = game.durationSec > 0
    ? Math.max(0, Math.min(100, (remainingMs / (game.durationSec * 1000)) * 100))
    : 0
  const matchedCount = game.matchedPairIds.length
  const totalPairs = Math.max(1, Math.floor(game.cards.length / 2))
  const leader = game.leaderboard[0] || null
  const statusLabel = game.status === 'playing'
    ? `${remainingSec}s`
    : game.status === 'round-ended'
      ? 'Kết thúc'
      : 'Đang chờ'

  const emitAction = (type: string, payload: Record<string, unknown> = {}) => {
    socket.emit('vocab-match-action', { roomId, type, payload })
  }

  const handleCardClick = (card: MatchCard) => {
    if (game.status !== 'playing' || matchedPairSet.has(card.pairId)) return
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
    emitAction('match', { firstCardId: selectedCard.id, secondCardId: card.id })
    setSelectedCard(null)
  }

  const startGame = () => emitAction('start', { durationSec })
  const resetGame = () => emitAction('reset')

  return (
    <div className="flex min-h-[520px] w-full min-w-0 flex-1 flex-col gap-4 text-brand-brown-dark">
      <div className="flex flex-col gap-3 rounded-[28px] border border-brand-terracotta-light/20 bg-white/88 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-terracotta text-white shadow-lg shadow-brand-terracotta/20">
            <Gamepad2 size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-brand-terracotta">Ghép thẻ realtime</p>
            <h2 className="text-xl font-black leading-tight sm:text-2xl">Ghép từ vựng với nghĩa</h2>
            <p className="mt-1 text-xs font-semibold text-brand-brown-light">
              Dữ liệu lấy từ kho TOPIK, mỗi round random {totalPairs} cặp trong {game.wordBankSize || 52} từ. Hết giờ sẽ dừng để cả phòng xem kết quả.
            </p>
          </div>
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
            onClick={startGame}
            disabled={game.status === 'playing'}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-green-500 px-4 text-sm font-black text-white shadow-lg shadow-green-500/20 transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-300 disabled:shadow-none"
          >
            {game.status !== 'playing' && <Play size={15} />}
            {game.status === 'playing' ? 'Đang chơi' : game.status === 'idle' ? 'Bắt đầu' : 'Round mới'}
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="grid h-10 w-10 place-items-center rounded-full border border-brand-terracotta-light/25 bg-white text-brand-brown-light transition hover:text-brand-terracotta"
            aria-label="Reset game"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="flex min-w-0 flex-col rounded-[28px] border border-brand-terracotta-light/20 bg-white/86 p-3 shadow-sm sm:p-4">
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
              className="h-full rounded-full bg-green-500 transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

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
                        ? `${leader.username} đang dẫn đầu với ${leader.score} điểm và ${leader.matches} cặp đúng.`
                        : 'Chưa có cặp nào được ghép đúng trong round này.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startGame}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-terracotta px-4 text-sm font-black text-white shadow-md shadow-brand-terracotta/15 transition hover:bg-brand-brown-dark"
                >
                  <Play size={15} /> Chơi round tiếp
                </button>
              </div>
            </div>
          )}

          {game.status !== 'idle' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
              {game.cards.map(card => {
                const matched = matchedPairSet.has(card.pairId)
                const selected = selectedCard?.id === card.id
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleCardClick(card)}
                    disabled={matched || game.status !== 'playing'}
                    className={`group min-h-[104px] rounded-[22px] border p-3 text-center transition ${
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

        <aside className="flex min-w-0 flex-col gap-4">
          <div className="rounded-[28px] border border-brand-terracotta-light/20 bg-white/88 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-black">
                <Users size={16} className="text-brand-terracotta" /> Đang chờ
              </h3>
              <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-black text-brand-brown-light">
                {waitingMembers.length}
              </span>
            </div>
            <div className="space-y-2">
              {(waitingMembers.length ? waitingMembers : members.slice(0, 4)).map(member => (
                <div key={member.id} className="flex items-center gap-2 rounded-2xl bg-brand-light/45 px-3 py-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-brand-terracotta">
                    {(member.username || '?').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 truncate text-xs font-black">{member.username}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-brand-terracotta-light/20 bg-white/88 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-black">
                <Trophy size={16} className="text-amber-500" /> Bảng xếp hạng
              </h3>
              <span className="text-xs font-black text-brand-brown-light">Điểm</span>
            </div>
            <div className="space-y-2">
              {(game.leaderboard.length ? game.leaderboard : members.map(member => ({
                memberId: member.id,
                username: member.username,
                score: 0,
                matches: 0,
                wrong: 0,
                fastestMs: null,
                lastMatchedAt: null
              }))).slice(0, 8).map((score, index) => (
                <div key={score.memberId} className="rounded-2xl border border-brand-terracotta-light/14 bg-brand-light/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${
                        index === 0 ? 'bg-amber-400 text-white' : 'bg-white text-brand-brown-light'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="min-w-0 truncate text-sm font-black">{score.username}</span>
                    </div>
                    <span className="text-sm font-black text-brand-terracotta">{score.score}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-brand-brown-light">
                    <span>Đúng {score.matches}</span>
                    <span>Sai {score.wrong}</span>
                    <span>Nhanh {formatMs(score.fastestMs)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
