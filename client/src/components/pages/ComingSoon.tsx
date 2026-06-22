import { useEffect, useRef } from 'react'

export default function ComingSoon() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Animated speed lines on canvas
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

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
                rel="stylesheet"
            />

            <div className="relative min-h-[82vh] flex flex-col items-center justify-center overflow-hidden bg-[#fffdf5] dark:bg-[#1a1712] px-4">
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

                {/* Speed lines canvas */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* Panel border — comic page feel */}
                <div
                    className="relative z-10 w-full max-w-2xl border-[3px] border-foreground bg-[#fffdf5]/90 dark:bg-[#1e1b14]/90 backdrop-blur-sm"
                    style={{ boxShadow: '7px 7px 0 var(--foreground)' }}
                >
                    {/* Amber top stripe */}
                    <div
                        className="absolute top-0 left-0 right-0 h-[4px]"
                        style={{
                            background:
                                'linear-gradient(90deg, #e8a838 0%, #d97706 40%, #b45309 70%, #e8a838 100%)',
                        }}
                    />

                    {/* Panel label — top left */}
                    <div className="absolute -top-[13px] left-5 bg-foreground px-3 py-0.5">
                        <span
                            className="text-background text-[10px] tracking-[0.22em]"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            ◆ LATER N COMIX — BLOG
                        </span>
                    </div>

                    {/* Issue tag — top right */}
                    <div
                        className="absolute -top-[13px] right-5 bg-amber-400 border-2 border-foreground px-3 py-0.5"
                        style={{ boxShadow: '2px 2px 0 var(--foreground)' }}
                    >
                        <span
                            className="text-[#1a1a1a] text-[10px] tracking-[0.18em]"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            ISSUE #00
                        </span>
                    </div>

                    <div className="px-8 pt-12 pb-10 text-center flex flex-col items-center gap-6">
                        {/* SFX label */}
                        <div className="flex items-center gap-3 w-full justify-center">
                            <div className="flex-1 h-[2px] bg-foreground/15" />
                            <span
                                className="text-[11px] tracking-[0.24em] text-amber-500"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                ✦ SOMETHING'S BREWING ✦
                            </span>
                            <div className="flex-1 h-[2px] bg-foreground/15" />
                        </div>

                        {/* COMING SOON — big stacked comic type */}
                        <div className="relative select-none">
                            {/* Shadow layer */}
                            <div
                                className="absolute top-[6px] left-[6px] text-[88px] sm:text-[110px] leading-[0.88] tracking-[0.02em] text-foreground/10 dark:text-foreground/8 pointer-events-none"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                COMING
                                <br />
                                SOON
                            </div>
                            {/* Main text */}
                            <div
                                className="relative text-[88px] sm:text-[110px] leading-[0.88] tracking-[0.02em] text-foreground dark:text-[#f0ebe4]"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                COMING
                                <br />
                                SOON
                            </div>
                            {/* Amber underline accent on SOON */}
                            <div
                                className="absolute bottom-1 left-0 right-0 h-[5px] bg-amber-400 border-t-2 border-b-2 border-foreground"
                                style={{ transform: 'skewX(-2deg)' }}
                            />
                        </div>

                        {/* Speech bubble */}
                        <div className="relative mt-2">
                            <div
                                className="relative border-[2.5px] border-foreground bg-[#fff8e7] dark:bg-[#2a2518] px-6 py-3"
                                style={{
                                    boxShadow: '3px 3px 0 var(--foreground)',
                                    borderRadius: '4px 18px 18px 18px',
                                }}
                            >
                                {/* Bubble tail */}
                                <div
                                    className="absolute -top-[11px] left-5 w-0 h-0"
                                    style={{
                                        borderLeft: '10px solid transparent',
                                        borderRight: '10px solid transparent',
                                        borderBottom: '11px solid var(--foreground)',
                                    }}
                                />
                                <div
                                    className="absolute -top-[8px] left-[22px] w-0 h-0"
                                    style={{
                                        borderLeft: '8px solid transparent',
                                        borderRight: '8px solid transparent',
                                        borderBottom: '9px solid #fff8e7',
                                    }}
                                />
                                <p
                                    className="text-[13px] sm:text-[14px] tracking-[0.08em] text-foreground dark:text-[#e8dfc8] leading-snug"
                                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                >
                                    Our blog is getting its ink ready.
                                    <br />
                                    <span className="text-amber-600 dark:text-amber-400">
                                        Creator spotlights, updates & stories — arriving soon.
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Action chips */}
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                            <div
                                className="px-4 py-1.5 border-2 border-foreground bg-foreground text-background text-[12px] tracking-[0.14em]"
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    boxShadow: '3px 3px 0 #e8a838',
                                }}
                            >
                                ◆ STAY TUNED
                            </div>
                            <div
                                className="px-4 py-1.5 border-2 border-foreground text-foreground text-[12px] tracking-[0.14em] bg-transparent"
                                style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    boxShadow: '3px 3px 0 var(--foreground)',
                                }}
                            >
                                ☆ FOLLOW US
                            </div>
                        </div>

                        {/* Bottom panel divider */}
                        <div className="flex items-center gap-2 w-full mt-2">
                            <div className="flex-1 h-[2px] bg-foreground/10" />
                            <span
                                className="text-[10px] tracking-[0.22em] text-muted-foreground"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                ★ LATER N COMIX PUBLISHING ★
                            </span>
                            <div className="flex-1 h-[2px] bg-foreground/10" />
                        </div>
                    </div>

                    {/* Bottom accent stripe */}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-[3px]"
                        style={{
                            background:
                                'linear-gradient(90deg, #b45309 0%, #d97706 50%, #e8a838 100%)',
                        }}
                    />
                </div>

                {/* Scattered background panels — decorative comic feel */}
                <div
                    className="absolute top-8 left-4 sm:left-12 w-20 h-28 border-[2.5px] border-foreground/20 dark:border-foreground/10 rotate-[-4deg] pointer-events-none"
                    style={{ background: 'transparent' }}
                />
                <div className="absolute bottom-10 right-4 sm:right-12 w-16 h-20 border-[2.5px] border-foreground/15 dark:border-foreground/8 rotate-[3deg] pointer-events-none" />
                <div className="absolute top-16 right-8 sm:right-24 w-10 h-14 border-2 border-amber-400/30 rotate-[6deg] pointer-events-none" />
            </div>
        </>
    )
}
