// // components/pages/Welcome.tsx
// 'use client'

// import { useEffect, useRef } from 'react'
// import { motion } from 'framer-motion'
// import { useModalStore } from '@/store/modalStore'
// import { useAuthStore } from '@/store/authStore' // TODO: adjust to your actual auth store/hook

// const fadeUp = {
//     hidden: { opacity: 0, y: 14 },
//     visible: { opacity: 1, y: 0 },
// }

// export default function Welcome() {
//     const canvasRef = useRef<HTMLCanvasElement>(null)
//     const { openLogin } = useModalStore()
//     const user = useAuthStore((s) => s.user) // TODO: adjust selector to your store shape

//     useEffect(() => {
//         const canvas = canvasRef.current
//         if (!canvas) return
//         const ctx = canvas.getContext('2d')
//         if (!ctx) return

//         let frame = 0
//         let animId: number

//         const resize = () => {
//             canvas.width = canvas.offsetWidth
//             canvas.height = canvas.offsetHeight
//         }
//         resize()
//         window.addEventListener('resize', resize)

//         const draw = () => {
//             ctx.clearRect(0, 0, canvas.width, canvas.height)
//             const cx = canvas.width / 2
//             const cy = canvas.height / 2
//             const count = 28
//             const isDark = document.documentElement.classList.contains('dark')
//             const lineColor = isDark ? 'rgba(232,168,56,0.09)' : 'rgba(0,0,0,0.055)'

//             for (let i = 0; i < count; i++) {
//                 const angle = (i / count) * Math.PI * 2 + frame * 0.003
//                 const len = Math.max(canvas.width, canvas.height) * 1.2
//                 const wobble = Math.sin(frame * 0.02 + i) * 0.012
//                 ctx.beginPath()
//                 ctx.moveTo(cx, cy)
//                 ctx.lineTo(cx + Math.cos(angle + wobble) * len, cy + Math.sin(angle + wobble) * len)
//                 ctx.strokeStyle = lineColor
//                 ctx.lineWidth = i % 4 === 0 ? 2.5 : 1
//                 ctx.stroke()
//             }
//             frame++
//             animId = requestAnimationFrame(draw)
//         }
//         draw()
//         return () => {
//             cancelAnimationFrame(animId)
//             window.removeEventListener('resize', resize)
//         }
//     }, [])

//     const handleStartCreating = (e: React.MouseEvent<HTMLAnchorElement>) => {
//         if (!user) {
//             e.preventDefault()
//             openLogin()
//         }
//         // if logged in, lets <a href="/become-creator"> navigate normally
//     }

//     return (
//         <>
//             <link
//                 href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
//                 rel="stylesheet"
//             />

//             <div className="relative min-h-[82vh] flex flex-col items-center justify-center overflow-hidden bg-[#fffdf5] dark:bg-[#1a1712] px-4 py-10">
//                 {/* Halftone bg */}
//                 <div
//                     className="absolute inset-0 pointer-events-none dark:hidden"
//                     style={{
//                         backgroundImage:
//                             'radial-gradient(circle, rgba(0,0,0,0.065) 1.2px, transparent 1.2px)',
//                         backgroundSize: '9px 9px',
//                     }}
//                 />
//                 <div
//                     className="absolute inset-0 pointer-events-none hidden dark:block"
//                     style={{
//                         backgroundImage:
//                             'radial-gradient(circle, rgba(232,168,56,0.11) 1.2px, transparent 1.2px)',
//                         backgroundSize: '9px 9px',
//                     }}
//                 />

//                 {/* Speed lines */}
//                 <canvas
//                     ref={canvasRef}
//                     className="absolute inset-0 w-full h-full pointer-events-none"
//                 />

