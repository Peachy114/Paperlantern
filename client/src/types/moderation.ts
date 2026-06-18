// types/moderation.ts

export interface ModerationUser {
  id: number
  name: string
  username: string
  email: string
  strike_count: number
  is_banned: boolean
}

export interface ChapterImage {
  id: number
  path: string
  order: number
}

export interface ChapterDetail {
  id: number
  title: string
  order: number
  content: string | null
  moderation_status: string
  created_at: string
  images: ChapterImage[]
  work: {
    id: number
    title: string
    cover: string | null
    type: string
    user: ModerationUser
  }
}

export interface WorkDetail {
  id: number
  title: string
  cover: string | null
  type: string
  description: string | null
  moderation_status: string
  created_at: string
  user: ModerationUser
}

export interface StickyNoteDetail {
  id: number
  type: 'text' | 'image'
  text: string | null
  image_path: string | null
  color: string | null
  moderation_status: string
  created_at: string
  user: ModerationUser
}