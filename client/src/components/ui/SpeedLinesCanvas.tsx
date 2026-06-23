import { useEffect, useRef } from 'react'

//for coming soon
export default function SpeedLinesCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

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

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}
