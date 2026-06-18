import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const INK_SPLATS = [
  { color: '#f59e0b', x: -10,  y: -10, size: 18, delay: 0    },
  { color: '#f472b6', x: 60,  y: -8,  size: 14, delay: 0.05 },
  { color: '#ef4444', x: 100, y: -5,  size: 16, delay: 0.08 },
  { color: '#f59e0b', x: -6,  y: 10,  size: 12, delay: 0.06 },
  { color: '#f472b6', x: 130, y: 24,  size: 10, delay: 0.1  },
  { color: '#fbbf24', x: 55,  y: 32,  size: 8,  delay: 0.12 },
]

export default function PaperLantern() {
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    setClicked(true)
    setTimeout(() => setClicked(false), 600)
  }

  return (
    <div className="relative shrink-0 mr-2">

      {/* Ink splats — on hover or click */}
      <AnimatePresence>
        {(hovered || clicked) && INK_SPLATS.map((splat, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none rounded-full z-20"
            style={{
              background: splat.color,
              width: splat.size,
              height: splat.size,
              left: splat.x,
              top: splat.y,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: clicked ? [0, 1.4, 0] : [0, 1.2, 1, 0],
              opacity: clicked ? [0, 1, 0] : [0, 1, 1, 0],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: clicked ? 0.4 : 0.8,
              delay: splat.delay,
              ease: 'easeOut',
            }}
          />
        ))}
      </AnimatePresence>

      <Link to="/" className="no-underline" onClick={handleClick}>
        <motion.div
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          whileHover={{ y: -2, rotate: [0, -2, 2, -1, 1, 0] }}
          whileTap={{ scale: 0.95, y: 1 }}
          transition={{ duration: 0.15 }}
          className="relative inline-flex items-center overflow-hidden border-[2.5px] border-foreground px-3 py-1"
          style={{ boxShadow: hovered ? '4px 4px 0 #f472b6' : '3px 3px 0 var(--foreground)', transition: 'box-shadow 0.15s' }}
        >
          {/* Static amber background */}
          <div className="absolute inset-0 bg-[#f59e0b]" />

          {/* Shine sweep on hover */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)' }}
            animate={{ x: hovered ? ['-100%', '200%'] : '-100%' }}
            transition={{ duration: 0.6, repeat: hovered ? Infinity : 0, repeatDelay: 0.8 }}
          />

          {/* Text */}
          <motion.span
            className="relative z-10 text-[19px] leading-none tracking-[0.06em] text-[#1a1a1a]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            animate={clicked ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            PAPER LANTERN
          </motion.span>

          {/* Bottom ink drip on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 w-1 rounded-full bg-[#f472b6] origin-top"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 8, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                style={{ bottom: '-8px' }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </Link>
    </div>
  )
}