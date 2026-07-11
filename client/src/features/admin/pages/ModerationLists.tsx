import { Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminModerationQueue } from '@/features/admin/hooks/useAdminModeration'
import { storageUrl } from '@/utils/storage'

const FONTS =
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap'

const STRIKE_COLOR = ['', '#86efac', '#fbbf24', '#fca5a5']

// ─── Violate Form ────────────────────────────────────────────────────────────

function ViolateForm({
    onConfirm,
    onCancel,
}: {
    onConfirm: (reason: string) => void
    onCancel: () => void
}) {
    const [reason, setReason] = useState('')

    return (
        <div className="px-3 sm:pl-14 sm:pr-4 py-3 bg-red-50 dark:bg-red-950/20 border-t border-red-200 dark:border-red-900">
            <p
                className="text-[11px] text-red-600 dark:text-red-400 mb-2"
                style={{ fontFamily: "'Kalam', cursive" }}
            >
                State the reason for violation:
            </p>
            <div className="flex gap-2">
                <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Graphic violence, inappropriate content..."
                    className="flex-1 px-3 py-1.5 text-[12px] border-[2px] border-red-300 bg-white dark:bg-zinc-900 text-foreground focus:outline-none focus:border-red-500"
                    style={{ fontFamily: "'Kalam', cursive" }}
                />
                <button
                    onClick={() => {
                        if (reason.trim()) onConfirm(reason)
                    }}
                    disabled={!reason.trim()}
                    className="border-[2px] border-red-500 bg-red-500 text-white px-3 py-1 text-[10px] disabled:opacity-50 cursor-pointer hover:bg-red-600 transition-colors"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                >
                    CONFIRM
                </button>
                <button
                    onClick={onCancel}
                    className="border-[2px] border-[#1a1a1a]/20 text-[#1a1a1a]/40 px-3 py-1 text-[10px] cursor-pointer hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                >
                    CANCEL
                </button>
            </div>
        </div>
    )
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
    return (
        <div className="bg-[#1a1a1a] dark:bg-[#2a2825] px-3 sm:pl-14 sm:pr-5 py-3 flex items-center justify-between border-b-[2px] border-[#1a1a1a]">
            <span
                className="text-white text-[12px] tracking-[0.18em]"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
                ◆ {label}
            </span>
            <span
                className="px-2 py-0.5 text-[10px]"
                style={{
                    background: count > 0 ? '#fca5a5' : '#86efac',
                    fontFamily: "'Kalam', cursive",
                    color: '#1a1a1a',
                }}
            >
                {count}
            </span>
        </div>
    )
}

// ─── Cover ───────────────────────────────────────────────────────────────────

function Cover({ src, alt }: { src: string | null; alt: string }) {
    return (
        <div className="w-10 h-14 sm:w-14 sm:h-20 shrink-0 bg-[#d4cfc2] border border-black/10 overflow-hidden flex items-center justify-center">
            {src ? (
                <img src={storageUrl(src)!} alt={alt} className="w-full h-full object-cover" />
            ) : (
                <span className="text-black/20 text-sub-title">◻</span>
            )}
        </div>
    )
}

// ─── Strike Badge ─────────────────────────────────────────────────────────────

function StrikeBadge({ count }: { count: number }) {
    if (!count || count === 0) return null
    return (
        <>
            <span className="text-[#1a1a1a]/20 text-[10px]">·</span>
            <span
                className="text-[10px] px-1.5 py-0.5"
                style={{
                    background: STRIKE_COLOR[count] ?? '#fca5a5',
                    fontFamily: "'Kalam', cursive",
                    color: '#1a1a1a',
                }}
            >
                {count} strike{count > 1 ? 's' : ''}
            </span>
        </>
    )
}

// ─── Action Buttons ───────────────────────────────────────────────────────────

