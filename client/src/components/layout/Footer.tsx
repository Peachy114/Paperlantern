import { Link } from 'react-router-dom'
// import { FaXTwitter, FaInstagram, FaDiscord } from 'react-icons/fa6'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'

const PROTECTED = ['/become-creator', '/studio']

const NAV_LINKS = {
    Browse: [
        { label: 'Comics', to: '/all-comics' },
        { label: 'Novels', to: '/all-wattpad' },
        { label: 'Rankings', to: '/all-comics?view=rankings' },
    ],
    Create: [
        { label: 'Become a Creator', to: '/become-creator' },
        { label: 'Studio', to: '/studio' },
    ],
    Company: [
        { label: 'About', to: '/about' },
        { label: 'Blog', to: '/blog' },
    ],
}

// const SOCIAL = [
//   { label: 'Twitter', href: '#', icon: FaXTwitter },
//   { label: 'Instagram', href: '#', icon: FaInstagram },
//   { label: 'Discord', href: '#', icon: FaDiscord },
// ]

const RIGHTS = [
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms of Service', to: '/terms-and-services' },
    { label: 'Cookies', to: '/cookies' },
]

export default function Footer() {
    const { token } = useAuthStore()
    const { openLogin } = useModalStore()

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
                rel="stylesheet"
            />

            <footer
                className="relative w-full mt-12 overflow-hidden bg-[#fffdf5] dark:bg-[#111111] border-t-[3px] border-foreground rounded-xl"
                style={{ boxShadow: '0 -4px 0 hsl(var(--foreground))' }}
            >
                {/* Halftone dot bg — light */}
                <div
                    className="absolute inset-0 pointer-events-none z-0 dark:hidden"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, rgba(0,0,0,0.07) 1.2px, transparent 1.2px)',
                        backgroundSize: '9px 9px',
                    }}
                />
                {/* Halftone dot bg — dark */}
                <div
                    className="absolute inset-0 pointer-events-none z-0 hidden dark:block"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, rgba(245,158,11,0.12) 1.2px, transparent 1.2px)',
                        backgroundSize: '9px 9px',
                    }}
                />

                {/* Speed lines top-right */}
                <svg
                    className="absolute top-0 right-0 w-44 h-36 pointer-events-none opacity-[0.06]"
                    viewBox="0 0 180 160"
                >
                    {Array.from({ length: 12 }, (_, i) => {
                        const rad = ((i / 12) * 90 + 270) * (Math.PI / 180)
                        return (
                            <line
                                key={i}
                                x1="180"
                                y1="0"
                                x2={180 + Math.cos(rad) * 220}
                                y2={Math.sin(rad) * 220}
                                stroke="#f59e0b"
                                strokeWidth={i % 3 === 0 ? 2 : 1}
                            />
                        )
                    })}
                </svg>

                {/* Speed lines bottom-left */}
                <svg
                    className="absolute bottom-0 left-0 w-36 h-28 pointer-events-none opacity-[0.06]"
                    viewBox="0 0 140 120"
                >
                    {Array.from({ length: 10 }, (_, i) => {
                        const rad = ((i / 10) * 90 + 90) * (Math.PI / 180)
                        return (
                            <line
                                key={i}
                                x1="0"
                                y1="120"
                                x2={Math.cos(rad) * 200}
                                y2={120 + Math.sin(rad) * 200}
                                stroke="#14b8a6"
                                strokeWidth={i % 3 === 0 ? 2 : 1}
                            />
                        )
                    })}
                </svg>

                <div className="relative z-10 max-w-[1126px] mx-auto px-5 sm:px-8 md:px-10 pt-8 sm:pt-10 pb-6 sm:pb-7">
                    {/* Main row — stacks vertically on mobile */}
                    <div className="flex flex-col sm:flex-row flex-wrap gap-8 sm:gap-10 items-start">
                        {/* Brand */}
                        <div className="flex flex-col gap-3 min-w-0 w-full sm:w-auto sm:min-w-[200px]">
                            <div
                                className="inline-flex items-center self-start bg-amber-400 border-[2.5px] border-foreground px-4 py-1"
                                style={{ boxShadow: '4px 4px 0 currentColor' }}
                            >
                                <span
                                    className="text-[22px] leading-none tracking-[0.06em] text-[#1a1a1a]"
                                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                >
                                    LATER N COMIX
                                </span>
                            </div>

                            <p
                                className=" text-start text-[11px] tracking-[0.1em] text-muted-foreground leading-relaxed max-w-[240px] sm:max-w-[210px]"
                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                            >
                                A COZY CORNER FOR COMICS & NOVELS. READ, DISCOVER, AND SUPPORT
                                CREATORS.
                            </p>

                            {/* <div className="flex items-center gap-2">
                {SOCIAL.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-[34px] h-[34px] flex items-center justify-center border-2 border-foreground text-foreground hover:bg-amber-400 hover:text-[#1a1a1a] hover:-translate-x-px hover:-translate-y-px transition-all duration-100"
                    style={{ boxShadow: '2px 2px 0 var(--foreground)' }}
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div> */}
                        </div>

                        {/* Nav columns — 3-column grid on mobile, auto on larger */}
                        <div className="grid grid-cols-3 gap-6 w-full sm:w-auto sm:flex sm:flex-row sm:gap-10 sm:ml-auto">
                            {Object.entries(NAV_LINKS).map(([section, links]) => (
                                <div key={section} className="flex flex-col gap-2">
                                    <span
                                        className="text-[13px] tracking-[0.18em] text-foreground border-b-2 border-amber-400 pb-1 mb-1 whitespace-nowrap"
                                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                    >
                                        {section.toUpperCase()}
                                    </span>
                                    {links.map(({ label, to }) =>
                                        !token && PROTECTED.includes(to) ? (
                                            <button
                                                key={label}
                                                onClick={openLogin}
                                                className="group flex items-center gap-1 text-[11px] sm:text-[12px] tracking-[0.08em] text-muted-foreground hover:text-foreground transition-colors duration-100 bg-transparent border-none cursor-pointer p-0"
                                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                            >
                                                <span className="text-[10px] text-amber-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-100 hidden sm:inline">
                                                    ▸
                                                </span>
                                                {label.toUpperCase()}
                                            </button>
                                        ) : (
                                            <Link
                                                key={label}
                                                to={to}
                                                className="group flex items-center gap-1 text-[11px] sm:text-[12px] tracking-[0.08em] text-muted-foreground hover:text-foreground transition-colors duration-100"
                                                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                            >
                                                <span className="text-[10px] text-amber-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-100 hidden sm:inline">
                                                    ▸
                                                </span>
                                                {label.toUpperCase()}
                                            </Link>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="relative mt-8 pt-5 border-t-[2.5px] border-foreground flex flex-col sm:flex-row items-center sm:justify-between gap-3 text-center sm:text-left">
                        {/* Divider stamp */}
                        <span
                            className="absolute -top-[11px] left-1/2 -translate-x-1/2 bg-[#fffdf5] dark:bg-[#111111] px-3 text-[10px] tracking-[0.2em] text-muted-foreground whitespace-nowrap"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            ★ LATER N COMIX ★
                        </span>

                        <p
                            className="text-[11px] tracking-[0.1em] text-muted-foreground"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            © {new Date().getFullYear()} LATER N COMIX. ALL RIGHTS RESERVED.
                        </p>

                        <div className="flex items-center justify-center sm:justify-end gap-1 flex-wrap">
                            {RIGHTS.map(({ label, to }) => (
                                <Link
                                    key={label}
                                    to={to}
                                    className="text-[11px] tracking-[0.08em] text-muted-foreground hover:text-foreground border border-transparent hover:border-foreground px-2 py-0.5 hover:-translate-x-px hover:-translate-y-px transition-all duration-100"
                                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                                >
                                    {label.toUpperCase()}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}
