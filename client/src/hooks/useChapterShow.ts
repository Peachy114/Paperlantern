import { useNavigate, useParams } from 'react-router-dom'
import { useSuspenseQuery } from '@tanstack/react-query'
import { studioApi } from '@/api/studio'
import { storageUrl } from '@/utils/storage'

interface ChapterImage {
  id: number
  path: string
  order: number
}

interface Chapter {
  id: number
  title: string
  order: number
  cover: string | null
  content: string | null
  work_type: 'webtoon' | 'wattpad'
  images: ChapterImage[]
  created_at: string
}

export function useChapterShow() {
  const { workId, id } = useParams()
  const navigate = useNavigate()

  const { data: chapter } = useSuspenseQuery<Chapter>({
    queryKey: ['studio-chapter', workId, id],
    queryFn: () => studioApi.getChapter(Number(workId), Number(id)).then((res) => res.data),
  })

  const { data: chapters } = useSuspenseQuery<Chapter[]>({
    queryKey: ['studio-chapters', workId],
    queryFn: () => studioApi.getChapters(Number(workId)).then((res) => res.data),
  })

  const idx = chapters.findIndex((c) => c.id === chapter.id)
  const prevId = idx > 0 ? chapters[idx - 1].id : null
  const nextId = idx < chapters.length - 1 ? chapters[idx + 1].id : null

  const goTo = (chapterId: number) => {
    navigate(`/studio/works/${workId}/chapters/${chapterId}/show`)
  }

  const imageUrl = (path: string) => storageUrl(path)

  return {
    chapter,
    prevId,
    nextId,
    workId: Number(workId),
    navigate,
    goTo,
    imageUrl,
  }
}