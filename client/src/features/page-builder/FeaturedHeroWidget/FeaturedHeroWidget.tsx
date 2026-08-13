import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
} from 'react'

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAnnouncements } from '@/features/announcements/hooks/useAnnouncements'
import { publicApi } from '@/api/public'
import { storageUrl } from '@/utils/storage'
import type { PageWidget } from '@/types/pageLayout'
import type { WorkItem } from '@/features/work/hooks/useHome'
import type { Art } from '@/types/art'
import type { CommissionService } from '@/types/commission'
import { SAMPLE_ARTS, SAMPLE_COMMISSIONS } from '@/features/page-builder/samplePageData'
import { AUTO_ROTATE_DELAY, DRAG_THRESHOLD } from './constants'
import { AnnouncementStyleHero } from './designs/AnnouncementStyleHero'
import { BlurredBackgroundHero } from './designs/BlurredBackgroundHero'
import { BlurredBackgroundHeroSameHeight } from './designs/BlurredBackgroundHeroSameHeight'
import { GappedHero } from './designs/GappedHero'
import { OverlappingHero } from './designs/OverlappingHero'
import { FeaturedHeroSkeleton } from './FeaturedHeroSkeleton'
import { FeaturedHeroDetailsDialog } from './FeaturedHeroDetailsDialog'
import { SAMPLE_SHOP_HERO_ITEMS } from './sampleData'
import type { CarouselDesign, HeroItem, ShopHeroItem } from './types'
import { uniqueHeroItems } from './utils/uniqueHeroItems'

