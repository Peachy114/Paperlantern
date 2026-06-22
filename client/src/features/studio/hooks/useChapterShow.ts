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
    slug: string
    title: string
    order: number
    cover: string | null
    content: string | null
    work_type: 'webtoon' | 'wattpad'
    images: ChapterImage[]
    created_at: string
}

export function useChapterShow() {
    const { workSlug, chapterSlug } = useParams()
    const navigate = useNavigate()

    const { data: chapter } = useSuspenseQuery<Chapter>({
        queryKey: ['studio-chapter', workSlug, chapterSlug],
        queryFn: () => studioApi.getChapter(workSlug!, chapterSlug!).then((res) => res.data),
    })

    const { data: chapters } = useSuspenseQuery<Chapter[]>({
        queryKey: ['studio-chapters', workSlug],
        queryFn: () => studioApi.getChapters(workSlug!).then((res) => res.data),
    })

    const idx = chapters.findIndex((c) => c.slug === chapter.slug)
    const prevSlug = idx > 0 ? chapters[idx - 1].slug : null
    const nextSlug = idx < chapters.length - 1 ? chapters[idx + 1].slug : null

    const goTo = (slug: string) => {
        navigate(`/studio/works/${workSlug}/chapters/${slug}/show`)
    }

    const imageUrl = (path: string) => storageUrl(path)

    return {
        chapter,
        prevSlug,
        nextSlug,
        workSlug,
        navigate,
        goTo,
        imageUrl,
    }
}
