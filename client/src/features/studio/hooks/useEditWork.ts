import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { studioApi } from '@/api/studio'
import { storageUrl } from '@/utils/storage'
import { containsBadWord } from '@/lib/badWords'
import * as Yup from 'yup'
import { toast } from 'sonner'

export const GENRES = [
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Fantasy',
    'Horror',
    'Mystery',
    'Romance',
    'Sci-Fi',
    'Slice of Life',
    'Thriller',
    'Sports',
    'Supernatural',
    'Historical',
    'Psychological',
]

export const SCHEDULES = [
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
    'sun',
    'daily',
    'weekly',
    'biweekly',
    'monthly',
]

const noBadWords = (field: string) =>
    Yup.string().test(
        'no-bad-words',
        `${field} contains inappropriate language.`,
        (val) => !val || !containsBadWord(val)
    )

// Cover/banner are optional on edit (existing images are kept if no new file is uploaded)
const schema = Yup.object({
    title: noBadWords('Title')
        .required('Title is required.')
        .max(30, 'Title must be 30 characters or less.'),
    description: noBadWords('Description')
        .required('Description is required.')
        .max(300, 'Description must be 300 characters or less.'),
    genres: Yup.array().of(Yup.string().required()).min(1, 'Please select at least one genre.'),
})

export function useEditWork() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [form, setForm] = useState({
        title: '',
        description: '',
        type: 'webtoon' as 'webtoon' | 'wattpad',
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
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchWork()
    }, [id])

    const fetchWork = async () => {
        try {
            const res = await studioApi.getWork(Number(id))
            const work = res.data
            setForm({
                title: work.title ?? '',
                description: work.description ?? '',
                type: work.type ?? 'webtoon',
                genres: work.genres ?? [],
                status: work.status ?? 'draft',
                schedule: work.schedule ?? '',
                schedule_time: work.schedule_time ?? '',
                next_chapter_at: work.next_chapter_at ? work.next_chapter_at.split('T')[0] : '',
            })
            if (work.cover) setCoverPreview(storageUrl(work.cover)!)
            if (work.banner) setBannerPreview(storageUrl(work.banner)!)
        } catch {
            setError('Failed to load work.')
        } finally {
            setFetching(false)
        }
    }

    const clearFieldError = (field: string) => {
        setFieldErrors((prev) => {
            const next = { ...prev }
            delete next[field]
            return next
        })
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name } = e.target
        setForm((prev) => ({ ...prev, [name]: e.target.value }))
        clearFieldError(name)
    }

    const handleGenreToggle = (genre: string) => {
        setForm((prev) => ({
            ...prev,
            genres: prev.genres.includes(genre)
                ? prev.genres.filter((g) => g !== genre)
                : [...prev.genres, genre],
        }))
        clearFieldError('genres')
    }

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: 'cover' | 'banner'
    ) => {
        const file = e.target.files?.[0] ?? null
        if (!file) return
        const preview = URL.createObjectURL(file)
        if (field === 'cover') {
            setCover(file)
            setCoverPreview(preview)
        }
        if (field === 'banner') {
            setBanner(file)
            setBannerPreview(preview)
        }
        clearFieldError(field)
    }

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setFieldErrors({})

        try {
            await schema.validate(form, { abortEarly: false })
        } catch (err) {
            if (err instanceof Yup.ValidationError) {
                const errors: Record<string, string> = {}
                err.inner.forEach((e) => {
                    if (e.path) errors[e.path] = e.message
                })
                setFieldErrors(errors)
                toast.error('Please fix the highlighted fields.')
            }
            setLoading(false)
            return
        }

        try {
            const formData = new FormData()
            formData.append('_method', 'PUT')

            Object.entries(form).forEach(([key, value]) => {
                if (key === 'cover' || key === 'banner') return
                if (key === 'genres') {
                    if ((value as string[]).length === 0) {
                        formData.append('genres[]', '')
                    } else {
                        ;(value as string[]).forEach((g) => formData.append('genres[]', g))
                    }
                } else {
                    formData.append(key, value as string)
                }
            })
            if (cover) formData.append('cover', cover)
            if (banner) formData.append('banner', banner)

            await studioApi.updateWork(Number(id), formData)
            toast.success('Changes saved successfully!')
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
                toast.error('Please fix the highlighted fields.')
            } else {
                setError('Failed to update work. Please try again.')
                toast.error('Something went wrong. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    return {
        form,
        coverPreview,
        bannerPreview,
        loading,
        fetching,
        error,
        fieldErrors,
        navigate,
        handleChange,
        handleGenreToggle,
        handleFileChange,
        handleSubmit,
    }
}