function ActionButtons({
    onReview,
    onApprove,
    onViolate,
    approving,
    violating,
}: {
    onReview: () => void
    onApprove: () => void
    onViolate: () => void
    approving: boolean
    violating: boolean
}) {
    return (
        <div className="flex items-center gap-1 shrink-0">
            <button
                onClick={onReview}
                className="border-[2px] border-[#1a1a1a] dark:border-foreground/70 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-white transition-colors px-2 py-1 text-[10px] cursor-pointer"
                style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    letterSpacing: '0.1em',
                    boxShadow: '1.5px 1.5px 0 #1a1a1a',
                }}
            >
                REVIEW
            </button>
            <button
                onClick={onApprove}
                disabled={approving}
                className="border-[2px] border-green-400 text-green-700 hover:bg-green-50 transition-colors px-2 py-1 text-[10px] disabled:opacity-50 cursor-pointer"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
            >
                ✓ APPROVE
            </button>
            <button
                onClick={onViolate}
                disabled={violating}
                className="border-[2px] border-red-300 text-red-500 hover:bg-red-50 transition-colors px-2 py-1 text-[10px] disabled:opacity-50 cursor-pointer"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
            >
                ✕ VIOLATE
            </button>
        </div>
    )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
    return (
        <div
            className="px-5 py-8 text-center text-[#1a1a1a]/30 dark:text-foreground/30 text-[12px]"
            style={{ fontFamily: "'Kalam', cursive" }}
        >
            🎉 No {label} pending review.
        </div>
    )
}

// ─── Chapters Section ─────────────────────────────────────────────────────────

