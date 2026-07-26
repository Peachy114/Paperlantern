import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Globe2, Heart, Link2, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { publicApi } from '@/api/public'
import UnlockModal from '@/components/shared/UnlockModalChapter'
import { Button } from '@/components/ui/button'
import CommentSection2 from '@/features/comments/components/CommentSection2'
import SuperLikeButton from '@/features/comments/components/SuperLikeButton'
import { useComicShow } from '@/features/work/hooks/useComicShow'
import { useHome } from '@/features/work/hooks/useHome'
import WorkCard3 from '@/features/work/components/ui/WorkCard3'
import { unlockChapter, useWallet } from '@/hooks/useWallet'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'

import PublicWorkChapterList from './PublicWorkChapterList'
import PublicWorkHeader from './PublicWorkHeader'
import PublicWorkInfo from './PublicWorkInfo'

export default function PublicWorkOverview() {
    const { work, chapters = [], isOwner, navigate, coverUrl, slug } = useComicShow()

    const { token, user } = useAuthStore()
    const { openLogin } = useModalStore()
    const { wallet, refetch: refetchWallet } = useWallet()
    const home = useHome()

    const queryClient = useQueryClient()

    const [unlocking, setUnlocking] = useState(false)

    const [unlockModal, setUnlockModal] = useState<{
        open: boolean
        chapterSlug: string | null
        chapterTitle: string
        creditsRequired: number
    }>({
        open: false,
        chapterSlug: null,
        chapterTitle: '',
        creditsRequired: 0,
    })

    const firstChapter = chapters.find((chapter: any) => Boolean(chapter?.slug)) ?? null
    const similarWorks = ([
        ...home.popularWorks,
        ...home.freshReleases,
        ...home.weeklyChart,
    ])
        .filter((item) => item.slug !== slug)
        .filter((item) => item.type === work?.type)
        .filter((item) => {
            const genres = (work?.genres ?? []).map((genre: string) => genre.toLowerCase())
            if (genres.length === 0) return false
            return (item.genres ?? []).some((genre) => genres.includes(genre.toLowerCase()))
        })
        .slice(0, 6)

    const openUnlockModal = (
        chapterSlug: string,
        chapterTitle: string,
        creditsRequired: number
    ) => {
        if (!token) {
            openLogin()
            return
        }

        setUnlockModal({
            open: true,
            chapterSlug,
            chapterTitle,
            creditsRequired,
        })
    }

    const closeUnlockModal = () => {
        setUnlockModal((current) => ({
            ...current,
            open: false,
        }))
    }

    const handleConfirmUnlock = async () => {
        if (!unlockModal.chapterSlug) {
            return
        }

        setUnlocking(true)

        try {
            const chapter = chapters.find((item: any) => item.slug === unlockModal.chapterSlug)

            if (!chapter) {
                toast.error('Chapter could not be found.')
                return
            }

            const result = await unlockChapter(chapter.slug)

            if (!result.success) {
                return
            }

            await refetchWallet()

            await queryClient.invalidateQueries({
                queryKey: ['comic', slug, user?.id ?? 'guest'],
            })

            closeUnlockModal()

            navigate(`/works/${slug}/chapters/${chapter.slug}`)
        } catch (error) {
            console.error('Unlock error:', error)

            toast.error('Could not unlock this chapter.')
        } finally {
            setUnlocking(false)
        }
    }

    const handleChapterClick = (chapter: any) => {
        if (!chapter?.slug) {
            return
        }

        if (!token) {
            openLogin()
            return
        }

        if (chapter.is_locked && !isOwner) {
            openUnlockModal(chapter.slug, chapter.title, chapter.credits_required ?? 0)

            return
        }

        navigate(`/works/${slug}/chapters/${chapter.slug}`)
    }

    const handleFirstEpisodeClick = () => {
        if (!firstChapter) {
            return
        }

        handleChapterClick(firstChapter)
    }

    const sidebarActions: ReactNode = work?.id ? (
        <>
            <SuperLikeButton
                targetType="work"
                targetId={work.id}
                className="text-[10px] [&>svg]:h-3 [&>svg]:w-3"
                initialCount={work.super_likes_count ?? 0}
                ownerUserId={work.user_id}
                showCount={false}
            />

            <WorkEngagementButtons
                slug={slug ?? ''}
                initialLikeCount={work.work_likes_count ?? work.likes ?? 0}
                initialFavoriteCount={work.favorites_count ?? 0}
            />
        </>
    ) : null

    return (
        <>
            <UnlockModal
                open={unlockModal.open}
                onClose={closeUnlockModal}
                onConfirm={handleConfirmUnlock}
                chapterTitle={unlockModal.chapterTitle}
                creditsRequired={unlockModal.creditsRequired}
                userBalance={wallet?.balance ?? 0}
                unlocking={unlocking}
            />

            <main
                className="
                    min-h-screen
                    bg-background
                    pb-14
                "
            >
                {/* ============================================================
                    ONE HEADER ONLY

                    PublicWorkHeader:
                    - uses only work.banner
                    - never uses work.cover as the banner
                    - reads social links from work.user.public_link
                ============================================================ */}
                <div className="w-full">
                    <PublicWorkHeader work={work} coverUrl={coverUrl} />
                </div>

                {/* ============================================================
                    ONE LEFT SIDEBAR + ONE RIGHT CHAPTER PANEL

                    PublicWorkInfo is rendered exactly once.
                ============================================================ */}
                <div
                    className="
                        relative
                        z-10
                        mx-auto
                        -mt-7
                        grid
                        w-full
                        max-w-[1180px]
                        gap-5
                        px-3
                        sm:-mt-9
                        sm:px-5
                        lg:-mt-10
                        lg:grid-cols-[280px_minmax(0,1fr)]
                        lg:items-start
                        lg:gap-6
                    "
                >
                    {/* LEFT SIDEBAR */}
                    <aside className="min-w-0">
                        <PublicWorkInfo
                            work={work}
                            isOwner={isOwner}
                            slug={slug ?? ''}
                            navigate={navigate}
                            coverUrl={coverUrl}
                            onFirstEpisodeClick={handleFirstEpisodeClick}
                            hasFirstEpisode={Boolean(firstChapter)}
                            engagementActions={sidebarActions}
                        />
                    </aside>

                    {/* RIGHT SIDE — SEPARATE BANNER, TITLE, LINKS, AND LIST */}
                    <section className="min-w-0 space-y-3">
                        {/* NEW EPISODES BANNER + PUBLIC LINKS */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div
                                className="
                                    relative
                                    min-w-0
                                    flex-1
                                    overflow-hidden
                                    rounded-[18px]
                                    bg-[#58b6f5]
                                    px-5
                                    py-3
                                    text-white
                                    shadow-[0_10px_24px_rgba(56,189,248,0.24)]
                                    sm:px-6
                                "
                            >
                                <div className="relative z-10 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5" />

                                    <h2 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                                        New episodes!
                                    </h2>
                                </div>

                                <div
                                    className="
                                        pointer-events-none
                                        absolute
                                        -right-6
                                        -top-10
                                        h-28
                                        w-28
                                        rounded-full
                                        border-[12px]
                                        border-white/20
                                    "
                                />

                                <div
                                    className="
                                        pointer-events-none
                                        absolute
                                        right-14
                                        top-3
                                        h-3
                                        w-3
                                        rounded-full
                                        bg-yellow-300
                                    "
                                />

                                <div
                                    className="
                                        pointer-events-none
                                        absolute
                                        bottom-2
                                        right-24
                                        h-2
                                        w-2
                                        rounded-full
                                        bg-white/70
                                    "
                                />
                            </div>

                            <PublicSocialLinks
                                value={
                                    (work?.user as { public_link?: unknown } | undefined)
                                        ?.public_link
                                }
                            />
                        </div>

                        {/* TABLE OF CONTENTS TITLE — OUTSIDE THE CHAPTER CARD */}
                        {/* <div className="flex flex-wrap items-end justify-between gap-2 px-1 pt-1">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#58b6f5]">
                                    Episodes
                                </p>
                            </div>

                            <span className="rounded-full border border-border bg-background px-3 py-1 text-[10px] font-semibold text-muted-foreground shadow-sm">
                                {chapters.length} chapter{chapters.length === 1 ? '' : 's'}
                            </span>
                        </div> */}

                        {/* CHAPTER LIST CARD ONLY */}
                        <div
                            className="
                            "
                        >
                            <PublicWorkChapterList
                                chapters={chapters}
                                coverUrl={coverUrl}
                                slug={slug ?? ''}
                                isOwner={isOwner}
                                onChapterClick={handleChapterClick}
                            />
                        </div>
                    </section>
                </div>

                {/* COMMENTS UNDER THE RIGHT COLUMN */}
                {work?.id && (
                    <div
                        className="
                            mx-auto
                            mt-6
                            w-full
                            max-w-[1180px]
                            px-3
                            sm:px-5

                        "
                    >
                        <div
                            className="
                                rounded-[26px]
                                bg-background
                                p-4
                                shadow-[0_14px_40px_rgba(15,23,42,0.10)]
                                ring-1
                                ring-black/5
                                sm:p-6
                                dark:ring-white/10
                            "
                        >
                            <CommentSection2
                                targetType="work"
                                targetId={work.id}
                                artistUsername={work.user?.username}
                                title={`${work.title} comments`}
                                initialVisibleCount={10}
                            />
                        </div>
                    </div>
                )}

                {similarWorks.length > 0 && (
                    <section className="mx-auto mt-6 w-full max-w-[1180px] px-3 sm:px-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h2 className="text-lg font-black uppercase tracking-tight">
                                Similar {work?.type === 'wattpad' ? 'novels' : 'comix'}
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                            {similarWorks.map((item) => (
                                <WorkCard3
                                    key={item.id}
                                    id={item.id}
                                    slug={item.slug}
                                    title={item.title}
                                    cover={home.cover(item.cover, 'sm') ?? ''}
                                    type={item.type as 'webtoon' | 'wattpad' | 'art'}
                                    genres={item.genres}
                                    views={item.views}
                                    likes={item.likes}
                                    status={item.status}
                                    showStats
                                />
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </>
    )
}

type PublicLink = {
    id: string
    label: string
    platform: string
    url: string
}

function PublicSocialLinks({ value }: { value: unknown }) {
    const links = normalizePublicLinks(value)

    if (links.length === 0) {
        return null
    }

    return (
        <nav
            aria-label="Creator public links"
            className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:max-w-[280px]"
        >
            {links.map((link) => (
                <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    title={link.label}
                    aria-label={`Open ${link.label}`}
                    className="
                        inline-flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-border
                        bg-background
                        text-foreground
                        shadow-sm
                        transition
                        hover:-translate-y-0.5
                        hover:border-[#58b6f5]
                        hover:bg-sky-50
                        hover:text-[#258fd5]
                        hover:shadow-md
                        dark:hover:bg-sky-950/30
                    "
                >
                    <PublicLinkIcon platform={link.platform} />
                    <span className="sr-only">{link.label}</span>
                </a>
            ))}
        </nav>
    )
}

function PublicLinkIcon({ platform }: { platform: string }) {
    const iconClassName = 'h-4 w-4'

    if (platform === 'discord') {
        return <DiscordIcon className={iconClassName} />
    }

    if (platform === 'instagram') {
        return <InstagramIcon className={iconClassName} />
    }

    if (platform === 'facebook') {
        return <FacebookIcon className={iconClassName} />
    }

    if (platform === 'youtube') {
        return <YouTubeIcon className={iconClassName} />
    }

    if (platform === 'github') {
        return <GitHubIcon className={iconClassName} />
    }

    if (platform === 'twitch') {
        return <TwitchIcon className={iconClassName} />
    }

    if (platform === 'threads') {
        return <ThreadsIcon className={iconClassName} />
    }

    if (platform === 'x' || platform === 'twitter') {
        return <XIcon className={iconClassName} />
    }

    if (platform === 'tiktok') {
        return <TikTokIcon className={iconClassName} />
    }

    if (platform === 'website' || platform === 'portfolio') {
        return <Globe2 className={iconClassName} />
    }

    return <Link2 className={iconClassName} />
}

type SocialIconProps = {
    className?: string
}

function DiscordIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M19.5 5.34A17.3 17.3 0 0 0 15.44 4l-.5 1.03a15.3 15.3 0 0 0-5.88 0L8.55 4A17.4 17.4 0 0 0 4.5 5.35C1.94 9.14 1.25 12.84 1.6 16.5a16.5 16.5 0 0 0 4.98 2.52l1.2-1.65a10.7 10.7 0 0 1-1.88-.9l.46-.35c3.63 1.68 7.56 1.68 11.15 0l.47.35c-.6.35-1.24.65-1.89.9l1.2 1.65a16.4 16.4 0 0 0 4.98-2.52c.42-4.24-.72-7.9-2.77-11.16ZM8.82 14.25c-1.09 0-1.99-1-1.99-2.22s.88-2.22 1.99-2.22c1.1 0 2 1 1.98 2.22 0 1.22-.88 2.22-1.98 2.22Zm6.36 0c-1.09 0-1.98-1-1.98-2.22s.87-2.22 1.98-2.22c1.1 0 2 1 1.98 2.22 0 1.22-.87 2.22-1.98 2.22Z" />
        </svg>
    )
}

function InstagramIcon({ className }: SocialIconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
    )
}

function FacebookIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M13.6 22v-9h3.1l.47-3.5H13.6V7.27c0-1.01.28-1.7 1.78-1.7h1.91V2.44c-.33-.04-1.46-.14-2.78-.14-2.75 0-4.63 1.68-4.63 4.77V9.5H6.77V13h3.11v9h3.72Z" />
        </svg>
    )
}

function YouTubeIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.86 12 9.6 15.6Z" />
        </svg>
    )
}

function GitHubIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.02c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18A10.9 10.9 0 0 1 12 6.14c.98 0 1.95.13 2.86.38 2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.68.42.36.78 1.07.78 2.16v3.03c0 .31.21.67.79.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
        </svg>
    )
}

function TwitchIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M2.15 0 0 5.74v15.67h5.74V24l3.13-2.59h4.7L24 11.48V0H2.15Zm19.24 10.17-4.17 4.17h-4.7l-3.66 3.13v-3.13H4.7V2.61h16.69v7.56ZM17.74 5.22h-2.61v5.74h2.61V5.22Zm-7.04 0H8.09v5.74h2.61V5.22Z" />
        </svg>
    )
}

function XIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.49 22H3.38l7.25-8.29L3 2h6.4l4.42 5.84L18.9 2Zm-1.09 17.84h1.72L8.46 4.05H6.61l11.2 15.79Z" />
        </svg>
    )
}

function TikTokIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M16.7 1c.18 1.55 1.05 2.94 2.35 3.78A6.5 6.5 0 0 0 22 5.77v3.6a10.04 10.04 0 0 1-5.3-1.56v7.34a7.14 7.14 0 1 1-6.15-7.08v3.65a3.54 3.54 0 1 0 2.5 3.43V1h3.65Z" />
        </svg>
    )
}

function ThreadsIcon({ className }: SocialIconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17.2 8.6c-.7-3-2.8-4.6-5.4-4.6-3.6 0-6.1 2.6-6.1 7.7 0 5.3 2.7 8.3 6.6 8.3 3.4 0 5.8-2 5.8-4.8 0-2.5-1.8-4.1-4.7-4.1-2.6 0-4.3 1.2-4.3 3 0 1.4 1.1 2.4 2.7 2.4 2.8 0 4.8-2.4 4.8-5.8 0-1-.1-1.8-.3-2.6" />
        </svg>
    )
}

