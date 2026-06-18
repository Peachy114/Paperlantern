// components/ui/AddStickyModal.tsx
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { containsBadWord } from '@/lib/badWords'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (note: { type: 'text' | 'image'; text?: string; color?: string; imageFile?: File; imageMode?: 'photo' | 'sticker' }) => void
  imageCount: number
}

const COLORS = [
  '#fef08a', '#ffc6a6', '#ffbacf', '#86efac', '#c4b5fd', '#bae6fd', '#fca5a5',
]

export default function AddStickyModal({ open, onClose, onAdd, imageCount }: Props) {
  const [tab, setTab] = useState<'text' | 'image'>('text')
  const [text, setText] = useState('')
  const [color, setColor] = useState('#fef08a')
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageMode, setImageMode] = useState<'photo' | 'sticker'>('photo')
  const [error, setError] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)                          // store the File
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }


    const handleAdd = () => {
    if (tab === 'text' && !text.trim()) return
    if (tab === 'image' && !imageFile) return

    if (tab === 'text' && containsBadWord(text)) {
        setError('Your note contains inappropriate language. 🚫')
        return
    }

    setError('')
    onAdd(tab === 'text'
    ? { type: 'text', text: text.trim(), color }
    : { type: 'image', imageFile: imageFile ?? undefined, imageMode }
    )
    setText(''); setPreview(null); setColor('#fef08a'); setImageFile(null)
    onClose()
    }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm overflow-hidden bg-[#fffdf5] dark:bg-[#1c1a17] border-[2.5px] border-[#1a1a1a] dark:border-foreground/40"
            style={{ boxShadow: '5px 5px 0 #1a1a1a' }}
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#1a1a1a] px-5 py-4 flex items-center justify-between">
              <div>
                <h2
                  className="text-white leading-none tracking-[0.04em]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px' }}
                >
                  ADD STICKY
                </h2>
                <p className="text-white/40 mt-1 text-[11px]" style={{ fontFamily: "'Kalam', cursive" }}>
                  write a note or upload a sticker
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors text-[20px] leading-none cursor-pointer"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b-[2px] border-[#1a1a1a] dark:border-foreground/20">
              {(['text', 'image'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-[12px] tracking-[0.12em] transition-colors cursor-pointer ${
                    tab === t
                      ? 'bg-[#1a1a1a] text-white dark:bg-foreground dark:text-background'
                      : 'text-[#1a1a1a]/50 dark:text-foreground/50 hover:text-[#1a1a1a] dark:hover:text-foreground'
                  }`}
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}
                >
                  {t === 'text' ? '✏️ WRITE NOTE' : '🖼️ UPLOAD STICKER'}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === 'text' ? (
                <>
                  {/* Live preview */}
                  <div className="flex justify-center mb-4">
                    <div
                      className="px-4 py-3 w-40 min-h-[80px] text-[12px] leading-snug relative"
                      style={{
                        background: color,
                        fontFamily: "'Kalam', cursive",
                        color: '#1a1a1a',
                        transform: 'rotate(-1.5deg)',
                        boxShadow: '3px 3px 0 rgba(0,0,0,0.18)',
                      }}
                    >
                      {/* Tape */}
                      <div
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-5 opacity-50"
                        style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)' }}
                      />
                      {text || <span className="opacity-30">your note...</span>}
                    </div>
                  </div>

                  {/* Text input */}
                  <textarea
                    value={text}
                    onChange={e => { setText(e.target.value); setError('') }} 
                    maxLength={80}
                    rows={3}
                    placeholder="write your note..."
                    className="w-full px-3 py-2 text-[12px] border-[2px] border-[#1a1a1a]/20 dark:border-foreground/20 bg-transparent text-foreground placeholder:text-foreground/30 outline-none resize-none focus:border-amber-400 transition-colors"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  />
                  <div className="text-right text-[10px] text-foreground/30 mb-3" style={{ fontFamily: "'Kalam', cursive" }}>
                    {text.length}/80
                  </div>

                  {/* Color picker */}
                  <div className="mb-4">
                    <p className="text-[10px] tracking-[0.12em] text-foreground/40 mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      PICK A COLOR
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className="w-7 h-7 border-[2px] transition-transform cursor-pointer hover:scale-110"
                          style={{
                            background: c,
                            borderColor: color === c ? '#1a1a1a' : 'transparent',
                            boxShadow: color === c ? '2px 2px 0 #1a1a1a' : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                    <>
                        {/* Photo vs Sticker toggle */}
                        <div className="flex border-[2px] border-[#1a1a1a]/20 dark:border-foreground/20 mb-4">
                        <button
                            onClick={() => setImageMode('photo')}
                            className={`flex-1 py-1.5 text-xsmall tracking-[0.1em] transition-colors cursor-pointer ${
                            imageMode === 'photo'
                                ? 'bg-[#1a1a1a] text-white dark:bg-foreground dark:text-background'
                                : 'text-foreground/50 hover:text-foreground'
                            }`}
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            🖼️ PHOTO
                        </button>
                        <button
                            onClick={() => setImageMode('sticker')}
                            className={`flex-1 py-1.5 text-xsmall tracking-[0.1em] transition-colors cursor-pointer ${
                            imageMode === 'sticker'
                                ? 'bg-[#1a1a1a] text-white dark:bg-foreground dark:text-background'
                                : 'text-foreground/50 hover:text-foreground'
                            }`}
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            ✨ STICKER
                        </button>
                        </div>

                        {/* Mode description */}
                        <p className="text-xsmall text-foreground/40 mb-3" style={{ fontFamily: "'Kalam', cursive" }}>
                        {imageMode === 'photo'
                            ? 'shows with white background'
                            : 'transparent background (use PNG)'}
                        </p>

                        {imageCount >= 3 ? (
                        <div className="border-[2px] border-dashed border-red-300 flex flex-col items-center justify-center py-8 mb-4">
                            <span className="text-2xl mb-2">🚫</span>
                            <p className="text-xsmall text-red-400" style={{ fontFamily: "'Kalam', cursive" }}>
                            max 3 stickers reached
                            </p>
                            <p className="text-xsmall text-foreground/30 mt-1" style={{ fontFamily: "'Kalam', cursive" }}>
                            remove one to add more
                            </p>
                        </div>
                        ) : (
                        <>
                            <div
                            onClick={() => fileRef.current?.click()}
                            className="border-[2px] border-dashed border-[#1a1a1a]/30 dark:border-foreground/20 flex flex-col items-center justify-center py-8 mb-4 cursor-pointer hover:border-amber-400 transition-colors"
                            style={{ background: imageMode === 'photo' ? '#f9f9f9' : 'transparent' }}
                            >
                            {preview ? (
                                <img
                                src={preview}
                                alt="preview"
                                className="max-h-32 max-w-full object-contain"
                                style={{ background: imageMode === 'photo' ? 'white' : 'transparent' }}
                                />
                            ) : (
                                <>
                                <span className="text-3xl mb-2">{imageMode === 'photo' ? '🖼️' : '✨'}</span>
                                <p className="text-xsmall text-foreground/40" style={{ fontFamily: "'Kalam', cursive" }}>
                                    click to upload {imageMode === 'photo' ? 'image' : 'sticker (PNG)'}
                                </p>
                                <p className="text-xsmall text-foreground/25 mt-1" style={{ fontFamily: "'Kalam', cursive" }}>
                                    {imageCount}/3 used
                                </p>
                                </>
                            )}
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                            </div>
                            {preview && (
                            <button
                                onClick={() => { setPreview(null); setImageFile(null) }}
                                className="text-xsmall text-foreground/40 hover:text-foreground mb-4 underline cursor-pointer"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                remove image
                            </button>
                            )}
                        </>
                        )}
                    </>
                    )}
              
              {/* Error */}
            {error && (
            <p
                className="text-red-400 text-[11px] mb-3"
                style={{ fontFamily: "'Kalam', cursive" }}
            >
                {error}
            </p>
            )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 border-[2px] border-[#1a1a1a]/20 dark:border-foreground/20 text-foreground/50 hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer text-[12px]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleAdd}
                  disabled={(tab === 'text' && !text.trim()) || (tab === 'image' && !preview)}
                  className="flex-1 py-2 bg-[#1a1a1a] dark:bg-foreground text-white dark:text-background border-[2px] border-[#1a1a1a] dark:border-foreground disabled:opacity-30 hover:opacity-90 transition-opacity cursor-pointer text-[12px]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', boxShadow: '2px 2px 0 rgba(0,0,0,0.2)' }}
                >
                  PIN IT 📌
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}