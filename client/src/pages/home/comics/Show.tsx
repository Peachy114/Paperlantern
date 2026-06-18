import React from 'react'
import { useComicShow } from '@/hooks/useComicShow'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'

import { useState } from 'react'
import { useWallet, unlockChapter } from '@/hooks/useWallet'
import { useQueryClient } from '@tanstack/react-query'
import UnlockModal from '@/components/UnlockModalChapter'

export default function ComicShow() {
  const { work, chapters, isOwner, navigate, workId, coverUrl } = useComicShow()
  const { token } = useAuthStore()
  const { openLogin } = useModalStore()


  const { wallet, refetch: refetchWallet } = useWallet()
  const queryClient = useQueryClient()
  const [unlocking, setUnlocking] = useState(false)
  const [unlockModal, setUnlockModal] = useState<{
    open: boolean
    chapterId: number | null
    chapterTitle: string
    creditsRequired: number
  }>({ open: false, chapterId: null, chapterTitle: '', creditsRequired: 0 })

  const openUnlockModal = (chapterId: number, chapterTitle: string, creditsRequired: number) => {
    if (!token) { openLogin(); return }
    setUnlockModal({ open: true, chapterId, chapterTitle, creditsRequired })
  }

  const handleConfirmUnlock = async () => {
    if (!unlockModal.chapterId) return
    setUnlocking(true)
    try {
      const result = await unlockChapter(unlockModal.chapterId)
      if (result.success) {
        refetchWallet()
        queryClient.invalidateQueries({ queryKey: ['comic', workId] })
        setUnlockModal(m => ({ ...m, open: false }))
        navigate(`/comics/${workId}/chapters/${unlockModal.chapterId}`)
      }
    } catch {
      // error
    } finally {
      setUnlocking(false)
    }
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />

      <UnlockModal
        open={unlockModal.open}
        onClose={() => setUnlockModal(m => ({ ...m, open: false }))}
        onConfirm={handleConfirmUnlock}
        chapterTitle={unlockModal.chapterTitle}
        creditsRequired={unlockModal.creditsRequired}
        userBalance={wallet?.balance ?? 0}
        unlocking={unlocking}
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">

        {/* ── Volume spine + cover block ── */}
        <div
          className="flex gap-0 mb-8 sm:mb-10"
          style={{ boxShadow: '4px 4px 0 #1a1a1a', border: '2.5px solid #1a1a1a' }}
        >

          {/* Spine — thinner on mobile */}
          <div
            className="w-4 sm:w-6 shrink-0 flex flex-col items-center justify-between py-4 bg-[#1a1a1a] dark:bg-[#0a0a0a]"
            style={{ minHeight: '240px' }}
          >
            <div
              className="text-amber-400 text-[8px] sm:text-xsmall tracking-[0.3em] rotate-90 whitespace-nowrap mt-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              PAPER LANTERN
            </div>
            <div
              className="text-white/30 text-[8px] sm:text-xsmall tracking-[0.2em] rotate-90 whitespace-nowrap mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              VOL.1
            </div>
          </div>

          {/* Main cover area */}
          <div className="flex-1 min-w-0 relative">

            {/* Banner */}
            {coverUrl(work.banner) ? (
              <div className="relative h-44 sm:h-64 overflow-hidden">
                <img src={coverUrl(work.banner)!} alt={work.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
                  <span
                    className="text-amber-400 text-[10px] sm:text-xsmall tracking-[0.25em] block mb-1"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {work.type === 'webtoon' ? '◆ WEBTOON' : '◆ NOVEL'}
                  </span>
                  <h1
                    className="text-white leading-none"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(22px, 5vw, 44px)', letterSpacing: '0.04em' }}
                  >
                    {work.title}
                  </h1>
                </div>
              </div>
            ) : (
              <div className="bg-foreground/5 h-24 sm:h-32 flex items-end p-3 sm:p-5">
                <div>
                  <span
                    className="text-amber-500 text-[10px] sm:text-xsmall tracking-[0.25em] block mb-1"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {work.type === 'webtoon' ? '◆ WEBTOON' : '◆ NOVEL'}
                  </span>
                  <h1
                    className="text-foreground leading-none"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(22px, 5vw, 44px)', letterSpacing: '0.04em' }}
                  >
                    {work.title}
                  </h1>
                </div>
              </div>
            )}

            {/* Info row */}
            <div className="flex items-stretch gap-0 border-t-[2.5px] border-[#1a1a1a] dark:border-foreground/40">

              {/* Cover thumbnail — smaller on mobile */}
              {coverUrl(work.cover) && (
                <div className="shrink-0 w-24 sm:w-36 border-r-[2.5px] border-[#1a1a1a] dark:border-foreground/40 overflow-hidden">
                  <img
                    src={coverUrl(work.cover)!}
                    alt={work.title}
                    className="w-full h-full object-cover"
                    style={{ minHeight: '140px' }}
                  />
                </div>
              )}

              {/* Meta */}
              <div className="flex-1 min-w-0 p-3 sm:p-4 bg-[#fffdf5] dark:bg-[#1c1a17] relative">

                {/* Sticky note — genres (hidden on very small screens) */}
                {work.genres?.length > 0 && (
                  <div
                    className="hidden xs:block absolute -top-3 right-3 sm:right-4 px-2 sm:px-3 py-1 sm:py-1.5 rotate-1 z-10 text-[10px] sm:text-xsmall"
                    style={{
                      background: '#fef08a',
                      boxShadow: '2px 3px 6px rgba(0,0,0,0.15)',
                      fontFamily: "'Kalam', cursive",
                      color: '#1a1a1a',
                      lineHeight: 1.4,
                    }}
                  >
                    {work.genres.slice(0, 2).join(' · ')}
                  </div>
                )}

                {/* Mobile genres row */}
                {work.genres?.length > 0 && (
                  <div className="xs:hidden flex flex-wrap gap-1 mb-2">
                    {work.genres.slice(0, 3).map((g: string) => (
                      <span
                        key={g}
                        className="text-[9px] px-1.5 py-0.5 bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.08em' }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Author + Manage */}
                <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
                  <span
                    className="text-muted-foreground/50 text-[10px] sm:text-xsmall tracking-[0.14em]"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    BY
                  </span>
                  <span
                    className="text-foreground/70 text-[12px] sm:text-small truncate"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    {work.user?.name ?? 'Unknown'}
                  </span>
                  {isOwner && (
                    <button
                      onClick={() => navigate(`/studio/works/${workId}/chapters`)}
                      className="ml-auto shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 border-[2px] border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors duration-100 cursor-pointer text-[10px] sm:text-xsmall tracking-widest font-bold"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", boxShadow: '2px 2px 0 var(--foreground)' }}
                    >
                      MANAGE
                    </button>
                  )}
                </div>

                {/* Description */}
                {work.description && (
                  <div
                    className="max-h-16 sm:max-h-24 overflow-y-auto mb-3 sm:mb-4 pr-1 text-start"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    <p
                      className="text-foreground/70 dark:text-foreground/60 leading-relaxed text-[11px] sm:text-small"
                      style={{ fontFamily: "'Noto Serif', serif" }}
                    >
                      {work.description}
                    </p>
                  </div>
                )}

                {/* Stats — tighter gap on mobile */}
                <div className="flex items-center gap-4 sm:gap-10">
                  {[
                    { val: work.chapters_count, lbl: 'CHAPS' },
                    { val: work.views, lbl: 'VIEWS' },
                    { val: work.likes ?? 0, lbl: 'LIKES' },
                  ].map(({ val, lbl }, i, arr) => (
                    <React.Fragment key={lbl}>
                      <div key={lbl}>
                        <div
                          className="text-foreground text-[18px] sm:text-main-title"
                          style={{ fontFamily: "'Bebas Neue', sans-serif", lineHeight: 1 }}
                        >
                          {val}
                        </div>
                        <div
                          className="text-muted-foreground text-[9px] sm:text-xsmall tracking-[0.1em] sm:tracking-[0.14em]"
                          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                          {lbl}
                        </div>
                      </div>
                      {i < arr.length - 1 && <div className="w-px h-6 sm:h-8 bg-foreground/10" />}
                    </React.Fragment>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>
        
        {/* ── Chapter List ── */}
        <div
          className="relative border-[2.5px] border-[#1a1a1a] dark:border-foreground/40 overflow-hidden"
          style={{ boxShadow: '4px 4px 0 var(--foreground)' }}
        >
          {/* Red margin line — hidden on mobile (no left indent) */}
          <div className="hidden sm:block absolute left-12 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-500/20 pointer-events-none z-10" />

          {/* Header */}
          <div className="relative flex items-center justify-between px-3 sm:px-4 sm:pl-16 py-3 bg-[#1a1a1a] dark:bg-[#0f0f0f]">
            <span
              className="text-white text-[13px] sm:text-normal tracking-[0.18em]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              ◆ TABLE OF CONTENTS
            </span>
            <div
              className="px-2 py-1 -rotate-2 text-[10px] sm:text-xsmall shrink-0"
              style={{
                background: '#86efac',
                fontFamily: "'Kalam', cursive",
                color: '#1a1a1a',
                boxShadow: '1px 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {chapters.length} chapters
            </div>
          </div>

          {chapters.length === 0 && (
            <div
              className="px-4 sm:pl-16 py-8 text-center text-muted-foreground text-normal bg-[#fffdf5] dark:bg-[#1c1a17]"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              No chapters yet...
            </div>
          )}

          {/* Rows */}
          {chapters.map((chapter, i) => (
            <div
              key={chapter.id}
                                    onClick={() => {
  if (!token) { openLogin(); return }
  if (chapter.is_locked) {
    openUnlockModal(chapter.id, chapter.title, chapter.credits_required ?? 0)
    return
  }
  navigate(`/comics/${workId}/chapters/${chapter.id}`)
}}
className={`relative flex items-center justify-between px-3 sm:pl-16 sm:pr-4 transition-colors duration-100 cursor-pointer hover:bg-amber-400/8 ${
  i % 2 === 0 ? 'bg-[#fffdf5] dark:bg-[#1c1a17]' : 'bg-[#faf8ee] dark:bg-[#191713]'
}`}
              style={{ borderBottom: '1px solid rgba(147, 197, 253, 0.25)', minHeight: '44px' }}
            >
              {/* Line number — desktop only */}
              <span
                className="hidden sm:block absolute left-0 w-12 text-right pr-3 text-muted-foreground/30 text-xsmall"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Chapter info */}
              <div className="flex items-center gap-1.5 sm:gap-2 py-2.5 min-w-0 flex-1">
                <span
                  className="text-foreground/40 shrink-0 text-[11px] sm:text-small tracking-[0.06em]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  CH.{chapter.order}
                </span>
                <span
                  className="text-foreground text-[12px] sm:text-normal truncate"
                  style={{ fontFamily: "'Noto Serif', serif" }}
                >
                  {chapter.title}
                </span>

                {chapter.is_locked && (
                  <span
                    className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xsmall shrink-0 rotate-[-1deg]"
                    style={{
                      background: '#fca5a5',
                      fontFamily: "'Kalam', cursive",
                      color: '#1a1a1a',
                      boxShadow: '1px 1px 3px rgba(0,0,0,0.15)',
                      display: 'inline-block',
                    }}
                  >
                    🔒 {chapter.credits_required}cr
                  </span>
                )}
              </div>

              {/* Date + Likes — date hidden on mobile */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                {chapter.likes > 0 && (
                  <span
                    className="text-muted-foreground/40 text-[10px] sm:text-xsmall flex items-center gap-1"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    ♥ {chapter.likes.toLocaleString()}
                  </span>
                )}
                <span
                  className="hidden sm:block text-muted-foreground/40 text-xsmall"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  {new Date(chapter.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {/* Mobile: short date */}
                <span
                  className="sm:hidden text-muted-foreground/40 text-[10px]"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  {new Date(chapter.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}

          <div className="h-2 bg-[#fffdf5] dark:bg-[#1c1a17] border-t border-blue-200/20" />
        </div>

        {/* Volume bottom label */}
        <div className="flex items-center justify-between mt-3 px-1">
          <span
            className="text-muted-foreground/40 text-[9px] sm:text-xsmall tracking-[0.15em] sm:tracking-[0.2em]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            PAPER LANTERN PUBLISHING
          </span>
          <span
            className="text-muted-foreground/40 text-[9px] sm:text-xsmall tracking-[0.15em] sm:tracking-[0.2em]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            VOL. 01
          </span>
        </div>

      </div>
    </>
  )
}