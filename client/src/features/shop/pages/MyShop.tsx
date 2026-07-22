import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, Edit2, PackagePlus, Trash2 } from 'lucide-react'
import { studioApi } from '@/api/studio'
import { storageUrl } from '@/utils/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

type ShopItem = {
    id: string
    title: string
    slug: string
    description?: string | null
    type: 'download' | 'adoptable' | 'sticker'
    labels?: string[] | null
    status: 'draft' | 'published' | 'archived'
    image_path?: string | null
    download_policy: 'free' | 'paid'
    credit_cost: number
    downloads_count: number
    likes_count: number
    usage?: {
        comments?: boolean
        profile?: boolean
        backgrounds?: boolean
        messages?: boolean
    } | null
    files?: Array<{
        id: string
        original_name?: string | null
        mime_type?: string | null
        size_bytes: number
    }>
}

type FormState = {
    title: string
    description: string
    type: 'download' | 'adoptable' | 'sticker'
    labels: string
    status: 'draft' | 'published' | 'archived'
    download_policy: 'free' | 'paid'
    credit_cost: string
    usage: {
        comments: boolean
        profile: boolean
        backgrounds: boolean
        messages: boolean
    }
    image: File | null
    files: File[]
}

const emptyForm: FormState = {
    title: '',
    description: '',
    type: 'download',
    labels: '',
    status: 'draft',
    download_policy: 'paid',
    credit_cost: '1',
    usage: {
        comments: false,
        profile: false,
        backgrounds: false,
        messages: false,
    },
    image: null,
    files: [],
}

