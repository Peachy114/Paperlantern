import { useHome } from '@/hooks/useHome'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/Card'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import News from '@/components/News'
import Welcome from '@/components/pages/Welcome'

const PAGE_SIZE = 10

function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const paginated = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return { paginated, page, setPage, totalPages }
}

function Pagination({
  page,
  totalPages,
  setPage,
}: {
  page: number
  totalPages: number
  setPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        className="px-4 py-1.5 rounded text-sm bg-foreground text-background disabled:opacity-30 hover:opacity-80 transition-opacity cursor-pointer"
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}
      >
        ← PREV
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={`w-8 h-8 rounded text-sm transition-all cursor-pointer
            ${p === page
              ? 'bg-foreground text-background'
              : 'bg-secondary text-foreground hover:bg-muted border border-border'
            }`}
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        className="px-4 py-1.5 rounded text-sm bg-foreground text-background disabled:opacity-30 hover:opacity-80 transition-opacity cursor-pointer"
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}
      >
        NEXT →
      </button>
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
  color,
}: {
  title: string
  subtitle: string
  color: string
}) {
  return (
    <div className="mb-6 flex items-end gap-4">
      <div className="shrink-0">
        <div
          className="inline-block text-[10px] tracking-[0.22em] border px-2 py-0.5 rounded-sm mb-1 opacity-80"
          style={{ fontFamily: "'Bebas Neue', sans-serif", color, borderColor: color }}
        >
          {subtitle.toUpperCase()}
        </div>
        <h2
          className="text-foreground leading-none mt-5"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '34px',
            letterSpacing: '0.04em',
            fontWeight: 400,
          }}
        >
          {title}
        </h2>
      </div>
      <div
        className="flex-1 h-[2px] mb-1.5 opacity-50"
        style={{ background: color }}
      />
    </div>
  )
}

// Heart rank badge
function RankBadge({ color, glow }: { color: string; glow: string }) {
  return (
    <motion.div
      className="absolute -top-3 -left-2 z-10"
      style={{ filter: `drop-shadow(0 3px 8px ${glow})` }}
      animate={{ scale: [1, 1.22, 1] }}
      transition={{
        duration: 0.75,
        repeat: Infinity,
        repeatDelay: 1.2,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{ scale: 1.4 }}
    >
      <svg width="26" height="24" viewBox="0 0 30 27" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15 25C15 25 2 17 2 9C2 5.69 4.69 3 8 3C10.5 3 12.65 4.45 13.82 6.55C14.22 7.27 14.6 7.5 15 7.5C15.4 7.5 15.78 7.27 16.18 6.55C17.35 4.45 19.5 3 22 3C25.31 3 28 5.69 28 9C28 17 15 25 15 25Z"
          fill={color}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="1"
        />
      </svg>
    </motion.div>
  )
}
// Animated particle that floats in the hero
function HeroParticle({ x, y, size, delay, color }: { x: number; y: number; size: number; delay: number; color: string }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: color, opacity: 0 }}
      animate={{
        y: [0, -30, 0],
        opacity: [0, 0.5, 0],
        scale: [0.8, 1.2, 0.8],
      }}
      transition={{
        duration: 4 + Math.random() * 3,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 3 + Math.random() * 5,
  delay: i * 0.4,
  color: i % 3 === 0 ? 'rgba(251,191,36,0.7)' : i % 3 === 1 ? 'rgba(20,184,166,0.5)' : 'rgba(255,255,255,0.3)',
}))

