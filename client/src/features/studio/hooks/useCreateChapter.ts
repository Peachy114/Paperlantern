import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { studioApi } from '@/api/studio'
import { containsBadWord } from '@/lib/badWords'
import * as Yup from 'yup'

const noBadWords = (field: string) =>
    Yup.string().test(
        'no-bad-words',
        `${field} contains inappropriate language.`,
        (val) => !val || !containsBadWord(val)
    )

const makeSchema = (workType: 'webtoon' | 'wattpad', images: File[], cover: File | null) =>
    Yup.object({
        title: noBadWords('Title')
            .required('Title is required.')
            .max(100, 'Title is too long. Maximum 100 characters.'),
        content: Yup.string().when([], {
            is: () => workType === 'wattpad',
            then: (s) => s.required('Story content is required.'),
            otherwise: (s) => s.optional(),
        }),
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
            () => workType !== 'webtoon' || images.length > 0
        ),
        _cover: Yup.mixed().test('has-cover', 'Cover image is required.', () => cover !== null),
    })

export function useCreateChapter(workType: 'webtoon' | 'wattpad') {
    const { workSlug } = useParams()
    const navigate = useNavigate()

    const [form, setForm] = useState({
        title: '',
        content: '',
        status: 'draft' as 'draft' | 'scheduled' | 'published',
        scheduled_at: '',
        lock_type: 'free' as 'free' | 'early_access' | 'premium',
        credits_required: 0,
    })

    const [cover, setCover] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
        setImages((prev) => [...prev, ...files])
        setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
    }

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index))
        setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    }

    const reorderImages = (from: number, to: number) => {
        const reorder = <T>(arr: T[]): T[] => {
            const next = [...arr]
            const [moved] = next.splice(from, 1)
            next.splice(to, 0, moved)
            return next
        }
        setImages((prev) => (prev.length ? reorder(prev) : prev))
        setImagePreviews((prev) => reorder(prev))
    }

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await makeSchema(workType, images, cover).validate(
                { ...form, _images: images, _cover: cover },
                { abortEarly: true }
            )
        } catch (err) {
            if (err instanceof Yup.ValidationError) setError(err.message)
            setLoading(false)
            return
        }

        try {
            const formData = new FormData()
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
            if (workType === 'webtoon') images.forEach((img) => formData.append('images[]', img))

            await studioApi.createChapter(workSlug!, formData)
            navigate(`/studio/works/${workSlug}/chapters`)
        } catch (err: any) {
            const message =
                err?.response?.data?.errors?.scheduled_at?.[0] ??
                err?.response?.data?.message ??
                'Failed to create chapter. Please try again.'
            setError(message)
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
