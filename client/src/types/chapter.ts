export interface ChapterImage {
    id: string
    path: string
    order: number
}

export interface Chapter {
    id: string
    slug: string
    title: string
    order: number
    cover: string | null
    content: string | null
    work_type: 'webtoon' | 'wattpad'
    images: ChapterImage[]
    created_at: string
    is_locked: boolean
    credits_required: number
    status: string
    views: number
    likes: number
    work_user_id: string
}

export type ChapterListItem = Pick<
    Chapter,
    'id' | 'slug' | 'title' | 'order' | 'is_locked' | 'credits_required' | 'created_at' | 'likes'
>
