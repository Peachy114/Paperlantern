import ScrollButton from '@/components/ui/scroll'
import { useChapterShow } from '@/features/studio/hooks/useChapterShow'

export default function ChapterShow() {
    const { chapter, prevSlug, nextSlug, workSlug, navigate, goTo, imageUrl } = useChapterShow()

    const NavButtons = () => (
        <div className="flex items-center justify-between py-2.5">
            {prevSlug ? (
                <button
                    onClick={() => goTo(prevSlug)}
                    className="px-3 sm:px-4 py-2 border-[2px] border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors duration-100 active:bg-foreground active:text-background"
                    style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '14px',
                        letterSpacing: '0.15em',
                        boxShadow: '2px 2px 0 var(--foreground)',
                    }}
                >
                    ← PREV
                </button>
            ) : (
                <div />
            )}

            {nextSlug ? (
                <button
                    onClick={() => goTo(nextSlug)}
                    className="px-3 sm:px-4 py-2 border-[2px] border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors duration-100 active:bg-foreground active:text-background"
                    style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '14px',
                        letterSpacing: '0.15em',
                        boxShadow: '2px 2px 0 var(--foreground)',
                    }}
                >
                    NEXT →
                </button>
            ) : (
                <div />
            )}
        </div>
    )

    return (
        <>
            <ScrollButton />
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
                rel="stylesheet"
            />

            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
                {/* Header */}
                <div className="flex items-start sm:items-center justify-between pb-4 mb-5 border-b-[2.5px] border-[#1a1a1a] dark:border-foreground/40 gap-3">
                    <button
                        onClick={() => navigate(`/studio/works/${workSlug}/chapters`)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: '12px',
                            letterSpacing: '0.2em',
                        }}
                    >
                        ← BACK
                    </button>

                    <div className="min-w-0 flex-1">
                        <span
                            className="text-center text-amber-500 block"
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: '11px',
                                letterSpacing: '0.25em',
                            }}
                        >
                            ◆ {chapter.work_type === 'webtoon' ? 'WEBTOON' : 'NOVEL'} · CH.
                            {chapter.order}
                        </span>
                        <h1
                            className="text-foreground leading-tight sm:leading-none"
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 'clamp(20px, 5vw, 32px)',
                                letterSpacing: '0.04em',
                                wordBreak: 'break-word',
                            }}
                        >
                            {chapter.title}
                        </h1>
                    </div>

                    {/* Date — hidden on very small screens, shown from sm up */}
                    <span
                        className="text-muted-foreground/40 shrink-0"
                        style={{ fontFamily: "'Kalam', cursive", fontSize: '11px' }}
                    >
                        {new Date(chapter.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </span>
                </div>

                {/* Webtoon */}
                {chapter.work_type === 'webtoon' && (
                    <div className="flex flex-col overflow-hidden bg-zinc-950 my-5">
                        {chapter.images.length === 0 ? (
                            <div
                                className="flex items-center justify-center py-24 text-zinc-500"
                                style={{ fontFamily: "'Kalam', cursive", fontSize: '13px' }}
                            >
                                No images uploaded.
                            </div>
                        ) : (
                            chapter.images.map((img) => (
                                <img
                                    key={img.id}
                                    src={imageUrl(img.path)!}
                                    alt={`Page ${img.order + 1}`}
                                    className="w-full block"
                                    draggable={false}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* Novel */}
                {chapter.work_type === 'wattpad' && (
                    <div className="bg-[#ffffff] dark:bg-[#080808] px-4 sm:px-8 py-8 sm:py-10 my-5 text-start">
                        {chapter.content ? (
                            <p
                                className="leading-loose text-foreground whitespace-pre-wrap break-words"
                                style={{
                                    fontFamily: "'Noto Serif', serif",
                                    fontSize: 'clamp(14px, 3.5vw, 15px)',
                                }}
                            >
                                {chapter.content}
                            </p>
                        ) : (
                            <p
                                className="text-muted-foreground italic text-center py-16"
                                style={{ fontFamily: "'Kalam', cursive", fontSize: '13px' }}
                            >
                                No content yet.
                            </p>
                        )}
                    </div>
                )}

                {/* Nav buttons — bottom */}
                <NavButtons />

                {/* Back */}
                <div className="flex items-center gap-3 min-w-0 mt-1">
                    <div className="w-px h-4 bg-foreground/20 shrink-0" />
                </div>

                <div className="flex items-center justify-between mt-3 px-1">
                    <span
                        className="text-muted-foreground/40 text-[10px] tracking-[0.2em]"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        LATER N COMIX PUBLISHING
                    </span>
                    <span
                        className="text-muted-foreground/40 text-[10px] tracking-[0.2em]"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        VOL. 01 · CH. {chapter.order}
                    </span>
                </div>
            </div>
        </>
    )
}
