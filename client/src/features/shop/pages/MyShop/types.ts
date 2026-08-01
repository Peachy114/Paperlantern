export type ShopItem = {
    id: string
    title: string
    slug: string
    description?: string | null
    type: 'download' | 'adoptable' | 'sticker'
    labels?: string[] | null
    status: 'draft' | 'published' | 'archived'
    image_path?: string | null
    download_policy: 'free' | 'paid'
    credit_cost: number
    downloads_count: number
    likes_count: number
    usage?: {
        comments?: boolean
        profile?: boolean
        backgrounds?: boolean
        messages?: boolean
    } | null
    files?: Array<{
        id: string
        original_name?: string | null
        mime_type?: string | null
        size_bytes: number
    }>
}

export type ShopFileEntry = {
    id: string
    file: File
}

export type ShopFormState = {
    title: string
    description: string
    type: 'download' | 'adoptable' | 'sticker'
    labels: string
    status: 'draft' | 'published' | 'archived'
    download_policy: 'free' | 'paid'
    credit_cost: string
    usage: {
        comments: boolean
        profile: boolean
        backgrounds: boolean
        messages: boolean
    }
    image: File | null
    files: ShopFileEntry[]
}

export const emptyShopForm: ShopFormState = {
    title: '',
    description: '',
    type: 'download',
    labels: '',
    status: 'draft',
    download_policy: 'paid',
    credit_cost: '1',
    usage: {
        comments: false,
        profile: false,
        backgrounds: false,
        messages: false,
    },
    image: null,
    files: [],
}

export type ShopStats = {
    publishedItems: number
    paidItems: number
    freeItems: number
    draftItems: number
    totalDownloads: number
    totalLikes: number
    featuredItem: ShopItem | null
    downloadProducts: number
    adoptables: number
    stickers: number
}