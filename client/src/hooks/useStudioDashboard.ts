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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this work?')) return
    try {
      await studioApi.deleteWork(id)
      queryClient.setQueryData<Work[]>(['studio-works'], (prev) =>
        prev?.filter((w) => w.id !== id) ?? []
      )
    } catch {
      alert('Failed to delete work.')
    }
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