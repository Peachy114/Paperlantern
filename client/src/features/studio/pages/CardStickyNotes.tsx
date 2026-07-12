import { useState, useEffect, useRef } from 'react'
import AddStickyModal from '../components/sticky-modal/AddStickyModal'
import { useStickyBoard } from '@/features/studio/hooks/useStickyBoard'
import { useMyViolations } from '@/features/studio/hooks/useMyViolations'

const ANNOUNCEMENT_LINES = [
    'Pin notes and reminders here.',
    'Cover and banner — digital art only.',
    'No A.I. generated content.',
    '— Later N Comix Team 🏮',
]

const targetLabel = (type: string) =>
    type.includes('Chapter') ? 'chapter' : type.includes('Work') ? 'work' : 'sticky note'

export default function CardStickyNotes() {
    const [modalOpen, setModalOpen] = useState(false)
    const noteRefs = useRef<Map<number, HTMLDivElement>>(new Map()) // ← number, not string

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

    useEffect(() => {
        const listeners: Array<{ el: HTMLDivElement; fn: (e: TouchEvent) => void }> = []

        displayedNotes.forEach((note) => {
            const el = noteRefs.current.get(note.id)
            if (!el) return

            const fn = (e: TouchEvent) => {
                if (e.cancelable) e.preventDefault()
                onTouchStart(e as unknown as React.TouchEvent, note.id)
            }

            el.addEventListener('touchstart', fn, { passive: false })
            listeners.push({ el, fn })
        })

        return () => {
            listeners.forEach(({ el, fn }) => el.removeEventListener('touchstart', fn))
        }
    }, [displayedNotes, onTouchStart])

    return (
        <>
            <div className="border rounded-lg overflow-hidden h-full">
                <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Notes to Self
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{notes.length} pinned</span>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="w-6 h-6 flex items-center justify-center border rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-base leading-none"
                            title="Add note"
                        >
                            +
                        </button>
                    </div>
                </div>

                {violations.length > 0 ? (
                    <div className="px-4 py-3 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-0.5">
                            ⚠️ Strike {violations[0].strike_number}/3
                        </p>
                        <p className="text-xs text-red-500/80">
                            Your {targetLabel(violations[0].target_type)} was flagged for violating
                            our terms. Please review it.
                        </p>
                        {violations.length > 1 && (
                            <p className="text-xs text-red-400 mt-1">
                                +{violations.length - 1} more violation
                                {violations.length - 1 > 1 ? 's' : ''} — further violations may
                                result in a ban.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="px-4 py-3 bg-muted/10 border-b">
                        <p className="text-xs font-medium mb-1">Welcome to your board!</p>
                        {ANNOUNCEMENT_LINES.map((line, i) => (
                            <p key={i} className="text-xs text-muted-foreground leading-5">
                                {line}
                            </p>
                        ))}
                    </div>
                )}

                <div
                    ref={boardRef}
                    className="relative w-full bg-muted/5"
                    style={{
                        minHeight: '220px',
                        cursor: dragging !== null ? 'grabbing' : 'default',
                        userSelect: dragging !== null ? 'none' : 'auto',
                        overscrollBehavior: 'none',
                    }}
                >
                    {notes.length === 0 && !loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-xs text-muted-foreground/40">
                                Click + to pin your first note
                            </p>
                        </div>
                    )}

                    {displayedNotes.map((note, index) => {
                        const isDraggingThis = dragging === note.id
                        return (
                            <div
                                key={note.id}
                                ref={(el) => {
                                    if (el)
                                        noteRefs.current.set(note.id, el) // number ✓
                                    else noteRefs.current.delete(note.id)
                                }}
                                className="absolute group select-none"
                                style={{
                                    left: note.x,
                                    top: note.y,
                                    zIndex: index + 2,
                                    cursor: isDraggingThis ? 'grabbing' : 'grab',
                                    transform: `rotate(${note.rotate}) scale(${isDraggingThis ? 1.04 : 1})`,
                                    transition: 'transform 0.1s',
                                    touchAction: 'none',
                                }}
                                onMouseDown={(e) => onMouseDown(e, note.id)}
                            >
                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => handleRemove(note.id)}
                                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center z-20 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                    title="Remove"
                                >
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                        <path
                                            d="M1 1l6 6M7 1L1 7"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>

                                {note.type === 'text' ? (
                                    <div
                                        className="px-3 pt-4 pb-2 text-[11px] leading-snug w-32 min-h-16 shadow-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                                        style={{ background: note.color, color: '#1a1a1a' }}
                                    >
                                        {note.text}
                                    </div>
                                ) : (
                                    <div
                                        className={
                                            note.imageMode === 'sticker'
                                                ? 'w-20 h-20'
                                                : 'w-28 h-28 overflow-hidden border bg-muted shadow-sm'
                                        }
                                    >
                                        <img
                                            src={note.imageUrl}
                                            alt={note.imageMode === 'sticker' ? 'sticker' : 'photo'}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
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