//                 <div
//                     className="relative z-10 w-full max-w-2xl border-[3px] border-[#1a1a1a] bg-[#fffdf5]/90 dark:bg-[#1e1b14]/90 backdrop-blur-sm overflow-hidden"
//                     style={{ boxShadow: '7px 7px 0 #1a1a1a' }}
//                 >
//                     <div
//                         className="absolute top-0 left-0 right-0 h-[4px]"
//                         style={{
//                             background:
//                                 'linear-gradient(90deg, #e8a838 0%, #d97706 40%, #b45309 70%, #e8a838 100%)',
//                         }}
//                     />

//                     <div className="flex items-center justify-between px-4 sm:px-5 py-2 bg-[#1a1a1a] dark:bg-[#2a2825] mt-1">
//                         <span
//                             className="text-[11px] tracking-[0.25em] text-[#f77c9b]"
//                             style={{ fontFamily: "'Bebas Neue', sans-serif" }}
//                         >
//                             ◆ LATER N COMIX
//                         </span>
//                         <span
//                             className="text-[10px] tracking-[0.18em] text-[#1a1a1a] bg-amber-400 px-2.5 py-0.5 border-2 border-[#1a1a1a]"
//                             style={{ fontFamily: "'Bebas Neue', sans-serif" }}
//                         >
//                             ISSUE #01
//                         </span>
//                     </div>

//                     <div className="px-6 sm:px-8 pt-8 pb-7 text-center flex flex-col items-center gap-6">
//                         <motion.div
//                             initial="hidden"
//                             animate="visible"
//                             variants={fadeUp}
//                             transition={{ duration: 0.5, delay: 0.05 }}
//                             className="flex items-center gap-3 w-full justify-center"
//                         >
//                             <div className="flex-1 max-w-[80px] h-[2px] bg-foreground/15" />
//                             <span
//                                 className="text-[11px] tracking-[0.24em] text-amber-500"
//                                 style={{ fontFamily: "'Bebas Neue', sans-serif" }}
//                             >
//                                 ✦ A COZY CORNER FOR STORIES ✦
//                             </span>
//                             <div className="flex-1 max-w-[80px] h-[2px] bg-foreground/15" />
//                         </motion.div>

//                         <div className="flex items-center justify-center gap-4 sm:gap-5 flex-wrap">
//                             <motion.svg
//                                 width="80"
//                                 height="80"
//                                 viewBox="0 0 80 80"
//                                 className="flex-shrink-0"
//                                 initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
//                                 animate={{ opacity: 1, scale: 1, rotate: [-3, 3, -3] }}
//                                 transition={{
//                                     opacity: { duration: 0.4 },
//                                     scale: { duration: 0.4 },
//                                     rotate: {
//                                         duration: 2.4,
//                                         repeat: Infinity,
//                                         ease: 'easeInOut',
//                                         delay: 0.4,
//                                     },
//                                 }}
//                             >
//                                 <ellipse
//                                     cx="40"
//                                     cy="68"
//                                     rx="22"
//                                     ry="6"
//                                     fill="currentColor"
//                                     className="text-foreground/10"
//                                 />
//                                 <path
//                                     d="M22 40 Q18 18 32 16 L34 26 Q40 22 46 26 L48 16 Q62 18 58 40 Z"
//                                     fill="#f77c9b"
//                                 />
//                                 <circle cx="40" cy="44" r="22" fill="#f77c9b" />
//                                 <circle cx="32" cy="42" r="3.2" fill="#fffdf5" />
//                                 <circle cx="48" cy="42" r="3.2" fill="#fffdf5" />
//                                 <circle cx="32" cy="42" r="1.3" fill="#4b1528" />
//                                 <circle cx="48" cy="42" r="1.3" fill="#4b1528" />
//                                 <path
//                                     d="M36 50 Q40 54 44 50"
//                                     stroke="#4b1528"
//                                     strokeWidth="2"
//                                     fill="none"
//                                     strokeLinecap="round"
//                                 />
//                                 <ellipse cx="40" cy="47" rx="1.6" ry="1.2" fill="#4b1528" />
//                                 <path
//                                     d="M14 44 Q4 38 8 28"
//                                     stroke="#f77c9b"
//                                     strokeWidth="5"
//                                     fill="none"
//                                     strokeLinecap="round"
//                                 />
//                             </motion.svg>
//                         </div>