export default function MyShop() {
    const queryClient = useQueryClient()
    const [editing, setEditing] = useState<ShopItem | null>(null)
    const [form, setForm] = useState<FormState>(emptyForm)
    const [selectedItems, setSelectedItems] = useState<string[]>([])

    const shop = useQuery({
        queryKey: ['studio-shop-items'],
        queryFn: () => studioApi.getShopItems().then((res) => res.data.items.data as ShopItem[]),
    })

    const preview = useMemo(
        () => (form.image ? URL.createObjectURL(form.image) : null),
        [form.image]
    )

    const saveMutation = useMutation({
        mutationFn: (payload: FormData) =>
            editing
                ? studioApi.updateShopItem(editing.id, payload)
                : studioApi.createShopItem(payload),
        onSuccess: () => {
            toast.success(editing ? 'Shop item updated.' : 'Shop item created.')
            setEditing(null)
            setForm(emptyForm)
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

    const shopItems = shop.data ?? []

    const toggleSelectedItem = (id: string) => {
        setSelectedItems((current) =>
            current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id]
        )
    }

    const deleteSelectedItems = async () => {
        if (selectedItems.length === 0) return

        try {
            for (const id of selectedItems) {
                await deleteMutation.mutateAsync(id)
            }
            toast.success(`${selectedItems.length} shop item${selectedItems.length === 1 ? '' : 's'} moved to trash.`)
            setSelectedItems([])
        } catch {
            toast.error('Could not delete selected shop items.')
        }
    }

    const editItem = (item: ShopItem) => {
        setEditing(item)
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

    const submit = (event: FormEvent) => {
        event.preventDefault()
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
        form.files.forEach((file) => payload.append('files[]', file))

        saveMutation.mutate(payload)
    }

    return (
        <main className="mx-auto w-full max-w-[1180px] px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">My Shop</h1>
                <p className="text-sm text-muted-foreground">
                    Create downloadable products, adoptables, and shop-only sticker products. My Arts stays for art posts only.
                </p>
            </div>

            <form onSubmit={submit} className="rounded-lg border bg-background p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <PackagePlus className="h-5 w-5" />
                    <h2 className="font-semibold">{editing ? 'Edit shop item' : 'Add shop item'}</h2>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="grid gap-3">
                        <div>
                            <Label>Product name</Label>
                            <Input
                                value={form.title}
                                onChange={(event) =>
                                    setForm((current) => ({ ...current, title: event.target.value }))
                                }
                                required
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <textarea
                                value={form.description}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                className="mt-1 min-h-24 w-full rounded-md border bg-background p-3 text-sm"
                            />
                        </div>
                        <div>
                            <Label>Labels</Label>
                            <Input
                                value={form.labels}
                                onChange={(event) =>
                                    setForm((current) => ({ ...current, labels: event.target.value }))
                                }
                                placeholder="adoptable, base, brush, chibi"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">Up to 12 labels, separated by commas.</p>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <SelectField
                                label="Type"
                                value={form.type}
                                values={['download', 'adoptable', 'sticker']}
                                onChange={(value) =>
                                    setForm((current) => ({ ...current, type: value as FormState['type'] }))
                                }
                            />
                            <SelectField
                                label="Status"
                                value={form.status}
                                values={['draft', 'published', 'archived']}
                                onChange={(value) =>
                                    setForm((current) => ({ ...current, status: value as FormState['status'] }))
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <SelectField
                                label="Download"
                                value={form.download_policy}
                                values={['paid', 'free']}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        download_policy: value as FormState['download_policy'],
                                    }))
                                }
                            />
                            <div>
                                <Label>Credit cost</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={form.credit_cost}
                                    disabled={form.download_policy === 'free'}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            credit_cost: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="rounded-lg border p-3">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Sticker usage
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                {(['comments', 'profile', 'backgrounds', 'messages'] as const).map((key) => (
                                    <label key={key} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={form.usage[key]}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    usage: {
                                                        ...current.usage,
                                                        [key]: event.target.checked,
                                                    },
                                                }))
                                            }
                                        />
                                        {key}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <FileInput
                        label="Preview image / GIF"
                        accept="image/*"
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                image: event.target.files?.[0] ?? null,
                            }))
                        }
                    />
                    <FileInput
                        label="Download files"
                        multiple
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                files: Array.from(event.target.files ?? []),
                            }))
                        }
                    />
                </div>

                {(preview || editing?.image_path) && (
                    <div className="mt-4 h-36 w-36 overflow-hidden rounded-lg border bg-muted">
                        <img
                            src={preview ?? storageUrl(editing?.image_path ?? null) ?? ''}
                            alt="Preview"
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}

                <div className="mt-4 flex gap-2">
                    <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? 'Saving...' : editing ? 'Save changes' : 'Create item'}
                    </Button>
                    {editing && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setEditing(null)
                                setForm(emptyForm)
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </form>

            <section className="mt-8">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Shop products</h2>
                    {shopItems.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-muted-foreground">{selectedItems.length} selected</span>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedItems(shopItems.map((item) => item.id))}
                                disabled={deleteMutation.isPending || selectedItems.length === shopItems.length}
                            >
                                Select all
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedItems([])}
                                disabled={deleteMutation.isPending || selectedItems.length === 0}
                            >
                                Unselect
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={deleteSelectedItems}
                                disabled={deleteMutation.isPending || selectedItems.length === 0}
                            >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Delete selected
                            </Button>
                        </div>
                    )}
                </div>
                {shop.isLoading ? (
                    <div className="rounded-lg border p-5 text-sm text-muted-foreground">Loading shop...</div>
                ) : shopItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No shop products yet. Add a downloadable item above.
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {shopItems.map((item) => (
                            <article key={item.id} className="overflow-hidden rounded-lg border bg-background">
                                <div className="flex items-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(item.id)}
                                        onChange={() => toggleSelectedItem(item.id)}
                                        className="h-4 w-4 rounded border-muted-foreground/40"
                                        aria-label={`Select ${item.title}`}
                                    />
                                    <span>Select</span>
                                </div>
                                <div className="aspect-[4/3] bg-muted">
                                    {item.image_path && (
                                        <img
                                            src={storageUrl(item.image_path)!}
                                            alt={item.title}
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-semibold">{item.title}</h3>
                                            <p className="text-xs text-muted-foreground">{item.type}</p>
                                        </div>
                                        <Badge variant={item.status === 'published' ? 'default' : 'outline'}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        <Badge variant="secondary">
                                            {item.download_policy === 'free'
                                                ? 'Free'
                                                : `${item.credit_cost} credits`}
                                        </Badge>
                                        <Badge variant="outline">
                                            <Download className="mr-1 h-3 w-3" />
                                            {item.files?.length ?? 0} files
                                        </Badge>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <Button type="button" size="sm" variant="outline" onClick={() => editItem(item)}>
                                            <Edit2 className="mr-1 h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => deleteMutation.mutate(item.id)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}

function SelectField({
    label,
    value,
    values,
    onChange,
}: {
    label: string
    value: string
    values: string[]
    onChange: (value: string) => void
}) {
    return (
        <div>
            <Label>{label}</Label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
                {values.map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </select>
        </div>
    )
}

function FileInput({
    label,
    multiple,
    accept,
    onChange,
}: {
    label: string
    multiple?: boolean
    accept?: string
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
    return (
        <label className="block cursor-pointer rounded-lg border border-dashed p-4 text-sm transition hover:bg-muted/50">
            <span className="font-medium">{label}</span>
            <input
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={onChange}
                className="mt-2 block w-full text-xs text-muted-foreground"
            />
        </label>
    )
}
