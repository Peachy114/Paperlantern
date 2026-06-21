import { useNavigate, useSearchParams } from 'react-router-dom'
import { studioApi } from '@/api/studio'
import { containsBadWord } from '@/lib/badWords'
import * as Yup from 'yup'
import { useState } from 'react'
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

const schema = Yup.object({
    title: noBadWords('Title')
        .required('Title is required.')
        .max(30, 'Title must be 30 characters or less.'),
    description: noBadWords('Description')
        .required('Description is required.')
        .max(300, 'Description must be 300 characters or less.'),
    genres: Yup.array().of(Yup.string().required()).min(1, 'Please select at least one genre.'),
    cover: Yup.mixed().required('Cover image is required.'),
    banner: Yup.mixed().required('Banner image is required.'),
})

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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name } = e.target
        setForm((prev) => ({ ...prev, [name]: e.target.value }))
        if (fieldErrors[name]) {
            setFieldErrors((prev) => {
                const next = { ...prev }
                delete next[name]
                return next
            })
        }
    }

    const handleGenreToggle = (genre: string) => {
        setForm((prev) => ({
            ...prev,
            genres: prev.genres.includes(genre)
                ? prev.genres.filter((g) => g !== genre)
                : [...prev.genres, genre],
        }))
        if (fieldErrors['genres']) {
            setFieldErrors((prev) => {
                const next = { ...prev }
                delete next['genres']
                return next
            })
        }
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
        if (fieldErrors[field]) {
            setFieldErrors((prev) => {
                const next = { ...prev }
                delete next[field]
                return next
            })
        }
    }

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setFieldErrors({})

        try {
            await schema.validate({ ...form, cover, banner }, { abortEarly: false })
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
            Object.entries(form).forEach(([key, value]) => {
                if (key === 'genres') {
                    ;(value as string[]).forEach((g) => formData.append('genres[]', g))
                } else {
                    formData.append(key, value as string)
                }
            })
            if (cover) formData.append('cover', cover)
            if (banner) formData.append('banner', banner)

            await studioApi.createWork(formData)
            toast.success(`${type === 'webtoon' ? 'Webtoon' : 'Novel'} created successfully!`)
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
                setError('Something went wrong. Please try again.')
                toast.error('Something went wrong. Please try again.')
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
