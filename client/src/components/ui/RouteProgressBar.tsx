import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const RunnerSVG = ({ frame }: { frame: number }) => {
  const frames = [
    <svg key={0} width="22" height="26" viewBox="0 0 20 24" fill="none">
      <circle cx="10" cy="3" r="2.5" fill="currentColor"/>
      <line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="10" y1="9" x2="5" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10" y1="9" x2="15" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10" y1="14" x2="5" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="10" y1="14" x2="15" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    <svg key={1} width="22" height="26" viewBox="0 0 20 24" fill="none">
      <circle cx="10" cy="3" r="2.5" fill="currentColor"/>
      <line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="10" y1="9" x2="4" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10" y1="9" x2="16" y2="11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10" y1="14" x2="7" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="10" y1="14" x2="14" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    <svg key={2} width="22" height="26" viewBox="0 0 20 24" fill="none">
      <circle cx="10" cy="2" r="2.5" fill="currentColor"/>
      <line x1="10" y1="5" x2="10" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="10" y1="8" x2="3" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10" y1="8" x2="17" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10" y1="13" x2="4" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="10" y1="13" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
  ]
  return frames[frame % 3]
}

export default function RouteProgressBar() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [frame, setFrame] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startBar = () => {
    clearInterval(intervalRef.current!)
    clearInterval(frameRef.current!)
    clearTimeout(timerRef.current!)
    setVisible(true)
    setProgress(0)
    timerRef.current = setTimeout(() => setProgress(20), 30)
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 80) { clearInterval(intervalRef.current!); return p }
        return p + Math.random() * 9
      })
    }, 280)
    frameRef.current = setInterval(() => {
      setFrame(f => f + 1)
    }, 120)
  }

  const finishBar = () => {
    clearInterval(intervalRef.current!)
    clearInterval(frameRef.current!)
    clearTimeout(timerRef.current!)
    setProgress(100)
    timerRef.current = setTimeout(() => setVisible(false), 500)
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return
      if (href === location.pathname) return
      startBar()
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [location.pathname])

  useEffect(() => {
    const originalPushState = history.pushState.bind(history)
    history.pushState = (...args) => {
      startBar()
      return originalPushState(...args)
    }
    return () => { history.pushState = originalPushState }
  }, [])

  useEffect(() => {
    finishBar()
  }, [location.pathname, location.search])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Track */}
          <div className="w-full h-[3px] bg-foreground/20" />

          {/* Filled bar */}
          <motion.div
            className="absolute top-0 left-0 h-[3px] bg-foreground/70"
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: progress === 100 ? 0.2 : 0.4 }}
          />

          {/* Runner */}
          <motion.div
            className="absolute text-foreground"
            style={{ top: '-24px' }}
            animate={{ left: `calc(${progress}% - 11px)` }}
            transition={{ ease: 'easeOut', duration: progress === 100 ? 0.2 : 0.4 }}
          >
            <RunnerSVG frame={frame} />
          </motion.div>

          {/* Dust puffs */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`${progress.toFixed(0)}-${i}`}
              className="absolute top-0 rounded-full bg-foreground/40"
              style={{
                width: `${4 + i * 2}px`,
                height: `${4 + i * 2}px`,
                left: `calc(${progress}% - ${22 + i * 12}px)`,
                marginTop: `-${2 + i}px`,
              }}
              initial={{ opacity: 0.7, scale: 1 }}
              animate={{ opacity: 0, scale: 2, y: -(4 + i * 3) }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}