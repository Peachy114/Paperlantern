import { useAdminDashboard } from '@/features/admin/hooks/useAdminDashboard'
import { useNavigate } from 'react-router-dom'

const FONTS =
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kalam:wght@400;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap'

export default function AdminDashboard() {
    const { stats } = useAdminDashboard()
    const navigate = useNavigate()

    return (
        <>
            <link href={FONTS} rel="stylesheet" />
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
                <div className="flex gap-0 mb-6">
                    {/* Spine */}
                    <div
                        className="w-4 sm:w-6 shrink-0 flex flex-col items-center justify-between py-4 bg-[#080808]"
                        style={{ minHeight: '320px' }}
                    >
                        <span
                            className="text-red-400 text-[8px] sm:text-xsmall tracking-[0.3em] rotate-90 whitespace-nowrap mt-4"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            LATER N COMIX
                        </span>
                        <span
                            className="text-white/30 text-[8px] sm:text-xsmall tracking-[0.2em] rotate-90 whitespace-nowrap mb-4"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            ADMIN
                        </span>
                    </div>

                    {/* Main */}
                    <div
                        className="flex-1 min-w-0 border-[2.5px] border-[#1a1a1a] overflow-hidden bg-[#fffdf5] dark:bg-[#1c1a17]"
                        style={{ boxShadow: '4px 4px 0 #1a1a1a' }}
                    >
                        {/* Header */}
                        <div className="border-b-[2.5px] border-[#000000] px-3 sm:px-5 py-3 sm:py-5 flex items-center justify-between gap-3 bg-[#1a1a1a]">
                            <div>
                                <h1
                                    className="text-red-400 leading-none"
                                    style={{
                                        fontFamily: "'Bebas Neue', sans-serif",
                                        fontSize: 'clamp(26px, 6vw, 38px)',
                                        letterSpacing: '0.04em',
                                    }}
                                >
                                    ADMIN PANEL
                                </h1>
                                <p
                                    className="text-white/30 mt-1 text-[12px] sm:text-small"
                                    style={{ fontFamily: "'Kalam', cursive" }}
                                >
                                    with great power comes great responsibility
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x-[2px] divide-y-[2px] sm:divide-y-0 divide-[#1a1a1a] border-b-[2px] border-[#1a1a1a]">
                            {[
                                {
                                    val: stats?.total_users,
                                    lbl: 'Total Users',
                                    sticky: 'growing!',
                                    color: '#ffc6a6',
                                    rotate: '2deg',
                                },
                                {
                                    val: stats?.total_works,
                                    lbl: 'Total Works',
                                    sticky: 'impressive!',
                                    color: '#ffbacf',
                                    rotate: '-1.5deg',
                                },
                                {
                                    val: stats?.total_chapters,
                                    lbl: 'Total Chapters',
                                    sticky: 'keep going!',
                                    color: '#86efac',
                                    rotate: '1.5deg',
                                },
                                {
                                    val: stats?.banned_users,
                                    lbl: 'Banned Users',
                                    sticky: 'be fair.',
                                    color: '#fca5a5',
                                    rotate: '-1deg',
                                },
                            ].map(({ val, lbl, sticky, color, rotate }) => (
                                <div
                                    key={lbl}
                                    className="relative px-2 sm:px-5 pt-8 pb-4 sm:pt-9 sm:pb-5 bg-[#fff9f5] dark:bg-[#1c1a17]"
                                >
                                    <div
                                        className="absolute -top-3 right-1 sm:right-3 h-10 px-1.5 sm:px-2.5 pt-3 py-0.5 text-[9px] sm:text-[11px] leading-tight z-20 whitespace-nowrap pointer-events-none"
                                        style={{
                                            background: color,
                                            fontFamily: "'Kalam', cursive",
                                            color: '#1a1a1a',
                                            boxShadow: '2px 3px 0 rgba(0,0,0,0.2)',
                                            transform: `rotate(${rotate})`,
                                        }}
                                    >
                                        {sticky}
                                    </div>
                                    <div
                                        className="text-[#1a1a1a] dark:text-foreground leading-none"
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            fontSize: 'clamp(20px, 5vw, 32px)',
                                        }}
                                    >
                                        {val ?? '—'}
                                    </div>
                                    <div
                                        className="text-[#1a1a1a]/40 dark:text-foreground/40 mt-1 text-[9px] sm:text-xsmall tracking-[0.12em]"
                                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                    >
                                        {lbl.toUpperCase()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Nav */}
                        <div className="bg-[#1a1a1a] dark:bg-[#2a2825] px-3 sm:px-5 py-3 flex items-center gap-2 border-b-[2px] border-[#1a1a1a]">
                            <span
                                className="text-white text-[12px] sm:text-normal tracking-[0.18em]"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                ◆ QUICK ACCESS
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y-[2px] sm:divide-y-0 sm:divide-x-[2px] divide-[#1a1a1a] border-b-[2px] border-[#1a1a1a]">
                            {[
                                {
                                    label: 'TICKETS',
                                    desc: 'view, ban, unban, or delete users',
                                    note: 'handle with care!',
                                    color: '#ffc6a6',
                                    rotate: '1.5deg',
                                    route: '/admin/tickets',
                                },
                                {
                                    label: 'USER MANAGEMENT',
                                    desc: 'view, ban, unban, or delete users',
                                    note: 'handle with care!',
                                    color: '#ffc6a6',
                                    rotate: '1.5deg',
                                    route: '/admin/users',
                                },
                                {
                                    label: 'ACTION LOGS',
                                    desc: 'track every admin action taken',
                                    note: 'transparency matters',
                                    color: '#86efac',
                                    rotate: '-1deg',
                                    route: '/admin/logs',
                                },
                                {
                                    label: 'WITHDRAWALS',
                                    desc: 'review and process storyteller withdrawal requests',
                                    note: 'pay them out!',
                                    color: '#86efac',
                                    rotate: '-1.5deg',
                                    route: '/admin/withdrawals',
                                },
                                {
                                    label: 'PLATFORM EARNINGS',
                                    desc: 'view total revenue, platform cut, and storyteller payouts',
                                    note: '20% ours!',
                                    color: '#a5f3fc',
                                    rotate: '1deg',
                                    route: '/admin/earnings',
                                },
                                {
                                    label: 'MODERATION QUEUE',
                                    desc: 'review pending chapters before publishing',
                                    note: 'stay vigilant!',
                                    color: '#fbbf24',
                                    rotate: '1deg',
                                    route: '/admin/moderation',
                                },
                                {
                                    label: 'ANNOUNCEMENTS',
                                    desc: 'create, edit, and delete announcements for studio users',
                                    note: 'keep users informed',
                                    color: '#fbbf24',
                                    rotate: '1deg',
                                    route: '/admin/announcements',
                                },
                            ].map(({ label, desc, note, color, rotate, route }) => (
                                <button
                                    key={label}
                                    onClick={() => navigate(route)}
                                    className="relative text-left px-4 sm:px-6 pt-8 pb-5 bg-[#fffdf5] dark:bg-[#1c1a17] hover:bg-amber-400/[0.07] transition-colors duration-100 cursor-pointer"
                                >
                                    <div
                                        className="absolute top-3 right-4 h-8 px-2 pt-2 text-[10px] leading-tight pointer-events-none"
                                        style={{
                                            background: color,
                                            fontFamily: "'Kalam', cursive",
                                            color: '#1a1a1a',
                                            boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
                                            transform: `rotate(${rotate})`,
                                        }}
                                    >
                                        {note}
                                    </div>
                                    <div
                                        className="text-[#1a1a1a] dark:text-foreground text-[18px] sm:text-[22px] leading-none mb-2"
                                        style={{
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            letterSpacing: '0.06em',
                                        }}
                                    >
                                        {label}
                                    </div>
                                    <div
                                        className="text-[#1a1a1a]/40 dark:text-foreground/40 text-[11px] sm:text-small"
                                        style={{ fontFamily: "'Kalam', cursive" }}
                                    >
                                        {desc}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between border-t-[2px] border-[#1a1a1a] bg-[#fffdf5] dark:bg-[#1c1a17]">
                            <span
                                className="text-[#1a1a1a]/30 dark:text-foreground/30 text-[10px] sm:text-xsmall"
                                style={{ fontFamily: "'Kalam', cursive" }}
                            >
                                super admin only
                            </span>
                            <span
                                className="text-[#1a1a1a]/20 dark:text-foreground/20 tracking-[0.2em] text-[9px] sm:text-xsmall"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                LATER N COMIX ADMIN
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
