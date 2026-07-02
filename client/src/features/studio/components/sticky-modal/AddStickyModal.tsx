// components/ui/AddStickyModal.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { useAddSticky, type StickyNotePayload } from '../../hooks/useAddSticky'
import AddStickyTextTab from './AddStickyTextTab'
import AddStickyImageTab from './AddStickyImageTab'

interface Props {
    open: boolean
    onClose: () => void
    onAdd: (note: StickyNotePayload) => void
    imageCount: number
}

export default function AddStickyModal({ open, onClose, onAdd, imageCount }: Props) {
    const {
        tab,
        setTab,
        text,
        setText,
        color,
        setColor,
        preview,
        fileRef,
        imageMode,
        setImageMode,
        error,
        setError,
        handleFile,
        removeImage,
        handleAdd,
        canSubmit,
    } = useAddSticky(onAdd, onClose)

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
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-[#1a1a1a] px-5 py-4 flex items-center justify-between">
                            <div>
                                <h2
                                    className="text-white leading-none tracking-[0.04em]"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        fontSize: '22px',
                                    }}
                                >
                                    ADD STICKY
                                </h2>
                                <p
                                    className="text-white/40 mt-1 text-[11px]"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
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
                            {(['text', 'image'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`flex-1 py-2.5 text-[12px] tracking-[0.12em] transition-colors cursor-pointer ${
                                        tab === t
                                            ? 'bg-[#1a1a1a] text-white dark:bg-foreground dark:text-background'
                                            : 'text-[#1a1a1a]/50 dark:text-foreground/50 hover:text-[#1a1a1a] dark:hover:text-foreground'
                                    }`}
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        letterSpacing: '0.12em',
                                    }}
                                >
                                    {t === 'text' ? '✏️ WRITE NOTE' : '🖼️ UPLOAD STICKER'}
                                </button>
                            ))}
                        </div>

                        <div className="p-5">
                            {tab === 'text' ? (
                                <AddStickyTextTab
                                    text={text}
                                    onTextChange={(v) => {
                                        setText(v)
                                        setError('')
                                    }}
                                    color={color}
                                    onColorChange={setColor}
                                />
                            ) : (
                                <AddStickyImageTab
                                    imageMode={imageMode}
                                    onImageModeChange={setImageMode}
                                    imageCount={imageCount}
                                    preview={preview}
                                    fileRef={fileRef}
                                    onFile={handleFile}
                                    onRemove={removeImage}
                                />
                            )}

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
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        letterSpacing: '0.1em',
                                    }}
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleAdd}
                                    disabled={!canSubmit}
                                    className="flex-1 py-2 bg-[#1a1a1a] dark:bg-foreground text-white dark:text-background border-[2px] border-[#1a1a1a] dark:border-foreground disabled:opacity-30 hover:opacity-90 transition-opacity cursor-pointer text-[12px]"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        letterSpacing: '0.1em',
                                        boxShadow: '2px 2px 0 rgba(0,0,0,0.2)',
                                    }}
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
