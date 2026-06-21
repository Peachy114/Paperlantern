export interface Work {
    id: number
    title: string
    type: 'webtoon' | 'wattpad'
    status: 'draft' | 'ongoing' | 'completed' | 'hiatus'
    genres: string[]
    cover: string | null
    views: number
    chapters_count: number
    created_at: string
    author_name?: string
}