function normalizePublicLinks(value: unknown): PublicLink[] {
    const parsedValue = parsePublicLinkValue(value)
    const candidates: Array<{ platformHint: string; label?: string; rawUrl: unknown }> = []

    if (Array.isArray(parsedValue)) {
        parsedValue.forEach((item, index) => {
            if (typeof item === 'string') {
                candidates.push({
                    platformHint: detectPublicLinkPlatform('', item),
                    rawUrl: item,
                })
                return
            }

            if (item && typeof item === 'object') {
                const record = item as Record<string, unknown>
                const rawUrl =
                    record.url ?? record.href ?? record.link ?? record.value ?? record.profile_url
                const platformHint = String(
                    record.platform ?? record.type ?? record.name ?? record.label ?? `link-${index}`
                )

                candidates.push({
                    platformHint,
                    label: typeof record.label === 'string' ? record.label : undefined,
                    rawUrl,
                })
            }
        })
    } else if (parsedValue && typeof parsedValue === 'object') {
        Object.entries(parsedValue as Record<string, unknown>).forEach(([key, item]) => {
            if (typeof item === 'string') {
                candidates.push({ platformHint: key, rawUrl: item })
                return
            }

            if (item && typeof item === 'object') {
                const record = item as Record<string, unknown>

                candidates.push({
                    platformHint: String(record.platform ?? record.type ?? key),
                    label: typeof record.label === 'string' ? record.label : undefined,
                    rawUrl:
                        record.url ??
                        record.href ??
                        record.link ??
                        record.value ??
                        record.profile_url,
                })
            }
        })
    } else if (typeof parsedValue === 'string') {
        candidates.push({
            platformHint: detectPublicLinkPlatform('', parsedValue),
            rawUrl: parsedValue,
        })
    }

    const uniqueUrls = new Set<string>()

    return candidates.flatMap((candidate, index) => {
        if (typeof candidate.rawUrl !== 'string' || !candidate.rawUrl.trim()) {
            return []
        }

        const platform = detectPublicLinkPlatform(candidate.platformHint, candidate.rawUrl)
        const url = normalizePublicLinkUrl(candidate.rawUrl, platform)

        if (!url || uniqueUrls.has(url)) {
            return []
        }

        uniqueUrls.add(url)

        return [
            {
                id: `${platform}-${index}-${url}`,
                platform,
                url,
                label: candidate.label?.trim() || publicLinkLabel(platform, candidate.platformHint),
            },
        ]
    })
}

