// hooks/useChapterIndex.ts
import { useNavigate, useParams } from 'react-router-dom'
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { studioApi } from '@/api/studio'

export interface Chapter {
  id: number 
  work_id: number
  title: string
  content: string | null
  order: number
  status: 'draft' | 'scheduled' | 'published'
  cover: string | null
  scheduled_at: string | null
  is_locked: boolean
  credits_required: number
  views: number
  likes: number
  created_at: string
}

export interface Work {
  id: number
  title: string
  type: 'webtoon' | 'wattpad'
}

export function useChapterIndex() {
  const { workId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: work } = useSuspenseQuery<Work>({
    queryKey: ['studio-work', workId],
    queryFn: () => studioApi.getWork(Number(workId)).then((res) => res.data),
  })

  const { data: chapters } = useSuspenseQuery<Chapter[]>({
    queryKey: ['studio-chapters', workId],
    queryFn: () => studioApi.getChapters(Number(workId)).then((res) => res.data),
  })

  const handleDelete = async (chapterId: number) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return
    try {
      await studioApi.deleteChapter(Number(workId), chapterId)
      queryClient.setQueryData<Chapter[]>(['studio-chapters', workId], (prev) =>
        prev?.filter((c) => c.id !== chapterId) ?? []
      )
    } catch {
      alert('Failed to delete chapter.')
    }
  }

  return {
    work,
    chapters,
    navigate,
    workId: Number(workId),
    handleDelete,
  }
}