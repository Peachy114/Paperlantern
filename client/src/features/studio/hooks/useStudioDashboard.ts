// hooks/useStudioDashboard.ts
import { useNavigate } from 'react-router-dom'
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { studioApi } from '@/api/studio'

interface Work {
    slug: string
    title: string
    type: 'webtoon' | 'wattpad'
    status: 'draft' | 'ongoing' | 'completed' | 'hiatus'
    genres: string[]
    cover: string | null
    views: number
    likes: number
    chapters_count: number
    created_at: string
}

export function useStudioDashboard() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [showTypeSelect, setShowTypeSelect] = useState(false)
    const [selectedType, setSelectedType] = useState<'webtoon' | 'wattpad'>('webtoon')

    const { data: works } = useSuspenseQuery<Work[]>({
        queryKey: ['studio-works'],
        queryFn: () => studioApi.getWorks().then((res) => res.data),
    })

    const handleDelete = async (slug: string) => {
        await studioApi.trashWork(slug)
        queryClient.setQueryData<Work[]>(
            ['studio-works'],
            (prev) => prev?.filter((w) => w.slug !== slug) ?? []
        )
    }

    const handleConfirmType = () => {
        setShowTypeSelect(false)
        navigate(`/studio/create?type=${selectedType}`)
    }

    return {
        works,
        showTypeSelect,
        selectedType,
        setShowTypeSelect,
        setSelectedType,
        handleDelete,
        handleConfirmType,
        navigate,
    }
}
