import { useState } from 'react'
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { studioApi } from '@/api/studio'

interface TrashedWork {
    slug: string
    title: string
    type: 'webtoon' | 'wattpad'
    cover: string | null
    deleted_at: string
}

interface TrashedChapter {
    slug: string
    title: string
    cover: string | null
    work_title: string
    deleted_at: string
}

const PER_PAGE = 5

export function useStudioTrash() {
    const queryClient = useQueryClient()

    const [worksPage, setWorksPage] = useState(1)
    const [chaptersPage, setChaptersPage] = useState(1)

    const { data: allWorks } = useSuspenseQuery<TrashedWork[]>({
        queryKey: ['studio-trash-works'],
        queryFn: () => studioApi.getTrashedWorks().then((res) => res.data),
    })

    const { data: allChapters } = useSuspenseQuery<TrashedChapter[]>({
        queryKey: ['studio-trash-chapters'],
        queryFn: () => studioApi.getTrashedChapters().then((res) => res.data),
    })

    const works = allWorks.slice(0, worksPage * PER_PAGE)
    const chapters = allChapters.slice(0, chaptersPage * PER_PAGE)

    const hasMoreWorks = works.length < allWorks.length
    const hasMoreChapters = chapters.length < allChapters.length

    const loadMoreWorks = () => setWorksPage((p) => p + 1)
    const loadMoreChapters = () => setChaptersPage((p) => p + 1)

    const restoreWork = async (slug: string) => {
        await studioApi.restoreWork(slug)
        queryClient.setQueryData<TrashedWork[]>(
            ['studio-trash-works'],
            (prev) => prev?.filter((w) => w.slug !== slug) ?? []
        )
        queryClient.invalidateQueries({ queryKey: ['studio-works'] })
    }

    const forceDeleteWork = async (slug: string) => {
        await studioApi.forceDeleteWork(slug)
        queryClient.setQueryData<TrashedWork[]>(
            ['studio-trash-works'],
            (prev) => prev?.filter((w) => w.slug !== slug) ?? []
        )
    }

    const restoreChapter = async (slug: string) => {
        await studioApi.restoreChapter(slug)
        queryClient.setQueryData<TrashedChapter[]>(
            ['studio-trash-chapters'],
            (prev) => prev?.filter((c) => c.slug !== slug) ?? []
        )
    }

    const forceDeleteChapter = async (slug: string) => {
        await studioApi.forceDeleteChapter(slug)
        queryClient.setQueryData<TrashedChapter[]>(
            ['studio-trash-chapters'],
            (prev) => prev?.filter((c) => c.slug !== slug) ?? []
        )
    }

    return {
        works,
        chapters,
        hasMoreWorks,
        hasMoreChapters,
        loadMoreWorks,
        loadMoreChapters,
        restoreWork,
        forceDeleteWork,
        restoreChapter,
        forceDeleteChapter,
    }
}