//                         <motion.div
//                             initial="hidden"
//                             animate="visible"
//                             variants={fadeUp}
//                             transition={{ duration: 0.5, delay: 0.3 }}
//                             className="relative mt-1"
//                         >
//                             <div
//                                 className="absolute -top-[11px] left-5 w-0 h-0"
//                                 style={{
//                                     borderLeft: '10px solid transparent',
//                                     borderRight: '10px solid transparent',
//                                     borderBottom: '11px solid #1a1a1a',
//                                 }}
//                             />
//                             <div
//                                 className="absolute -top-[8px] left-[22px] w-0 h-0 dark:hidden"
//                                 style={{
//                                     borderLeft: '8px solid transparent',
//                                     borderRight: '8px solid transparent',
//                                     borderBottom: '9px solid #fff8e7',
//                                 }}
//                             />
//                             <div
//                                 className="absolute -top-[8px] left-[22px] w-0 h-0 hidden dark:block"
//                                 style={{
//                                     borderLeft: '8px solid transparent',
//                                     borderRight: '8px solid transparent',
//                                     borderBottom: '9px solid #2a2518',
//                                 }}
//                             />
//                             <div
//                                 className="bg-[#fff8e7] dark:bg-[#2a2518] px-5 sm:px-6 py-3"
//                                 style={{
//                                     border: '2.5px solid #1a1a1a',
//                                     boxShadow: '3px 3px 0 #1a1a1a',
//                                     borderRadius: '4px 18px 18px 18px',
//                                 }}
//                             >
//                                 <p className="text-[13px] sm:text-[14px] tracking-[0.04em] text-foreground dark:text-[#e8dfc8] leading-relaxed">
//                                     Welcome to laterncomix 🏮
//                                     <br />
//                                     Grab a seat, the next chapter is just a page away.
//                                     <br />
//                                     <span className="text-amber-600 dark:text-amber-400">
//                                         Webcomics, novels &amp; serialized fiction await.
//                                     </span>
//                                 </p>
//                             </div>
//                         </motion.div>

//                         <motion.div
//                             initial="hidden"
//                             animate="visible"
//                             variants={fadeUp}
//                             transition={{ duration: 0.5, delay: 0.4 }}
//                             className="flex flex-wrap items-center justify-center gap-3"
//                         >
//                             <motion.a
//                                 href="/all-comics"
//                                 whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 #e8a838' }}
//                                 whileTap={{ x: 2, y: 2, boxShadow: '1px 1px 0 #e8a838' }}
//                                 className="px-5 py-2.5 border-2 border-foreground bg-[#1a1a1a] dark:bg-[#2a2825] text-[#f77c9b] text-[13px] tracking-[0.14em]"
//                                 style={{ boxShadow: '3px 3px 0 #e8a838', textDecoration: 'none' }}
//                             >
//                                 ▶ START READING
//                             </motion.a>
//                             <motion.a
//                                 href="/become-creator"
//                                 onClick={handleStartCreating}
//                                 whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 #1a1a1a' }}
//                                 whileTap={{ x: 2, y: 2, boxShadow: '1px 1px 0 #1a1a1a' }}
//                                 className="px-5 py-2.5 border-2 border-foreground text-foreground text-[13px] tracking-[0.14em] bg-transparent"
//                                 style={{ boxShadow: '3px 3px 0 #1a1a1a', textDecoration: 'none' }}
//                             >
//                                 ☉ START CREATING
//                             </motion.a>
//                         </motion.div>

