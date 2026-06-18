import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Navbar from '@/components/pages/Navbar'

export default function AuthLayout() {
  const { token } = useAuthStore()

  if (!token) return <Navigate to="/" replace />

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />

      <div className="relative min-h-screen flex flex-col">

        {/* Halftone dots — light */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.055) 1.2px, transparent 1.2px)',
            backgroundSize: '10px 10px',
          }}
        />
        {/* Halftone dots — dark */}
        <div
          className="fixed inset-0 pointer-events-none z-0 hidden dark:block"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(180,160,120,0.04) 1.2px, transparent 1.2px)',
            backgroundSize: '10px 10px',
          }}
        />

        {/* Speed lines — top-left burst */}
        <svg
          className="fixed top-0 left-0 pointer-events-none z-0 opacity-[0.04] dark:opacity-[0.06] w-[520px] h-[520px]"
          viewBox="0 0 520 520"
        >
          {Array.from({ length: 24 }, (_, i) => {
            const rad = ((i / 24) * 360 * Math.PI) / 180
            return (
              <line
                key={i}
                x1="0" y1="0"
                x2={Math.cos(rad) * 700}
                y2={Math.sin(rad) * 700}
                stroke={i % 4 === 0 ? '#f59e0b' : '#1a1a1a'}
                strokeWidth={i % 6 === 0 ? 3 : i % 3 === 0 ? 1.5 : 0.8}
              />
            )
          })}
        </svg>

        {/* Speed lines — bottom-right burst */}
        <svg
          className="fixed bottom-0 right-0 pointer-events-none z-0 opacity-[0.04] dark:opacity-[0.06] w-[420px] h-[420px]"
          viewBox="0 0 420 420"
        >
          {Array.from({ length: 20 }, (_, i) => {
            const rad = ((i / 20) * 360 * Math.PI) / 180
            return (
              <line
                key={i}
                x1="420" y1="420"
                x2={420 + Math.cos(rad) * 600}
                y2={420 + Math.sin(rad) * 600}
                stroke={i % 4 === 0 ? '#14b8a6' : '#1a1a1a'}
                strokeWidth={i % 5 === 0 ? 2.5 : i % 2 === 0 ? 1.2 : 0.6}
              />
            )
          })}
        </svg>

        {/* Comic panel grid */}
        <svg
          className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.025] dark:opacity-[0.04]"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="panel-grid" x="0" y="0" width="320" height="240" patternUnits="userSpaceOnUse">
              <rect x="4"   y="4"   width="148" height="112" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
              <rect x="160" y="4"   width="156" height="72"  fill="none" stroke="#1a1a1a" strokeWidth="2"/>
              <rect x="160" y="84"  width="156" height="32"  fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
              <rect x="160" y="124" width="156" height="112" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
              <rect x="4"   y="124" width="90"  height="112" fill="none" stroke="#1a1a1a" strokeWidth="2"/>
              <rect x="102" y="124" width="50"  height="112" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#panel-grid)"/>
        </svg>

        {/* Onomatopoeia watermarks */}
        <div
          className="fixed top-[12%] right-[4%] pointer-events-none z-0 select-none opacity-[0.028] dark:opacity-[0.045] rotate-12"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '160px', color: '#f59e0b', lineHeight: 1 }}
        >
          POW!
        </div>
        <div
          className="fixed bottom-[10%] left-[2%] pointer-events-none z-0 select-none opacity-[0.022] dark:opacity-[0.038] -rotate-6"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '120px', color: '#ec4899', lineHeight: 1 }}
        >
          BOOM
        </div>
        <div
          className="fixed top-[45%] left-[38%] pointer-events-none z-0 select-none opacity-[0.018] dark:opacity-[0.03] rotate-3"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '96px', color: '#1a1a1a', lineHeight: 1 }}
        >
          ZAP!
        </div>

        {/* App chrome */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>

      </div>
    </>
  )
}