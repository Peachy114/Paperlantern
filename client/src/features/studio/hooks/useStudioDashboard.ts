// hooks/useStudioDashboard.ts
import { useNavigate } from 'react-router-dom'
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { studioApi } from '@/api/studio'

interface Work {
    id: number
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

    // Confirmation is handled by the AlertDialog in the component.
    // This just performs the delete and updates the cache — it throws on
    // failure so the caller can show its own toast/error feedback.
    const handleDelete = async (id: number) => {
        await studioApi.deleteWork(id)
        queryClient.setQueryData<Work[]>(
            ['studio-works'],
            (prev) => prev?.filter((w) => w.id !== id) ?? []
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
