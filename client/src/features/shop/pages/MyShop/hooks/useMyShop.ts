import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as yup from 'yup'
import { arrayMove } from '@dnd-kit/sortable'
import type { Crop, PercentCrop } from 'react-image-crop'
import type { DragEndEvent } from '@dnd-kit/core'
import { studioApi } from '@/api/studio'
import { storageUrl } from '@/utils/storage'
import {
    emptyShopForm,
    type ShopFileEntry,
    type ShopFormState,
    type ShopItem,
    type ShopStats,
} from '../types'
import { shopFormSchema, type ShopFormErrors } from '../utils/validation'

function createFileEntryId(file: File) {
    const random =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)

    return `${file.name}-${file.size}-${file.lastModified}-${random}`
}

export function useMyShop() {
    const queryClient = useQueryClient()

    const [editing, setEditing] = useState<ShopItem | null>(null)
    const [form, setForm] = useState<ShopFormState>(emptyShopForm)
    const [errors, setErrors] = useState<ShopFormErrors>({})
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [activeSection, setActiveSection] = useState<'shop' | 'form'>('shop')
    const [workspaceBannerImage, setWorkspaceBannerImage] = useState<string | null>(null)
    const [orderedProductIds, setOrderedProductIds] = useState<string[]>([])

    const shop = useQuery({
        queryKey: ['studio-shop-items'],
        queryFn: () => studioApi.getShopItems().then((res) => res.data.items.data as ShopItem[]),
    })

    const preview = useMemo(
        () => (form.image ? URL.createObjectURL(form.image) : null),
        [form.image]
    )

    const [cropDialogOpen, setCropDialogOpen] = useState(false)
    const [crop, setCrop] = useState<Crop | PercentCrop>()
    const [completedCrop, setCompletedCrop] = useState<Crop | PercentCrop>()
    const imgRef = useRef<HTMLImageElement | null>(null)
    const imgSrc = useMemo(
        () => preview ?? storageUrl(editing?.image_path ?? null) ?? '',
        [preview, editing]
    )

    const onImageLoad = () => {
        if (!imgRef.current) return

        setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 })
    }

    const cancelCrop = () => setCropDialogOpen(false)

    const confirmCrop = () => {
        setCropDialogOpen(false)
        if (!completedCrop || !imgRef.current) return
        // Cropping is currently a no-op; preserve the selected image.
    }

    const saveMutation = useMutation({
        mutationFn: (payload: FormData) =>
            editing
                ? studioApi.updateShopItem(editing.id, payload)
                : studioApi.createShopItem(payload),
        onSuccess: () => {
            toast.success(editing ? 'Shop item updated.' : 'Shop item created.')
            setEditing(null)
            setForm(emptyShopForm)
            setErrors({})
            setActiveSection('shop')
            queryClient.invalidateQueries({ queryKey: ['studio-shop-items'] })
            queryClient.invalidateQueries({ queryKey: ['public-shop'] })
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message ?? 'Could not save shop item.')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => studioApi.deleteShopItem(id),
        onSuccess: () => {
            toast.success('Shop item moved to trash.')
            queryClient.invalidateQueries({ queryKey: ['studio-shop-items'] })
            queryClient.invalidateQueries({ queryKey: ['public-shop'] })
        },
        onError: () => toast.error('Could not delete shop item.'),
    })

    const reorderMutation = useMutation({
        mutationFn: (orderedIds: string[]) => (studioApi as any).reorderShopItems(orderedIds),
        onError: () => toast.error('Could not save the new product order.'),
    })

    const shopItems = shop.data ?? []

    // Keep a local, drag-editable order in sync with the fetched items: items
    // that already had a position keep it, newly fetched items are appended.
    useEffect(() => {
        setOrderedProductIds((current) => {
            const currentSet = new Set(current)
            const nextIds = shopItems.map((item) => item.id)
            const nextSet = new Set(nextIds)
            const stillPresent = current.filter((id) => nextSet.has(id))
            const newlyAdded = nextIds.filter((id) => !currentSet.has(id))
            const merged = [...stillPresent, ...newlyAdded]

            const unchanged =
                merged.length === current.length && merged.every((id, index) => id === current[index])

            return unchanged ? current : merged
        })
    }, [shopItems])

    const orderedShopItems = useMemo(() => {
        const byId = new Map(shopItems.map((item) => [item.id, item]))
        return orderedProductIds.map((id) => byId.get(id)).filter((item): item is ShopItem => Boolean(item))
    }, [orderedProductIds, shopItems])

    const stats: ShopStats = useMemo(() => {
        const publishedItems = shopItems.filter((item) => item.status === 'published').length
        const paidItems = shopItems.filter((item) => item.download_policy === 'paid').length
        const freeItems = shopItems.filter((item) => item.download_policy === 'free').length
        const draftItems = shopItems.filter((item) => item.status === 'draft').length
        const totalDownloads = shopItems.reduce((sum, item) => sum + (item.downloads_count ?? 0), 0)
        const totalLikes = shopItems.reduce((sum, item) => sum + (item.likes_count ?? 0), 0)
        const featuredItem = shopItems.find((item) => item.image_path) ?? shopItems[0] ?? null
        const downloadProducts = shopItems.filter((item) => item.type === 'download').length
        const adoptables = shopItems.filter((item) => item.type === 'adoptable').length
        const stickers = shopItems.filter((item) => item.type === 'sticker').length

        return {
            publishedItems,
            paidItems,
            freeItems,
            draftItems,
            totalDownloads,
            totalLikes,
            featuredItem,
            downloadProducts,
            adoptables,
            stickers,
        }
    }, [shopItems])

    const toggleSelectedItem = (id: string) => {
        setSelectedItems((current) =>
            current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id]
        )
    }

    const selectAllItems = () => setSelectedItems(shopItems.map((item) => item.id))
    const clearSelectedItems = () => setSelectedItems([])

    const deleteSelectedItems = async () => {
        if (selectedItems.length === 0) return

        try {
            for (const id of selectedItems) {
                await deleteMutation.mutateAsync(id)
            }
            toast.success(
                `${selectedItems.length} shop item${selectedItems.length === 1 ? '' : 's'} moved to trash.`
            )
            setSelectedItems([])
        } catch {
            toast.error('Could not delete selected shop items.')
        }
    }

    // Drag-and-drop reordering of shop products in the grid.
    const handleProductDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        setOrderedProductIds((current) => {
            const oldIndex = current.indexOf(String(active.id))
            const newIndex = current.indexOf(String(over.id))
            if (oldIndex === -1 || newIndex === -1) return current

            const next = arrayMove(current, oldIndex, newIndex)
            reorderMutation.mutate(next)
            return next
        })
    }

    // Drag-and-drop reordering of files staged in the add/edit form.
    const handleFileDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        setForm((current) => {
            const oldIndex = current.files.findIndex((entry) => entry.id === active.id)
            const newIndex = current.files.findIndex((entry) => entry.id === over.id)
            if (oldIndex === -1 || newIndex === -1) return current

            return { ...current, files: arrayMove(current.files, oldIndex, newIndex) }
        })
    }

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null
        setForm((current) => ({ ...current, image: file }))
        setCropDialogOpen(Boolean(file))
    }

    const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
        const entries: ShopFileEntry[] = Array.from(event.target.files ?? []).map((file) => ({
            id: createFileEntryId(file),
            file,
        }))
        setForm((current) => ({ ...current, files: entries }))
    }

    const removeFileEntry = (id: string) => {
        setForm((current) => ({ ...current, files: current.files.filter((entry) => entry.id !== id) }))
    }

    const startNewItem = () => {
        setEditing(null)
        setForm(emptyShopForm)
        setErrors({})
        setActiveSection('form')
    }

    const cancelForm = () => {
        setEditing(null)
        setForm(emptyShopForm)
        setErrors({})
        setActiveSection('shop')
    }

    const editItem = (item: ShopItem) => {
        setEditing(item)
        setErrors({})
        setActiveSection('form')
        setForm({
            title: item.title,
            description: item.description ?? '',
            type: item.type,
            labels: (item.labels ?? []).join(', '),
            status: item.status,
            download_policy: item.download_policy,
            credit_cost: String(item.credit_cost || 1),
            usage: {
                comments: Boolean(item.usage?.comments),
                profile: Boolean(item.usage?.profile),
                backgrounds: Boolean(item.usage?.backgrounds),
                messages: Boolean(item.usage?.messages),
            },
            image: null,
            files: [],
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const validate = async () => {
        try {
            await shopFormSchema.validate(form, { abortEarly: false })
            setErrors({})
            return true
        } catch (validationError) {
            if (validationError instanceof yup.ValidationError) {
                const nextErrors: ShopFormErrors = {}
                validationError.inner.forEach((issue) => {
                    const key = issue.path as keyof ShopFormErrors | undefined
                    if (key && !nextErrors[key]) {
                        nextErrors[key] = issue.message
                    }
                })
                setErrors(nextErrors)
            }
            return false
        }
    }

    const submit = async (event: FormEvent) => {
        event.preventDefault()

        const isValid = await validate()
        if (!isValid) {
            toast.error('Please fix the highlighted fields before saving.')
            return
        }

        const payload = new FormData()
        payload.append('title', form.title)
        payload.append('description', form.description)
        payload.append('type', form.type)
        payload.append('status', form.status)
        payload.append('download_policy', form.download_policy)
        payload.append('credit_cost', form.download_policy === 'free' ? '0' : form.credit_cost)

        form.labels
            .split(',')
            .map((label) => label.trim())
            .filter(Boolean)
            .slice(0, 12)
            .forEach((label, index) => payload.append(`labels[${index}]`, label))

        Object.entries(form.usage).forEach(([key, value]) =>
            payload.append(`usage[${key}]`, value ? '1' : '0')
        )

        if (form.image) payload.append('image', form.image)
        form.files.forEach((entry) => payload.append('files[]', entry.file))

        saveMutation.mutate(payload)
    }

    return {
        shop,
        shopItems,
        orderedShopItems,
        stats,
        editing,
        form,
        setForm,
        errors,
        selectedItems,
        activeSection,
        setActiveSection,
        workspaceBannerImage,
        setWorkspaceBannerImage,
        preview,
        saveMutation,
        deleteMutation,
        reorderMutation,
        toggleSelectedItem,
        selectAllItems,
        clearSelectedItems,
        deleteSelectedItems,
        handleProductDragEnd,
        handleFileDragEnd,
        handleImageChange,
        handleFilesChange,
        removeFileEntry,
        startNewItem,
        cancelForm,
        editItem,
        submit,
        cropDialogOpen,
        crop,
        setCrop,
        completedCrop,
        setCompletedCrop,
        imgRef,
        imgSrc,
        onImageLoad,
        cancelCrop,
        confirmCrop,
    }
}

export type UseMyShopReturn = ReturnType<typeof useMyShop>