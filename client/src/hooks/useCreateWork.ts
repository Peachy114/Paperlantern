import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { studioApi } from '@/api/studio'
import { containsBadWord } from '@/lib/badWords'

export const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Thriller', 'Sports', 'Supernatural', 'Historical', 'Psychological'
]

export const SCHEDULES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'daily', 'weekly', 'biweekly', 'monthly']

export function useCreateWork() {
  const [searchParams] = useSearchParams()
  const type = (searchParams.get('type') ?? 'webtoon') as 'webtoon' | 'wattpad'
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    type,
    genres: [] as string[],
    status: 'draft',
    schedule: '',
    schedule_time: '',
    next_chapter_at: '',
  })

  const [cover, setCover] = useState<File | null>(null)
  const [banner, setBanner] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target
    setForm({ ...form, [name]: e.target.value })
    // Clear that field's error when user edits it
    if (fieldErrors[name]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[name]; return next })
    }
  }

  const handleGenreToggle = (genre: string) => {
    setForm((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre]
    }))
    // Clear genres error when user picks one
    if (fieldErrors['genres']) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next['genres']; return next })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'cover' | 'banner') => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    const preview = URL.createObjectURL(file)
    if (field === 'cover') { setCover(file); setCoverPreview(preview) }
    if (field === 'banner') { setBanner(file); setBannerPreview(preview) }
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})

    // Bad word check
    if (containsBadWord(form.title)) {
      setFieldErrors({ title: 'Title contains inappropriate language.' })
      setLoading(false)
      return
    }
    if (containsBadWord(form.description)) {
      setFieldErrors({ description: 'Description contains inappropriate language.' })
      setLoading(false)
      return
    }
    if (form.title.length > 30) {
      setFieldErrors({ title: 'Title must be 30 characters or less.' })
      setLoading(false)
      return
    }
    if (form.description.length > 300) {
      setFieldErrors({ description: 'Description must be 300 characters or less.' })
      setLoading(false)
      return
    }
    if (!form.description.trim()) {
      setFieldErrors({ description: 'Description is required.' })
      setLoading(false)
      return
    }
    if (!cover) {
      setFieldErrors({ cover: 'Cover image is required.' })
      setLoading(false)
      return
    }
    if (!banner) {
      setFieldErrors({ banner: 'Banner image is required.' })
      setLoading(false)
      return
    }
    if (form.genres.length === 0) {
      setFieldErrors({ genres: 'Please select at least one genre.' })
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'genres') {
          (value as string[]).forEach((g) => formData.append('genres[]', g))
        } else {
          formData.append(key, value as string)
        }
      })
      if (cover) formData.append('cover', cover)
      if (banner) formData.append('banner', banner)

      await studioApi.createWork(formData)
      navigate('/studio')
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const raw: Record<string, string[]> = err.response.data.errors
        const parsed: Record<string, string> = {}
        for (const [key, messages] of Object.entries(raw)) {
          const field = key.replace(/\.\d+$/, '')
          if (!parsed[field]) parsed[field] = messages[0]
        }
        setFieldErrors(parsed)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    type,
    form,
    cover,
    banner,
    coverPreview,
    bannerPreview,
    loading,
    error,
    fieldErrors,
    navigate,
    handleChange,
    handleGenreToggle,
    handleFileChange,
    handleSubmit,
  }
}