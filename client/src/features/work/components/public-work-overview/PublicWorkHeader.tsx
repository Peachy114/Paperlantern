import type { ReactNode } from 'react'
import { FaFacebookF, FaInstagram, FaThreads } from 'react-icons/fa6'

type SocialPlatform = 'threads' | 'instagram' | 'facebook'

type SocialLinks = Record<SocialPlatform, string | null>

interface PublicWorkHeaderProps {
    work: any
    coverUrl: (url?: string | null, variant?: 'sm') => string | null
}

export default function PublicWorkHeader({ work, coverUrl }: PublicWorkHeaderProps) {
    /*
     * IMPORTANT:
     * The header uses ONLY the database `banner` field.
     * It does not fall back to `cover`, so the portrait cover will
     * never become the large full-width banner.
     */
    const bannerUrl = work?.banner ? coverUrl(work.banner) : null

    const socialLinks = getArtistPublicLinks(work?.user)

    const hasSocialLinks = Boolean(
        socialLinks.threads || socialLinks.instagram || socialLinks.facebook
    )

    return (
        <header
            className="
                relative
                h-[150px]
                w-full
                overflow-hidden
                bg-gradient-to-r
                from-orange-100
                via-rose-100
                to-sky-100
                sm:h-[190px]
                lg:h-[220px]
                dark:from-slate-900
                dark:via-slate-800
                dark:to-slate-900
            "
        >
            {bannerUrl && (
                <img
                    src={bannerUrl}
                    alt={work?.title ? `${work.title} banner` : 'Work banner'}
                    loading="eager"
                    decoding="async"
                    draggable={false}
                    className="
                        h-full
                        w-full
                        object-cover
                    "
                />
            )}

            {bannerUrl && (
                <div
                    className="
                        pointer-events-none
                        absolute
                        inset-0
                        bg-gradient-to-t
                        from-black/10
                        via-transparent
                        to-white/5
                    "
                />
            )}

            {hasSocialLinks && (
                <nav
                    aria-label="Artist public links"
                    className="
                        absolute
                        right-4
                        top-4
                        z-10
                        flex
                        items-center
                        gap-4
                        sm:right-6
                        sm:top-5
                    "
                >
                    {socialLinks.threads && (
                        <SocialLink href={socialLinks.threads} label="Open artist Threads profile">
                            <FaThreads className="h-5 w-5 sm:h-6 sm:w-6" />
                        </SocialLink>
                    )}

                    {socialLinks.instagram && (
                        <SocialLink
                            href={socialLinks.instagram}
                            label="Open artist Instagram profile"
                        >
                            <FaInstagram className="h-5 w-5 sm:h-6 sm:w-6" />
                        </SocialLink>
                    )}

                    {socialLinks.facebook && (
                        <SocialLink
                            href={socialLinks.facebook}
                            label="Open artist Facebook profile"
                        >
                            <FaFacebookF className="h-5 w-5 sm:h-6 sm:w-6" />
                        </SocialLink>
                    )}
                </nav>
            )}
        </header>
    )
}

function SocialLink({
    href,
    label,
    children,
}: {
    href: string
    label: string
    children: ReactNode
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            onClick={(event) => {
                event.stopPropagation()
            }}
            className="
                inline-flex
                items-center
                justify-center
                text-black
                drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]
                transition
                duration-200
                hover:-translate-y-0.5
                hover:scale-110
                hover:opacity-70
                focus-visible:rounded-sm
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-black/70
                dark:text-white
                dark:drop-shadow-none
            "
        >
            {children}
        </a>
    )
}

function getArtistPublicLinks(user: any): SocialLinks {
    const links: SocialLinks = {
        threads: null,
        instagram: null,
        facebook: null,
    }

    if (!user) return links

    /*
     * Supports direct user fields.
     */
    assignLink(links, 'threads', user.threads_url ?? user.threads)

    assignLink(links, 'instagram', user.instagram_url ?? user.instagram)

    assignLink(links, 'facebook', user.facebook_url ?? user.facebook)

    /*
     * Supports:
     * user.public_link
     * user.public_links
     *
     * Accepted forms:
     *
     * Object:
     * {
     *   threads: "...",
     *   instagram: "...",
     *   facebook: "..."
     * }
     *
     * Array:
     * [
     *   { platform: "threads", url: "..." },
     *   { platform: "instagram", url: "..." }
     * ]
     *
     * JSON strings containing either format are also supported.
     */
    const rawPublicLinks = user.public_link ?? user.public_links ?? null

    const parsed = parsePublicLinks(rawPublicLinks)

    if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
            if (!item || typeof item !== 'object') return

            const record = item as Record<string, unknown>

            const platform = normalizePlatform(
                record.platform ?? record.type ?? record.name ?? record.label ?? record.site
            )

            const url =
                record.url ?? record.link ?? record.href ?? record.value ?? record.public_link

            if (platform) {
                assignLink(links, platform, url)
            }
        })

        return links
    }

    if (parsed && typeof parsed === 'object') {
        const record = parsed as Record<string, unknown>

        assignLink(links, 'threads', record.threads ?? record.thread ?? record.threads_url)

        assignLink(links, 'instagram', record.instagram ?? record.instagram_url ?? record.ig)

        assignLink(links, 'facebook', record.facebook ?? record.facebook_url ?? record.fb)

        const platform = normalizePlatform(
            record.platform ?? record.type ?? record.name ?? record.label
        )

        const url = record.url ?? record.link ?? record.href ?? record.value

        if (platform) {
            assignLink(links, platform, url)
        }

        return links
    }

    if (typeof parsed === 'string') {
        const platform = platformFromUrl(parsed)

        if (platform) {
            assignLink(links, platform, parsed)
        }
    }

    return links
}

function parsePublicLinks(value: unknown): unknown {
    if (typeof value !== 'string') {
        return value
    }

    const trimmed = value.trim()

    if (!trimmed) {
        return null
    }

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            return JSON.parse(trimmed)
        } catch {
            return trimmed
        }
    }

    return trimmed
}

function normalizePlatform(value: unknown): SocialPlatform | null {
    if (typeof value !== 'string') {
        return null
    }

    const platform = value.trim().toLowerCase()

    if (platform.includes('thread')) {
        return 'threads'
    }

    if (platform.includes('instagram') || platform === 'ig') {
        return 'instagram'
    }

    if (platform.includes('facebook') || platform === 'fb') {
        return 'facebook'
    }

    return null
}

function platformFromUrl(url: string): SocialPlatform | null {
    const normalized = url.toLowerCase()

    if (normalized.includes('threads.net')) {
        return 'threads'
    }

    if (normalized.includes('instagram.com')) {
        return 'instagram'
    }

    if (normalized.includes('facebook.com') || normalized.includes('fb.com')) {
        return 'facebook'
    }

    return null
}

function assignLink(links: SocialLinks, platform: SocialPlatform, value: unknown) {
    if (links[platform]) return
    if (typeof value !== 'string') return

    const normalizedUrl = normalizeExternalUrl(value)

    if (!normalizedUrl) return

    links[platform] = normalizedUrl
}

function normalizeExternalUrl(value: string): string | null {
    const trimmed = value.trim()

    if (!trimmed) {
        return null
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed
    }

    return `https://${trimmed.replace(/^\/+/, '')}`
}
