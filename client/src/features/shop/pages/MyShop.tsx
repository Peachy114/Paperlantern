import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, Edit2, Heart, Package, PackagePlus, Store, Trash2 } from 'lucide-react'
import { studioApi } from '@/api/studio'
import { storageUrl } from '@/utils/storage'
import WorkspaceBannerPicker from '@/features/announcements/components/WorkspaceBannerPicker'
import CreatorWorkspaceShell from '@/features/studio/components/workspace/CreatorWorkspaceShell'
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
    const [activeSection, setActiveSection] = useState<'shop' | 'form'>('shop')
    const [workspaceBannerImage, setWorkspaceBannerImage] = useState<string | null>(null)

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

    const shopItems = shop.data ?? []
    const publishedItems = shopItems.filter((item) => item.status === 'published').length
    const paidItems = shopItems.filter((item) => item.download_policy === 'paid').length
    const freeItems = shopItems.filter((item) => item.download_policy === 'free').length
    const draftItems = shopItems.filter((item) => item.status === 'draft').length
    const totalDownloads = shopItems.reduce((sum, item) => sum + (item.downloads_count ?? 0), 0)
    const totalLikes = shopItems.reduce((sum, item) => sum + (item.likes_count ?? 0), 0)
    const featuredItem = shopItems.find((item) => item.image_path) ?? shopItems[0] ?? null

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
            toast.success(
                `${selectedItems.length} shop item${selectedItems.length === 1 ? '' : 's'} moved to trash.`
            )
            setSelectedItems([])
        } catch {
            toast.error('Could not delete selected shop items.')
        }
    }

    const editItem = (item: ShopItem) => {
        setEditing(item)
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
        <CreatorWorkspaceShell
            layout="dashboard"
            title="Shop"
            description=""
            action={
                <div className="flex items-center gap-2">
                    {activeSection === 'form' ? (
                        <button
                            type="button"
                            onClick={() => {
                                setEditing(null)
                                setForm(emptyForm)
                                setActiveSection('shop')
                            }}
                            className="inline-flex h-8 items-center rounded-full border border-sky-200 bg-card px-4 text-xs font-bold text-sky-600 shadow-sm transition hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10"
                        >
                            Back to Shop
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={() => {
                            setEditing(null)
                            setForm(emptyForm)
                            setActiveSection('form')
                        }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-sky-400 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-sky-500"
                    >
                        <PackagePlus className="h-3.5 w-3.5" />
                        Add Product
                    </button>
                </div>
            }
        >
            {activeSection === 'shop' && (
                <>
                    <ShopDashboardHero
                        items={shopItems}
                        featuredItem={featuredItem}
                        publishedItems={publishedItems}
                        paidItems={paidItems}
                        freeItems={freeItems}
                        draftItems={draftItems}
                        totalDownloads={totalDownloads}
                        totalLikes={totalLikes}
                        workspaceBannerImage={workspaceBannerImage}
                        onWorkspaceBannerChange={setWorkspaceBannerImage}
                    />

                    <section className="mt-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xs font-black uppercase tracking-[0.12em]">
                                Shop Products
                            </h2>
                            {shopItems.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {selectedItems.length > 0 ? (
                                        <span className="mr-1 text-[10px] text-muted-foreground">
                                            {selectedItems.length} selected
                                        </span>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedItems(shopItems.map((item) => item.id))
                                        }
                                        disabled={
                                            deleteMutation.isPending ||
                                            selectedItems.length === shopItems.length
                                        }
                                        className="rounded-full border px-3 py-1 text-[9px] font-bold transition hover:bg-muted disabled:opacity-40"
                                    >
                                        Select all
                                    </button>
                                    {selectedItems.length > 0 ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedItems([])}
                                                disabled={deleteMutation.isPending}
                                                className="rounded-full border px-3 py-1 text-[9px] font-bold transition hover:bg-muted disabled:opacity-40"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                onClick={deleteSelectedItems}
                                                disabled={deleteMutation.isPending}
                                                className="rounded-full bg-rose-500 px-3 py-1 text-[9px] font-bold text-white transition hover:bg-rose-600 disabled:opacity-40"
                                            >
                                                Delete selected
                                            </button>
                                        </>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>

                        {shop.isLoading ? (
                            <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">
                                Loading shop...
                            </div>
                        ) : shopItems.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-10 text-center">
                                <Store className="mx-auto h-8 w-8 text-muted-foreground/40" />
                                <p className="mt-3 text-sm font-semibold">No shop products yet</p>
                                <button
                                    type="button"
                                    onClick={() => setActiveSection('form')}
                                    className="mt-4 rounded-full bg-sky-400 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-500"
                                >
                                    Add your first product
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                {shopItems.map((item) => (
                                    <ShopProductCard
                                        key={item.id}
                                        item={item}
                                        selected={selectedItems.includes(item.id)}
                                        onSelect={toggleSelectedItem}
                                        onEdit={editItem}
                                        onDelete={(id) => deleteMutation.mutate(id)}
                                        deleting={deleteMutation.isPending}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {activeSection === 'form' && (
                <form onSubmit={submit} className="rounded-lg border bg-background p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <PackagePlus className="h-5 w-5" />
                        <h2 className="font-semibold">
                            {editing ? 'Edit shop item' : 'Add shop item'}
                        </h2>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="grid gap-3">
                            <div>
                                <Label>Product name</Label>
                                <Input
                                    value={form.title}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }))
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
                                        setForm((current) => ({
                                            ...current,
                                            labels: event.target.value,
                                        }))
                                    }
                                    placeholder="adoptable, base, brush, chibi"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Up to 12 labels, separated by commas.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <SelectField
                                    label="Type"
                                    value={form.type}
                                    values={['download', 'adoptable', 'sticker']}
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            type: value as FormState['type'],
                                        }))
                                    }
                                />
                                <SelectField
                                    label="Status"
                                    value={form.status}
                                    values={['draft', 'published', 'archived']}
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            status: value as FormState['status'],
                                        }))
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
                                    {(
                                        ['comments', 'profile', 'backgrounds', 'messages'] as const
                                    ).map((key) => (
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
                            {saveMutation.isPending
                                ? 'Saving...'
                                : editing
                                  ? 'Save changes'
                                  : 'Create item'}
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
            )}
        </CreatorWorkspaceShell>
    )
}

function ShopDashboardHero({
    items,
    featuredItem,
    publishedItems,
    paidItems,
    freeItems,
    draftItems,
    totalDownloads,
    totalLikes,
    workspaceBannerImage,
    onWorkspaceBannerChange,
}: {
    items: ShopItem[]
    featuredItem: ShopItem | null
    publishedItems: number
    paidItems: number
    freeItems: number
    draftItems: number
    totalDownloads: number
    totalLikes: number
    workspaceBannerImage: string | null
    onWorkspaceBannerChange: (image: string | null) => void
}) {
    const featuredImage = storageUrl(featuredItem?.image_path ?? null)
    const activeBannerImage = workspaceBannerImage ?? featuredImage
    const chartPoints = items.slice(0, 7).map((item) => ({
        label: item.title.length > 10 ? `${item.title.slice(0, 9)}…` : item.title,
        fullLabel: item.title,
        downloads: Number(item.downloads_count) || 0,
        likes: Number(item.likes_count) || 0,
    }))
    const downloadProducts = items.filter((item) => item.type === 'download').length
    const adoptables = items.filter((item) => item.type === 'adoptable').length
    const stickers = items.filter((item) => item.type === 'sticker').length

    return (
        <div className="space-y-4">
            <section className="overflow-hidden rounded-[28px] border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-background to-orange-50/40 p-2.5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-3">
                <div className="grid gap-3 xl:grid-cols-[190px_minmax(0,1fr)]">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="relative min-h-56 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            {activeBannerImage ? (
                                <img
                                    src={activeBannerImage}
                                    alt={featuredItem?.title ?? 'Featured shop product'}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 via-rose-50 to-sky-100 text-center">
                                    <Store className="h-12 w-12 text-sky-500" />
                                    <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                                        Your Shop
                                    </p>
                                </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 pb-3 pt-12 text-white">
                                <p className="line-clamp-1 text-sm font-bold">
                                    {featuredItem?.title ?? 'Add your first product'}
                                </p>
                                <p className="mt-0.5 text-[10px] text-white/80">
                                    {items.length} product{items.length === 1 ? '' : 's'} in your
                                    shop
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                        Shop status
                                    </p>
                                    <p className="mt-1 text-sm font-bold">
                                        {publishedItems > 0 ? 'Live' : 'Not published'}
                                    </p>
                                </div>
                                <span
                                    className={`h-2.5 w-2.5 rounded-full ${
                                        publishedItems > 0
                                            ? 'bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]'
                                            : 'bg-slate-300 shadow-[0_0_0_5px_rgba(148,163,184,0.12)]'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm sm:p-5">
                        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-500">
                                    Product Activity
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    Downloads and likes across your shop products
                                </p>
                            </div>
                            <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                                {totalDownloads.toLocaleString()} downloads ·{' '}
                                {totalLikes.toLocaleString()} likes
                            </span>
                        </div>

                        <ShopPerformanceChart points={chartPoints} />

                        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
                            <ShopDashboardStat
                                icon={<Store className="h-4 w-4" />}
                                label="Products"
                                value={items.length}
                            />
                            <ShopDashboardStat
                                icon={<Package className="h-4 w-4 text-emerald-500" />}
                                label="Published"
                                value={publishedItems}
                            />
                            <ShopDashboardStat
                                icon={<PackagePlus className="h-4 w-4 text-violet-500" />}
                                label="Paid"
                                value={paidItems}
                            />
                            <ShopDashboardStat
                                icon={<Package className="h-4 w-4 text-sky-500" />}
                                label="Free"
                                value={freeItems}
                            />
                            <ShopDashboardStat
                                icon={<Download className="h-4 w-4 text-sky-500" />}
                                label="Downloads"
                                value={totalDownloads}
                            />
                            <ShopDashboardStat
                                icon={<Heart className="h-4 w-4 fill-rose-500 text-rose-500" />}
                                label="Likes"
                                value={totalLikes}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <section className="rounded-[24px] border border-border bg-muted/35 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                            Product mix
                        </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
                        <ShopMiniMetric label="Downloads" value={downloadProducts} />
                        <ShopMiniMetric label="Adoptables" value={adoptables} />
                        <ShopMiniMetric label="Stickers" value={stickers} />
                        <ShopMiniMetric label="Paid products" value={paidItems} />
                        <ShopMiniMetric label="Free products" value={freeItems} />
                        <ShopMiniMetric label="Drafts" value={draftItems} />
                    </div>
                </section>

                <section className="relative min-h-44 overflow-hidden rounded-[24px] border border-border bg-gradient-to-r from-rose-100 via-orange-50 to-sky-100 shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:from-rose-500/15 dark:via-orange-500/10 dark:to-sky-500/15">
                    <div className="absolute right-3 top-3 z-20">
                        <WorkspaceBannerPicker
                            audience="studio"
                            storageKey="workspace-banner-my-shop"
                            pageTarget="my_shop"
                            fallbackImage={featuredImage}
                            onImageChange={onWorkspaceBannerChange}
                        />
                    </div>
                    {activeBannerImage ? (
                        <img
                            src={activeBannerImage}
                            alt="Shop banner"
                            className="absolute inset-0 h-full w-full object-cover object-center"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Store className="h-20 w-20 text-sky-400/70" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
                    {featuredItem ? (
                        <div className="absolute bottom-4 right-4 max-w-[60%] rounded-full bg-black/45 px-4 py-2 text-right text-[10px] font-bold text-white backdrop-blur">
                            {featuredItem.title}
                        </div>
                    ) : null}
                </section>
            </div>
        </div>
    )
}

type ShopPerformancePoint = {
    label: string
    fullLabel: string
    downloads: number
    likes: number
}

function ShopPerformanceChart({ points }: { points: ShopPerformancePoint[] }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const width = 720
    const height = 190
    const baseline = 148
    const chartTop = 34
    const left = 28
    const right = width - 28
    const max = Math.max(...points.flatMap((point) => [point.downloads, point.likes]), 1)
    const step = (right - left) / Math.max(points.length - 1, 1)
    const downloadCoordinates = points.map((point, index) => ({
        x: left + index * step,
        y: baseline - (point.downloads / max) * (baseline - chartTop),
    }))
    const likeCoordinates = points.map((point, index) => ({
        x: left + index * step,
        y: baseline - (point.likes / max) * (baseline - chartTop),
    }))
    const downloadPath = createShopChartPath(downloadCoordinates)
    const likePath = createShopChartPath(likeCoordinates)
    const first = downloadCoordinates[0]
    const last = downloadCoordinates[downloadCoordinates.length - 1]
    const areaPath =
        first && last ? `${downloadPath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z` : ''
    const activePoint = activeIndex === null ? null : points[activeIndex]
    const activeDownload = activeIndex === null ? null : downloadCoordinates[activeIndex]
    const activeLike = activeIndex === null ? null : likeCoordinates[activeIndex]
    const hasActivity = points.some((point) => point.downloads > 0 || point.likes > 0)

    return (
        <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-background to-sky-50/65">
            <div className="pointer-events-none absolute right-3 top-2 z-10 flex items-center gap-3 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[9px] font-bold text-muted-foreground shadow-sm backdrop-blur">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    Downloads
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Likes
                </span>
            </div>

            {activePoint && activeDownload && activeLike ? (
                <div
                    className={`pointer-events-none absolute top-8 z-20 min-w-36 rounded-xl border border-border bg-background/95 px-3 py-2 text-[10px] shadow-xl backdrop-blur ${
                        activeIndex === 0
                            ? 'translate-x-0'
                            : activeIndex === points.length - 1
                              ? '-translate-x-full'
                              : '-translate-x-1/2'
                    }`}
                    style={{ left: `${(activeDownload.x / width) * 100}%` }}
                >
                    <p className="font-black text-foreground">{activePoint.fullLabel}</p>
                    <div className="mt-1.5 space-y-1 text-muted-foreground">
                        <div className="flex items-center justify-between gap-5">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-sky-400" />
                                Downloads
                            </span>
                            <strong className="text-foreground">{activePoint.downloads}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-5">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                Likes
                            </span>
                            <strong className="text-rose-600">{activePoint.likes}</strong>
                        </div>
                    </div>
                </div>
            ) : null}

            {!hasActivity ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pt-5 text-xs font-semibold text-muted-foreground">
                    Product activity will appear here.
                </div>
            ) : null}

            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-full w-full"
                role="img"
                aria-label="Downloads and likes across shop products"
                onMouseLeave={() => setActiveIndex(null)}
            >
                {[0, 1, 2, 3].map((lineIndex) => {
                    const y = chartTop + lineIndex * ((baseline - chartTop) / 3)

                    return (
                        <line
                            key={lineIndex}
                            x1={left}
                            x2={right}
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            strokeDasharray="3 5"
                            className="text-slate-200/90"
                        />
                    )
                })}

                <defs>
                    <linearGradient id="shop-downloads-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.58" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.03" />
                    </linearGradient>
                </defs>

                <path d={areaPath} fill="url(#shop-downloads-fill)" />
                <path
                    d={downloadPath}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={likePath}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeDasharray="6 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {activeDownload ? (
                    <line
                        x1={activeDownload.x}
                        x2={activeDownload.x}
                        y1={chartTop}
                        y2={baseline}
                        stroke="#94a3b8"
                        strokeWidth="1"
                        strokeDasharray="3 4"
                    />
                ) : null}

                {points.map((point, index) => {
                    const downloadCoordinate = downloadCoordinates[index]
                    const likeCoordinate = likeCoordinates[index]
                    const hitLeft =
                        index === 0
                            ? left
                            : downloadCoordinate.x - (points.length > 1 ? step / 2 : 0)
                    const hitRight =
                        index === points.length - 1
                            ? right
                            : downloadCoordinate.x + (points.length > 1 ? step / 2 : right - left)
                    const active = activeIndex === index

                    return (
                        <g key={`${point.fullLabel}-${index}`}>
                            <circle
                                cx={downloadCoordinate.x}
                                cy={downloadCoordinate.y}
                                r={active ? 5 : 3.5}
                                fill="#ffffff"
                                stroke="#38bdf8"
                                strokeWidth="2"
                            />
                            <circle
                                cx={likeCoordinate.x}
                                cy={likeCoordinate.y}
                                r={active ? 4.5 : 3}
                                fill="#ffffff"
                                stroke="#f43f5e"
                                strokeWidth="2"
                            />
                            <text
                                x={downloadCoordinate.x}
                                y={176}
                                textAnchor="middle"
                                className="pointer-events-none fill-slate-400 text-[8px]"
                            >
                                {point.label}
                            </text>
                            <rect
                                x={hitLeft}
                                y={chartTop}
                                width={hitRight - hitLeft}
                                height={baseline - chartTop + 12}
                                fill="transparent"
                                tabIndex={0}
                                role="button"
                                aria-label={`${point.fullLabel}: ${point.downloads} downloads, ${point.likes} likes`}
                                className="cursor-crosshair outline-none"
                                onMouseEnter={() => setActiveIndex(index)}
                                onFocus={() => setActiveIndex(index)}
                                onBlur={() => setActiveIndex(null)}
                            />
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}

function createShopChartPath(points: Array<{ x: number; y: number }>) {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

    return points.reduce((path, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`

        const previous = points[index - 1]
        const controlX = (previous.x + point.x) / 2

        return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
    }, '')
}

function ShopDashboardStat({
    icon,
    label,
    value,
}: {
    icon: ReactNode
    label: string
    value: number
}) {
    return (
        <div className="rounded-2xl border border-border bg-card px-3 py-3 shadow-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                {icon}
                <span className="text-[9px] font-bold">{label}</span>
            </div>
            <p className="mt-2 text-lg font-black leading-none text-foreground">
                {value.toLocaleString()}
            </p>
        </div>
    )
}

function ShopMiniMetric({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <p className="text-xl font-black">{value.toLocaleString()}</p>
            <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{label}</p>
        </div>
    )
}

function ShopProductCard({
    item,
    selected,
    onSelect,
    onEdit,
    onDelete,
    deleting,
}: {
    item: ShopItem
    selected: boolean
    onSelect: (id: string) => void
    onEdit: (item: ShopItem) => void
    onDelete: (id: string) => void
    deleting: boolean
}) {
    const image = storageUrl(item.image_path ?? null)
    const labels = item.labels ?? []

    return (
        <article
            className={`group overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                selected ? 'border-sky-400 ring-2 ring-sky-200' : 'border-border'
            }`}
        >
            <div className="relative aspect-square overflow-hidden bg-muted">
                {image ? (
                    <img
                        src={image}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 via-rose-100 to-sky-100">
                        <Package className="h-9 w-9 text-muted-foreground" />
                    </div>
                )}

                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    <span className="rounded-full bg-background/90 px-2 py-1 text-[9px] font-bold capitalize text-foreground shadow-sm backdrop-blur">
                        {item.type}
                    </span>
                    <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold capitalize text-white shadow-sm ${
                            item.status === 'published'
                                ? 'bg-emerald-500'
                                : item.status === 'draft'
                                  ? 'bg-slate-500'
                                  : 'bg-amber-500'
                        }`}
                    >
                        {item.status}
                    </span>
                </div>

                <label className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onSelect(item.id)}
                        className="h-4 w-4 accent-sky-500"
                        aria-label={`Select ${item.title}`}
                    />
                </label>
            </div>

            <div className="p-2.5">
                <h3 className="line-clamp-2 min-h-8 text-xs font-black leading-[1.35]">
                    {item.title}
                </h3>
                <p className="mt-1 text-[10px] font-black text-orange-500">
                    {item.download_policy === 'free'
                        ? 'Free'
                        : `${item.credit_cost.toLocaleString()} credits`}
                </p>

                {item.description ? (
                    <p className="mt-2 line-clamp-2 min-h-7 text-[9px] leading-relaxed text-muted-foreground">
                        {item.description}
                    </p>
                ) : null}

                {labels.length > 0 ? (
                    <div className="mt-2 flex min-h-4 flex-wrap gap-1">
                        {labels.slice(0, 2).map((label) => (
                            <Badge
                                key={label}
                                variant="secondary"
                                className="h-4 rounded-full px-1.5 text-[8px] font-normal"
                            >
                                #{label}
                            </Badge>
                        ))}
                    </div>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[8px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Download className="h-2.5 w-2.5" />
                        {item.downloads_count.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-500">
                        <Heart className="h-2.5 w-2.5 fill-current" />
                        {item.likes_count.toLocaleString()}
                    </span>
                    <span>{item.files?.length ?? 0} files</span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="inline-flex h-7 items-center justify-center gap-1 rounded-full bg-rose-400 text-[9px] font-bold text-white transition hover:bg-rose-500"
                    >
                        <Edit2 className="h-2.5 w-2.5" />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        disabled={deleting}
                        className="inline-flex h-7 items-center justify-center gap-1 rounded-full bg-sky-400 text-[9px] font-bold text-white transition hover:bg-sky-500 disabled:opacity-40"
                    >
                        <Trash2 className="h-2.5 w-2.5" />
                        Delete
                    </button>
                </div>
            </div>
        </article>
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