function parsePublicLinkValue(value: unknown): unknown {
    if (typeof value !== 'string') {
        return value
    }

    const trimmed = value.trim()

    if (!trimmed) {
        return null
    }

    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        return trimmed
    }

    try {
        return JSON.parse(trimmed)
    } catch {
        return trimmed
    }
}

function detectPublicLinkPlatform(platformHint: string, rawUrl: string) {
    const source = `${platformHint} ${rawUrl}`.toLowerCase()

    if (source.includes('discord')) return 'discord'
    if (source.includes('threads')) return 'threads'
    if (source.includes('instagram')) return 'instagram'
    if (source.includes('facebook') || source.includes('fb.com')) return 'facebook'
    if (source.includes('youtube') || source.includes('youtu.be')) return 'youtube'
    if (source.includes('github')) return 'github'
    if (source.includes('twitch')) return 'twitch'
    if (source.includes('tiktok')) return 'tiktok'
    if (source.includes('twitter') || source.includes('x.com')) return 'x'
    if (source.includes('portfolio')) return 'portfolio'
    if (source.includes('website') || source.includes('site')) return 'website'

    return (
        platformHint
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') || 'link'
    )
}

function normalizePublicLinkUrl(rawValue: string, platform: string) {
    const value = rawValue.trim()

    if (!value) {
        return null
    }

    if (/^(https?:\/\/|mailto:)/i.test(value)) {
        return value
    }

    if (/^www\./i.test(value) || value.includes('.com/') || value.includes('.gg/')) {
        return `https://${value.replace(/^\/+/, '')}`
    }

    const handle = value.replace(/^@/, '').replace(/^\/+|\/+$/g, '')

    if (!handle || handle.includes(' ')) {
        return null
    }

    if (platform === 'discord') return `https://discord.gg/${handle}`
    if (platform === 'threads') return `https://threads.net/@${handle}`
    if (platform === 'instagram') return `https://instagram.com/${handle}`
    if (platform === 'facebook') return `https://facebook.com/${handle}`
    if (platform === 'youtube')
        return `https://youtube.com/${value.startsWith('@') ? '@' : ''}${handle}`
    if (platform === 'github') return `https://github.com/${handle}`
    if (platform === 'twitch') return `https://twitch.tv/${handle}`
    if (platform === 'tiktok') return `https://tiktok.com/@${handle}`
    if (platform === 'x' || platform === 'twitter') return `https://x.com/${handle}`

    return null
}