//                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full text-left mt-1">
//                             {(
//                                 [
//                                     {
//                                         icon: 'ti-book-2',
//                                         label: 'COMICS',
//                                         sub: 'webtoons & manga',
//                                         accent: '#f77c9b',
//                                         n: '01',
//                                         dark: false,
//                                     },
//                                     {
//                                         icon: 'ti-feather',
//                                         label: 'NOVELS',
//                                         sub: 'wattpad-style',
//                                         accent: '#e8a838',
//                                         n: '02',
//                                         dark: false,
//                                     },
//                                     {
//                                         icon: 'ti-bolt',
//                                         label: 'SUPPORT',
//                                         sub: 'unlock chapters',
//                                         accent: '#e8a838',
//                                         n: '03',
//                                         dark: true,
//                                     },
//                                 ] as {
//                                     icon: string
//                                     label: string
//                                     sub: string
//                                     accent: string
//                                     n: string
//                                     dark: boolean
//                                 }[]
//                             ).map(({ icon, label, sub, accent, n, dark }, i) => (
//                                 <motion.div
//                                     key={label}
//                                     initial="hidden"
//                                     animate="visible"
//                                     variants={fadeUp}
//                                     transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
//                                     whileHover={{ x: -3, y: -3, boxShadow: '4px 4px 0 #1a1a1a' }}
//                                     className={`relative border-[2.5px] border-[#1a1a1a] p-4 ${dark ? 'bg-[#1a1a1a] dark:bg-[#3a342c]' : 'bg-[#fffdf5] dark:bg-[#1e1b14]'}`}
//                                 >
//                                     <div
//                                         className="absolute -top-0.5 -right-0.5 border-2 border-[#1a1a1a] text-[10px] tracking-[0.1em] px-2 py-0.5"
//                                         style={{
//                                             background: accent,
//                                             color: accent === '#e8a838' ? '#412402' : '#4b1528',
//                                             transform: 'translate(4px, -8px) rotate(8deg)',
//                                         }}
//                                     >
//                                         {n}
//                                     </div>
//                                     <i
//                                         className={`ti ${icon}`}
//                                         aria-hidden="true"
//                                         style={{
//                                             fontSize: '26px',
//                                             color: accent,
//                                             display: 'block',
//                                             marginBottom: '10px',
//                                         }}
//                                     />
//                                     <div
//                                         className={`text-[14px] tracking-[0.1em] font-medium mb-1 ${dark ? 'text-[#fffdf5]' : 'text-foreground'}`}
//                                     >
//                                         {label}
//                                     </div>
//                                     <div
//                                         className={`text-[11px] ${dark ? 'text-[#fffdf5]/55' : 'text-foreground/55'}`}
//                                         style={{ fontFamily: "'Noto Serif', serif" }}
//                                     >
//                                         {sub}
//                                     </div>
//                                     <div
//                                         className="h-1 mt-3 w-3/5"
//                                         style={{ background: accent, transform: 'skewX(-8deg)' }}
//                                     />
//                                 </motion.div>
//                             ))}
//                         </div>

//                         <motion.div
//                             initial="hidden"
//                             animate="visible"
//                             variants={fadeUp}
//                             transition={{ duration: 0.5, delay: 0.8 }}
//                             className="flex items-center gap-2 w-full"
//                         >
//                             <div className="flex-1 h-[2px] bg-foreground/10" />
//                             <span
//                                 className="text-[10px] tracking-[0.22em] text-muted-foreground"
//                                 style={{ fontFamily: "'Bebas Neue', sans-serif" }}
//                             >
//                                 ★ LATER N COMIX PUBLISHING ★
//                             </span>
//                             <div className="flex-1 h-[2px] bg-foreground/10" />
//                         </motion.div>
//                     </div>

//                     <div
//                         className="absolute bottom-0 left-0 right-0 h-[3px]"
//                         style={{
//                             background:
//                                 'linear-gradient(90deg, #b45309 0%, #d97706 50%, #e8a838 100%)',
//                         }}
//                     />
//                 </div>
//             </div>
//         </>
//     )
// }
// components/pages/Welcome.tsx
'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useModalStore } from '@/store/modalStore'
import { useAuthStore } from '@/store/authStore' // TODO: adjust to your actual auth store/hook

