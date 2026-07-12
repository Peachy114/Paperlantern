// useCreateWork.ts
import { useNavigate, useSearchParams } from 'react-router-dom'
import { studioApi } from '@/api/studio'
import { containsBadWord } from '@/lib/badWords'
import * as Yup from 'yup'
import { useState } from 'react'
import { toast } from 'sonner'
import { arrayMove } from '@dnd-kit/sortable'
import { uploadChapterImagesInBatches } from '../utils/chapterImageUpload'

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

export const WORK_LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'ko', label: 'Korean' },
    { value: 'id', label: 'Indonesian' },
    { value: 'th', label: 'Thai' },
] as const

const noBadWords = (field: string) =>
    Yup.string().test(
        'no-bad-words',
        `${field} contains inappropriate language.`,
        (val) => !val || !containsBadWord(val)
    )

const workSchema = Yup.object({
    title: noBadWords('Title')
        .required('Title is required.')
        .max(100, 'Title must be 100 characters or less.'),
    description: noBadWords('Description')
        .required('Description is required.')
        .max(300, 'Description must be 300 characters or less.'),
    genres: Yup.array()
        .of(Yup.string().required())
        .min(1, 'Please select at least one genre.')
        .max(5, 'Select up to 5 genres.'),
    language: Yup.string()
        .oneOf(WORK_LANGUAGES.map((language) => language.value), 'Choose a supported language.')
        .required('Language is required.'),
    cover: Yup.mixed().required('Cover image is required.'),
    banner: Yup.mixed().required('Banner image is required.'),
})

const makeChapterSchema = (workType: 'webtoon' | 'wattpad', images: File[], cover: File | null) =>
    Yup.object({
        title: noBadWords('Chapter title').required('Chapter title is required.'),
        content: Yup.string().when([], {
            is: () => workType === 'wattpad',
            then: (s) => s.required('Story content is required.'),
            otherwise: (s) => s.optional(),
        }),
        credits_required: Yup.number().when('lock_type', {
            is: (v: string) => v === 'early_access' || v === 'premium',
            then: (s) => s.min(3, 'Minimum credits required is 3.'),
        }),
        _images: Yup.mixed().test(
            'has-pages',
            'Please add at least one chapter page.',
            () => workType !== 'webtoon' || images.length > 0
        ),
        _cover: Yup.mixed().test('has-cover', 'Cover image is required.', () => cover !== null),
    })

