import { Suspense } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdminModerationShowStickyNote } from '@/features/admin/hooks/useAdminModerationShowStickyNote'
import { storageUrl } from '@/utils/storage'

const STRIKE_BG = ['', '#86efac', '#fbbf24', '#fca5a5']
const STRIKE_MSG = ['', 'First warning', 'Final warning — next ban!', 'BANNED']

function ModerationShowStickyNoteContent() {
    const { id } = useParams()
    const navigate = useNavigate()
    const {
        note,
        form,
        showViolateForm,
        setShowViolateForm,
        approve,
        violate,
        approving,
        violating,
        result,
    } = useAdminModerationShowStickyNote(Number(id))

    const {
        register,
        formState: { errors },
    } = form
    const user = note.user

    return (
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
            {/* Back */}
            <button
                onClick={() => navigate('/admin/moderation')}
                className="text-muted-foreground hover:text-foreground text-[11px] mb-4 transition-colors"
                style={{ fontFamily: "'Kalam', cursive" }}
            >
                ← Back to Queue
            </button>

            {/* Result banner */}
            {result && (
                <div
                    className="mb-4 px-4 py-3 border-[2px] border-[#1a1a1a]"
                    style={{
                        background: result.banned ? '#fca5a5' : '#86efac',
                        fontFamily: "'Kalam', cursive",
                        color: '#1a1a1a',
                    }}
                >
                    ✓ {result.message}
                    {result.strike && ` — Strike ${result.strike}/3`}
                </div>
            )}

            <div className="flex gap-0">
                {/* Spine */}
                <div
                    className="w-4 sm:w-6 shrink-0 flex flex-col items-center justify-between py-4 bg-[#080808]"
                    style={{ minHeight: '400px' }}
                >
                    <span
                        className="text-red-400 text-[8px] tracking-[0.3em] rotate-90 whitespace-nowrap mt-4"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        REVIEW
                    </span>
                </div>

                <div
                    className="flex-1 border-[2.5px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]"
                    style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
                >
                    {/* Header */}
                    <div className="bg-[#1a1a1a] px-4 sm:px-6 py-4">
                        <h1
                            className="text-red-400 leading-none"
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 'clamp(20px, 5vw, 32px)',
                                letterSpacing: '0.04em',
                            }}
                        >
                            STICKY NOTE REVIEW
                        </h1>
                        <p
                            className="text-white/50 mt-1 text-[12px]"
                            style={{ fontFamily: "'Kalam', cursive" }}
                        >
                            {note.type} note
                        </p>
                    </div>

                    {/* Creator info */}
                    <div className="px-4 sm:px-6 py-4 border-b-[2px] border-[#1a1a1a] flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span
                                    className="text-[#1a1a1a] dark:text-foreground text-[13px]"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    {user.name}
                                </span>
                                <span
                                    className="text-[#1a1a1a]/40 text-[11px]"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    @{user.username}
                                </span>
                                <span
                                    className="text-[#1a1a1a]/40 text-[11px]"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    {user.email}
                                </span>
                            </div>
                            {user.strike_count > 0 && (
                                <div
                                    className="mt-1 inline-block px-2 py-0.5 text-[10px]"
                                    style={{
                                        background: STRIKE_BG[user.strike_count] ?? '#fca5a5',
                                        fontFamily: "'Kalam', cursive",
                                        color: '#1a1a1a',
                                    }}
                                >
                                    ⚠️ {STRIKE_MSG[user.strike_count] ?? 'Multiple violations'} (
                                    {user.strike_count}/3 strikes)
                                </div>
                            )}
                        </div>
                        <div
                            className="text-[#1a1a1a]/30 text-[10px]"
                            style={{ fontFamily: "'Kalam', cursive" }}
                        >
                            submitted {new Date(note.created_at).toLocaleDateString()}
                        </div>
                    </div>

                    {/* Sticky note content */}
                    <div
                        className="p-4 max-w-xs border-[2px] border-[#1a1a1a]/20"
                        style={{
                            background: note.color ?? '#fef9c3',
                            fontFamily: "'Kalam', cursive",
                            fontSize: '14px',
                            lineHeight: '1.6',
                            boxShadow: '3px 3px 0 #1a1a1a20',
                        }}
                    >
                        {note.type === 'text' &&
                            (note.text ? (
                                note.text
                            ) : (
                                <span className="text-[#1a1a1a]/30">No text content.</span>
                            ))}
                        {note.type === 'image' &&
                            (note.image_path ? (
                                <img
                                    src={storageUrl(note.image_path)!}
                                    alt="Sticky note image"
                                    className="w-full"
                                />
                            ) : (
                                <span className="text-[#1a1a1a]/30">No image uploaded.</span>
                            ))}
                    </div>

                    {/* Actions */}
                    {note.moderation_status === 'pending_review' && (
                        <div className="px-4 sm:px-6 py-4">
                            <div
                                className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[11px] tracking-[0.15em] mb-4"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                ◆ MODERATION DECISION
                            </div>

                            {!showViolateForm ? (
                                <div className="flex gap-3">
                                    <button
                                        onClick={approve}
                                        disabled={approving}
                                        className="border-[2.5px] border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors px-5 py-2 text-[13px] disabled:opacity-50 cursor-pointer"
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            letterSpacing: '0.1em',
                                            boxShadow: '2px 2px 0 #16a34a',
                                        }}
                                    >
                                        {approving ? 'APPROVING...' : '✓ APPROVE'}
                                    </button>
                                    <button
                                        onClick={() => setShowViolateForm(true)}
                                        className="border-[2.5px] border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors px-5 py-2 text-[13px] cursor-pointer"
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            letterSpacing: '0.1em',
                                            boxShadow: '2px 2px 0 #dc2626',
                                        }}
                                    >
                                        ✕ VIOLATION
                                    </button>
                                </div>
                            ) : (
                                <div className="border-[2px] border-red-300 bg-red-50 dark:bg-red-950/20 p-4">
                                    <p
                                        className="text-[12px] text-red-600 mb-3"
                                        style={{ fontFamily: "'Kalam', cursive" }}
                                    >
                                        ⚠️ This will issue strike {user.strike_count + 1}/3 to @
                                        {user.username}.
                                        {user.strike_count + 1 >= 3 &&
                                            ' This will result in an automatic ban!'}
                                    </p>

                                    <textarea
                                        {...register('reason')}
                                        rows={3}
                                        placeholder="Explain the violation reason clearly..."
                                        className="w-full px-3 py-2 text-[12px] border-[2px] border-red-300 bg-white dark:bg-zinc-900 text-foreground focus:outline-none focus:border-red-500 resize-none mb-1"
                                        style={{ fontFamily: "'Kalam', cursive" }}
                                    />

                                    {/* Yup error message */}
                                    {errors.reason && (
                                        <p
                                            className="text-red-500 text-[11px] mb-3"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            ⚠️ {errors.reason.message}
                                        </p>
                                    )}

                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={violate}
                                            disabled={violating}
                                            className="border-[2px] border-red-500 bg-red-500 text-white px-4 py-1.5 text-[11px] disabled:opacity-50 cursor-pointer hover:bg-red-600 transition-colors"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: '0.1em',
                                            }}
                                        >
                                            {violating ? 'PROCESSING...' : 'CONFIRM VIOLATION'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowViolateForm(false)
                                                form.reset()
                                            }}
                                            className="border-[2px] border-[#1a1a1a]/20 text-[#1a1a1a]/40 px-4 py-1.5 text-[11px] cursor-pointer hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: '0.1em',
                                            }}
                                        >
                                            CANCEL
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Already reviewed */}
                    {note.moderation_status !== 'pending_review' && (
                        <div
                            className="px-4 sm:px-6 py-4"
                            style={{
                                background:
                                    note.moderation_status === 'approved'
                                        ? 'rgba(134,239,172,0.2)'
                                        : 'rgba(252,165,165,0.2)',
                            }}
                        >
                            <span
                                className="text-[13px]"
                                style={{
                                    fontFamily: "'Kalam', cursive",
                                    color:
                                        note.moderation_status === 'approved'
                                            ? '#16a34a'
                                            : '#dc2626',
                                }}
                            >
                                {note.moderation_status === 'approved'
                                    ? '✓ This note has been approved.'
                                    : '✕ This note was marked as a violation.'}
                            </span>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-4 sm:px-6 py-2.5 border-t-[2px] border-[#1a1a1a] flex justify-end bg-[#fffdf5] dark:bg-[#1c1a17]">
                        <span
                            className="text-[#1a1a1a]/20 tracking-[0.2em] text-[9px]"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            LATER N COMIX MODERATION
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ModerationShowStickyNote() {
    return (
        <Suspense
            fallback={
                <div
                    className="flex items-center justify-center min-h-[60vh] tracking-[0.2em]"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                    — LOADING NOTE... —
                </div>
            }
        >
            <ModerationShowStickyNoteContent />
        </Suspense>
    )
}
