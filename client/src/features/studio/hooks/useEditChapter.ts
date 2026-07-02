import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { studioApi } from '@/api/studio'
import { storageUrl } from '@/utils/storage'
import { containsBadWord } from '@/lib/badWords'
import * as Yup from 'yup'

interface ImageItem {
    id?: number
    file?: File
    preview: string
}

const noBadWords = (field: string) =>
    Yup.string().test(
        'no-bad-words',
        `${field} contains inappropriate language.`,
        (val) => !val || !containsBadWord(val)
    )

const makeSchema = (workType: 'webtoon' | 'wattpad', imageItems: ImageItem[]) =>
    Yup.object({
        title: noBadWords('Title')
            .required('Title is required.')
            .max(30, 'Title must be 30 characters or less.'),
        scheduled_at: Yup.string().when('status', {
            is: 'scheduled',
            then: (s) =>
                s
                    .required('Please set a scheduled date and time.')
                    .test('is-future', 'Scheduled time must be in the future.', (val) => {
                        if (!val) return false
                        return new Date(val) > new Date()
                    }),
        }),
        credits_required: Yup.number().when('lock_type', {
            is: (v: string) => v === 'early_access' || v === 'premium',
            then: (s) => s.min(3, 'Minimum credits required is 3.'),
        }),
        _images: Yup.mixed().test(
            'has-pages',
            'Please add at least one chapter page.',
            () => workType !== 'webtoon' || imageItems.length > 0
        ),
    })

export function useEditChapter(workType: 'webtoon' | 'wattpad') {
    const { workSlug, chapterSlug } = useParams()
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

    useEffect(() => {
        fetchChapter()
    }, [chapterSlug])

    const fetchChapter = async () => {
        try {
            const res = await studioApi.getChapter(workSlug!, chapterSlug!)
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
                credits_required:
                    (chapter.lock_type ?? 'free') === 'free' ? 0 : (chapter.credits_required ?? 3),
            })
            if (chapter.cover) setCoverPreview(storageUrl(chapter.cover, 'sm'))
            if (chapter.images?.length) {
                setImageItems(
                    chapter.images.map((img: any) => ({
                        id: img.id,
                        preview: storageUrl(img.path, 'sm')!,
                    }))
                )
            }
        } catch {
            setError('Failed to load chapter.')
        } finally {
            setFetching(false)
        }
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }))
    }

    const handleLockTypeChange = (value: 'free' | 'early_access' | 'premium') => {
        setForm((prev) => ({
            ...prev,
            lock_type: value,
            credits_required:
                value === 'free'
                    ? 0
                    : prev.credits_required && prev.credits_required >= 3
                      ? prev.credits_required
                      : 3,
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
        setImageItems(files.map((file) => ({ file, preview: URL.createObjectURL(file) })))
    }

    const removeImage = (index: number) => {
        setImageItems((prev) => prev.filter((_, i) => i !== index))
    }

    const reorderImages = (from: number, to: number) => {
        setImageItems((prev) => {
            const next = [...prev]
            const [moved] = next.splice(from, 1)
            next.splice(to, 0, moved)
            return next
        })
    }

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await makeSchema(workType, imageItems).validate(
                { ...form, _images: imageItems },
                { abortEarly: true }
            )
        } catch (err) {
            if (err instanceof Yup.ValidationError) setError(err.message)
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
            formData.append(
                'credits_required',
                String(form.lock_type === 'free' ? 0 : form.credits_required)
            )
            if (form.scheduled_at) formData.append('scheduled_at', form.scheduled_at)
            if (cover) formData.append('cover', cover)

            if (workType === 'webtoon') {
                const newFiles = imageItems.filter((item) => item.file)
                const existingIds = imageItems.filter((item) => item.id && !item.file)
                if (newFiles.length > 0) {
                    newFiles.forEach((item) => formData.append('images[]', item.file!))
                } else if (existingIds.length > 0) {
                    existingIds.forEach((item) =>
                        formData.append('existing_image_ids[]', String(item.id))
                    )
                }
            }

            await studioApi.updateChapter(workSlug!, chapterSlug!, formData)
            navigate(`/studio/works/${workSlug}/chapters`)
        } catch (err: any) {
            const message =
                err?.response?.data?.errors?.scheduled_at?.[0] ??
                err?.response?.data?.message ??
                'Failed to update chapter. Please try again.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return {
        form,
        coverPreview,
        imageItems,
        loading,
        fetching,
        error,
        navigate,
        workSlug,
        handleChange,
        handleLockTypeChange,
        handleCoverChange,
        handleImagesChange,
        removeImage,
        reorderImages,
        handleSubmit,
    }
}