function ChaptersSection({
    chapters,
    approveChapter,
    violateChapter,
    approvingChapter,
    violatingChapter,
}: Pick<
    ReturnType<typeof useAdminModerationQueue>,
    'chapters' | 'approveChapter' | 'violateChapter' | 'approvingChapter' | 'violatingChapter'
>) {
    const navigate = useNavigate()
    const [violateId, setViolateId] = useState<string | null>(null)

    return (
        <>
            <SectionHeader label="PENDING CHAPTERS" count={chapters.length} />
            {chapters.length === 0 ? (
                <EmptyState label="chapters" />
            ) : (
                <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                    <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />
                    {chapters.map((chapter, i) => (
                        <div key={chapter.id}>
                            <div
                                className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:pl-14 sm:pr-4 py-3 ${i % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'}`}
                            >
                                <span
                                    className="hidden sm:block absolute left-0 w-10 text-right pr-2.5 text-[#1a1a1a]/20 text-xsmall"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <Cover
                                    src={chapter.work?.cover ?? null}
                                    alt={chapter.work?.title ?? 'Unknown'}
                                />
                                <div className="flex-1 min-w-0 text-start">
                                    <div
                                        className="text-[#1a1a1a] dark:text-foreground text-[13px] sm:text-normal truncate"
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        {chapter.work?.title ?? 'Unknown Work'} — Ch.{chapter.order}{' '}
                                        {chapter.title}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span
                                            className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px]"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            {chapter.work?.user
                                                ? `by @${chapter.work.user.username}`
                                                : '⚠ user deleted'}
                                        </span>
                                        <StrikeBadge
                                            count={chapter.work?.user?.strike_count ?? 0}
                                        />
                                        <span className="text-[#1a1a1a]/20 text-[10px]">·</span>
                                        <span
                                            className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px]"
                                            style={{ fontFamily: "'Noto Serif', serif" }}
                                        >
                                            {new Date(chapter.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <ActionButtons
                                    onReview={() =>
                                        navigate(`/admin/moderation/chapters/${chapter.slug}`)
                                    }
                                    onApprove={() => approveChapter(chapter.slug)} // ← was chapter.id
                                    onViolate={() => setViolateId(chapter.slug)} // ← was chapter.id
                                    approving={approvingChapter === chapter.slug} // ← was chapter.id
                                    violating={violatingChapter === chapter.slug} // ← was chapter.id
                                />
                            </div>
                            {violateId === chapter.slug && ( // ← was chapter.id
                                <ViolateForm
                                    onConfirm={(reason) => {
                                        violateChapter(chapter.slug, reason) // ← was chapter.id
                                        setViolateId(null)
                                    }}
                                    onCancel={() => setViolateId(null)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    )
}

// ─── Works Section ────────────────────────────────────────────────────────────

function WorksSection({
    works,
    approveWork,
    violateWork,
    approvingWork,
    violatingWork,
}: Pick<
    ReturnType<typeof useAdminModerationQueue>,
    'works' | 'approveWork' | 'violateWork' | 'approvingWork' | 'violatingWork'
>) {
    const navigate = useNavigate()
    const [violateId, setViolateId] = useState<string | null>(null)

    return (
        <>
            <SectionHeader label="PENDING WORKS" count={works.length} />
            {works.length === 0 ? (
                <EmptyState label="works" />
            ) : (
                <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                    <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />
                    {works.map((work, i) => (
                        <div key={work.id}>
                            <div
                                className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:pl-14 sm:pr-4 py-3 ${i % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'}`}
                            >
                                <span
                                    className="hidden sm:block absolute left-0 w-10 text-right pr-2.5 text-[#1a1a1a]/20 text-xsmall"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <Cover src={work.cover} alt={work.title} />
                                <div className="flex-1 min-w-0 text-start">
                                    <div
                                        className="text-[#1a1a1a] dark:text-foreground text-[13px] sm:text-normal truncate"
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        {work.title}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 bg-[#1a1a1a]/10 dark:bg-white/10 text-[#1a1a1a]/50 dark:text-foreground/50"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            {work.type}
                                        </span>
                                        <span className="text-[#1a1a1a]/20 text-[10px]">·</span>
                                        <span
                                            className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px]"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            {work.user
                                                ? `by @${work.user.username}`
                                                : '⚠ user deleted'}
                                        </span>
                                        <StrikeBadge count={work.user?.strike_count ?? 0} />
                                        <span className="text-[#1a1a1a]/20 text-[10px]">·</span>
                                        <span
                                            className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px]"
                                            style={{ fontFamily: "'Noto Serif', serif" }}
                                        >
                                            {new Date(work.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <ActionButtons
                                    onReview={() =>
                                        navigate(`/admin/moderation/works/${work.slug}`)
                                    } // ← was work.id
                                    onApprove={() => approveWork(work.slug)} // ← was work.id
                                    onViolate={() => setViolateId(work.slug)} // ← was work.id
                                    approving={approvingWork === work.slug} // ← was work.id
                                    violating={violatingWork === work.slug} // ← was work.id
                                />
                            </div>
                            {violateId === work.slug && ( // ← was work.id
                                <ViolateForm
                                    onConfirm={(reason) => {
                                        violateWork(work.slug, reason) // ← was work.id
                                        setViolateId(null)
                                    }}
                                    onCancel={() => setViolateId(null)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    )
}

// ─── Sticky Notes Section ─────────────────────────────────────────────────────

function StickyNotesSection({
    stickyNotes,
    approveStickyNote,
    violateStickyNote,
    approvingStickyNote,
    violatingStickyNote,
}: Pick<
    ReturnType<typeof useAdminModerationQueue>,
    | 'stickyNotes'
    | 'approveStickyNote'
    | 'violateStickyNote'
    | 'approvingStickyNote'
    | 'violatingStickyNote'
>) {
    const navigate = useNavigate()
    const [violateId, setViolateId] = useState<string | null>(null)

    return (
        <>
            <SectionHeader label="PENDING STICKY NOTES" count={stickyNotes.length} />
            {stickyNotes.length === 0 ? (
                <EmptyState label="sticky notes" />
            ) : (
                <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                    <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />
                    {stickyNotes.map((note, i) => (
                        <div key={note.id}>
                            <div
                                className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:pl-14 sm:pr-4 py-3 ${i % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'}`}
                            >
                                <span
                                    className="hidden sm:block absolute left-0 w-10 text-right pr-2.5 text-[#1a1a1a]/20 text-xsmall"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <div
                                    className="w-10 h-14 sm:w-14 sm:h-20 shrink-0 border border-black/10 flex items-center justify-center"
                                    style={{ background: note.color ?? '#fef08a' }}
                                >
                                    <span className="text-xl">
                                        {note.type === 'image' ? '🖼️' : '📝'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0 text-start">
                                    <div
                                        className="text-[#1a1a1a] dark:text-foreground text-[13px] sm:text-normal truncate"
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        {note.type === 'text'
                                            ? (note.text ?? 'Text Note')
                                            : 'Image Note'}
                                    </div>
                                    <div
                                        className="text-[#1a1a1a]/50 dark:text-foreground/50 text-[11px] truncate mt-0.5"
                                        style={{
                                            fontFamily: "'Noto Serif', serif",
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        {note.type === 'text'
                                            ? (note.text ?? 'Text Note')
                                            : 'Image Note'}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span
                                            className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px]"
                                            style={{ fontFamily: "'Kalam', cursive" }}
                                        >
                                            {note.user
                                                ? `by @${note.user.username}`
                                                : '⚠ user deleted'}
                                        </span>
                                        <StrikeBadge count={note.user?.strike_count ?? 0} />
                                        <span className="text-[#1a1a1a]/20 text-[10px]">·</span>
                                        <span
                                            className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px]"
                                            style={{ fontFamily: "'Noto Serif', serif" }}
                                        >
                                            {new Date(note.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <ActionButtons
                                    onReview={() =>
                                        navigate(`/admin/moderation/sticky-notes/${note.id}`)
                                    }
                                    onApprove={() => approveStickyNote(note.id)}
                                    onViolate={() => setViolateId(note.id)}
                                    approving={approvingStickyNote === note.id}
                                    violating={violatingStickyNote === note.id}
                                />
                            </div>
                            {violateId === note.id && (
                                <ViolateForm
                                    onConfirm={(reason) => {
                                        violateStickyNote(note.id, reason)
                                        setViolateId(null)
                                    }}
                                    onCancel={() => setViolateId(null)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function ReviewContentSection({
    review,
    suspendContent,
    restoreSuspension,
    suspendingContent,
    restoringSuspension,
}: Pick<
    ReturnType<typeof useAdminModerationQueue>,
    'review' | 'suspendContent' | 'restoreSuspension' | 'suspendingContent' | 'restoringSuspension'
>) {
    const navigate = useNavigate()
    const [suspendTarget, setSuspendTarget] = useState<{
        type: string
        id: string
        field?: string | null
        label: string
    } | null>(null)

    const itemsCount =
        review.works.length +
        review.chapters.length +
        review.arts.length +
        review.profile_blocks.length

    const keyFor = (type: string, id: string, field?: string | null) =>
        `${type}:${id}:${field ?? ''}`

    const actionButton = (
        type: string,
        id: string,
        label: string,
        field?: string | null,
        danger = false
    ) => {
        const key = keyFor(type, id, field)
        return (
            <button
                onClick={() => setSuspendTarget({ type, id, field, label })}
                disabled={suspendingContent === key}
                className={`border-[2px] px-2 py-1 text-[10px] disabled:opacity-50 cursor-pointer transition-colors ${
                    danger
                        ? 'border-red-300 text-red-500 hover:bg-red-50'
                        : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                }`}
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
            >
                {suspendingContent === key ? 'SUSPENDING...' : label.toUpperCase()}
            </button>
        )
    }

    return (
        <>
            <SectionHeader label="LIVE CONTENT REVIEW" count={itemsCount} />
            <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                {review.active_suspensions.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/20 px-3 sm:pl-14 sm:pr-4 py-4">
                        <p
                            className="text-[12px] text-red-700 dark:text-red-300 mb-3"
                            style={{ fontFamily: "'Kalam', cursive" }}
                        >
                            Active suspensions hidden from public view
                        </p>
                        <div className="grid gap-2">
                            {review.active_suspensions.map((suspension) => (
                                <div
                                    key={suspension.id}
                                    className="flex flex-wrap items-center justify-between gap-2 border border-red-200 dark:border-red-900 bg-white/70 dark:bg-black/20 px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            @{suspension.user?.username ?? 'unknown'} -{' '}
                                            {suspension.target_field ?? 'content'}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                            {suspension.reason}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {suspension.ticket && (
                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/tickets/${suspension.ticket!.id}`
                                                    )
                                                }
                                                className="border-[2px] border-[#1a1a1a] px-2 py-1 text-[10px]"
                                                style={{
                                                    fontFamily: "'Bebas Neue', sans-serif",
                                                    letterSpacing: '0.1em',
                                                }}
                                            >
                                                OPEN SUPPORT
                                            </button>
                                        )}
                                        <button
                                            onClick={() => restoreSuspension(suspension.id)}
                                            disabled={restoringSuspension === suspension.id}
                                            className="border-[2px] border-green-400 text-green-700 px-2 py-1 text-[10px] disabled:opacity-50"
                                            style={{
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: '0.1em',
                                            }}
                                        >
                                            {restoringSuspension === suspension.id
                                                ? 'RESTORING...'
                                                : 'RESTORE'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {itemsCount === 0 ? (
                    <EmptyState label="live content" />
                ) : (
                    <div className="grid gap-3 px-3 sm:pl-14 sm:pr-4 py-4 bg-[#fffdf5] dark:bg-[#1c1a17]">
                        {review.works.map((work) => (
                            <ReviewRow
                                key={`work-${work.id}`}
                                image={work.cover}
                                title={work.title}
                                meta={`Work by @${work.user?.username ?? 'unknown'}`}
                                actions={
                                    <>
                                        {actionButton(
                                            'work',
                                            String(work.id),
                                            'Suspend Cover',
                                            'cover'
                                        )}
                                        {actionButton(
                                            'work',
                                            String(work.id),
                                            'Suspend Banner',
                                            'banner'
                                        )}
                                        {actionButton(
                                            'work',
                                            String(work.id),
                                            'Suspend Work',
                                            null,
                                            true
                                        )}
                                    </>
                                }
                            />
                        ))}
                        {review.chapters.map((chapter) => (
                            <ReviewRow
                                key={`chapter-${chapter.id}`}
                                image={chapter.cover ?? chapter.work?.cover ?? null}
                                title={`${chapter.work?.title ?? 'Unknown'} - Ch.${chapter.order} ${chapter.title}`}
                                meta={`Chapter by @${chapter.work?.user?.username ?? 'unknown'}`}
                                actions={
                                    <>
                                        {actionButton(
                                            'chapter',
                                            String(chapter.id),
                                            'Suspend Cover',
                                            'cover'
                                        )}
                                        {actionButton(
                                            'chapter',
                                            String(chapter.id),
                                            'Suspend Chapter',
                                            null,
                                            true
                                        )}
                                    </>
                                }
                            />
                        ))}
                        {review.arts.map((art) => (
                            <ReviewRow
                                key={`art-${art.id}`}
                                image={art.image_path}
                                title={art.title}
                                meta={`Art by @${art.user?.username ?? 'unknown'} - ${art.images.length} image(s)`}
                                actions={
                                    <>
                                        {actionButton(
                                            'art',
                                            art.id,
                                            'Suspend Primary Image',
                                            'image_path'
                                        )}
                                        {actionButton('art', art.id, 'Suspend Art', null, true)}
                                        {art.images.slice(0, 3).map((image, index) =>
                                            actionButton(
                                                'art_image',
                                                image.id,
                                                `Image ${index + 1}`,
                                                null,
                                                true
                                            )
                                        )}
                                    </>
                                }
                            />
                        ))}
                        {review.profile_blocks.map((block) => (
                            <ReviewRow
                                key={`profile-block-${block.id}`}
                                image={block.image_path ?? null}
                                title={
                                    block.type === 'text'
                                        ? block.text_content || 'Profile board text'
                                        : 'Profile board image'
                                }
                                meta={`Board block by @${block.user?.username ?? 'unknown'}`}
                                actions={actionButton(
                                    'profile_block',
                                    block.id,
                                    'Suspend Block',
                                    null,
                                    true
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>

            {suspendTarget && (
                <ViolateForm
                    onConfirm={(reason) => {
                        suspendContent(
                            suspendTarget.type,
                            suspendTarget.id,
                            reason,
                            suspendTarget.field
                        )
                        setSuspendTarget(null)
                    }}
                    onCancel={() => setSuspendTarget(null)}
                />
            )}
        </>
    )
}

function ReviewRow({
    image,
    title,
    meta,
    actions,
}: {
    image?: string | null
    title: string
    meta: string
    actions: React.ReactNode
}) {
    return (
        <div className="flex items-center gap-3 border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/20 px-3 py-3">
            <Cover src={image ?? null} alt={title} />
            <div className="min-w-0 flex-1 text-start">
                <p className="truncate text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{meta}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-1">{actions}</div>
        </div>
    )
}

function ModerationQueue() {
    const navigate = useNavigate()

    // Single hook call — data passed down as props
    const queue = useAdminModerationQueue()

    return (
        <>
            <link href={FONTS} rel="stylesheet" />
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
                <div className="flex gap-0 mb-6">
                    {/* Spine */}
                    <div
                        className="w-4 sm:w-6 shrink-0 flex flex-col items-center justify-between py-4 bg-[#080808]"
                        style={{ minHeight: '320px' }}
                    >
                        <span
                            className="text-red-400 text-[8px] sm:text-xsmall tracking-[0.3em] rotate-90 whitespace-nowrap mt-4"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            LATER N COMIX
                        </span>
                        <span
                            className="text-white/30 text-[8px] sm:text-xsmall tracking-[0.2em] rotate-90 whitespace-nowrap mb-4"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            MODERATION
                        </span>
                    </div>

                    {/* Main */}
                    <div
                        className="flex-1 min-w-0 border-[2.5px] border-[#1a1a1a] overflow-hidden bg-[#fffdf5] dark:bg-[#1c1a17]"
                        style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
                    >
                        {/* Header */}
                        <div className="border-b-[2.5px] border-[#000000] px-3 sm:px-5 py-3 sm:py-5 bg-[#1a1a1a]">
                            <button
                                onClick={() => navigate('/admin')}
                                className="text-white/30 hover:text-white text-[11px] mb-1 transition-colors"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                ← Back to Admin
                            </button>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1
                                        className="text-red-400 leading-none"
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            fontSize: 'clamp(26px, 6vw, 38px)',
                                            letterSpacing: '0.04em',
                                        }}
                                    >
                                        MODERATION QUEUE
                                    </h1>
                                    <p
                                        className="text-white/30 mt-1 text-[12px]"
                                        style={{ fontFamily: "'Kalam', cursive" }}
                                    >
                                        review before publishing
                                    </p>
                                </div>
                                <div
                                    className="px-3 py-1 -rotate-[1deg] text-[13px]"
                                    style={{
                                        background: queue.pendingCount > 0 ? '#fca5a5' : '#86efac',
                                        fontFamily: "'Kalam', cursive",
                                        color: '#1a1a1a',
                                        boxShadow: '2px 2px 0 rgba(0,0,0,0.2)',
                                    }}
                                >
                                    {queue.pendingCount} pending
                                </div>
                            </div>
                        </div>

                        {/* Sections — all receive sliced props, no extra hook calls */}
                        <ChaptersSection
                            chapters={queue.chapters}
                            approveChapter={queue.approveChapter}
                            violateChapter={queue.violateChapter}
                            approvingChapter={queue.approvingChapter}
                            violatingChapter={queue.violatingChapter}
                        />
                        <WorksSection
                            works={queue.works}
                            approveWork={queue.approveWork}
                            violateWork={queue.violateWork}
                            approvingWork={queue.approvingWork}
                            violatingWork={queue.violatingWork}
                        />
                        <StickyNotesSection
                            stickyNotes={queue.stickyNotes}
                            approveStickyNote={queue.approveStickyNote}
                            violateStickyNote={queue.violateStickyNote}
                            approvingStickyNote={queue.approvingStickyNote}
                            violatingStickyNote={queue.violatingStickyNote}
                        />
                        <ReviewContentSection
                            review={queue.review}
                            suspendContent={queue.suspendContent}
                            restoreSuspension={queue.restoreSuspension}
                            suspendingContent={queue.suspendingContent}
                            restoringSuspension={queue.restoringSuspension}
                        />

                        {/* Footer */}
                        <div className="px-3 sm:pl-14 sm:pr-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
                            <span
                                className="text-[#1a1a1a]/30 text-[10px]"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                {queue.pendingCount} items awaiting review
                            </span>
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
        </>
    )
}

export default function ModerationPage() {
    return (
        <Suspense
            fallback={
                <div
                    className="flex items-center justify-center min-h-[60vh] tracking-[0.2em]"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                    — LOADING QUEUE... —
                </div>
            }
        >
            <ModerationQueue />
        </Suspense>
    )
}