export default function FeaturedHeroWidget({
    widget,
    works,
    preview = false,
}: {
    widget: PageWidget
    works: WorkItem[]
    preview?: boolean
}) {
    const navigate = useNavigate()
    const settings = widget.settings ?? {}

    const sources = {
        arts: settings.hero_source_arts ?? true,
        announcements: settings.hero_source_announcements ?? true,
        works: settings.hero_source_works ?? true,
        novels: settings.hero_source_novels ?? true,
        commissions: settings.hero_source_commissions ?? true,
        shop: settings.hero_source_shop ?? false,
    }

    const limit = settings.limit ?? 10
    const featuredOnly = Boolean(settings.hero_featured_only)

    const { announcements, loading: announcementsLoading } = useAnnouncements('public')

    const artsQuery = useQuery({
        queryKey: ['featured-hero-arts'],
        enabled: sources.arts,
        queryFn: () => publicApi.getArts().then((res) => res.data),
        staleTime: 60_000,
    })

    const commissionsQuery = useQuery({
        queryKey: ['featured-hero-commissions'],
        enabled: sources.commissions,
        queryFn: async () => {
            const res = await publicApi.getCommissions()
            return res.data
        },
        staleTime: 60_000,
    })

    const shopQuery = useQuery({
        queryKey: ['featured-hero-shop'],
        enabled: sources.shop,
        queryFn: async () => {
            const res = await publicApi.getShop()
            return res.data
        },
        staleTime: 60_000,
    })

    const items = useMemo(() => {
        const nextItems: HeroItem[] = []

        if (sources.works || sources.novels || sources.arts) {
            works.forEach((work) => {
                if (work.type === 'webtoon' && !sources.works) return
                if (work.type === 'wattpad' && !sources.novels) return
                if (work.type === 'art' && !sources.arts) return

                nextItems.push({
                    id: `work-${work.id}`,
                    type: 'work',
                    title: work.title,
                    artist: null,
                    description: work.description,
                    image: storageUrl(work.banner || work.cover),
                    href:
                        work.type === 'art'
                            ? `/explore/arts?art=${encodeURIComponent(work.slug || work.id)}`
                            : `/works/${work.slug}`,
                    views: work.views,
                    likes: work.likes,
                    labels: work.genres,
                    featured: Boolean((work as WorkItem & { is_featured?: boolean }).is_featured),
                    work,
                })
            })
        }

        if (sources.announcements) {
            announcements.forEach((announcement) => {
                nextItems.push({
                    id: `announcement-${announcement.id}`,
                    type: 'announcement',
                    title: announcement.title,
                    artist: announcement.creator?.name,
                    description: announcement.content,
                    image: storageUrl(announcement.image ?? null, 'sm'),
                    href: '',
                    labels: announcement.tag ? [announcement.tag] : [],
                    featured: Boolean(
                        (announcement as typeof announcement & { is_featured?: boolean })
                            .is_featured || announcement.is_pinned
                    ),
                    announcement,
                })
            })
        }

        if (sources.arts) {
            const apiArts = (artsQuery.data?.arts?.data ?? []) as Art[]
            const arts = apiArts.length || !preview ? apiArts : SAMPLE_ARTS

            arts.forEach((art) => {
                nextItems.push({
                    id: `art-${art.id}`,
                    type: 'art',
                    title: art.title,
                    artist: art.user?.name ?? art.user?.username,
                    description: art.description,
                    image: storageUrl(art.images?.[0]?.image_path ?? art.image_path),
                    href: `/explore/arts?art=${encodeURIComponent(art.slug || art.id)}`,
                    views: art.views,
                    likes: art.likes,
                    labels: art.labels ?? [],
                    featured: Boolean(
                        (art as Art & { is_featured?: boolean }).is_featured || art.boosted_until
                    ),
                })
            })
        }

        if (sources.commissions) {
            const apiCommissions = (commissionsQuery.data?.commissions?.data ??
                []) as CommissionService[]
            const commissions =
                apiCommissions.length || !preview ? apiCommissions : SAMPLE_COMMISSIONS

            commissions.forEach((commission) => {
                nextItems.push({
                    id: `commission-${commission.id}`,
                    type: 'commission',
                    title: commission.title,
                    artist: commission.artist?.name ?? commission.artist?.username,
                    description: commission.description,
                    image: storageUrl(commission.image_path),
                    href: `/commissions?service=${encodeURIComponent(commission.slug)}`,
                    labels: commission.category?.name ? [commission.category.name] : ['Commission'],
                    featured: Boolean(commission.boosted_until),
                })
            })
        }

        if (sources.shop) {
            const apiShopItems = (shopQuery.data?.downloads?.data ?? []) as ShopHeroItem[]
            const shopItems =
                apiShopItems.length || !preview ? apiShopItems : SAMPLE_SHOP_HERO_ITEMS

            shopItems.forEach((item) => {
                nextItems.push({
                    id: `shop-${item.id}`,
                    type: 'shop',
                    title: item.title,
                    artist: item.artist?.name ?? item.artist?.username ?? item.source_label,
                    image: storageUrl(item.image_path ?? null),
                    href: `/shop?item=${encodeURIComponent(item.slug || item.id)}`,
                    views: item.downloads_count,
                    likes: item.likes,
                    labels: item.labels ?? ['Shop'],
                    featured: Boolean(item.is_featured),
                })
            })
        }

        const uniqueNextItems = uniqueHeroItems(nextItems)
        const filteredItems = uniqueNextItems.filter(
            (item) => item.image && (!featuredOnly || item.featured)
        )

        const fallbackItems = uniqueNextItems.filter((item) => item.image)

        return (filteredItems.length > 0 ? filteredItems : fallbackItems).slice(0, limit)
    }, [
        announcements,
        artsQuery.data,
        commissionsQuery.data,
        featuredOnly,
        limit,
        sources.announcements,
        sources.arts,
        sources.commissions,
        sources.novels,
        sources.shop,
        sources.works,
        shopQuery.data,
        works,
        preview,
    ])

    const isLoading =
        (sources.announcements && announcementsLoading) ||
        (sources.arts && artsQuery.isLoading) ||
        (sources.commissions && commissionsQuery.isLoading) ||
        (sources.shop && shopQuery.isLoading)

    const [index, setIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState(0)
    const [selectedHeroItem, setSelectedHeroItem] = useState<HeroItem | null>(null)

    const dragStartXRef = useRef<number | null>(null)
    const pointerIdRef = useRef<number | null>(null)

    const itemCount = items.length

    const goTo = useCallback(
        (nextIndex: number) => {
            if (itemCount === 0) return

            setIndex(((nextIndex % itemCount) + itemCount) % itemCount)
        },
        [itemCount]
    )

    const prev = useCallback(() => {
        setIndex((currentIndex) => {
            if (itemCount === 0) return 0
            return (currentIndex - 1 + itemCount) % itemCount
        })
    }, [itemCount])

    const next = useCallback(() => {
        setIndex((currentIndex) => {
            if (itemCount === 0) return 0
            return (currentIndex + 1) % itemCount
        })
    }, [itemCount])

    const openItem = useCallback((item: HeroItem) => {
        if (preview) return

        setSelectedHeroItem(item)
    }, [preview])

    useEffect(() => {
        if (itemCount === 0) {
            setIndex(0)
            return
        }

        setIndex((currentIndex) => currentIndex % itemCount)
    }, [itemCount])

    useEffect(() => {
        if (itemCount <= 1 || isHovered || isDragging) return

        const timer = window.setInterval(next, AUTO_ROTATE_DELAY)

        return () => window.clearInterval(timer)
    }, [isDragging, isHovered, itemCount, next])

    const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
        if (itemCount <= 1) return

        dragStartXRef.current = event.clientX
        pointerIdRef.current = event.pointerId
        setIsDragging(true)
        setDragOffset(0)

    }

    const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
        if (
            !isDragging ||
            dragStartXRef.current === null ||
            pointerIdRef.current !== event.pointerId
        ) {
            return
        }

        const nextDragOffset = event.clientX - dragStartXRef.current
        setDragOffset(nextDragOffset)

        // Capturing on pointer-down steals ordinary clicks from the hero card.
        // Capture only after a real drag begins so click-to-open still works.
        if (Math.abs(nextDragOffset) > 4 && !event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.setPointerCapture(event.pointerId)
        }
    }

    const finishPointerDrag = (event: ReactPointerEvent<HTMLElement>) => {
        if (pointerIdRef.current !== event.pointerId) return

        if (dragOffset <= -DRAG_THRESHOLD) {
            next()
        } else if (dragOffset >= DRAG_THRESHOLD) {
            prev()
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        dragStartXRef.current = null
        pointerIdRef.current = null
        setIsDragging(false)
        setDragOffset(0)
    }

    if (isLoading) return <FeaturedHeroSkeleton />

    if (items.length === 0) return null

    const design = (settings.hero_design ?? 'default') as CarouselDesign
    const currentIndex = index % items.length
    const current = items[currentIndex]
    const previousItem = items[(currentIndex - 1 + items.length) % items.length]
    const nextItem = items[(currentIndex + 1) % items.length]

    const sharedCarouselProps = {
        widget,
        items,
        current,
        currentIndex,
        previousItem,
        nextItem,
        onPrev: prev,
        onNext: next,
        onGoTo: goTo,
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: finishPointerDrag,
        onPointerCancel: finishPointerDrag,
        onOpenItem: openItem,
        dragOffset,
        isDragging,
    }

    return (
        <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            {design === 'reference_1' && <BlurredBackgroundHero {...sharedCarouselProps} />}

            {design === 'reference_2' && <OverlappingHero {...sharedCarouselProps} />}

            {design === 'reference_3' && <GappedHero {...sharedCarouselProps} />}

            {design === 'reference_4' && (
                <BlurredBackgroundHeroSameHeight {...sharedCarouselProps} />
            )}

            {design === 'default' && <AnnouncementStyleHero {...sharedCarouselProps} />}

            <FeaturedHeroDetailsDialog
                item={selectedHeroItem}
                onClose={() => setSelectedHeroItem(null)}
                onViewDetails={(item) => {
                    setSelectedHeroItem(null)
                    navigate(item.href)
                }}
            />
        </div>
    )
}