const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
}

export default function Welcome() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { openLogin } = useModalStore()
    const user = useAuthStore((s) => s.user) // TODO: adjust selector to your store shape

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let frame = 0
        let animId: number

        const resize = () => {
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
        }
        resize()
        window.addEventListener('resize', resize)

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            const cx = canvas.width / 2
            const cy = canvas.height / 2
            const count = 28
            const isDark = document.documentElement.classList.contains('dark')
            const lineColor = isDark ? 'rgba(232,168,56,0.09)' : 'rgba(0,0,0,0.055)'

            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + frame * 0.003
                const len = Math.max(canvas.width, canvas.height) * 1.2
                const wobble = Math.sin(frame * 0.02 + i) * 0.012
                ctx.beginPath()
                ctx.moveTo(cx, cy)
                ctx.lineTo(cx + Math.cos(angle + wobble) * len, cy + Math.sin(angle + wobble) * len)
                ctx.strokeStyle = lineColor
                ctx.lineWidth = i % 4 === 0 ? 2.5 : 1
                ctx.stroke()
            }
            frame++
            animId = requestAnimationFrame(draw)
        }
        draw()
        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', resize)
        }
    }, [])

    const handleStartCreating = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!user) {
            e.preventDefault()
            openLogin()
        }
        // if logged in, lets <a href="/become-creator"> navigate normally
    }

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"
                rel="stylesheet"
            />

            <div className="relative min-h-[82vh] flex flex-col items-center justify-center overflow-hidden bg-[#fffdf5] dark:bg-[#1a1712] px-4 py-10">
                {/* Halftone bg */}
                <div
                    className="absolute inset-0 pointer-events-none dark:hidden"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, rgba(0,0,0,0.065) 1.2px, transparent 1.2px)',
                        backgroundSize: '9px 9px',
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none hidden dark:block"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, rgba(232,168,56,0.11) 1.2px, transparent 1.2px)',
                        backgroundSize: '9px 9px',
                    }}
                />

                {/* Speed lines */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                />

                <div
                    className="relative z-10 w-full max-w-2xl border-[3px] border-[#1a1a1a] bg-[#fffdf5]/90 dark:bg-[#1e1b14]/90 backdrop-blur-sm overflow-hidden"
                    style={{ boxShadow: '7px 7px 0 #1a1a1a' }}
                >
                    <div
                        className="absolute top-0 left-0 right-0 h-[4px]"
                        style={{
                            background:
                                'linear-gradient(90deg, #e8a838 0%, #d97706 40%, #b45309 70%, #e8a838 100%)',
                        }}
                    />

                    <div className="flex items-center justify-between px-4 sm:px-5 py-2 bg-[#1a1a1a] dark:bg-[#2a2825] mt-1">
                        <span
                            className="text-[11px] tracking-[0.25em] text-[#f77c9b]"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            ◆ LATER N COMIX
                        </span>
                        <span
                            className="text-[10px] tracking-[0.18em] text-[#1a1a1a] bg-amber-400 px-2.5 py-0.5 border-2 border-[#1a1a1a]"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            ISSUE #01
                        </span>
                    </div>

                    <div className="px-6 sm:px-8 pt-8 pb-7 text-center flex flex-col items-center gap-6">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="flex items-center gap-3 w-full justify-center"
                        >
                            <div className="flex-1 max-w-[80px] h-[2px] bg-foreground/15" />
                            <span
                                className="text-[11px] tracking-[0.24em] text-amber-500"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                ✦ ISSUE #01 · THE FIRST PAGE ✦
                            </span>
                            <div className="flex-1 max-w-[80px] h-[2px] bg-foreground/15" />
                        </motion.div>

                        <div className="flex items-center justify-center gap-4 sm:gap-5 flex-wrap">
                            <motion.svg
                                width="80"
                                height="80"
                                viewBox="0 0 80 80"
                                className="flex-shrink-0"
                                initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                                animate={{ opacity: 1, scale: 1, rotate: [-3, 3, -3] }}
                                transition={{
                                    opacity: { duration: 0.4 },
                                    scale: { duration: 0.4 },
                                    rotate: {
                                        duration: 2.4,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: 0.4,
                                    },
                                }}
                            >
                                <ellipse
                                    cx="40"
                                    cy="68"
                                    rx="22"
                                    ry="6"
                                    fill="currentColor"
                                    className="text-foreground/10"
                                />
                                <path
                                    d="M22 40 Q18 18 32 16 L34 26 Q40 22 46 26 L48 16 Q62 18 58 40 Z"
                                    fill="#f77c9b"
                                />
                                <circle cx="40" cy="44" r="22" fill="#f77c9b" />
                                <circle cx="32" cy="42" r="3.2" fill="#fffdf5" />
                                <circle cx="48" cy="42" r="3.2" fill="#fffdf5" />
                                <circle cx="32" cy="42" r="1.3" fill="#4b1528" />
                                <circle cx="48" cy="42" r="1.3" fill="#4b1528" />
                                <path
                                    d="M36 50 Q40 54 44 50"
                                    stroke="#4b1528"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                                <ellipse cx="40" cy="47" rx="1.6" ry="1.2" fill="#4b1528" />
                                <path
                                    d="M14 44 Q4 38 8 28"
                                    stroke="#f77c9b"
                                    strokeWidth="5"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                            </motion.svg>
                        </div>

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="relative mt-1"
                        >
                            <div
                                className="absolute -top-[11px] left-5 w-0 h-0"
                                style={{
                                    borderLeft: '10px solid transparent',
                                    borderRight: '10px solid transparent',
                                    borderBottom: '11px solid #1a1a1a',
                                }}
                            />
                            <div
                                className="absolute -top-[8px] left-[22px] w-0 h-0 dark:hidden"
                                style={{
                                    borderLeft: '8px solid transparent',
                                    borderRight: '8px solid transparent',
                                    borderBottom: '9px solid #fff8e7',
                                }}
                            />
                            <div
                                className="absolute -top-[8px] left-[22px] w-0 h-0 hidden dark:block"
                                style={{
                                    borderLeft: '8px solid transparent',
                                    borderRight: '8px solid transparent',
                                    borderBottom: '9px solid #2a2518',
                                }}
                            />
                            <div
                                className="bg-[#fff8e7] dark:bg-[#2a2518] px-5 sm:px-6 py-3"
                                style={{
                                    border: '2.5px solid #1a1a1a',
                                    boxShadow: '3px 3px 0 #1a1a1a',
                                    borderRadius: '4px 18px 18px 18px',
                                }}
                            >
                                <p className="text-[13px] sm:text-[14px] tracking-[0.04em] text-foreground dark:text-[#e8dfc8] leading-relaxed">
                                    Welcome to laterncomix 🏮
                                    <br />
                                    These pages are blank — no comics, no novels, not yet.
                                    <br />
                                    <span className="text-amber-600 dark:text-amber-400">
                                        Be the first creator to publish here, and earn as readers
                                        follow your story.
                                    </span>
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="flex flex-wrap items-center justify-center gap-3"
                        >
                            <motion.a
                                href="/become-creator"
                                onClick={handleStartCreating}
                                whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 #e8a838' }}
                                whileTap={{ x: 2, y: 2, boxShadow: '1px 1px 0 #e8a838' }}
                                className="px-5 py-2.5 border-2 border-foreground bg-[#1a1a1a] dark:bg-[#2a2825] text-[#f77c9b] text-[13px] tracking-[0.14em]"
                                style={{ boxShadow: '3px 3px 0 #e8a838', textDecoration: 'none' }}
                            >
                                ✎ PUBLISH YOUR FIRST CHAPTER
                            </motion.a>
                            <motion.a
                                href="/all-comics"
                                whileHover={{ x: -2, y: -2, boxShadow: '5px 5px 0 #1a1a1a' }}
                                whileTap={{ x: 2, y: 2, boxShadow: '1px 1px 0 #1a1a1a' }}
                                className="px-5 py-2.5 border-2 border-foreground text-foreground text-[13px] tracking-[0.14em] bg-transparent"
                                style={{ boxShadow: '3px 3px 0 #1a1a1a', textDecoration: 'none' }}
                            >
                                ▶ LOOK AROUND
                            </motion.a>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full text-left mt-1">
                            {(
                                [
                                    {
                                        icon: 'ti-book-2',
                                        label: 'COMICS',
                                        sub: 'be the first webtoon',
                                        accent: '#f77c9b',
                                        n: '✦',
                                        dark: false,
                                    },
                                    {
                                        icon: 'ti-feather',
                                        label: 'NOVELS',
                                        sub: 'be the first story',
                                        accent: '#e8a838',
                                        n: '✦',
                                        dark: false,
                                    },
                                    {
                                        icon: 'ti-coin',
                                        label: 'PUBLISH + EARN',
                                        sub: 'get paid as you go',
                                        accent: '#e8a838',
                                        n: 'NEW',
                                        dark: true,
                                    },
                                ] as {
                                    icon: string
                                    label: string
                                    sub: string
                                    accent: string
                                    n: string
                                    dark: boolean
                                }[]
                            ).map(({ icon, label, sub, accent, n, dark }, i) => (
                                <motion.div
                                    key={label}
                                    initial="hidden"
                                    animate="visible"
                                    variants={fadeUp}
                                    transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                                    whileHover={{ x: -3, y: -3, boxShadow: '4px 4px 0 #1a1a1a' }}
                                    className={`relative border-[2.5px] border-[#1a1a1a] p-4 ${dark ? 'bg-[#1a1a1a] dark:bg-[#3a342c]' : 'bg-[#fffdf5] dark:bg-[#1e1b14]'}`}
                                >
                                    <div
                                        className="absolute -top-0.5 -right-0.5 border-2 border-[#1a1a1a] text-[10px] tracking-[0.1em] px-2 py-0.5"
                                        style={{
                                            background: accent,
                                            color: accent === '#e8a838' ? '#412402' : '#4b1528',
                                            transform: 'translate(4px, -8px) rotate(8deg)',
                                        }}
                                    >
                                        {n}
                                    </div>
                                    <i
                                        className={`ti ${icon}`}
                                        aria-hidden="true"
                                        style={{
                                            fontSize: '26px',
                                            color: accent,
                                            display: 'block',
                                            marginBottom: '10px',
                                        }}
                                    />
                                    <div
                                        className={`text-[14px] tracking-[0.1em] font-medium mb-1 ${dark ? 'text-[#fffdf5]' : 'text-foreground'}`}
                                    >
                                        {label}
                                    </div>
                                    <div
                                        className={`text-[11px] ${dark ? 'text-[#fffdf5]/55' : 'text-foreground/55'}`}
                                        style={{ fontFamily: "'Noto Serif', serif" }}
                                    >
                                        {sub}
                                    </div>
                                    <div
                                        className="h-1 mt-3 w-3/5"
                                        style={{ background: accent, transform: 'skewX(-8deg)' }}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            className="flex items-center gap-2 w-full"
                        >
                            <div className="flex-1 h-[2px] bg-foreground/10" />
                            <span
                                className="text-[10px] tracking-[0.22em] text-muted-foreground"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                ★ LATER N COMIX PUBLISHING ★
                            </span>
                            <div className="flex-1 h-[2px] bg-foreground/10" />
                        </motion.div>
                    </div>

                    <div
                        className="absolute bottom-0 left-0 right-0 h-[3px]"
                        style={{
                            background:
                                'linear-gradient(90deg, #b45309 0%, #d97706 50%, #e8a838 100%)',
                        }}
                    />
                </div>
            </div>
        </>
    )
}
