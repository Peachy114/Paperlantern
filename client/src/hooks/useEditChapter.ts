import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { studioApi } from '@/api/studio'
import { storageUrl } from '@/utils/storage'
import { containsBadWord } from '@/lib/badWords'

interface ImageItem {
  id?: number        // existing image
  file?: File        // new upload
  preview: string
}

export function useEditChapter(workType: 'webtoon' | 'wattpad') {
  const { workId, id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    content: '',
    status: 'draft' as 'draft' | 'scheduled' | 'published',
    scheduled_at: '',
    lock_type: 'free' as 'free' | 'early_access' | 'premium',
    is_locked: false,
    credits_required: 3,
  })

  const [cover, setCover] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [imageItems, setImageItems] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchChapter() }, [id])

  const fetchChapter = async () => {
    try {
      const res = await studioApi.getChapter(Number(workId), Number(id))
      const chapter = res.data
      setForm({
        title: chapter.title ?? '',
        content: chapter.content ?? '',
        status: chapter.status ?? 'draft',
        scheduled_at: chapter.scheduled_at
          ? new Date(chapter.scheduled_at).toISOString().slice(0, 16)
          : '',
        lock_type: chapter.lock_type ?? 'free',
        is_locked: chapter.is_locked ?? false,
        credits_required: chapter.credits_required ?? 0,
      })
      if (chapter.cover) setCoverPreview(storageUrl(chapter.cover))
      if (chapter.images?.length) {
        setImageItems(chapter.images.map((img: any) => ({
          id: img.id,
          preview: storageUrl(img.path)!,
        })))
      }
    } catch {
      setError('Failed to load chapter.')
    } finally {
      setFetching(false)
    }
  }

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
    setImageItems(files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    })))
  }

  const removeImage = (index: number) => {
    setImageItems((prev) => prev.filter((_, i) => i !== index))
  }

  const reorderImages = (from: number, to: number) => {
    setImageItems((prev) => {
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
    if (form.title.length > 30) {
      setError('Title must be 30 characters or less.' )
      setLoading(false)
      return
    }
    if (workType === 'webtoon' && imageItems.length === 0) {
      setError('Please add at least one chapter page.')
      setLoading(false)
      return
    }
    if ((form.lock_type === 'early_access' || form.lock_type === 'premium') && form.credits_required < 3) {
      setError('Minimum credits required is 3.')
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('_method', 'PUT')
      formData.append('title', form.title)
      formData.append('content', form.content)
      formData.append('status', form.status)
      formData.append('lock_type', form.lock_type)
      formData.append('credits_required', String(form.credits_required))
      if (form.scheduled_at) formData.append('scheduled_at', form.scheduled_at)
      if (cover) formData.append('cover', cover)

      if (workType === 'webtoon') {
        const newFiles = imageItems.filter((item) => item.file)
        const existingIds = imageItems.filter((item) => item.id && !item.file)

        if (newFiles.length > 0) {
          newFiles.forEach((item) => formData.append('images[]', item.file!))
        } else if (existingIds.length > 0) {
          existingIds.forEach((item) => formData.append('existing_image_ids[]', String(item.id)))
        }
        // both empty = backend deletes all
      }

      await studioApi.updateChapter(Number(workId), Number(id), formData)
      navigate(`/studio/works/${workId}/chapters`)
    } catch (err: any) {
      console.error('Validation errors:', err.response?.data)
      setError('Failed to update chapter. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return {
    form, coverPreview, imageItems,
    loading, fetching, error,
    navigate, workId: Number(workId),
    handleChange, handleCoverChange, handleImagesChange,
    removeImage, reorderImages, handleSubmit,
  }
}