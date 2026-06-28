import * as React from 'react'
import { useNavigate } from 'react-router-dom'

interface HeroWork {
    slug: string
    title: string
    description?: string | null
    banner?: string | null
    cover: string | null
    type: 'webtoon' | 'wattpad'
    status?: string
}

interface Announcement {
    title: string
    content: string
    image?: string | null
    tag?: 'event' | 'reminder' | 'update'
    is_pinned: boolean
    created_at: string
    creator?: { name?: string | null } | null
}

export type HeroModalSlide =
    | { kind: 'comic'; data: HeroWork }
    | { kind: 'news'; data: Announcement }

export default function HeroModal({
    slide,
    cover,
    onClose,
}: {
    slide: HeroModalSlide | null
    cover: (path: string | null) => string | null
    onClose: () => void
}) {
    const navigate = useNavigate()

    // Close on Escape
    React.useEffect(() => {
        if (!slide) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [slide, onClose])

    if (!slide) return null

    const isComic = slide.kind === 'comic'
    const work = isComic ? (slide.data as HeroWork) : null
    const announcement = !isComic ? (slide.data as Announcement) : null

    const imgSrc = isComic ? cover(work!.banner ?? work!.cover) : cover(announcement!.image ?? null)

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
            style={{
                background: 'rgba(0,0,0,0.75)',
                animation: 'heroModalFadeIn 0.2s ease-out',
            }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={isComic ? work!.title : announcement!.title}
        >
            <style>{`
                @keyframes heroModalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes heroModalRise {
                    from { opacity: 0; transform: translateY(16px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>

            <div
                className="relative w-full max-w-5xl rounded-2xl overflow-hidden flex items-center justify-center bg-[#0c0c0c]"
                style={{
                    maxHeight: '94vh',
                    animation: 'heroModalRise 0.25s ease-out',
                    boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image sized to its own aspect ratio — never cropped */}
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={isComic ? work!.title : announcement!.title}
                        className="block max-w-full object-contain"
                        style={{ height: 'min(82vh, 720px)', width: 'auto', maxHeight: '94vh' }}
                    />
                ) : (
                    <div className="w-full" style={{ height: 'min(640px, 86vh)' }} />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent pointer-events-none" />

                <div className="absolute inset-x-0 bottom-0 h-20 sm:h-24 pointer-events-none bg-gradient-to-t from-[#1a1712] to-transparent" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-9 h-9 rounded-full flex items-center justify-center bg-black/50 border border-white/20 text-white hover:bg-black/70 transition-colors cursor-pointer"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                </button>

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 px-4 sm:px-6 py-2.5 flex items-center justify-between bg-black/40 backdrop-blur-sm z-20">
                    <span
                        className="text-amber-400 text-[10px] tracking-[0.25em]"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        ◆ LATER N COMIX TIMES
                    </span>
                    <span
                        className="text-white/60 text-[9px] tracking-[0.15em] pr-10"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        {isComic
                            ? work!.type.toUpperCase()
                            : announcement!.is_pinned
                              ? 'PINNED'
                              : 'NEWS'}
                    </span>
                </div>

                {/* Sticky-note tag for news */}
                {!isComic && (
                    <div
                        className="absolute top-14 right-4 sm:right-6 px-2.5 py-1.5 rotate-[2deg] z-20"
                        style={{
                            background:
                                announcement!.tag === 'event'
                                    ? '#86efac'
                                    : announcement!.tag === 'reminder'
                                      ? '#fca5a5'
                                      : '#fef08a',
                            fontFamily: "'Kalam', cursive",
                            fontSize: '11px',
                            color: '#1a1a1a',
                            boxShadow: '2px 3px 6px rgba(0,0,0,0.15)',
                        }}
                    >
                        {announcement!.tag === 'event'
                            ? '🎉 event'
                            : announcement!.tag === 'reminder'
                              ? '🔔 reminder'
                              : '📢 update'}
                    </div>
                )}

                {/* Content */}
                <div className="absolute bottom-7 sm:bottom-9 left-6 right-6 sm:left-8 sm:right-8 z-10">
                    {isComic ? (
                        <div
                            className="inline-block text-[10px] tracking-[0.25em] px-2.5 py-0.5 rounded-sm mb-2 bg-amber-500/20 border border-amber-400/60 text-amber-300"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            {work!.type === 'webtoon' ? 'WEBTOON' : 'NOVEL'}
                        </div>
                    ) : (
                        <div
                            className="text-amber-400 mb-2 text-[10px] tracking-[0.25em]"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            ◆ {announcement!.is_pinned ? 'PINNED ANNOUNCEMENT' : 'LATEST NEWS'}
                        </div>
                    )}

                    <h1
                        className="text-white leading-[0.95] mb-3"
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 'clamp(24px, 4.2vw, 44px)',
                            letterSpacing: '0.02em',
                            textShadow: '0 2px 16px rgba(0,0,0,0.6)',
                        }}
                    >
                        {isComic ? work!.title : announcement!.title}
                    </h1>

                    {isComic ? (
                        work!.description && (
                            <p className="text-white/75 text-[13px] sm:text-[14px] leading-relaxed mb-4 line-clamp-3">
                                {work!.description}
                            </p>
                        )
                    ) : (
                        <p className="text-white/75 text-[13px] sm:text-[14px] leading-relaxed mb-4 line-clamp-3">
                            {announcement!.content}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        {isComic ? (
                            <>
                                <span className="inline-block text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-black">
                                    {work!.status === 'completed'
                                        ? 'COMPLETED'
                                        : work!.status === 'hiatus'
                                          ? 'HIATUS'
                                          : 'NEW'}
                                </span>
                                <button
                                    onClick={() => navigate(`/works/${work!.slug}`)}
                                    className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide px-4 py-2 rounded-full bg-white text-black hover:bg-amber-300 transition-colors cursor-pointer"
                                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                >
                                    READ NOW
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                    >
                                        <path
                                            d="M5 12h14M13 6l6 6-6 6"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <div
                                    className="px-2 py-1 bg-white/90 text-black shrink-0"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        fontSize: '9px',
                                        letterSpacing: '0.2em',
                                    }}
                                >
                                    {announcement!.creator?.name?.toUpperCase() ?? 'STAFF'}
                                </div>
                                <span
                                    className="text-white/60"
                                    style={{ fontFamily: "'Kalam', cursive", fontSize: '11px' }}
                                >
                                    {new Date(announcement!.created_at).toLocaleDateString(
                                        'en-US',
                                        {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        }
                                    )}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
