import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { studioApi } from '@/api/studio'
import { storageUrl } from '@/utils/storage'
import { containsBadWord } from '@/lib/badWords'
import * as Yup from 'yup'
import { toast } from 'sonner'
import { arrayMove } from '@dnd-kit/sortable'

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
        .max(100, 'Title must be 100 characters or less.'),
    description: noBadWords('Description')
        .required('Description is required.')
        .max(300, 'Description must be 300 characters or less.'),
    genres: Yup.array().of(Yup.string().required()).min(1, 'Please select at least one genre.'),
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

export function useEditWork() {
    const { slug } = useParams()
    const navigate = useNavigate()

    // ── Work state ────────────────────────────────────────────────
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

    // ── Chapter state ─────────────────────────────────────────────
    const [hasChapters, setHasChapters] = useState(true)
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
    const [chapterFieldErrors, setChapterFieldErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchWork()
    }, [slug])

    const fetchWork = async () => {
        try {
            const [workRes, chaptersRes] = await Promise.all([
                studioApi.getWork(slug!),
                studioApi.getChapters(slug!),
            ])
            const work = workRes.data
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
            setHasChapters((chaptersRes.data?.length ?? 0) > 0)
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

    // ── Work handlers ─────────────────────────────────────────────
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))

        if (name === 'status' && (value === 'ongoing' || value === 'completed')) {
            setChapterForm((prev) => ({ ...prev, status: 'published' }))
        }

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

    // ── Chapter handlers ──────────────────────────────────────────
    const handleChapterChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setChapterForm((prev) => ({ ...prev, [name]: value }))
        setChapterFieldErrors((prev) => {
            const next = { ...prev }
            delete next[name]
            return next
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
        !hasChapters &&
        (form.status === 'ongoing' || form.status === 'completed' || form.status === 'hiatus')

    // ── Submit ────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setFieldErrors({})
        setChapterFieldErrors({})

        // Validate work
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

        // Validate chapter if required
        if (requiresChapter) {
            try {
                await makeChapterSchema(form.type, chapterImages, chapterCover).validate(
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
                    toast.error('Please fix the chapter fields.')
                }
                setLoading(false)
                return
            }
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

            await studioApi.updateWork(slug!, formData)

            // Create first chapter if required
            if (requiresChapter) {
                const chapterFormData = new FormData()
                chapterFormData.append('title', chapterForm.title)
                chapterFormData.append('content', chapterForm.content)
                chapterFormData.append('status', 'published')
                chapterFormData.append('lock_type', chapterForm.lock_type)
                chapterFormData.append(
                    'credits_required',
                    String(chapterForm.lock_type === 'free' ? 0 : chapterForm.credits_required)
                )
                if (chapterForm.scheduled_at)
                    chapterFormData.append('scheduled_at', chapterForm.scheduled_at)
                if (chapterCover) chapterFormData.append('cover', chapterCover)
                if (form.type === 'webtoon')
                    chapterImages.forEach((img) => chapterFormData.append('images[]', img))

                await studioApi.createChapter(slug!, chapterFormData)
            }

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
        // Chapter
        hasChapters,
        requiresChapter,
        chapterForm,
        chapterCover,
        chapterCoverPreview,
        chapterImages,
        chapterImagePreviews,
        chapterFieldErrors,
        handleChapterChange,
        handleChapterLockTypeChange,
        handleChapterCoverChange,
        handleChapterImagesChange,
        removeChapterImage,
        reorderChapterImages,
    }
}
