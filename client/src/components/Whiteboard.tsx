import { useEffect, useRef, useState, useCallback } from 'react'
import type { Socket } from 'socket.io-client'
import { Pencil, Eraser, Trash2, ImagePlus, Brush } from 'lucide-react'

// ── Kiểu dữ liệu (toạ độ chuẩn hoá 0..1 để đồng bộ mọi kích thước màn) ──
type Point = { x: number; y: number }
type StrokeEl = {
  id: string
  type: 'stroke'
  tool: 'pen' | 'eraser'
  color: string
  size: number // chuẩn hoá theo chiều rộng canvas (0..1)
  points: Point[]
  by?: string
}
type ImageEl = {
  id: string
  type: 'image'
  src: string
  x: number // tâm ảnh, chuẩn hoá
  y: number
  w: number // chuẩn hoá theo width
  h: number // chuẩn hoá theo height
  by?: string
}
type WBElement = StrokeEl | ImageEl

interface Props {
  socket: Socket | null
  roomId: string
  initialElements?: WBElement[]
}

const PALETTE = ['#4A3E3D', '#A77A6C', '#E5A893', '#E11D48', '#2563EB', '#16A34A', '#F59E0B', '#111827']
const SIZES = [3, 6, 12, 22]
const MAX_SYNC_IMAGE_BYTES = 2_500_000

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `wb-${Date.now()}-${Math.random().toString(36).slice(2)}`

