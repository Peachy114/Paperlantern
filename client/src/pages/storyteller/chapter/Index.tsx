// pages/studio/Chapter/Index.tsx
import { useChapterIndex } from '@/hooks/useChapterIndex'
import { storageUrl } from '@/utils/storage'

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string; rotate: string }> = {
  draft:     { label: 'Draft',     bg: '#e4e4e7', color: '#52525b', rotate: '-0.5deg' },
  scheduled: { label: 'Scheduled', bg: '#fef08a', color: '#854d0e', rotate: '0.5deg'  },
  published: { label: 'Published', bg: '#86efac', color: '#14532d', rotate: '0.5deg'  },
}

export default function ChapterIndex() {
  const { work, chapters, navigate, workId, handleDelete } = useChapterIndex()

  const totalViews = chapters.reduce((s, c) => s + c.views, 0)
  const totalLikes = chapters.reduce((s, c) => s + (c.likes ?? 0), 0)

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">

        <div className="flex gap-0 mb-6">

          {/* Spine */}
          <div
            className="w-4 sm:w-6 shrink-0 flex flex-col items-center justify-between py-4 bg-[#080808]"
            style={{ minHeight: '320px' }}
          >
            <span
              className="text-amber-400 text-[8px] sm:text-xsmall tracking-[0.3em] rotate-90 whitespace-nowrap mt-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              PAPER LANTERN
            </span>
            <span
              className="text-white/30 text-[8px] sm:text-xsmall tracking-[0.2em] rotate-90 whitespace-nowrap mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              STUDIO
            </span>
          </div>

          {/* Main panel */}
          <div
            className="flex-1 min-w-0 border-[2.5px] border-[#1a1a1a] overflow-hidden bg-[#fffdf5] dark:bg-[#1c1a17]"
            style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
          >

            {/* Header */}
            <div className="border-b-[2.5px] border-[#1a1a1a] px-3 sm:px-5 py-3 sm:py-5 flex items-start sm:items-center justify-between gap-3 bg-[#fffdf5] dark:bg-[#1c1717]">
              <div className="text-start min-w-0">
                <button
                  onClick={() => navigate('/studio')}
                  className="text-muted-foreground hover:text-foreground transition-colors mb-1 block text-[10px] sm:text-xsmall tracking-[0.2em]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  ← BACK TO STUDIO
                </button>
                <h1
                  className="text-[#1a1a1a] dark:text-foreground leading-none truncate"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(22px, 5vw, 34px)', letterSpacing: '0.04em' }}
                >
                  {work?.title ?? 'CHAPTERS'}
                </h1>
                <p
                  className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[11px] sm:text-small"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  {work?.type === 'webtoon' ? '◆ Webtoon' : '◆ Novel'} · manage chapters
                </p>
              </div>

              <button
                onClick={() => navigate(`/studio/works/${workId}/chapters/create`)}
                className="shrink-0 border-[2.5px] border-[#1a1a1a] dark:border-foreground text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-amber-400 dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 px-2.5 sm:px-4 py-1.5 sm:py-2 cursor-pointer text-[11px] sm:text-normal"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em', boxShadow: '2px 2px 0 #1a1a1a' }}
              >
                + NEW
              </button>
            </div>

            {/* Stats row — overflow-visible so sticky notes poke above */}
            <div className="grid grid-cols-3 divide-x-[2px] divide-[#000000] border-b-[2px] border-[#1a1a1a] overflow-visible">
              {[
                { val: chapters.length,             lbl: 'Chapters', sticky: 'keep it up!',        color: '#fef08a', rotate: '2deg'    },
                { val: totalViews.toLocaleString(), lbl: 'Views',    sticky: 'people are reading!', color: '#f9a8d4', rotate: '-1.5deg' },
                { val: totalLikes.toLocaleString(), lbl: 'Likes',    sticky: 'they love it!',       color: '#86efac', rotate: '1.5deg'  },
              ].map(({ val, lbl, sticky, color, rotate }) => (
                <div key={lbl} className="relative px-2 sm:px-5 pt-8 pb-4 sm:pt-9 sm:pb-5 bg-[#fffdf5] dark:bg-[#1c1a17]">
                  {/* Sticky note — always visible */}
                  <div
                    className="absolute -top-3 right-1 h-10 sm:right-3 px-1.5 sm:px-2.5 pt-3 py-0.5 text-[9px] sm:text-[11px] leading-tight z-20 whitespace-nowrap pointer-events-none"
                    style={{
                      background: color,
                      fontFamily: "'Kalam', cursive",
                      color: '#1a1a1a',
                      boxShadow: '2px 3px 0 rgba(0,0,0,0.2)',
                      transform: `rotate(${rotate})`,
                    }}
                  >
                    {sticky}
                  </div>
                  <div
                    className="text-[#1a1a1a] dark:text-foreground leading-none"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(18px, 5vw, 32px)' }}
                  >
                    {val}
                  </div>
                  <div
                    className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[9px] sm:text-xsmall tracking-[0.1em] sm:tracking-[0.18em]"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {lbl.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>

            {/* TOC strip */}
            <div className="relative">
              <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />
              <div className="bg-[#1a1a1a] dark:bg-[#2a2825] px-3 sm:pl-14 sm:pr-5 py-3 flex items-center justify-between">
                <span
                  className="text-white text-[12px] sm:text-normal tracking-[0.18em]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  ◆ CHAPTER LIST
                </span>
                <div
                  className="px-2 py-1 -rotate-[1.5deg] text-[10px] sm:text-xsmall shrink-0"
                  style={{ background: '#86efac', fontFamily: "'Kalam', cursive", color: '#1a1a1a', boxShadow: '1px 2px 4px rgba(0,0,0,0.25)' }}
                >
                  {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Empty state */}
            {chapters.length === 0 ? (
              <div className="relative">
                <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 pointer-events-none z-10" />
                <div
                  className="px-4 sm:pl-14 sm:pr-5 py-12 text-center bg-[#fffdf5] dark:bg-[#1c1a17] text-normal"
                  style={{ fontFamily: "'Kalam', cursive", color: '#888' }}
                >
                  No chapters yet...
                  <br />
                  <button
                    onClick={() => navigate(`/studio/works/${workId}/chapters/create`)}
                    className="mt-4 border-[2px] border-[#1a1a1a] dark:border-foreground/60 px-4 py-1.5 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-amber-400 transition-colors duration-100 cursor-pointer text-normal"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}
                  >
                    ADD FIRST CHAPTER
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-blue-200/30 dark:divide-white/10 relative">
                <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none z-10" />

                {chapters.map((chapter, i) => {
                  const badge = STATUS_BADGE[chapter.status] ?? { label: chapter.status, bg: '#e4e4e7', color: '#52525b', rotate: '0deg' }
                  return (
                    <div
                      key={chapter.id}
                      className={`relative flex items-start gap-2 sm:gap-3 px-3 sm:pl-14 sm:pr-4 py-3 transition-colors duration-100 hover:bg-amber-400/[0.07] ${
                        i % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'
                      }`}
                    >
                      <span
                        className="hidden sm:block absolute left-0 w-10 text-right pr-2.5 text-[#1a1a1a]/20 dark:text-foreground/20 mt-1 text-xsmall"
                        style={{ fontFamily: "'Kalam', cursive" }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      <div className="w-10 h-14 sm:w-14 sm:h-20 shrink-0 border border-black/10 dark:border-white/10 overflow-hidden bg-[#d4cfc2] flex items-center justify-center text-black/20">
                        {chapter.cover
                          ? <img src={storageUrl(chapter.cover)!} alt={chapter.title} className="w-full h-full object-cover" />
                          : <span className="text-normal">◻</span>
                        }
                      </div>

                      <div className="flex-1 min-w-0 text-start">
                        <div
                          className="text-[#1a1a1a] dark:text-foreground truncate text-[12px] sm:text-normal"
                          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}
                        >
                          CH.{chapter.order} · {chapter.title}
                        </div>

                        <div className="flex items-center gap-1 sm:gap-1.5 mt-1 flex-wrap">
                          <span
                            className="inline-block px-1.5 py-0.5 text-[10px] sm:text-xsmall"
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              fontFamily: "'Kalam', cursive",
                              transform: `rotate(${badge.rotate})`,
                              boxShadow: '1px 1px 2px rgba(0,0,0,0.08)',
                            }}
                          >
                            {badge.label}
                          </span>

                          {chapter.is_locked && (
                            <span
                              className="inline-block px-1.5 py-0.5 text-[10px] sm:text-xsmall -rotate-[1deg]"
                              style={{ background: '#fca5a5', fontFamily: "'Kalam', cursive", color: '#7f1d1d', boxShadow: '1px 1px 2px rgba(0,0,0,0.08)' }}
                            >
                              🔒 {chapter.credits_required}cr
                            </span>
                          )}

                          {chapter.scheduled_at && (
                            <span
                              className="text-[10px] sm:text-xsmall text-amber-600/70"
                              style={{ fontFamily: "'Kalam', cursive" }}
                            >
                              <span className="sm:hidden">
                                ⏰ {new Date(chapter.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="hidden sm:inline">
                                ⏰ {new Date(chapter.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
                          <span className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px] sm:text-xsmall" style={{ fontFamily: "'Noto Serif', serif" }}>
                            {chapter.views.toLocaleString()} views
                          </span>
                          <span className="text-[#1a1a1a]/20 text-[10px]">·</span>
                          <span className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px] sm:text-xsmall" style={{ fontFamily: "'Noto Serif', serif" }}>
                            {(chapter.likes ?? 0).toLocaleString()} likes
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        <button
                          onClick={() => navigate(`/studio/works/${workId}/chapters/${chapter.id}/show`)}
                          className="sm:hidden border-[2px] border-[#1a1a1a] dark:border-foreground/70 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 w-8 h-8 flex items-center justify-center cursor-pointer"
                          style={{ boxShadow: '1.5px 1.5px 0 #1a1a1a' }}
                          title="View"
                        >
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M1 6.5C1 6.5 3 2.5 6.5 2.5C10 2.5 12 6.5 12 6.5C12 6.5 10 10.5 6.5 10.5C3 10.5 1 6.5 1 6.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                            <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => navigate(`/studio/works/${workId}/chapters/${chapter.id}/edit`)}
                          className="sm:hidden border-[2px] border-[#1a1a1a] dark:border-foreground/70 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 w-8 h-8 flex items-center justify-center cursor-pointer"
                          style={{ boxShadow: '1.5px 1.5px 0 #1a1a1a' }}
                          title="Edit"
                        >
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M9 2L11 4L4.5 10.5H2.5V8.5L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(chapter.id)}
                          className="sm:hidden border-[2px] border-red-300 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors duration-100 w-8 h-8 flex items-center justify-center cursor-pointer"
                          title="Delete"
                        >
                          <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
                            <path d="M1 3H10M4 3V1.5H7V3M2 3L2.5 11H8.5L9 3H2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>

                        <button
                          onClick={() => navigate(`/studio/works/${workId}/chapters/${chapter.id}/show`)}
                          className="hidden sm:block border-[2px] border-[#1a1a1a] dark:border-foreground/70 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 px-2.5 py-1 cursor-pointer text-xsmall"
                          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', boxShadow: '1.5px 1.5px 0 #1a1a1a' }}
                        >
                          VIEW
                        </button>
                        <button
                          onClick={() => navigate(`/studio/works/${workId}/chapters/${chapter.id}/edit`)}
                          className="hidden sm:block border-[2px] border-[#1a1a1a] dark:border-foreground/70 text-[#1a1a1a] dark:text-foreground hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-foreground dark:hover:text-background transition-colors duration-100 px-2.5 py-1 cursor-pointer text-xsmall"
                          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', boxShadow: '1.5px 1.5px 0 #1a1a1a' }}
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => handleDelete(chapter.id)}
                          className="hidden sm:block border-[2px] border-red-300 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-400 transition-colors duration-100 px-2.5 py-1 cursor-pointer text-xsmall"
                          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer */}
            <div className="relative px-3 sm:pl-14 sm:pr-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
              <div className="hidden sm:block absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-400/20 pointer-events-none" />
              <span className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px] sm:text-xsmall" style={{ fontFamily: "'Kalam', cursive" }}>
                {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} total
              </span>
              <span className="text-[#1a1a1a]/20 dark:text-foreground/20 tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-xsmall" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                PAPER LANTERN PUBLISHING
              </span>
            </div>

          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-muted-foreground/30 text-[9px] sm:text-xsmall tracking-[0.15em] sm:tracking-[0.2em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            PAPER LANTERN PUBLISHING
          </span>
          <span className="text-muted-foreground/30 text-[9px] sm:text-xsmall tracking-[0.15em] sm:tracking-[0.2em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            VOL. 01
          </span>
        </div>

      </div>
    </>
  )
}