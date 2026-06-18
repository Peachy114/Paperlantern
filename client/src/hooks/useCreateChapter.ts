// hooks/useCreateChapter.ts
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { studioApi } from '@/api/studio'
import { containsBadWord } from '@/lib/badWords'

export function useCreateChapter(workType: 'webtoon' | 'wattpad') {
  const { workId } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    content: '',
    status: 'draft' as 'draft' | 'scheduled' | 'published',
    scheduled_at: '',
    lock_type: 'free' as 'free' | 'early_access' | 'premium', 
    credits_required: 3,
  })

  const [cover, setCover] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    setCover(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setImages((prev) => [...prev, ...files])
    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const reorderImages = (from: number, to: number) => {
    setImages((prev) => {
      if (prev.length === 0) return prev
      const reordered = [...prev]
      const [moved] = reordered.splice(from, 1)
      reordered.splice(to, 0, moved)
      return reordered
    })
    setImagePreviews((prev) => {
      const reordered = [...prev]
      const [moved] = reordered.splice(from, 1)
      reordered.splice(to, 0, moved)
      return reordered
    })
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Bad word check
    if (containsBadWord(form.title)) {
       setError('Title contains inappropriate language.')
      setLoading(false)
      return
    }
    if (form.title.trim().length === 0) {
      setError('Title is required.')
      setLoading(false)
      return
    }
    if (form.title.length > 100) {
      setError('Title is too long. Maximum 100 characters.')
      setLoading(false)
      return
    }
    if (workType === 'webtoon' && images.length === 0) {
      setError('Please add at least one chapter page.')
      setLoading(false)
      return
    }
    if (workType === 'wattpad' && !form.content.trim()) {
      setError('Story content is required.')
      setLoading(false)
      return
    }
    if (!cover) {
      setError('Cover image is required.')
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('content', form.content)
      formData.append('status', form.status)
      formData.append('lock_type', form.lock_type)  
      formData.append('credits_required', String(form.credits_required))
      if (form.scheduled_at) formData.append('scheduled_at', form.scheduled_at)
      if (cover) formData.append('cover', cover)

      if (workType === 'webtoon') {
        images.forEach((img) => formData.append('images[]', img))
      }

      await studioApi.createChapter(Number(workId), formData)
      navigate(`/studio/works/${workId}/chapters`)
    } catch {
      setError('Failed to create chapter. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return {
    form,
    cover,
    coverPreview,
    images,
    imagePreviews,
    loading,
    error,
    navigate,
    workId: Number(workId),
    handleChange,
    handleCoverChange,
    handleImagesChange,
    removeImage,
    reorderImages,
    handleSubmit,
  }
}