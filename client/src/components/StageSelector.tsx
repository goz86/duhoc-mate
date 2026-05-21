import { useTranslation } from 'react-i18next'
import type { StageMode } from '../types'

type StageOption = {
  key: StageMode
  icon: string
  label: string
  aspect?: string
}

type StageSelectorProps = {
  stageMode: StageMode
  onChange: (mode: StageMode) => void
}

export default function StageSelector({ stageMode, onChange }: StageSelectorProps) {
  const { t } = useTranslation()

  // The selector is data-driven so adding a future room module only needs one option.
  const stages: StageOption[] = [
    { key: 'youtube', icon: '▶', label: t('room.stage.youtube'), aspect: '16:9' },
    { key: 'tiktok', icon: '♪', label: t('room.stage.tiktok'), aspect: '9:16' },
    { key: 'music', icon: '🎧', label: t('room.stage.music') },
    { key: 'pdf', icon: '📄', label: t('room.stage.pdf'), aspect: 'A4' },
    { key: 'pomodoro', icon: '⏱', label: t('room.stage.pomodoro') },
    { key: 'topik', icon: 'KR', label: t('room.stage.topik') },
    { key: 'video', icon: '◉', label: 'Bàn học' },
    { key: 'ideas', icon: '▦', label: 'Idea Board' },
  ]
  return (
    <div className="bg-white/70 p-2 rounded-2xl border border-brand-terracotta-light/20 shadow-sm">
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {stages.map(mode => (
          <button
            key={mode.key}
            onClick={() => onChange(mode.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer whitespace-nowrap ${
              stageMode === mode.key
                ? 'bg-brand-terracotta text-white shadow-md'
                : 'hover:bg-brand-light text-brand-brown-light'
            }`}
          >
            <span>{mode.icon}</span>
            <span className="hidden sm:inline">{mode.label}</span>
            {mode.aspect && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${
                stageMode === mode.key
                  ? 'bg-white/25 text-white'
                  : 'bg-brand-light/80 text-brand-brown-light/70'
              }`}>
                {mode.aspect}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
