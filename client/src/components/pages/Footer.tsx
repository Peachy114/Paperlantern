import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'

const PROTECTED = ['/become-creator', '/studio']

const NAV_LINKS = [
    { label: 'Comics', to: '/all-comics' },
    { label: 'Novels', to: '/all-wattpad' },
    { label: 'Rankings', to: '/all-comics?view=rankings' },
    { label: 'Become a Creator', to: '/become-creator' },
    { label: 'Studio', to: '/studio' },
    { label: 'About', to: '/about' },
    { label: 'Blog', to: '/blog' },
]

const RIGHTS = [
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms of Service', to: '/terms-and-services' },
    { label: 'Cookies', to: '/cookies' },
]

export default function Footer() {
    const { token } = useAuthStore()
    const { openLogin } = useModalStore()

    return (
        <footer className="relative w-full overflow-hidden bg-black">
            <div className="max-w-[1390px] mx-auto px-6 pb-8 flex flex-col items-center">
                {/* Logo stamp */}
                <img src="/logo_white.png" alt="" className="w-60 h-30 object-contain" />

                {/* Tagline */}
                <p className="font-sans tracking-[0.16em] text-center mb-8 leading-relaxed text-white/45 text-xs">
                    A COZY CORNER FOR COMICS &amp; NOVELS. READ, DISCOVER, AND SUPPORT CREATORS.
                </p>

                {/* Nav links */}
                <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-10 text-comix-xs">
                    {NAV_LINKS.map(({ label, to }) =>
                        !token && PROTECTED.includes(to) ? (
                            <button
                                key={label}
                                onClick={openLogin}
                                className="font-sans text-comix-sm tracking-[0.16em] bg-transparent border-none cursor-pointer p-0 text-white/55 hover:text-white hover:underline transition-colors duration-100"
                            >
                                {label.toUpperCase()}
                            </button>
                        ) : (
                            <Link
                                key={label}
                                to={to}
                                className="font-sans text-comix-sm tracking-[0.16em] text-white/55 hover:text-white hover:underline transition-colors duration-100"
                            >
                                {label.toUpperCase()}
                            </Link>
                        )
                    )}
                </nav>

                {/* Bottom row */}
                <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                    <p className="font-sans text-comix-xs tracking-[0.1em] text-white/30">
                        © {new Date().getFullYear()} DEVORBITSTUDIO. ALL RIGHTS RESERVED.
                    </p>

                    <div className="flex items-center gap-1 flex-wrap justify-center">
                        {RIGHTS.map(({ label, to }) => (
                            <Link
                                key={label}
                                to={to}
                                className="font-sans text-comix-xs tracking-[0.08em] px-2 py-0.5 border border-transparent text-white/30 hover:text-white hover:border-white/30 transition-all duration-100"
                            >
                                {label.toUpperCase()}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