export function useCreateWork() {
    const [searchParams] = useSearchParams()
    const type = (searchParams.get('type') ?? 'webtoon') as 'webtoon' | 'wattpad'
    const navigate = useNavigate()

    // ── Work state ────────────────────────────────────────────────
    const [form, setForm] = useState({
        title: '',
        description: '',
        type,
        genres: [] as string[],
        language: 'en',
        status: 'draft',
        schedule: '',
        schedule_time: '',
        next_chapter_at: '',
    })
    const [cover, setCover] = useState<File | null>(null)
    const [banner, setBanner] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [bannerPreview, setBannerPreview] = useState<string | null>(null)

    // ── Chapter state ─────────────────────────────────────────────
    const [chapterForm, setChapterForm] = useState({
        title: '',
        content: '',
        status: 'published' as 'draft' | 'scheduled' | 'published',
        scheduled_at: '',
        lock_type: 'free' as 'free' | 'early_access' | 'premium',
        credits_required: 0,
    })
    const [chapterCover, setChapterCover] = useState<File | null>(null)
    const [chapterCoverPreview, setChapterCoverPreview] = useState<string | null>(null)
    const [chapterImages, setChapterImages] = useState<File[]>([])
    const [chapterImagePreviews, setChapterImagePreviews] = useState<string[]>([])

    // ── Shared state ──────────────────────────────────────────────
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [chapterFieldErrors, setChapterFieldErrors] = useState<Record<string, string>>({})

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        const nextValue = name === 'schedule_time' ? normalizeTimeInput(value) : value
        setForm((prev) => ({ ...prev, [name]: nextValue }))

        // When work status changes to ongoing/completed, lock chapter to published
        if (name === 'status' && (value === 'ongoing' || value === 'completed')) {
            setChapterForm((prev) => ({ ...prev, status: 'published' }))
        }

        if (fieldErrors[name]) {
            setFieldErrors((prev) => {
                const n = { ...prev }
                delete n[name]
                return n
            })
        }
    }

    const handleGenreToggle = (genre: string) => {
        if (!form.genres.includes(genre) && form.genres.length >= 5) {
            setFieldErrors((prev) => ({ ...prev, genres: 'Select up to 5 genres.' }))
            toast.error('Select up to 5 genres.')
            return
        }

        setForm((prev) => ({
            ...prev,
            genres: prev.genres.includes(genre)
                ? prev.genres.filter((g) => g !== genre)
                : [...prev.genres, genre],
        }))
        if (fieldErrors['genres'])
            setFieldErrors((prev) => {
                const n = { ...prev }
                delete n['genres']
                return n
            })
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
        if (fieldErrors[field])
            setFieldErrors((prev) => {
                const n = { ...prev }
                delete n[field]
                return n
            })
    }

    // ── Chapter handlers ──────────────────────────────────────────
    const handleChapterChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setChapterForm((prev) => ({ ...prev, [name]: value }))
        if (chapterFieldErrors[name])
            setChapterFieldErrors((prev) => {
                const n = { ...prev }
                delete n[name]
                return n
            })
    }

    const handleChapterLockTypeChange = (value: 'free' | 'early_access' | 'premium') => {
        setChapterForm((prev) => ({
            ...prev,
            lock_type: value,
            credits_required:
                value === 'free' ? 0 : prev.credits_required >= 3 ? prev.credits_required : 3,
        }))
    }

    const handleChapterCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null
        if (!file) return
        setChapterCover(file)
        setChapterCoverPreview(URL.createObjectURL(file))
    }

    const handleChapterImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? [])
        if (!files.length) return
        setChapterImages((prev) => [...prev, ...files])
        setChapterImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
    }

    const removeChapterImage = (index: number) => {
        setChapterImages((prev) => prev.filter((_, i) => i !== index))
        setChapterImagePreviews((prev) => prev.filter((_, i) => i !== index))
    }

    const reorderChapterImages = (from: number, to: number) => {
        setChapterImages((prev) => arrayMove(prev, from, to))
        setChapterImagePreviews((prev) => arrayMove(prev, from, to))
    }

    // ── Derived ───────────────────────────────────────────────────
    const requiresChapter =
        form.status === 'ongoing' || form.status === 'completed' || form.status === 'hiatus'
    const isChapterEmpty =
        !chapterForm.title.trim() && !chapterForm.content.trim() && chapterImages.length === 0

    // ── Submit ────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setFieldErrors({})
        setChapterFieldErrors({})

        let workValid = true
        let chapterValid = true

        try {
            await workSchema.validate({ ...form, cover, banner }, { abortEarly: false })
        } catch (err) {
            if (err instanceof Yup.ValidationError) {
                const errors: Record<string, string> = {}
                err.inner.forEach((e) => {
                    if (e.path) errors[e.path] = e.message
                })
                setFieldErrors(errors)
            }
            workValid = false
        }

        if (requiresChapter) {
            try {
                await makeChapterSchema(type, chapterImages, chapterCover).validate(
                    { ...chapterForm, _images: chapterImages, _cover: chapterCover },
                    { abortEarly: false }
                )
            } catch (err) {
                if (err instanceof Yup.ValidationError) {
                    const errors: Record<string, string> = {}
                    err.inner.forEach((e) => {
                        if (e.path) errors[e.path] = e.message
                    })
                    setChapterFieldErrors(errors)
                }
                chapterValid = false
            }
        }

        if (!workValid || !chapterValid) {
            toast.error('Please fix the fields marked in red.')
            setLoading(false)
            return
        }

        try {
            // 1. Create work
            const workFormData = new FormData()
            Object.entries(form).forEach(([key, value]) => {
                if (key === 'genres') {
                    ;(value as string[]).forEach((g) => workFormData.append('genres[]', g))
                } else {
                    workFormData.append(key, value as string)
                }
            })
            if (cover) workFormData.append('cover', cover)
            if (banner) workFormData.append('banner', banner)

            const workRes = await studioApi.createWork(workFormData)
            const workSlug = workRes.data.slug

            // 2. Create chapter only if ongoing/completed
            if (requiresChapter) {
                const chapterFormData = new FormData()
                chapterFormData.append('title', chapterForm.title)
                chapterFormData.append('content', chapterForm.content)
                chapterFormData.append('status', 'published') // always published
                chapterFormData.append('lock_type', chapterForm.lock_type)
                chapterFormData.append(
                    'credits_required',
                    String(chapterForm.lock_type === 'free' ? 0 : chapterForm.credits_required)
                )
                if (chapterForm.scheduled_at)
                    chapterFormData.append('scheduled_at', chapterForm.scheduled_at)
                if (chapterCover) chapterFormData.append('cover', chapterCover)
                if (type === 'webtoon') chapterFormData.append('defer_images', '1')

                const chapterRes = await studioApi.createChapter(workSlug, chapterFormData)
                if (type === 'webtoon') {
                    await uploadChapterImagesInBatches(workSlug, chapterRes.data.slug, chapterImages)
                }
            }
            toast.success(`${type === 'webtoon' ? 'Webtoon' : 'Novel'} created!`)
            navigate(`/studio/works/${workSlug}/chapters`)
        } catch (err: any) {
            if (err.response?.status === 422 && err.response?.data?.errors) {
                const raw: Record<string, string[]> = err.response.data.errors
                const parsed: Record<string, string> = {}
                for (const [key, messages] of Object.entries(raw)) {
                    const field = key.replace(/\.\d+$/, '')
                    if (!parsed[field]) parsed[field] = messages[0]
                }
                setFieldErrors(parsed)
                toast.error('Please fix the fields marked in red.')
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
        chapterForm,
        chapterCover,
        chapterCoverPreview,
        chapterImages,
        chapterImagePreviews,
        loading,
        error,
        fieldErrors,
        chapterFieldErrors,
        requiresChapter,
        isChapterEmpty,
        navigate,
        handleChange,
        handleGenreToggle,
        handleFileChange,
        handleChapterChange,
        handleChapterLockTypeChange,
        handleChapterCoverChange,
        handleChapterImagesChange,
        removeChapterImage,
        reorderChapterImages,
        handleSubmit,
    }
}

function normalizeTimeInput(value: string) {
    if (!value) return ''
    const match = value.match(/^(\d{1,2}):(\d{2})/)
    if (!match) return value
    return `${match[1].padStart(2, '0')}:${match[2]}`
}
