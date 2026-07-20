import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'

const PROTECTED_ROUTES = ['/become-creator', '/studio']

const NAV_LINKS = [
    { label: 'Comix', to: '/comix' },
    { label: 'Arts', to: '/explore/arts' },
    { label: 'Commission', to: '/commissions' },
    { label: 'Become Creator', to: '/become-creator' },
    { label: 'Studio', to: '/studio' },
    { label: 'About', to: '/about' },
    { label: 'Blog', to: '/blog' },
] as const

const LEGAL_LINKS = [
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms and Service', to: '/terms-and-services' },
    { label: 'Cookies', to: '/cookies' },
] as const

const SOCIAL_LINKS = [
    {
        label: 'Discord',
        href: 'https://discord.com',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                    fill="currentColor"
                    d="M19.54 5.34A16.3 16.3 0 0 0 15.44 4l-.5 1.02a15.1 15.1 0 0 0-5.86 0L8.57 4a16.7 16.7 0 0 0-4.1 1.34C1.88 9.2 1.18 12.96 1.53 16.67a16.5 16.5 0 0 0 5.03 2.54l1.22-1.67c-.67-.25-1.31-.56-1.92-.92l.47-.37c3.7 1.72 7.73 1.72 11.38 0l.48.37c-.62.36-1.26.67-1.93.92l1.22 1.67a16.4 16.4 0 0 0 5.02-2.54c.42-4.3-.72-8.02-2.96-11.33ZM8.3 14.42c-1.12 0-2.04-1.03-2.04-2.3 0-1.26.9-2.3 2.04-2.3 1.14 0 2.06 1.04 2.04 2.3 0 1.27-.9 2.3-2.04 2.3Zm7.4 0c-1.12 0-2.04-1.03-2.04-2.3 0-1.26.9-2.3 2.04-2.3 1.14 0 2.06 1.04 2.04 2.3 0 1.27-.9 2.3-2.04 2.3Z"
                />
            </svg>
        ),
    },
    {
        label: 'Instagram',
        href: 'https://instagram.com',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                />
                <circle
                    cx="12"
                    cy="12"
                    r="4.1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                />
                <circle cx="17.4" cy="6.7" r="1.1" fill="currentColor" />
            </svg>
        ),
    },
    {
        label: 'Facebook',
        href: 'https://facebook.com',
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                    fill="currentColor"
                    d="M14.1 8.2V6.7c0-.7.5-.9 1-.9h2.6V2.1L14.4 2c-3.6 0-4.4 2.1-4.4 4.3v1.9H7.8V12H10v10h4.1V12h3.1l.5-3.8h-3.6Z"
                />
            </svg>
        ),
    },
] as const

export default function Footer() {
    const token = useAuthStore((state) => state.token)
    const openLogin = useModalStore((state) => state.openLogin)

    return (
        <footer className="site-footer">
            {/* ====================================================== */}
            {/* // footer parent ---- */}
            {/* ====================================================== */}

            <div className="site-footer__inner">
                {/* //// left character image ---- */}
                <img
                    src="/new_logo.png"
                    alt=""
                    width={180}
                    height={180}
                    loading="lazy"
                    decoding="async"
                    style={{ borderRadius: '12px' }}
                    className="site-footer__character site-footer__character--left"
                />

                {/* ====================================================== */}
                {/* // footer center content ---- */}
                {/* ====================================================== */}

                <div className="site-footer__content">
                    {/* //// footer description ---- */}
                    <p className="site-footer__description">
                        Subscribe to Comix exclusive notifications for the latest news on events,
                        new releases, and more!
                    </p>

                    {/* //// main footer navigation ---- */}
                    <nav aria-label="Footer navigation" className="site-footer__navigation">
                        {NAV_LINKS.map(({ label, to }) => {
                            const isProtected = PROTECTED_ROUTES.includes(to)

                            if (!token && isProtected) {
                                return (
                                    <button
                                        key={to}
                                        type="button"
                                        onClick={openLogin}
                                        className="site-footer__link site-footer__button"
                                    >
                                        {label}
                                    </button>
                                )
                            }

                            return (
                                <Link key={to} to={to} className="site-footer__link">
                                    {label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* //// legal navigation ---- */}
                    <nav aria-label="Legal navigation" className="site-footer__legal">
                        {LEGAL_LINKS.map(({ label, to }) => (
                            <Link key={to} to={to} className="site-footer__link">
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* //// social links ---- */}
                    <div className="site-footer__socials">
                        {SOCIAL_LINKS.map(({ label, href, icon }) => (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={label}
                                className="site-footer__social"
                            >
                                {icon}
                            </a>
                        ))}
                    </div>

                    {/* //// copyright ---- */}
                    <p className="site-footer__copyright">
                        © {new Date().getFullYear()} Devorbitstudio. All rights reserved.
                    </p>
                </div>

                {/* //// right character image ---- */}
                <img
                    src="/riri_body_1.png"
                    alt=""
                    width={200}
                    height={200}
                    loading="lazy"
                    decoding="async"
                    className="site-footer__character--right"
                />
            </div>
        </footer>
    )
}