function publicLinkLabel(platform: string, fallback: string) {
    const labels: Record<string, string> = {
        discord: 'Discord',
        threads: 'Threads',
        instagram: 'Instagram',
        facebook: 'Facebook',
        youtube: 'YouTube',
        github: 'GitHub',
        twitch: 'Twitch',
        tiktok: 'TikTok',
        x: 'X',
        twitter: 'X',
        website: 'Website',
        portfolio: 'Portfolio',
    }

    if (labels[platform]) {
        return labels[platform]
    }

    return (
        fallback
            .replace(/[_-]+/g, ' ')
            .replace(/\b\w/g, (character) => character.toUpperCase())
            .trim() || 'Public link'
    )
}

interface WorkEngagement {
    liked: boolean
    favorited: boolean
    work_likes_count: number
    favorites_count: number
}

function WorkEngagementButtons({
    slug,
    initialLikeCount,
    initialFavoriteCount,
}: {
    slug: string
    initialLikeCount: number
    initialFavoriteCount: number
}) {
    const { token } = useAuthStore()

    const { openLogin } = useModalStore()

    const queryClient = useQueryClient()

    const queryKey = ['work-engagement', slug]

    const fallback: WorkEngagement = {
        liked: false,
        favorited: false,
        work_likes_count: initialLikeCount,
        favorites_count: initialFavoriteCount,
    }

    const { data = fallback } = useQuery<WorkEngagement>({
        queryKey,

        queryFn: () => publicApi.getWorkEngagement(slug).then((response) => response.data),

        enabled: Boolean(slug),
        initialData: fallback,
    })

    const mergeEngagement = (next: Partial<WorkEngagement>) => {
        queryClient.setQueryData<WorkEngagement>(queryKey, (current) => ({
            ...(current ?? fallback),
            ...next,
        }))
    }

    const likeMutation = useMutation({
        mutationFn: () => publicApi.toggleWorkLike(slug).then((response) => response.data),

        onSuccess: (result) => {
            mergeEngagement(result)
        },

        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not update like.')
        },
    })

    const favoriteMutation = useMutation({
        mutationFn: () => publicApi.toggleWorkFavorite(slug).then((response) => response.data),

        onSuccess: (result) => {
            mergeEngagement(result)
        },

        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not update favorite.')
        },
    })

    const requireLogin = () => {
        if (token) {
            return true
        }

        openLogin()
        return false
    }

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                onClick={() => {
                    if (requireLogin()) {
                        likeMutation.mutate()
                    }
                }}
                disabled={likeMutation.isPending}
                className={`
                    h-9
                    min-w-0
                    gap-1
                    rounded-full
                    px-1
                    text-[10px]
                    font-medium
                    hover:bg-red-50
                    hover:text-red-500
                    dark:hover:bg-red-950/20
                    ${data.liked ? 'text-red-500' : 'text-foreground'}
                `}
            >
                {likeMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Heart
                        className={`
                            h-3.5
                            w-3.5
                            ${data.liked ? 'fill-current' : ''}
                        `}
                    />
                )}

                <span>Like</span>
            </Button>

            <Button
                type="button"
                variant="ghost"
                onClick={() => {
                    if (requireLogin()) {
                        favoriteMutation.mutate()
                    }
                }}
                disabled={favoriteMutation.isPending}
                className={`
                    h-9
                    min-w-0
                    gap-1
                    rounded-full
                    px-1
                    text-[10px]
                    font-medium
                    hover:bg-blue-50
                    hover:text-blue-500
                    dark:hover:bg-blue-950/20
                    ${data.favorited ? 'text-blue-500' : 'text-foreground'}
                `}
            >
                {favoriteMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Bookmark
                        className={`
                            h-3.5
                            w-3.5
                            ${data.favorited ? 'fill-current' : ''}
                        `}
                    />
                )}

                <span>Favorite</span>
            </Button>
        </>
    )
}
