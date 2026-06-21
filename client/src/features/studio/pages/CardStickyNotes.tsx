import { useState } from 'react'
import AddStickyModal from '../components/AddStickyModal'
import { motion, AnimatePresence } from 'framer-motion'
import { useStickyBoard } from '@/features/studio/hooks/useStickyBoard'
import { useMyViolations } from '@/features/studio/hooks/useMyViolations'

const ANNOUNCEMENT = {
    title: 'Welcome to your board!',
    lines: [
        'pin notes, reminders, and stickers here.',
        'click + to add your first sticky!',
        'cover and banner - digital art only.',
        'NO A.I',
        '— Later N Comix Team 🏮',
    ],
}

const targetLabel = (type: string) =>
    type.includes('Chapter') ? 'chapter' : type.includes('Work') ? 'work' : 'sticky note'

export default function CardStickyNotes() {
    const [modalOpen, setModalOpen] = useState(false)
    const {
        notes,
        loading,
        dragging,
        boardRef,
        displayedNotes,
        handleAdd,
        handleRemove,
        onMouseDown,
        onTouchStart,
    } = useStickyBoard()
    const { violations } = useMyViolations()

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Bebas+Neue&display=swap"
                rel="stylesheet"
            />

            <div
                className="relative border-[2.5px] mb-5 border-[#1a1a1a] dark:border-foreground/40 bg-[#faf8ee] dark:bg-[#191713] overflow-hidden"
                style={{ boxShadow: '4px 4px 0 #1a1a1a', minHeight: '260px' }}
            >
                {/* Cork board texture */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, rgba(139,115,85,0.5) 1px, transparent 1px)',
                        backgroundSize: '12px 12px',
                    }}
                />

                {/* Header */}
                <div className="relative border-b-[2px] border-[#1a1a1a] dark:border-foreground/30 px-3 py-2 bg-[#1a1a1a] flex items-center justify-between z-20">
                    <span
                        className="text-white tracking-[0.18em] text-[12px] sm:text-normal"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        ◆ NOTES TO SELF
                    </span>
                    <div className="flex items-center gap-3">
                        <span
                            className="text-white/30 text-[10px]"
                            style={{ fontFamily: "'Kalam', cursive" }}
                        >
                            {notes.length} pinned
                        </span>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="w-6 h-6 flex items-center justify-center border-[2px] border-white/30 text-white hover:border-white hover:bg-white/10 transition-colors cursor-pointer text-[16px] leading-none"
                            style={{ fontFamily: "'Kalam', cursive" }}
                            title="Add sticky"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Board */}
                <div
                    ref={boardRef}
                    className="relative w-full"
                    style={{
                        minHeight: '300px',
                        cursor: dragging !== null ? 'grabbing' : 'default',
                        userSelect: dragging !== null ? 'none' : 'auto',
                    }}
                >
                    {/* Announcement / Violation paper */}
                    <div
                        className="absolute"
                        style={{ left: '10px', top: '10px', transform: 'rotate(-1deg)', zIndex: 1 }}
                    >
                        <div className="relative w-52">
                            <div
                                className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full z-10"
                                style={{
                                    background: violations.length > 0 ? '#f87171' : '#4ade80',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                }}
                            />
                            <div
                                className="relative overflow-hidden pt-6 pb-3 px-3"
                                style={{
                                    background: violations.length > 0 ? '#fff5f5' : '#fffef0',
                                    boxShadow: '2px 4px 0 rgba(0,0,0,0.15)',
                                    border:
                                        violations.length > 0
                                            ? '1px solid rgba(239,68,68,0.2)'
                                            : '1px solid rgba(0,0,0,0.08)',
                                }}
                            >
                                <div
                                    className="absolute left-7 top-0 bottom-0 w-[1.5px]"
                                    style={{
                                        background:
                                            violations.length > 0
                                                ? 'rgba(239,68,68,0.3)'
                                                : 'rgba(255,100,100,0.35)',
                                    }}
                                />
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute left-0 right-0 h-[1px]"
                                        style={{
                                            top: `${28 + i * 18}px`,
                                            background: 'rgba(100,140,255,0.15)',
                                        }}
                                    />
                                ))}

                                <div className="relative pl-5">
                                    {violations.length > 0 ? (
                                        <>
                                            <p
                                                className="text-[11px] sm:text-[12px] font-bold text-red-600 mb-1.5 leading-tight"
                                                style={{ fontFamily: "'Kalam', cursive" }}
                                            >
                                                ⚠️ Strike {violations[0].strike_number}/3
                                            </p>
                                            <p
                                                className="text-[10px] sm:text-[11px] text-[#1a1a1a]/70 leading-[18px] mb-1"
                                                style={{ fontFamily: "'Kalam', cursive" }}
                                            >
                                                your {targetLabel(violations[0].target_type)} was
                                                flagged for violating our terms.
                                            </p>
                                            <p
                                                className="text-[10px] sm:text-[11px] text-[#1a1a1a]/50 leading-[18px] italic"
                                                style={{ fontFamily: "'Kalam', cursive" }}
                                            >
                                                Please check your{' '}
                                                {targetLabel(violations[0].target_type)}s.
                                            </p>
                                            {violations.length > 1 && (
                                                <p
                                                    className="text-[9px] text-red-400 mt-1.5"
                                                    style={{ fontFamily: "'Kalam', cursive" }}
                                                >
                                                    +{violations.length - 1} more violation
                                                    {violations.length - 1 > 1 ? 's' : ''} = ban
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <p
                                                className="text-[10px] sm:text-[12px] font-bold text-[#1a1a1a] mb-1.5 leading-tight"
                                                style={{ fontFamily: "'Kalam', cursive" }}
                                            >
                                                {ANNOUNCEMENT.title}
                                            </p>
                                            {ANNOUNCEMENT.lines.map((line, i) => (
                                                <p
                                                    key={i}
                                                    className="text-[10px] sm:text-[11px] text-[#1a1a1a]/60 leading-[18px]"
                                                    style={{ fontFamily: "'Kalam', cursive" }}
                                                >
                                                    {line}
                                                </p>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Draggable sticky notes */}
                    <AnimatePresence>
                        {displayedNotes.map((note, index) => {
                            const isDraggingThis = dragging === note.id
                            return (
                                <motion.div
                                    key={note.id}
                                    className="absolute group select-none"
                                    style={{
                                        left: note.x,
                                        top: note.y,
                                        zIndex: index + 2,
                                        cursor: isDraggingThis ? 'grabbing' : 'grab',
                                        filter:
                                            isDraggingThis &&
                                            !(note.type === 'image' && note.imageMode === 'sticker')
                                                ? 'drop-shadow(4px 8px 6px rgba(0,0,0,0.35))'
                                                : 'none',
                                        transform: `rotate(${note.rotate}) ${isDraggingThis ? 'scale(1.06)' : 'scale(1)'}`,
                                        transition: isDraggingThis
                                            ? 'filter 0.1s, transform 0.1s'
                                            : 'filter 0.2s, transform 0.2s',
                                    }}
                                    initial={{ opacity: 0, scale: 0.7, y: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.6, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    onMouseDown={(e) => onMouseDown(e, note.id)}
                                    onTouchStart={(e) => onTouchStart(e, note.id)}
                                >
                                    {!(note.type === 'image' && note.imageMode === 'sticker') && (
                                        <div
                                            className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-5 z-10"
                                            style={{
                                                background: 'rgba(255,255,255,0.6)',
                                                border: '1px solid rgba(0,0,0,0.07)',
                                            }}
                                        />
                                    )}

                                    <button
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={() => handleRemove(note.id)}
                                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#1a1a1a] hover:bg-red-500 text-white flex items-center justify-center z-20 cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-150"
                                        style={{ boxShadow: '1px 1px 0 rgba(0,0,0,0.3)' }}
                                        title="Remove"
                                    >
                                        <svg width="9" height="10" viewBox="0 0 9 10" fill="none">
                                            <path
                                                d="M1 2.5h7M3.5 2.5V1.5h2V2.5M2 2.5l.5 6h4l.5-6"
                                                stroke="white"
                                                strokeWidth="1.2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>

                                    {note.type === 'text' ? (
                                        <div
                                            className="px-2 sm:px-3 pt-5 pb-2 sm:pb-3 text-[10px] sm:text-[11px] leading-snug w-24 sm:w-36 min-h-[60px] sm:min-h-[70px] relative"
                                            style={{
                                                background: note.color,
                                                fontFamily: "'Kalam', cursive",
                                                color: '#1a1a1a',
                                                boxShadow: isDraggingThis
                                                    ? '4px 8px 0 rgba(0,0,0,0.25)'
                                                    : '2px 3px 0 rgba(0,0,0,0.18)',
                                            }}
                                        >
                                            {note.text}
                                            <div
                                                className="absolute bottom-0 right-0 w-4 h-4"
                                                style={{
                                                    background:
                                                        'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.08) 50%)',
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className={
                                                note.imageMode === 'sticker'
                                                    ? 'w-20 h-20 sm:w-28 sm:h-28'
                                                    : 'w-28 h-28 sm:w-80 sm:h-80 overflow-hidden'
                                            }
                                            style={{
                                                border:
                                                    note.imageMode === 'sticker'
                                                        ? 'none'
                                                        : '2px solid #e5e7eb',
                                                background:
                                                    note.imageMode === 'sticker'
                                                        ? 'transparent'
                                                        : '#f5e8e8',
                                                boxShadow:
                                                    note.imageMode === 'sticker'
                                                        ? 'none'
                                                        : isDraggingThis
                                                          ? '4px 8px 0 rgba(0,0,0,0.25)'
                                                          : '2px 3px 0 rgba(0,0,0,0.18)',
                                                padding: note.imageMode === 'sticker' ? '0' : '4px',
                                            }}
                                        >
                                            <img
                                                src={note.imageUrl}
                                                alt={
                                                    note.imageMode === 'sticker'
                                                        ? 'sticker'
                                                        : 'photo'
                                                }
                                                className="w-full h-full object-cover"
                                                style={{
                                                    filter:
                                                        note.imageMode === 'sticker' &&
                                                        isDraggingThis
                                                            ? 'drop-shadow(4px 8px 6px rgba(0,0,0,0.35))'
                                                            : 'none',
                                                }}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>

                    {notes.length === 0 && !loading && (
                        <div
                            className="absolute text-[#1a1a1a]/20 dark:text-foreground/20 text-[11px]"
                            style={{ left: '160px', top: '30px', fontFamily: "'Kalam', cursive" }}
                        >
                            pin something here →
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-[#1a1a1a]/10 dark:border-foreground/10 flex justify-end">
                    <span
                        className="text-[#1a1a1a]/20 dark:text-foreground/20 text-[9px] tracking-[0.15em]"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        LATER N COMIX STUDIO
                    </span>
                </div>
            </div>

            <AddStickyModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onAdd={handleAdd}
                imageCount={notes.filter((n) => n.type === 'image').length}
            />
        </>
    )
}
