import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ScrollButton() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      // hide once user starts scrolling
      setShow(window.scrollY < 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
      <AnimatePresence>
        {show && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            aria-label="Scroll to bottom"
            className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2 cursor-pointer border-none bg-transparent p-0 group"
          >
            {/* Mouse shape */}
            <div className="w-7 h-11 rounded-full border-2 border-foreground/30 group-hover:border-foreground/70 transition-colors duration-300 flex justify-center pt-2">
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="w-1 h-1 rounded-full bg-foreground/40 group-hover:bg-foreground/80 transition-colors duration-300"
              />
            </div>

            {/* Label */}
            <span
              className="text-foreground/40 group-hover:text-foreground/70 transition-colors duration-300 tracking-[0.2em] text-[9px]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              SCROLL DOWN
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}