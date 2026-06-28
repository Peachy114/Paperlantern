export interface ModerationUser {
    id: string
    name: string
    username: string
    email: string
    strike_count: number
    is_banned: boolean
}

export interface ChapterImage {
    id: string
    path: string
    order: number
}

export interface ChapterDetail {
    id: string
    title: string
    order: number
    content: string | null
    moderation_status: string
    created_at: string
    images: ChapterImage[]
    work: {
        id: string
        title: string
        cover: string | null
        type: string
        user: ModerationUser
    }
}

export interface WorkDetail {
    id: string
    title: string
    cover: string | null
    type: string
    description: string | null
    moderation_status: string
    created_at: string
    user: ModerationUser
}

export interface StickyNoteDetail {
    id: string
    type: 'text' | 'image'
    text: string | null
    image_path: string | null
    color: string | null
    moderation_status: string
    created_at: string
    user: ModerationUser
}
