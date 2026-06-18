import { motion } from 'framer-motion'

const TEAM = [
  {
    role: 'Lead Developer',
    name: 'Fatma',
    note: 'built this with too much coffee ☕',
    color: '#bae6fd',
    rotate: '-2deg',
  },
  {
    role: 'UI / Design',
    name: 'Haya',
    note: 'every pixel placed with love 🎨',
    color: '#fef08a',
    rotate: '1.5deg',
  },
  {
    role: 'Backend',
    name: 'Hajar',
    note: 'databases are my love language 🗄️',
    color: '#86efac',
    rotate: '-1deg',
  },
]

const PINS = [
  { text: 'made with 💛', color: '#fef08a', rotate: '-3deg', top: '14%', left: '3%' },
  { text: 'for the artists 🎨', color: '#fca5a5', rotate: '2deg', top: '18%', right: '3%' },
  { text: 'share your story!', color: '#86efac', rotate: '-1.5deg', bottom: '22%', left: '3%' },
  { text: 'keep creating ✨', color: '#c4b5fd', rotate: '2.5deg', bottom: '18%', right: '3%' },
]

const FOR_ARTISTS = [
  { emoji: '🖊️', title: 'Writers', text: 'Publish your novels chapter by chapter. Build readers who wait for your updates.' },
  { emoji: '🎨', title: 'Webtoon Artists', text: 'Upload your panels, grow your fanbase, and tell stories only you can tell.' },
  { emoji: '🌏', title: 'Everyone', text: 'Any storyteller hobbyist or pro who has something to say.' },
]