export default function IndexHome() {
  const { hero, weeklyChart, freshReleases, latestChapters, cover } = useHome()
  const navigate = useNavigate()
  const [activeHero, setActiveHero] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const weekly = usePagination(weeklyChart)
  const fresh = usePagination(freshReleases)
  const latest = usePagination(latestChapters.filter((c) => c.work != null))

  const RANK_COLORS = [
    { color: '#f59e0b', glow: 'rgba(245,158,11,0.7)' },
    { color: '#60a5fa', glow: 'rgba(96,165,250,0.5)' },
    { color: '#f472b6', glow: 'rgba(244,114,182,0.5)'},
    { color: '#fda4af', glow: 'rgba(253,164,175,0.5)'},
    { color: '#f59e0b', glow: 'rgba(245,158,11,0.7)' },
    { color: '#60a5fa', glow: 'rgba(96,165,250,0.5)' },
    { color: '#f472b6', glow: 'rgba(244,114,182,0.5)'},
    { color: '#fda4af', glow: 'rgba(253,164,175,0.5)'},
    { color: '#f59e0b', glow: 'rgba(245,158,11,0.7)' },
    { color: '#fda4af', glow: 'rgba(253,164,175,0.5)'},
  ]

  // Auto-cycle hero
  useEffect(() => {
    if (hero.length < 2) return
    intervalRef.current = setInterval(() => {
      setActiveHero((p) => (p + 1) % hero.length)
    }, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [hero.length])

  const current = hero[activeHero]


  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />

    {weeklyChart.length === 0 && freshReleases.length === 0 && latestChapters.length === 0 && hero.length === 0 ? (
      <Welcome />
    ) : (
      <div className="w-full">

        {/* ── Hero ── ==========================================================*/}
        {hero.length > 0 && (
          <section className="relative w-full overflow-hidden mb-14 rounded-xl mt-5" style={{ height: 'clamp(420px, 60vw, 540px)' }}>

            {/* Background image — cross-fade on hero change */}
            {hero.map((work, i) => (
              <motion.div
                key={work.id}
                className="absolute inset-0"
                animate={{ opacity: i === activeHero ? 1 : 0 }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
              >
                <img
                  src={cover(work.banner ?? work.cover)!}
                  alt={work.title}
                  className="w-full h-full object-cover"
                  style={{ filter: 'saturate(0.85) contrast(1.08)' }}
                />
              </motion.div>
            ))}

            {/* Cinematic vignette */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/40 to-black/0 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/0 pointer-events-none" />

            {/* Animated scan-line shimmer */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
              }}
            />

            {/* Floating particles — hidden on mobile for perf */}
            <div className="hidden sm:block">
              {PARTICLES.map((p, i) => <HeroParticle key={i} {...p} />)}
            </div>

            {/* Glowing orb */}
            <motion.div
              className="absolute pointer-events-none"
              style={{
                left: '-5%',
                top: '20%',
                width: '420px',
                height: '420px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Hero content */}
            <motion.div
              key={activeHero}
              className="absolute bottom-8 left-4 right-4 sm:left-10 sm:right-auto sm:max-w-[480px] sm:bottom-12"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              {/* Sticky note — hidden on mobile */}
              <div
                className="hidden sm:block absolute -top-10 right-0 px-3 py-1.5 rotate-[2deg] z-20"
                style={{
                  background: '#fca5a5',
                  fontFamily: "'Kalam', cursive",
                  fontSize: '11px',
                  color: '#1a1a1a',
                  boxShadow: '2px 3px 6px rgba(0,0,0,0.25)',
                  lineHeight: 1.4,
                }}
              >
                🔥 trending now
              </div>

              {/* Badge */}
              <motion.div
                className="inline-block text-[10px] sm:text-[11px] tracking-[0.28em] px-2.5 py-0.5 rounded-sm mb-2 sm:mb-3 bg-amber-500/20 border border-amber-400/60 text-amber-300"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {current?.type === 'webtoon' ? 'WEBTOON' : 'NOVEL'}
              </motion.div>

              <motion.h1
                className="text-white leading-[0.93] mb-2 sm:mb-3 truncate text-start"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(32px, 8vw, 68px)',
                  fontWeight: 400,
                  letterSpacing: '0.03em',
                  textShadow: '0 2px 20px rgba(0,0,0,0.6), 2px 2px 0 rgba(0,0,0,0.4)',
                  maxWidth: '100%',
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.45 }}
              >
                {current?.title}
              </motion.h1>

              {current?.description && (
                <motion.p
                  className="hidden sm:block text-white/65 text-[13px] leading-relaxed mb-6 line-clamp-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.28, duration: 0.4 }}
                >
                  {current.description}
                </motion.p>
              )}

              {/* Mobile-only short description (1 line) */}
              {current?.description && (
                <motion.p
                  className="sm:hidden text-white/60 text-[11px] leading-relaxed mb-3 line-clamp-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.28, duration: 0.4 }}
                >
                  {current.description}
                </motion.p>
              )}

              <motion.div
                className="flex gap-2 sm:gap-3 items-center flex-wrap"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
              >
                <button
                  onClick={() => navigate(`/comics/${current?.id}`)}
                  className="group relative px-4 sm:px-6 py-2 sm:py-2.5 cursor-pointer overflow-hidden
                    bg-black border-2 border-white text-white"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 'clamp(12px, 3vw, 15px)',
                    letterSpacing: '0.1em',
                    boxShadow: '3px 3px 0 rgba(255,255,255,0.6)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translate(-1px, -1px)'
                    e.currentTarget.style.boxShadow = '4px 4px 0 rgba(255,255,255,0.6)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translate(0, 0)'
                    e.currentTarget.style.boxShadow = '3px 3px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  {/* Shine sweep */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                  />
                  <span className="relative z-10">▶ READ NOW</span>
                </button>

                <button
                  onClick={() => navigate(`/comics/${current?.id}`)}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 text-white/80 border border-white/25 hover:border-white/60 hover:text-white transition-all cursor-pointer backdrop-blur-sm bg-white/5"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(12px, 3vw, 15px)', letterSpacing: '0.1em' }}
                >
                  ⓘ INFO
                </button>

                {/* Status sticky — hidden on mobile */}
                <div
                  className="hidden sm:block -rotate-1 px-2 py-1 ml-2 self-center"
                  style={{
                    background: '#fef08a',
                    fontFamily: "'Kalam', cursive",
                    fontSize: '10px',
                    color: '#1a1a1a',
                    boxShadow: '1px 2px 4px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {current?.status === 'completed' ? '✓ completed!' : 'ongoing~'}
                </div>

                {/* Mobile-only status pill */}
                <span
                  className="sm:hidden text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-white/60"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                >
                  {current?.status === 'completed' ? '✓ DONE' : '● ONGOING'}
                </span>
              </motion.div>
            </motion.div>

            {/* Thumbnail strip — bottom on mobile, right side on desktop */}
            {hero.length > 1 && (
              <>
                {/* Mobile: dot indicators */}
                <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {hero.slice(0, 4).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveHero(i)
                        if (intervalRef.current) clearInterval(intervalRef.current)
                      }}
                      className="cursor-pointer transition-all"
                      style={{
                        width: i === activeHero ? '20px' : '6px',
                        height: '6px',
                        borderRadius: '3px',
                        background: i === activeHero ? '#f59e0b' : 'rgba(255,255,255,0.35)',
                        transition: 'all 0.3s',
                      }}
                    />
                  ))}
                </div>

                {/* Desktop: thumbnail strip */}
                <div className="hidden sm:flex absolute bottom-12 right-8 flex-col gap-2">
                  {hero.slice(0, 4).map((work, i) => (
                    <motion.button
                      key={work.id}
                      onClick={() => {
                        setActiveHero(i)
                        if (intervalRef.current) clearInterval(intervalRef.current)
                      }}
                      className="relative w-16 h-[88px] rounded overflow-hidden shrink-0 cursor-pointer"
                      style={{
                        border: i === activeHero ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.15)',
                        boxShadow: i === activeHero ? '0 0 12px rgba(245,158,11,0.4)' : 'none',
                        opacity: i === activeHero ? 1 : 0.55,
                        transition: 'all 0.25s',
                      }}
                      whileHover={{ opacity: 1, scale: 1.04 }}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: i === activeHero ? 1 : 0.55, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                    >
                      {cover(work.cover) && (
                        <img src={cover(work.cover)!} alt={work.title} className="w-full h-full object-cover" />
                      )}
                      {i === activeHero && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"
                          layoutId="active-thumb"
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </>
            )}

            {/* Progress bar */}
            {hero.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 rounded-b-xl overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                  key={activeHero}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                />
              </div>
            )}

            {/* Vol stamp */}
            <div
              className="absolute top-5 left-4 sm:left-10 text-white/20 tracking-[0.2em] text-[10px]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              PAPER LANTERN
            </div>
          </section>
        )}
        

        <div className="px-6">

          {/* ── Weekly Chart ── ==========================================================*/}
          {weeklyChart.length > 0 && (
            <section className="mb-14">
              <SectionHeader title="Weekly Chart" subtitle="Top by views this week" color="#14b8a6" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {weekly.paginated.map((work, i) => (
                  <motion.div
                    key={work.id}
                    className="relative"
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.055, duration: 0.32, ease: 'easeOut' }}
                  >
                    <RankBadge
                      color={RANK_COLORS[i]?.color ?? '#6b7280'}
                      glow={RANK_COLORS[i]?.glow ?? 'rgba(107,114,128,0.4)'}
                    />
                    <Card
                      id={work.id}
                      title={work.title}
                      cover={cover(work.cover)}
                      type={work.type}
                      likes={work.likes ?? 0}
                      rank={(weekly.page - 1) * PAGE_SIZE + i + 1}
                    />
                  </motion.div>
                ))}
              </div>
              <Pagination page={weekly.page} totalPages={weekly.totalPages} setPage={weekly.setPage} />
            </section>
          )}

          <News audience="public" />

          {/* ── Fresh Releases ── ==========================================================*/}
          {freshReleases.length > 0 && (
            <section className="mb-14">
              <SectionHeader title="Fresh Releases" subtitle="New works this week" color="#f97316" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {fresh.paginated.map((work, i) => (
                  <motion.div
                    key={work.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.055, duration: 0.32, ease: 'easeOut' }}
                  >
                    <Card id={work.id} title={work.title} cover={cover(work.cover)} type={work.type} />
                  </motion.div>
                ))}
              </div>
              <Pagination page={fresh.page} totalPages={fresh.totalPages} setPage={fresh.setPage} />
            </section>
          )}

          {/* ── Latest Chapters ── ==========================================================*/}
          {latest.paginated.length > 0 && (
            <section className="mb-14">
              <SectionHeader title="Latest Chapters" subtitle="Recently updated" color="#f59e0b" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {latest.paginated.map((chapter, i) => (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.055, duration: 0.32, ease: 'easeOut' }}
                  >
                    <Card
                      id={chapter.work.id}
                      title={chapter.work.title}
                      cover={cover(chapter.cover ?? chapter.work.cover)}
                      chapter={{ order: chapter.order, title: chapter.title }}
                    />
                  </motion.div>
                ))}
              </div>
              <Pagination page={latest.page} totalPages={latest.totalPages} setPage={latest.setPage} />
            </section>
          )}

        </div>
      </div>
    )}
    </>
  )
}