export interface ChapterImage {
  id: number
  path: string
  order: number
}

export interface Chapter {
  id: number
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
}

export type ChapterListItem = Pick<Chapter, 'id' | 'title' | 'order' | 'is_locked' | 'credits_required' | 'created_at'>