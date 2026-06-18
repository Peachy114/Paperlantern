import { useAdminEarnings } from '@/hooks/useAdminEarnings'
import { useNavigate } from 'react-router-dom'

const FONTS = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap"

export default function AdminEarnings() {
  const { earnings, isLoading } = useAdminEarnings()
  const navigate = useNavigate()
  const v = (n?: number) => isLoading ? '—' : (n ?? 0)
  const p = (n?: number) => isLoading ? '—' : `₱${Number(n ?? 0).toFixed(2)}`

  return (
    <>
      <link href={FONTS} rel="stylesheet" />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <div className="flex gap-0 mb-6">

          {/* Spine */}
          <div className="w-4 sm:w-6 shrink-0 flex flex-col items-center justify-between py-4 bg-[#080808]" style={{ minHeight: '320px' }}>
            <span className="text-red-400 text-[8px] sm:text-xsmall tracking-[0.3em] rotate-90 whitespace-nowrap mt-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>PAPER LANTERN</span>
            <span className="text-white/30 text-[8px] sm:text-xsmall tracking-[0.2em] rotate-90 whitespace-nowrap mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>EARNINGS</span>
          </div>

          <div className="flex-1 min-w-0 border-[2.5px] border-[#1a1a1a] overflow-hidden bg-[#fffdf5] dark:bg-[#1c1a17]" style={{ boxShadow: '4px 4px 0 #1a1a1a' }}>

            {/* Header */}
            <div className="border-b-[2.5px] border-[#000000] px-3 sm:px-5 py-3 sm:py-5 bg-[#1a1a1a] flex items-center justify-between gap-3">
              <div>
                <h1 className="text-red-400 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(26px, 6vw, 38px)', letterSpacing: '0.04em' }}>
                  PLATFORM EARNINGS
                </h1>
                <p className="text-white/30 mt-1 text-[12px] sm:text-small" style={{ fontFamily: "'Kalam', cursive" }}>
                  20% platform · 80% storytellers
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/withdrawals')}
                className="shrink-0 px-3 py-1.5 border-[2px] border-red-400 text-red-400 hover:bg-red-400 hover:text-[#1a1a1a] transition-colors duration-100 cursor-pointer text-[11px]"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
              >
                VIEW WITHDRAWALS →
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x-[2px] divide-y-[2px] sm:divide-y-0 divide-[#1a1a1a] border-b-[2px] border-[#1a1a1a]">
              {[
                { val: v(earnings?.total_credits_spent),    lbl: 'Credits Sold',       sticky: 'total volume!',  color: '#ffc6a6', rotate: '2deg'    },
                { val: v(earnings?.total_transactions),     lbl: 'Transactions',        sticky: 'chapters read!', color: '#fef08a', rotate: '-1.5deg' },
                { val: v(earnings?.pending_withdrawals_count), lbl: 'Pending Payouts',  sticky: 'process soon!',  color: '#ffbacf', rotate: '1.5deg'  },
                { val: p(earnings?.pending_withdrawals_php),   lbl: 'Pending PHP',      sticky: 'to be paid out', color: '#fca5a5', rotate: '-1deg'   },
              ].map(({ val, lbl, sticky, color, rotate }) => (
                <div key={lbl} className="relative px-2 sm:px-5 pt-8 pb-4 sm:pt-9 sm:pb-5 bg-[#fff9f5] dark:bg-[#1c1a17]">
                  <div className="absolute -top-3 right-1 sm:right-3 h-10 px-1.5 sm:px-2.5 pt-3 py-0.5 text-[9px] sm:text-[11px] leading-tight z-20 whitespace-nowrap pointer-events-none"
                    style={{ background: color, fontFamily: "'Kalam', cursive", color: '#1a1a1a', boxShadow: '2px 3px 0 rgba(0,0,0,0.2)', transform: `rotate(${rotate})` }}>
                    {sticky}
                  </div>
                  <div className="text-[#1a1a1a] dark:text-foreground leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(18px, 4vw, 28px)' }}>{val}</div>
                  <div className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[9px] sm:text-xsmall tracking-[0.12em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{lbl.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Split breakdown */}
            <div className="bg-[#1a1a1a] px-3 sm:px-5 py-3">
              <span className="text-white text-[12px] sm:text-normal tracking-[0.18em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>◆ REVENUE SPLIT</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y-[2px] sm:divide-y-0 sm:divide-x-[2px] divide-[#1a1a1a] border-b-[2px] border-[#1a1a1a]">
              {/* Platform 20% */}
              <div className="relative px-4 sm:px-6 pt-8 pb-5 bg-[#fffdf5] dark:bg-[#1c1a17]">
                <div className="absolute top-3 right-4 h-8 px-2 pt-2 text-[10px] leading-tight pointer-events-none"
                  style={{ background: '#a5f3fc', fontFamily: "'Kalam', cursive", color: '#1a1a1a', boxShadow: '2px 2px 0 rgba(0,0,0,0.15)', transform: 'rotate(-1deg)' }}>
                  our cut!
                </div>
                <div className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px] tracking-[0.18em] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>PAPER LANTERN (20%)</div>
                <div className="text-[#1a1a1a] dark:text-foreground leading-none mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(22px, 5vw, 36px)' }}>
                  {p(earnings?.total_platform_php)}
                </div>
                <div className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[11px]" style={{ fontFamily: "'Kalam', cursive" }}>
                  {v(earnings?.total_platform_credits)} credits
                </div>
              </div>

              {/* Storytellers 80% */}
              <div className="relative px-4 sm:px-6 pt-8 pb-5 bg-[#faf8ee] dark:bg-[#191713]">
                <div className="absolute top-3 right-4 h-8 px-2 pt-2 text-[10px] leading-tight pointer-events-none"
                  style={{ background: '#86efac', fontFamily: "'Kalam', cursive", color: '#1a1a1a', boxShadow: '2px 2px 0 rgba(0,0,0,0.15)', transform: 'rotate(1deg)' }}>
                  their cut!
                </div>
                <div className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[10px] tracking-[0.18em] mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>STORYTELLERS (80%)</div>
                <div className="text-[#1a1a1a] dark:text-foreground leading-none mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(22px, 5vw, 36px)' }}>
                  {p(earnings?.total_storyteller_php)}
                </div>
                <div className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[11px]" style={{ fontFamily: "'Kalam', cursive" }}>
                  {v(earnings?.total_storyteller_credits)} credits
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
              <span className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px] sm:text-xsmall" style={{ fontFamily: "'Kalam', cursive" }}>
                all time totals
              </span>
              <span className="text-[#1a1a1a]/20 dark:text-foreground/20 tracking-[0.2em] text-[9px] sm:text-xsmall" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                PAPER LANTERN ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}