export default function Whiteboard({ socket, roomId, initialElements }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const elementsRef = useRef<WBElement[]>(initialElements ? [...initialElements] : [])
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map())
  const sizeRef = useRef({ w: 0, h: 0 })
  const dirtyRef = useRef(true)
  const drawingRef = useRef<{ stroke: StrokeEl | null; last: Point | null; buffer: Point[] }>({
    stroke: null,
    last: null,
    buffer: [],
  })

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [color, setColor] = useState(PALETTE[0])
  const [sizePx, setSizePx] = useState(6)
  const [isEmpty, setIsEmpty] = useState((initialElements?.length ?? 0) === 0)

  // refs để dùng trong event handler không bị stale
  const toolRef = useRef(tool); toolRef.current = tool
  const colorRef = useRef(color); colorRef.current = color
  const sizepxRef = useRef(sizePx); sizepxRef.current = sizePx

  const markDirty = useCallback(() => { dirtyRef.current = true }, [])
  const refreshEmpty = useCallback(() => setIsEmpty(elementsRef.current.length === 0), [])

  // ── Vẽ lại toàn bộ ─────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { w, h } = sizeRef.current
    ctx.clearRect(0, 0, w, h)

    for (const el of elementsRef.current) {
      if (el.type === 'image') {
        const img = imgCache.current.get(el.id)
        if (img && img.complete && img.naturalWidth) {
          const dw = el.w * w, dh = el.h * h
          ctx.drawImage(img, el.x * w - dw / 2, el.y * h - dh / 2, dw, dh)
        }
        continue
      }
      // stroke
      if (el.points.length === 0) continue
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = Math.max(0.5, el.size * w)
      if (el.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.strokeStyle = 'rgba(0,0,0,1)'
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = el.color
      }
      ctx.beginPath()
      const p0 = el.points[0]
      ctx.moveTo(p0.x * w, p0.y * h)
      if (el.points.length === 1) {
        // chấm tròn
        ctx.lineTo(p0.x * w + 0.01, p0.y * h)
      } else {
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x * w, el.points[i].y * h)
        }
      }
      ctx.stroke()
      ctx.restore()
    }
  }, [])

  // rAF loop
  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (dirtyRef.current) {
        dirtyRef.current = false
        redraw()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [redraw])

  // ── Resize (DPR-aware) ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const apply = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.floor(rect.width))
      const h = Math.max(1, Math.floor(rect.height))
      sizeRef.current = { w, h }
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      const ctx = canvas.getContext('2d')
      if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr) }
      markDirty()
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [markDirty])

  // ── Tải ảnh vào cache ──────────────────────────────────────────
  const loadImage = useCallback((el: ImageEl) => {
    if (imgCache.current.has(el.id)) return
    const img = new Image()
    img.onload = () => markDirty()
    img.src = el.src
    imgCache.current.set(el.id, img)
  }, [markDirty])

  // nạp ảnh từ initialElements
  useEffect(() => {
    for (const el of elementsRef.current) if (el.type === 'image') loadImage(el)
    markDirty()
  }, [loadImage, markDirty])

  // ── Lấy toạ độ chuẩn hoá từ pointer event ──────────────────────
  const getPoint = (e: PointerEvent | React.PointerEvent): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }
  }

  // ── Pointer handlers ───────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    const pt = getPoint(e)
    const { w } = sizeRef.current
    const stroke: StrokeEl = {
      id: uid(),
      type: 'stroke',
      tool: toolRef.current,
      color: colorRef.current,
      size: (sizepxRef.current || 6) / (w || 1),
      points: [pt],
    }
    drawingRef.current = { stroke, last: pt, buffer: [pt] }
    elementsRef.current.push(stroke)
    setIsEmpty(false)
    markDirty()
    socket?.emit('whiteboard-stroke-start', {
      roomId,
      stroke: { id: stroke.id, tool: stroke.tool, color: stroke.color, size: stroke.size, points: [pt] },
    })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drawingRef.current
    if (!d.stroke) return
    const pt = getPoint(e)
    if (d.last) {
      const dx = pt.x - d.last.x, dy = pt.y - d.last.y
      if (dx * dx + dy * dy < 0.000004) return // bỏ điểm quá gần (~0.2% canvas)
    }
    d.stroke.points.push(pt)
    d.buffer.push(pt)
    d.last = pt
    markDirty()
  }

  const flushBuffer = useCallback(() => {
    const d = drawingRef.current
    if (d.stroke && d.buffer.length) {
      socket?.emit('whiteboard-stroke-point', { roomId, strokeId: d.stroke.id, points: d.buffer })
      d.buffer = []
    }
  }, [socket, roomId])

  // gửi điểm theo lô mỗi 45ms
  useEffect(() => {
    const t = setInterval(flushBuffer, 45)
    return () => clearInterval(t)
  }, [flushBuffer])

  const endStroke = () => {
    flushBuffer()
    drawingRef.current = { stroke: null, last: null, buffer: [] }
  }

  // ── Thêm ảnh (paste / upload) ──────────────────────────────────
  const addImageFromSrc = useCallback((src: string, natW: number, natH: number) => {
    const { w, h } = sizeRef.current
    const targetWnorm = 0.4 // hiển thị ~40% bề ngang
    // giữ tỉ lệ ảnh trên màn người thêm
    const dispWpx = targetWnorm * w
    const dispHpx = dispWpx * (natH / natW)
    const el: ImageEl = {
      id: uid(),
      type: 'image',
      src,
      x: 0.5,
      y: 0.5,
      w: targetWnorm,
      h: h ? dispHpx / h : 0.3,
    }
    elementsRef.current.push(el)
    loadImage(el)
    setIsEmpty(false)
    markDirty()
    socket?.emit('whiteboard-image', { roomId, image: el })
  }, [loadImage, markDirty, socket, roomId])

  // downscale ảnh trước khi gửi
  const processImageBlob = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const MAX = 1100
      let { naturalWidth: nw, naturalHeight: nh } = img
      const scale = Math.min(1, MAX / Math.max(nw, nh))
      const ow = Math.round(nw * scale), oh = Math.round(nh * scale)
      const off = document.createElement('canvas')
      off.width = ow; off.height = oh
      const octx = off.getContext('2d')
      if (octx) {
        octx.drawImage(img, 0, 0, ow, oh)
        let dataUrl = off.toDataURL('image/jpeg', 0.82)
        let quality = 0.72
        while (dataUrl.length > MAX_SYNC_IMAGE_BYTES && quality >= 0.45) {
          dataUrl = off.toDataURL('image/jpeg', quality)
          quality -= 0.1
        }
        if (dataUrl.length <= MAX_SYNC_IMAGE_BYTES) {
          addImageFromSrc(dataUrl, ow, oh)
        } else {
          window.alert('Ảnh này quá lớn để đồng bộ trong phòng. Hãy chọn ảnh nhỏ hơn hoặc chụp/crop lại.')
        }
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [addImageFromSrc])

  const onUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) processImageBlob(file)
    e.target.value = ''
  }

  // dán ảnh từ clipboard khi đang ở tab vẽ
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const it of items) {
        if (it.type.startsWith('image/')) {
          const blob = it.getAsFile()
          if (blob) { e.preventDefault(); processImageBlob(blob) }
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [processImageBlob])

  // ── Xoá toàn bộ ────────────────────────────────────────────────
  const clearAll = () => {
    elementsRef.current = []
    imgCache.current.clear()
    setIsEmpty(true)
    markDirty()
    socket?.emit('whiteboard-clear', { roomId })
  }

  // ── Socket listeners (nét/ảnh/xoá từ người khác) ───────────────
  useEffect(() => {
    if (!socket) return
    const onStart = ({ stroke }: { stroke: StrokeEl }) => {
      if (!stroke?.id) return
      if (elementsRef.current.some(e => e.id === stroke.id)) return
      elementsRef.current.push({ ...stroke, type: 'stroke', points: [...(stroke.points || [])] })
      refreshEmpty(); markDirty()
    }
    const onPoint = ({ strokeId, points }: { strokeId: string; points: Point[] }) => {
      const el = elementsRef.current.find(e => e.id === strokeId)
      if (el && el.type === 'stroke' && Array.isArray(points)) {
        el.points.push(...points)
        markDirty()
      }
    }
    const onImage = ({ image }: { image: ImageEl }) => {
      if (!image?.id || elementsRef.current.some(e => e.id === image.id)) return
      elementsRef.current.push({ ...image, type: 'image' })
      loadImage(image); refreshEmpty(); markDirty()
    }
    const onClear = () => {
      elementsRef.current = []; imgCache.current.clear(); setIsEmpty(true); markDirty()
    }
    // Trạng thái đầy đủ khi mở tab (bắt kịp nét vẽ lúc ở tab khác)
    const onState = ({ elements }: { elements: WBElement[] }) => {
      if (!Array.isArray(elements)) return
      // không ghi đè nếu đang vẽ dở
      if (drawingRef.current.stroke) return
      elementsRef.current = elements.map(e => e.type === 'stroke' ? { ...e, points: [...e.points] } : { ...e })
      imgCache.current.clear()
      for (const el of elementsRef.current) if (el.type === 'image') loadImage(el)
      refreshEmpty(); markDirty()
    }
    const onImageError = ({ message }: { message?: string }) => {
      window.alert(message || 'Không thể đồng bộ ảnh này trong phòng.')
    }
    socket.on('whiteboard-stroke-start', onStart)
    socket.on('whiteboard-stroke-point', onPoint)
    socket.on('whiteboard-image', onImage)
    socket.on('whiteboard-clear', onClear)
    socket.on('whiteboard-state', onState)
    socket.on('whiteboard-image-error', onImageError)
    // yêu cầu trạng thái mới nhất ngay khi mở tab Vẽ
    socket.emit('whiteboard-request', { roomId })
    return () => {
      socket.off('whiteboard-stroke-start', onStart)
      socket.off('whiteboard-stroke-point', onPoint)
      socket.off('whiteboard-image', onImage)
      socket.off('whiteboard-clear', onClear)
      socket.off('whiteboard-state', onState)
      socket.off('whiteboard-image-error', onImageError)
    }
  }, [socket, roomId, loadImage, markDirty, refreshEmpty])

  // ── UI ─────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col gap-2.5 h-full min-h-0">
      {/* Thanh công cụ */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand-terracotta-light/20 bg-white/70 p-2 shadow-sm">
        {/* Bút / Tẩy */}
        <div className="flex items-center gap-1 rounded-xl bg-brand-light/70 p-1">
          <button
            onClick={() => setTool('pen')}
            title="Bút"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${tool === 'pen' ? 'bg-brand-terracotta text-white shadow' : 'text-brand-brown-light hover:bg-white'}`}
          >
            <Pencil size={15} /> <span className="hidden sm:inline">Bút</span>
          </button>
          <button
            onClick={() => setTool('eraser')}
            title="Tẩy"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${tool === 'eraser' ? 'bg-brand-terracotta text-white shadow' : 'text-brand-brown-light hover:bg-white'}`}
          >
            <Eraser size={15} /> <span className="hidden sm:inline">Tẩy</span>
          </button>
        </div>

        {/* Bảng màu */}
        <div className="flex items-center gap-1">
          {PALETTE.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pen') }}
              title={c}
              className={`h-6 w-6 rounded-full border transition hover:scale-110 ${color === c && tool === 'pen' ? 'border-brand-brown-dark ring-2 ring-brand-terracotta/40' : 'border-black/10'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Cỡ nét */}
        <div className="flex items-center gap-1 rounded-xl bg-brand-light/70 px-2 py-1">
          <Brush size={14} className="text-brand-brown-light" />
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => setSizePx(s)}
              title={`Cỡ ${s}`}
              className={`flex h-6 w-6 items-center justify-center rounded-full transition ${sizePx === s ? 'bg-brand-terracotta' : 'hover:bg-white'}`}
            >
              <span className="rounded-full" style={{ width: Math.min(18, s), height: Math.min(18, s), backgroundColor: sizePx === s ? '#fff' : '#9a8a84' }} />
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Thêm ảnh */}
          <button
            onClick={() => fileRef.current?.click()}
            title="Thêm ảnh (hoặc Ctrl+V để dán)"
            className="flex items-center gap-1.5 rounded-xl border border-brand-terracotta-light/30 bg-white px-2.5 py-1.5 text-xs font-bold text-brand-brown-dark transition hover:bg-brand-light"
          >
            <ImagePlus size={15} /> <span className="hidden sm:inline">Ảnh</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onUploadFile} className="hidden" />
          {/* Xoá tất cả */}
          <button
            onClick={clearAll}
            title="Xoá toàn bộ bảng"
            className="flex items-center gap-1.5 rounded-xl bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
          >
            <Trash2 size={15} /> <span className="hidden sm:inline">Xoá hết</span>
          </button>
        </div>
      </div>

      {/* Vùng vẽ */}
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-2xl border border-brand-terracotta-light/25 bg-white shadow-inner"
        style={{ height: 'calc(100vh - 300px)', minHeight: '380px' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
          className="absolute inset-0 touch-none"
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
        />
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-terracotta/10 border-2 border-brand-terracotta/20">
              <Pencil size={24} className="text-brand-terracotta/60" />
            </div>
            <p className="text-sm font-extrabold text-brand-brown-dark">Bảng vẽ chung của phòng</p>
            <p className="max-w-xs text-xs text-brand-brown-light">
              Vẽ bằng bút, tẩy, dán ảnh (Ctrl+V) — mọi người trong phòng đều thấy real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
