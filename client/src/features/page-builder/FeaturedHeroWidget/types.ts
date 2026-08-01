import { type PointerEvent as ReactPointerEvent } from 'react'
import type { PageWidget } from '@/types/pageLayout'
import type { Announcement } from '@/api/announcement'

export type HeroItem = {
    id: string
    type: 'work' | 'art' | 'commission' | 'announcement' | 'shop'
    title: string
    artist?: string | null
    image: string | null
    href: string
    views?: number
    likes?: number
    labels?: string[]
    featured?: boolean
    announcement?: Announcement
}

export type ShopHeroItem = {
    id: string
    slug?: string
    title: string
    labels?: string[]
    image_path?: string | null
    downloads_count?: number
    likes?: number
    is_featured?: boolean
    source_label?: string
    artist?: {
        name?: string
        username?: string
    } | null
}

export type CarouselDesign = 'default' | 'reference_1' | 'reference_2' | 'reference_3' | 'reference_4'

export type HeroLayoutProps = {
    widget: PageWidget
    items: HeroItem[]
    current: HeroItem
    currentIndex: number
    previousItem: HeroItem
    nextItem: HeroItem
    onPrev: () => void
    onNext: () => void
    onGoTo: (index: number) => void
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void
    onOpenItem: (item: HeroItem) => void
    dragOffset: number
    isDragging: boolean
}