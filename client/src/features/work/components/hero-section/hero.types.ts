import type { Announcement } from '@/api/announcement'

export type { Announcement }

export interface HeroWork {
    id: string
    slug: string
    title: string
    description?: string | null
    banner?: string | null
    cover: string | null
    type: 'webtoon' | 'wattpad'
    status?: string
}

export type Slide = { kind: 'comic'; data: HeroWork } | { kind: 'news'; data: Announcement }
