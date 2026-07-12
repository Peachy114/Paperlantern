import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowDown, ArrowLeft, ArrowUp, ImageOff, PlusCircle, Sparkles, Trash2 } from 'lucide-react'
import { adminArtsApi } from '@/api/adminArts'
import { adminApi } from '@/api/admin'
import { storageUrl } from '@/utils/storage'
import type { Art } from '@/types/art'
import type { ProfileBorder } from '@/types/artistProfile'
import type { SuperLikeAward } from '@/types/comment'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type FormState = {
    title: string
    description: string
    labels: string
    images: File[]
}

type AdminArtistOption = {
    id: string
    name: string
    username: string
    role: string
    artist_verified?: boolean
    works_count?: number
    arts_count?: number
}

const EMPTY_FORM: FormState = {
    title: '',
    description: '',
    labels: '',
    images: [],
}

export default function AdminArts() {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [featureUsername, setFeatureUsername] = useState('')
    const [featureDays, setFeatureDays] = useState(7)
    const [borderName, setBorderName] = useState('')
    const [borderImage, setBorderImage] = useState<File | null>(null)

    const { data: arts = [], isLoading } = useQuery({
        queryKey: ['admin-arts'],
        queryFn: () => adminArtsApi.list().then((res) => res.data),
    })

    const { data: profileBorders = [] } = useQuery({
        queryKey: ['admin-profile-borders'],
        queryFn: () => adminArtsApi.profileBorders().then((res) => res.data),
    })

    const { data: users = [] } = useQuery<AdminArtistOption[]>({
        queryKey: ['admin-users'],
        queryFn: () => adminApi.getUsers().then((res) => res.data),
    })

    const artistOptions = useMemo(
        () => users.filter((user) => user.role === 'storyteller'),
        [users]
    )

    const artistMatches = useMemo(() => {
        const query = featureUsername.trim().toLowerCase()
        if (!query) return artistOptions.slice(0, 6)

        return artistOptions
            .filter(
                (artist) =>
                    artist.name.toLowerCase().includes(query) ||
                    artist.username.toLowerCase().includes(query)
            )
            .slice(0, 8)
    }, [artistOptions, featureUsername])

    const createArt = useMutation({
        mutationFn: (payload: FormData) => adminArtsApi.create(payload),
        onSuccess: () => {
            toast.success('Admin art uploaded.')
            queryClient.invalidateQueries({ queryKey: ['admin-arts'] })
            setOpen(false)
            setForm(EMPTY_FORM)
        },
        onError: () => toast.error('Could not upload admin art.'),
    })

    const reorder = useMutation({
        mutationFn: (ids: string[]) => adminArtsApi.reorder(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-arts'] })
            queryClient.invalidateQueries({ queryKey: ['public-arts'] })
        },
        onError: () => toast.error('Could not update arts order.'),
    })

    const featureArtist = useMutation({
        mutationFn: () => adminArtsApi.featureArtist(featureUsername.trim(), featureDays),
        onSuccess: () => {
            toast.success('Artist added to Featured Artists.')
            setFeatureUsername('')
            setFeatureDays(7)
        },
        onError: () => toast.error('Could not feature artist. Check the username.'),
    })

    const createProfileBorder = useMutation({
        mutationFn: (payload: FormData) => adminArtsApi.createProfileBorder(payload),
        onSuccess: () => {
            toast.success('Default profile border added.')
            queryClient.invalidateQueries({ queryKey: ['admin-profile-borders'] })
            setBorderName('')
            setBorderImage(null)
        },
        onError: () => toast.error('Could not add default profile border.'),
    })

    const deleteProfileBorder = useMutation({
        mutationFn: (id: string) => adminArtsApi.deleteProfileBorder(id),
        onSuccess: () => {
            toast.success('Default profile border deleted.')
            queryClient.invalidateQueries({ queryKey: ['admin-profile-borders'] })
        },
        onError: () => toast.error('Could not delete default profile border.'),
    })

    const boostedArts = arts.filter((art) => art.boosted_until)
    const normalArts = arts.filter((art) => !art.boosted_until)

    const handleImages = (event: ChangeEvent<HTMLInputElement>) => {
        setForm((current) => ({
            ...current,
            images: Array.from(event.target.files ?? []).slice(0, 10),
        }))
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!form.title.trim() || form.images.length === 0) {
            toast.error('Title and at least one image are required.')
            return
        }

        const payload = new FormData()
        payload.append('title', form.title.trim())
        payload.append('description', form.description.trim())
        parseLabels(form.labels).forEach((label) => payload.append('labels[]', label))
        form.images.forEach((file) => payload.append('images[]', file))
        createArt.mutate(payload)
    }

    const moveArt = (artId: string, direction: -1 | 1) => {
        const ids = normalArts.map((art) => art.id)
        const index = ids.indexOf(artId)
        const nextIndex = index + direction
        if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) return
        const next = [...ids]
        ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
        reorder.mutate(next)
    }

    const handleFeatureArtist = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!featureUsername.trim()) {
            toast.error('Artist username is required.')
            return
        }
        featureArtist.mutate()
    }

    const handleProfileBorder = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!borderName.trim()) {
            toast.error('Border name is required.')
            return
        }
        if (!borderImage) {
            toast.error('Border image is required.')
            return
        }

        const payload = new FormData()
        payload.append('name', borderName.trim())
        payload.append('image', borderImage)
        createProfileBorder.mutate(payload)
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <Link
                        to="/admin"
                        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Admin
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Admin Arts</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Upload arts as Admin and organize the public Arts Explore order.
                    </p>
                </div>
                <Button onClick={() => setOpen(true)}>
                    <PlusCircle className="h-4 w-4" />
                    Upload Art
                </Button>
            </div>

            <section className="mb-6 rounded-lg border bg-background p-4">
                <div className="mb-3">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Featured Artists Widget
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">Manually Feature Artist</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add an artist profile to the Featured Artists widget. Paid profile boosts
                        also appear there automatically.
                    </p>
                </div>
                <form onSubmit={handleFeatureArtist} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                        <Input
                            value={featureUsername}
                            onChange={(event) => setFeatureUsername(event.target.value)}
                            placeholder="Type artist name or username"
                        />
                        <Input
                            type="number"
                            min={1}
                            max={30}
                            value={featureDays}
                            onChange={(event) => setFeatureDays(Number(event.target.value) || 1)}
                            aria-label="Feature days"
                        />
                        <Button type="submit" disabled={featureArtist.isPending}>
                            <Sparkles className="h-4 w-4" />
                            Feature
                        </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {artistMatches.map((artist) => (
                            <button
                                key={artist.id}
                                type="button"
                                onClick={() => setFeatureUsername(artist.username)}
                                className={`rounded-md border p-3 text-left transition hover:bg-muted ${
                                    featureUsername.trim().toLowerCase() === artist.username.toLowerCase()
                                        ? 'border-amber-500 bg-amber-500/10'
                                        : 'border-border'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-sm font-medium">{artist.name}</span>
                                    {artist.artist_verified && (
                                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                                            Verified
                                        </span>
                                    )}
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">@{artist.username}</p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    {(artist.works_count ?? 0).toLocaleString()} works ·{' '}
                                    {(artist.arts_count ?? 0).toLocaleString()} arts
                                </p>
                            </button>
                        ))}
                    </div>
                    {artistOptions.length === 0 && (
                        <p className="text-xs text-muted-foreground">No storytellers found yet.</p>
                    )}
                </form>
            </section>

            <section className="mb-6 rounded-lg border bg-background p-4">
                <div className="mb-3">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Profile Borders
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">Default Profile Borders</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Upload PNG, WebP, or GIF frames artists can select for their profile image.
                    </p>
                </div>
                <form onSubmit={handleProfileBorder} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <Input
                        value={borderName}
                        onChange={(event) => setBorderName(event.target.value)}
                        placeholder="Border name"
                    />
                    <Input
                        type="file"
                        accept="image/png,image/webp,image/gif"
                        onChange={(event) => setBorderImage(event.target.files?.[0] ?? null)}
                    />
                    <Button type="submit" disabled={createProfileBorder.isPending}>
                        <PlusCircle className="h-4 w-4" />
                        Add Border
                    </Button>
                </form>

                {profileBorders.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                        {profileBorders.map((border: ProfileBorder) => (
                            <div key={border.id} className="rounded-lg border bg-muted/20 p-3">
                                <div className="mx-auto flex h-24 w-24 items-center justify-center">
                                    <img
                                        src={storageUrl(border.image_path)!}
                                        alt={border.name}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <p className="truncate text-xs font-medium">{border.name}</p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-red-500 hover:text-red-500"
                                        onClick={() => deleteProfileBorder.mutate(border.id)}
                                        disabled={deleteProfileBorder.isPending}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <SuperLikeAwardsSection />

            {boostedArts.length > 0 && (
                <section className="mb-6 rounded-lg border bg-amber-500/5">
                    <div className="border-b px-4 py-2.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Paid boosted arts - locked on top
                    </div>
                    <div className="divide-y">
                        {boostedArts.map((art) => (
                            <AdminArtRow key={art.id} art={art} locked />
                        ))}
                    </div>
                </section>
            )}

            <section className="rounded-lg border bg-background">
                <div className="flex items-center justify-between border-b px-4 py-2.5">
                    <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Normal arts order
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {normalArts.length.toLocaleString()} total
                    </span>
                </div>

                {isLoading ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
                ) : normalArts.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                        No normal arts to organize.
                    </div>
                ) : (
                    <div className="divide-y">
                        {normalArts.map((art, index) => (
                            <AdminArtRow
                                key={art.id}
                                art={art}
                                onMoveUp={() => moveArt(art.id, -1)}
                                onMoveDown={() => moveArt(art.id, 1)}
                                moveUpDisabled={index === 0 || reorder.isPending}
                                moveDownDisabled={index === normalArts.length - 1 || reorder.isPending}
                            />
                        ))}
                    </div>
                )}
            </section>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Upload Admin Art</DialogTitle>
                            <DialogDescription>
                                This post appears publicly as By Admin and does not link to a profile.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="admin-art-title">Title</Label>
                                <Input
                                    id="admin-art-title"
                                    value={form.title}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="admin-art-labels">Labels</Label>
                                <Input
                                    id="admin-art-labels"
                                    value={form.labels}
                                    placeholder="portrait, fantasy, gif"
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            labels: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="admin-art-description">Description</Label>
                                <Textarea
                                    id="admin-art-description"
                                    rows={3}
                                    value={form.description}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="admin-art-images">Images</Label>
                                <Input
                                    id="admin-art-images"
                                    type="file"
                                    multiple
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    onChange={handleImages}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={createArt.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createArt.isPending}>
                                {createArt.isPending ? 'Uploading...' : 'Upload'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

type AwardDraft = {
    name: string
    icon: string
    credit_cost: number
    sort_order: number
    is_active: boolean
}

const EMPTY_AWARD: AwardDraft = {
    name: 'Star',
    icon: 'star',
    credit_cost: 1,
    sort_order: 0,
    is_active: true,
}

function iconFromAwardName(name: string): string {
    const normalized = name.trim().toLowerCase()
    if (normalized.includes('rocket')) return 'rocket'
    if (normalized.includes('glass')) return 'glasses'
    if (normalized.includes('star')) return 'star'

    return 'sparkles'
}

function SuperLikeAwardsSection() {
    const queryClient = useQueryClient()
    const [draft, setDraft] = useState<AwardDraft>(EMPTY_AWARD)

    const { data: awards = [] } = useQuery<SuperLikeAward[]>({
        queryKey: ['admin-super-like-awards'],
        queryFn: () => adminApi.getSuperLikeAwards().then((res) => res.data.data),
    })

    const createAward = useMutation({
        mutationFn: (payload: AwardDraft) => adminApi.createSuperLikeAward(payload),
        onSuccess: () => {
            toast.success('Super Like award added.')
            queryClient.invalidateQueries({ queryKey: ['admin-super-like-awards'] })
            queryClient.invalidateQueries({ queryKey: ['super-like-awards'] })
            setDraft(EMPTY_AWARD)
        },
        onError: () => toast.error('Could not add Super Like award.'),
    })

    const updateAward = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: AwardDraft }) =>
            adminApi.updateSuperLikeAward(id, payload),
        onSuccess: () => {
            toast.success('Super Like award updated.')
            queryClient.invalidateQueries({ queryKey: ['admin-super-like-awards'] })
            queryClient.invalidateQueries({ queryKey: ['super-like-awards'] })
        },
        onError: () => toast.error('Could not update Super Like award.'),
    })

    const disableAward = useMutation({
        mutationFn: (id: string) => adminApi.deleteSuperLikeAward(id),
        onSuccess: () => {
            toast.success('Super Like award disabled.')
            queryClient.invalidateQueries({ queryKey: ['admin-super-like-awards'] })
            queryClient.invalidateQueries({ queryKey: ['super-like-awards'] })
        },
        onError: () => toast.error('Could not disable Super Like award.'),
    })

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!draft.name.trim()) {
            toast.error('Award name is required.')
            return
        }
        createAward.mutate({
            ...draft,
            name: draft.name.trim(),
            icon: draft.icon.trim() || iconFromAwardName(draft.name),
            sort_order: draft.sort_order || awards.length + 1,
        })
    }

    return (
        <section className="mb-6 rounded-lg border bg-background p-4">
            <div className="mb-3">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Super Like Awards
                </p>
                <h2 className="mt-1 text-lg font-semibold">Default Award Types</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Configure the awards users can send to comments, chapters, works, and arts.
                </p>
            </div>

            <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
                <div className="grid gap-1.5">
                    <Label htmlFor="award-name">Name</Label>
                    <Input
                        id="award-name"
                        value={draft.name}
                        onChange={(event) =>
                            setDraft((current) => ({
                                ...current,
                                name: event.target.value,
                                icon: iconFromAwardName(event.target.value),
                            }))
                        }
                        placeholder="Star"
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="award-credit">Credit</Label>
                    <Input
                        id="award-credit"
                        type="number"
                        min={1}
                        max={100}
                        value={draft.credit_cost}
                        onChange={(event) =>
                            setDraft((current) => ({ ...current, credit_cost: Number(event.target.value) || 1 }))
                        }
                    />
                </div>
                <Button type="submit" disabled={createAward.isPending}>
                    <PlusCircle className="h-4 w-4" />
                    Add Award
                </Button>
            </form>

            <div className="mt-4 grid gap-2">
                {awards.map((award) => (
                    <SuperLikeAwardRow
                        key={award.id}
                        award={award}
                        busy={updateAward.isPending || disableAward.isPending}
                        onSave={(payload) => updateAward.mutate({ id: award.id, payload })}
                        onDisable={() => disableAward.mutate(award.id)}
                    />
                ))}
            </div>
        </section>
    )
}

function SuperLikeAwardRow({
    award,
    busy,
    onSave,
    onDisable,
}: {
    award: SuperLikeAward
    busy: boolean
    onSave: (payload: AwardDraft) => void
    onDisable: () => void
}) {
    const [draft, setDraft] = useState<AwardDraft>({
        name: award.name,
        icon: award.icon,
        credit_cost: award.credit_cost,
        sort_order: award.sort_order ?? 0,
        is_active: Boolean(award.is_active),
    })

    useEffect(() => {
        setDraft({
            name: award.name,
            icon: award.icon,
            credit_cost: award.credit_cost,
            sort_order: award.sort_order ?? 0,
            is_active: Boolean(award.is_active),
        })
    }, [award])

    return (
        <div className="grid gap-2 rounded-md border bg-muted/20 p-2 md:grid-cols-[1fr_120px_110px_110px_90px_auto_auto]">
            <Input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
                value={draft.icon}
                onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))}
            />
            <Input
                type="number"
                min={1}
                max={100}
                value={draft.credit_cost}
                onChange={(event) =>
                    setDraft((current) => ({ ...current, credit_cost: Number(event.target.value) || 1 }))
                }
            />
            <Input
                type="number"
                min={0}
                max={999}
                value={draft.sort_order}
                onChange={(event) =>
                    setDraft((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))
                }
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                    type="checkbox"
                    checked={draft.is_active}
                    onChange={(event) =>
                        setDraft((current) => ({ ...current, is_active: event.target.checked }))
                    }
                />
                Active
            </label>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onSave(draft)}>
                Save
            </Button>
            <Button type="button" variant="ghost" className="text-red-500 hover:text-red-500" disabled={busy} onClick={onDisable}>
                Disable
            </Button>
        </div>
    )
}

function AdminArtRow({
    art,
    locked = false,
    onMoveUp,
    onMoveDown,
    moveUpDisabled,
    moveDownDisabled,
}: {
    art: Art
    locked?: boolean
    onMoveUp?: () => void
    onMoveDown?: () => void
    moveUpDisabled?: boolean
    moveDownDisabled?: boolean
}) {
    const image = art.images?.[0]?.image_path ?? art.image_path
    const byline = art.user?.role === 'super_admin' ? 'By Admin' : `By ${art.user?.name ?? 'Unknown'}`

    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {image ? (
                    <img src={storageUrl(image)!} alt={art.title} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <ImageOff className="h-5 w-5 text-muted-foreground" />
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{art.title}</p>
                    {locked && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-black">
                            <Sparkles className="h-3 w-3" />
                            Boosted
                        </span>
                    )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{byline}</p>
                {art.labels && art.labels.length > 0 && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                        {art.labels.join(', ')}
                    </p>
                )}
            </div>
            {!locked && (
                <div className="flex gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={onMoveUp}
                        disabled={moveUpDisabled}
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={onMoveDown}
                        disabled={moveDownDisabled}
                    >
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}

function parseLabels(labels: string) {
    return Array.from(
        new Set(
            labels
                .split(',')
                .map((label) => label.trim().toLowerCase())
                .filter(Boolean)
        )
    ).slice(0, 12)
}
