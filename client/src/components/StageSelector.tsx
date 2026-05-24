import { BookOpen, FileText, LayoutDashboard, Play, Table2 } from 'lucide-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import type { StageMode } from '../types'

type StageOption = {
  key: StageMode
  icon: ComponentType<{ size?: number }>
  label: string
  aspect?: string
}

type StageSelectorProps = {
  stageMode: StageMode
  onChange: (mode: StageMode) => void
}

export default function StageSelector({ stageMode, onChange }: StageSelectorProps) {
  const { t } = useTranslation()

  const stages: StageOption[] = [
    { key: 'youtube', icon: Play, label: t('room.stage.youtube'), aspect: '16:9' },
    { key: 'pdf', icon: FileText, label: t('room.stage.pdf'), aspect: 'A4' },
    { key: 'topik', icon: BookOpen, label: t('room.stage.topik') },
    { key: 'video', icon: Table2, label: 'Bàn học' },
    { key: 'ideas', icon: LayoutDashboard, label: 'Idea Board' },
  ]

  return (
    <div className="rounded-2xl border border-brand-terracotta-light/20 bg-white/75 p-2 shadow-sm">
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {stages.map(mode => {
          const Icon = mode.icon
          return (
            <button
              key={mode.key}
              onClick={() => onChange(mode.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer whitespace-nowrap ${
                stageMode === mode.key
                  ? 'bg-brand-terracotta text-white shadow-md'
                  : 'hover:bg-brand-light text-brand-brown-light'
              }`}
            >
              <Icon size={15} />
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
          )
        })}
      </div>
    </div>
  )
}
