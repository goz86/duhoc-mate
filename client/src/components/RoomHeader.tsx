import { Headphones, LogOut, Share2, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { StageMode } from '../types'
import LanguageSwitcher from './LanguageSwitcher'

type RoomHeaderProps = {
  roomId: string
  copied: boolean
  stageMode: StageMode
  onCopyRoomId: () => void
  onToggleAudioMode: () => void
  onLeaveRoom: () => void
}

export default function RoomHeader({
  roomId,
  copied,
  stageMode,
  onCopyRoomId,
  onToggleAudioMode,
  onLeaveRoom,
}: RoomHeaderProps) {
  const { t } = useTranslation()

  // Header stays for global room actions; video now lives as a first-class stage tab.
  return (
    <header className="px-6 py-4 border-b border-brand-terracotta-light/20 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-brand-terracotta animate-pulse" size={24} />
          <span className="font-display font-black text-xl">Duhoc Mate</span>
        </div>
        <div className="h-4 w-[1px] bg-brand-terracotta-light/40" />
        <div className="flex items-center gap-2 bg-brand-light px-4 py-2 rounded-full border border-brand-terracotta-light/20 text-sm font-bold">
          MÃ PHÒNG: <span className="text-brand-terracotta">{roomId}</span>
          <button onClick={onCopyRoomId} className="hover:text-brand-brown-dark ml-2 cursor-pointer">
            <Share2 size={16} />
          </button>
          {copied && <span className="text-sm text-green-600 font-semibold ml-1">{t('room.copied')}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAudioMode}
          title={stageMode === 'music' ? 'Quay về YouTube' : 'Bật Lo-Fi Radio Mode'}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-sm cursor-pointer transition border ${
            stageMode === 'music'
              ? 'bg-brand-terracotta text-white border-brand-terracotta shadow-md'
              : 'bg-brand-light hover:bg-brand-terracotta-light/40 border-brand-terracotta-light/20 text-brand-brown-dark'
          }`}
        >
          <Headphones size={16} />
          <span className="hidden md:inline">{stageMode === 'music' ? t('room.audioOnlyActive') : t('room.audioOnly')}</span>
        </button>

        <LanguageSwitcher compact />

        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-brand-light hover:bg-brand-terracotta-light/40 border border-brand-terracotta-light/20 text-brand-brown-dark font-bold text-sm transition cursor-pointer"
        >
          <LogOut size={16} />
          <span className="hidden md:inline">{t('room.leaveRoom')}</span>
        </button>
      </div>
    </header>
  )
}