export default function About() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16 text-left">

        {/* ── Hero Board ── */}
        <motion.div
          className="relative border-[2.5px] border-[#1a1a1a] dark:border-foreground/40 bg-[#faf8ee] dark:bg-[#191713] overflow-hidden mb-8"
          style={{ boxShadow: '5px 5px 0 #1a1a1a', minHeight: '280px' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Cork texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(139,115,85,0.5) 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }}
          />

          {/* Header bar */}
          <div className="relative bg-[#1a1a1a] px-4 py-2 flex items-center justify-between z-30">
            <span
              className="text-white tracking-[0.18em] text-xsmall"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              ◆ ABOUT US
            </span>
            <span
              className="text-white/30 text-xsmall"
              style={{ fontFamily: "'Kalam', cursive" }}
            >
              devOrbit × Paper Lantern
            </span>
          </div>

          {/* Floating sticky notes — desktop only */}
          {PINS.map((pin, i) => (
            <motion.div
              key={i}
              className="absolute px-3 py-2 text-small z-10 hidden sm:block"
              style={{
                background: pin.color,
                fontFamily: "'Kalam', cursive",
                color: '#1a1a1a',
                rotate: pin.rotate,
                top: pin.top,
                left: pin.left,
                right: pin.right,
                bottom: pin.bottom,
                boxShadow: '2px 3px 0 rgba(0,0,0,0.15)',
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
            >
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-8 h-4"
                style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.07)' }}
              />
              {pin.text}
            </motion.div>
          ))}

          {/* Center content */}
          <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 py-14 sm:py-16">
            <span
              className="text-amber-500 text-xsmall tracking-[0.3em] block mb-3"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              ◆ OUR STORY
            </span>
            <h1
              className="text-[#1a1a1a] dark:text-foreground leading-none mb-4"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(36px, 8vw, 68px)',
                letterSpacing: '0.04em',
              }}
            >
              PAPER LANTERN
            </h1>
            <p
              className="text-[#1a1a1a]/60 dark:text-foreground/60 max-w-sm mx-auto text-small sm:text-normal leading-relaxed"
              style={{ fontFamily: "'Noto Serif', serif" }}
            >
              A place built by creators, for creators. We believe every artist deserves a stage
              whether you draw webtoons at 2am or write novels on your lunch break.
            </p>
          </div>
        </motion.div>

        {/* ── Origin Story (notebook style) ── */}
        <motion.div
          className="relative border-[2.5px] border-[#1a1a1a] dark:border-foreground/40 bg-[#fffdf5] dark:bg-[#1c1a17] mb-8 overflow-hidden"
          style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Red margin line */}
          <div className="hidden sm:block absolute left-12 top-0 bottom-0 w-[1.5px] bg-red-300/60 dark:bg-red-500/20 pointer-events-none" />
          {/* Ruled lines */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-[1px] pointer-events-none"
              style={{ top: `${56 + i * 28}px`, background: 'rgba(100,140,255,0.1)' }}
            />
          ))}

          <div className="relative sm:pl-16 p-5 sm:p-6">
            {/* Pin */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 z-10"
              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
            />

            <span
              className="text-amber-500 text-xsmall tracking-[0.2em] block mb-3 mt-2"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              ◆ HOW IT STARTED
            </span>

            <p
              className="text-foreground/80 text-small sm:text-normal leading-relaxed mb-4"
              style={{ fontFamily: "'Noto Serif', serif" }}
            >
              Paper Lantern started as a side project by <strong>devOrbit</strong> — a small team of developers
              and artists who kept asking the same question:
            </p>

            {/* Quote sticky */}
            <div
              className="inline-block px-4 py-3 mb-4 text-small sm:text-normal"
              style={{
                background: '#fef08a',
                fontFamily: "'Kalam', cursive",
                color: '#1a1a1a',
                transform: 'rotate(-0.5deg)',
                boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
              }}
            >
              "why is it so hard for indie artists to share their work online?" 🤔
            </div>

            <p
              className="text-foreground/80 text-small sm:text-normal leading-relaxed mb-4"
              style={{ fontFamily: "'Noto Serif', serif" }}
            >
              So we built the answer. A platform where webtoon artists, novel writers, and storytellers
              of all kinds can publish freely, build an audience, and connect with readers who genuinely care.
            </p>

            <p
              className="text-foreground/80 text-small sm:text-normal leading-relaxed"
              style={{ fontFamily: "'Noto Serif', serif" }}
            >
              No gatekeeping. No algorithms burying your work. Just your story, your way. 🏮
            </p>
          </div>
        </motion.div>

        {/* ── Team Board ── */}
        <motion.div
          className="relative border-[2.5px] border-[#1a1a1a] dark:border-foreground/40 bg-[#faf8ee] dark:bg-[#191713] overflow-hidden mb-8"
          style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Cork texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(139,115,85,0.5) 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }}
          />

          <div className="relative bg-[#1a1a1a] px-4 py-2 flex items-center justify-between">
            <span
              className="text-white tracking-[0.18em] text-xsmall"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              ◆ THE TEAM
            </span>
            <div
              className="px-2 py-0.5 -rotate-1 text-xsmall"
              style={{ background: '#fca5a5', fontFamily: "'Kalam', cursive", color: '#1a1a1a', boxShadow: '1px 1px 0 rgba(0,0,0,0.2)' }}
            >
              devOrbit ✨
            </div>
          </div>

          <div className="relative p-6 sm:p-10 flex flex-wrap gap-6 justify-center">
            {TEAM.map((member, i) => (
              <motion.div
                key={i}
                className="relative"
                style={{ rotate: member.rotate }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 + 0.2 }}
                whileHover={{ scale: 1.05, rotate: '0deg', transition: { duration: 0.15 } }}
              >
                {/* Tape */}
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-5 z-10"
                  style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.07)' }}
                />
                <div
                  className="w-44 px-4 pt-6 pb-4 relative"
                  style={{
                    background: member.color,
                    boxShadow: '3px 4px 0 rgba(0,0,0,0.2)',
                    color: '#1a1a1a',
                  }}
                >
                  <p
                    className="text-xsmall tracking-[0.15em] opacity-60 mb-1"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {member.role}
                  </p>
                  <p
                    className="text-sub-title font-bold mb-2"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    {member.name}
                  </p>
                  <p
                    className="text-xsmall opacity-70 leading-snug"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    {member.note}
                  </p>
                  {/* Fold corner */}
                  <div
                    className="absolute bottom-0 right-0 w-5 h-5"
                    style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── For the Artists ── */}
        <motion.div
          className="relative border-[2.5px] border-[#1a1a1a] dark:border-foreground/40 bg-[#fffdf5] dark:bg-[#1c1a17] overflow-hidden mb-6"
          style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="bg-[#1a1a1a] px-4 py-2">
            <span
              className="text-white tracking-[0.18em] text-xsmall"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              ◆ FOR THE ARTISTS
            </span>
          </div>

        <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4">
        {FOR_ARTISTS.map((card, i) => {
            const CARD_COLORS = ['#fef08a', '#ffc6a6', '#86efac']
            return (
            <motion.div
                key={i}
                className="flex-1 p-4 relative"
                style={{
                background: CARD_COLORS[i],
                boxShadow: '2px 3px 0 rgba(0,0,0,0.15)',
                color: '#1a1a1a',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                whileHover={{ y: -2, rotate: '0.5deg', transition: { duration: 0.15 } }}
            >
                {/* Tape */}
                <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-5"
                style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.07)' }}
                />
                {/* Fold corner */}
                <div
                className="absolute bottom-0 right-0 w-5 h-5"
                style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)' }}
                />
                <span className="text-2xl block mb-3 mt-1">{card.emoji}</span>
                <p
                className="text-xsmall tracking-[0.12em] mb-1"
                style={{ fontFamily: "'Bebas Neue', sans-serif", color: '#1a1a1a' }}
                >
                {card.title}
                </p>
                <p
                className="text-small leading-relaxed"
                style={{ fontFamily: "'Kalam', cursive", color: '#1a1a1a', opacity: 0.75 }}
                >
                {card.text}
                </p>
            </motion.div>
            )
        })}
        </div>
        </motion.div>

        {/* ── Footer note ── */}
        <div className="flex items-center justify-between px-1">
          <span
            className="text-muted-foreground/40 text-xsmall tracking-[0.2em]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            PAPER LANTERN PUBLISHING
          </span>
          <div
            className="px-3 py-1 text-small"
            style={{
              background: '#fef08a',
              fontFamily: "'Kalam', cursive",
              color: '#1a1a1a',
              transform: 'rotate(-1deg)',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
            }}
          >
            made with 💛 by devOrbit
          </div>
          <span
            className="text-muted-foreground/40 text-xsmall tracking-[0.2em]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            © 2025
          </span>
        </div>

      </div>
    </>
  )
}