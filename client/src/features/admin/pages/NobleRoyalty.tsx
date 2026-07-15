import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Crown, Edit, Gift, PlusCircle, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/api/admin'
import { adminArtsApi } from '@/api/adminArts'
import { adminNobleRoyaltyApi, type SubscriptionPlan } from '@/api/nobleRoyalty'
import { storageUrl } from '@/utils/storage'
import type { ArtistSticker, ProfileBorder, RoyaltyDesignAsset, RoyaltyDesignType } from '@/types/artistProfile'
import type { SuperLikeAward } from '@/types/comment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

type Tab = 'stickers' | 'borders' | 'rewards' | 'subscriptions' | 'message_designs' | 'message_backgrounds' | 'comment_borders' | 'board_buttons'
type GiftAssetType = 'sticker' | 'border' | 'design'

type AssetForm = {
    name: string
    description: string
    bundle_name: string
    is_free: boolean
    credit_cost: number
    subscription_free: boolean
    publish_public: boolean
    images: File[]
    sticker_names: string[]
    preview_urls: string[]
}

type RewardForm = {
    id?: string
    name: string
    icon: string
    credit_cost: number
    is_active: boolean
    sort_order: number
}

type PlanForm = {
    id?: string
    name: string
    slug: string
    audience: 'wanderer' | 'storyteller'
    tier_key: 'starter' | 'plus' | 'atelier'
    description: string
    monthly_credit_cost: number
    promo_label: string
    promo_credit_cost: number | ''
    promo_start_at: string
    promo_end_at: string
    is_recommended: boolean
    is_active: boolean
    unlimited_board: boolean
    board_limit: number
    free_boost_days: number
    early_access: boolean
    perks: string
    sort_order: number
}

type GiftForm = {
    recipient_username: string
    asset_type: GiftAssetType
    asset_id: string
    asset_name: string
    note: string
}

const EMPTY_ASSET: AssetForm = {
    name: '',
    description: '',
    bundle_name: '',
    is_free: false,
    credit_cost: 1,
    subscription_free: false,
    publish_public: true,
    images: [],
    sticker_names: [],
    preview_urls: [],
}
const EMPTY_REWARD: RewardForm = {
    name: '',
    icon: 'star',
    credit_cost: 1,
    is_active: true,
    sort_order: 0,
}
const EMPTY_PLAN: PlanForm = {
    name: '',
    slug: '',
    audience: 'wanderer',
    tier_key: 'starter',
    description: '',
    monthly_credit_cost: 60,
    promo_label: '',
    promo_credit_cost: '',
    promo_start_at: '',
    promo_end_at: '',
    is_recommended: false,
    is_active: true,
    unlimited_board: false,
    board_limit: 25,
    free_boost_days: 1,
    early_access: true,
    perks: '',
    sort_order: 0,
}
const EMPTY_GIFT: GiftForm = {
    recipient_username: '',
    asset_type: 'sticker',
    asset_id: '',
    asset_name: '',
    note: '',
}

const TABS: Tab[] = ['stickers', 'borders', 'rewards', 'subscriptions', 'message_designs', 'message_backgrounds', 'comment_borders', 'board_buttons']

const DESIGN_TAB_TYPES: Partial<Record<Tab, RoyaltyDesignType>> = {
    message_designs: 'message_design',
    message_backgrounds: 'message_background',
    comment_borders: 'comment_border',
    board_buttons: 'board_button',
}

const TAB_LABELS: Record<Tab, string> = {
    stickers: 'Stickers',
    borders: 'Borders',
    rewards: 'Rewards',
    subscriptions: 'Subscriptions',
    message_designs: 'Messages',
    message_backgrounds: 'Message Backgrounds',
    comment_borders: 'Comment Borders',
    board_buttons: 'Board Buttons',
}

export default function NobleRoyalty() {
    const queryClient = useQueryClient()
    const [searchParams, setSearchParams] = useSearchParams()
    const initialTab = TABS.includes(searchParams.get('tab') as Tab) ? (searchParams.get('tab') as Tab) : 'stickers'
    const [tab, setTabState] = useState<Tab>(initialTab)
    const [assetOpen, setAssetOpen] = useState(false)
    const [assetForm, setAssetForm] = useState<AssetForm>(EMPTY_ASSET)
    const [rewardOpen, setRewardOpen] = useState(false)
    const [rewardForm, setRewardForm] = useState<RewardForm>(EMPTY_REWARD)
    const [planOpen, setPlanOpen] = useState(false)
    const [planForm, setPlanForm] = useState<PlanForm>(EMPTY_PLAN)
    const [giftOpen, setGiftOpen] = useState(false)
    const [giftForm, setGiftForm] = useState<GiftForm>(EMPTY_GIFT)

    const stickers = useQuery({
        queryKey: ['admin-royalty-stickers'],
        queryFn: () => adminArtsApi.stickers().then((res) => res.data.data),
    })
    const borders = useQuery({
        queryKey: ['admin-profile-borders'],
        queryFn: () => adminArtsApi.profileBorders().then((res) => res.data),
    })
    const rewards = useQuery<SuperLikeAward[]>({
        queryKey: ['admin-super-like-awards'],
        queryFn: () => adminApi.getSuperLikeAwards().then((res) => res.data.data),
    })
    const plans = useQuery({
        queryKey: ['admin-subscription-plans'],
        queryFn: () => adminNobleRoyaltyApi.plans().then((res) => res.data.data),
    })
    const designType = DESIGN_TAB_TYPES[tab]
    const designAssets = useQuery({
        queryKey: ['admin-royalty-designs', designType],
        queryFn: () => adminArtsApi.royaltyDesigns(designType!).then((res) => res.data.data),
        enabled: Boolean(designType),
    })

    const createAsset = useMutation({
        mutationFn: (payload: FormData) => {
            if (tab === 'stickers') return adminArtsApi.createSticker(payload)
            if (tab === 'borders') return adminArtsApi.createProfileBorder(payload)
            return adminArtsApi.createRoyaltyDesign(payload)
        },
        onSuccess: () => {
            toast.success(`${singularTitle(tab)} added.`)
            queryClient.invalidateQueries({ queryKey: ['admin-royalty-stickers'] })
            queryClient.invalidateQueries({ queryKey: ['page-builder-sticker-library'] })
            queryClient.invalidateQueries({ queryKey: ['admin-profile-borders'] })
            queryClient.invalidateQueries({ queryKey: ['admin-royalty-designs'] })
            setAssetForm((current) => {
                current.preview_urls.forEach((url) => URL.revokeObjectURL(url))
                return EMPTY_ASSET
            })
            setAssetOpen(false)
        },
        onError: () => toast.error(`Could not add ${singularTitle(tab).toLowerCase()}.`),
    })

    const deleteSticker = useMutation({
        mutationFn: (id: string) => adminArtsApi.deleteSticker(id),
        onSuccess: () => {
            toast.success('Sticker deleted.')
            queryClient.invalidateQueries({ queryKey: ['admin-royalty-stickers'] })
            queryClient.invalidateQueries({ queryKey: ['page-builder-sticker-library'] })
        },
        onError: () => toast.error('Could not delete sticker.'),
    })

    const deleteBorder = useMutation({
        mutationFn: (id: string) => adminArtsApi.deleteProfileBorder(id),
        onSuccess: () => {
            toast.success('Border deleted.')
            queryClient.invalidateQueries({ queryKey: ['admin-profile-borders'] })
        },
        onError: () => toast.error('Could not delete border.'),
    })

    const deleteDesign = useMutation({
        mutationFn: (id: string) => adminArtsApi.deleteRoyaltyDesign(id),
        onSuccess: () => {
            toast.success('Design deleted.')
            queryClient.invalidateQueries({ queryKey: ['admin-royalty-designs'] })
        },
        onError: () => toast.error('Could not delete design.'),
    })

    const saveReward = useMutation({
        mutationFn: (payload: RewardForm) =>
            payload.id
                ? adminApi.updateSuperLikeAward(payload.id, payload)
                : adminApi.createSuperLikeAward(payload),
        onSuccess: () => {
            toast.success(rewardForm.id ? 'Reward updated.' : 'Reward added.')
            queryClient.invalidateQueries({ queryKey: ['admin-super-like-awards'] })
            queryClient.invalidateQueries({ queryKey: ['super-like-awards'] })
            setRewardForm(EMPTY_REWARD)
            setRewardOpen(false)
        },
        onError: () => toast.error('Could not save reward.'),
    })

    const savePlan = useMutation({
        mutationFn: (payload: PlanForm) =>
            payload.id
                ? adminNobleRoyaltyApi.updatePlan(payload.id, {
                      ...planPayload(payload),
                      perks: payload.perks,
                  })
                : adminNobleRoyaltyApi.createPlan({
                      ...planPayload(payload),
                      perks: payload.perks,
                  }),
        onSuccess: () => {
            toast.success(planForm.id ? 'Subscription updated.' : 'Subscription added.')
            queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] })
            queryClient.invalidateQueries({ queryKey: ['noble-royalty'] })
            setPlanForm(EMPTY_PLAN)
            setPlanOpen(false)
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not save subscription.'),
    })

    const sendGift = useMutation({
        mutationFn: (payload: GiftForm) =>
            adminNobleRoyaltyApi.gift({
                recipient_username: payload.recipient_username,
                asset_type: payload.asset_type,
                asset_id: payload.asset_id,
                note: payload.note,
            }),
        onSuccess: (res) => {
            toast.success(res.data?.message ?? 'Gift sent.')
            setGiftForm(EMPTY_GIFT)
            setGiftOpen(false)
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not send gift.'),
    })

    const deleteReward = useMutation({
        mutationFn: (id: string) => adminApi.deleteSuperLikeAward(id),
        onSuccess: () => {
            toast.success('Reward disabled.')
            queryClient.invalidateQueries({ queryKey: ['admin-super-like-awards'] })
            queryClient.invalidateQueries({ queryKey: ['super-like-awards'] })
        },
        onError: () => toast.error('Could not delete reward.'),
    })

    const title = useMemo(() => {
        return TAB_LABELS[tab]
    }, [tab])

    const setTab = (nextTab: Tab) => {
        setTabState(nextTab)
        setSearchParams(nextTab === 'stickers' ? {} : { tab: nextTab })
    }

    const openAddAsset = () => {
        setAssetForm((current) => {
            current.preview_urls.forEach((url) => URL.revokeObjectURL(url))
            return EMPTY_ASSET
        })
        setAssetOpen(true)
    }

    const removeAssetImage = (index: number) => {
        setAssetForm((current) => {
            current.preview_urls[index] && URL.revokeObjectURL(current.preview_urls[index])

            return {
                ...current,
                images: current.images.filter((_, itemIndex) => itemIndex !== index),
                sticker_names: current.sticker_names.filter((_, itemIndex) => itemIndex !== index),
                preview_urls: current.preview_urls.filter((_, itemIndex) => itemIndex !== index),
            }
        })
    }

    const openGift = (assetType: GiftAssetType, item: ArtistSticker | ProfileBorder | RoyaltyDesignAsset) => {
        setGiftForm({
            recipient_username: '',
            asset_type: assetType,
            asset_id: item.id,
            asset_name: item.name,
            note: '',
        })
        setGiftOpen(true)
    }

    const submitAsset = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (assetForm.images.length === 0) {
            toast.error('Image is required.')
            return
        }

        if (tab !== 'stickers' && !assetForm.name.trim()) {
            toast.error('Name and image are required.')
            return
        }

        const payload = new FormData()
        if (tab === 'stickers') {
            payload.append('name', assetForm.sticker_names[0]?.trim() ?? '')
            payload.append('bundle_name', assetForm.bundle_name.trim())
            payload.append('is_free', assetForm.is_free ? '1' : '0')
            payload.append('credit_cost', String(assetForm.is_free ? 0 : Math.max(1, assetForm.credit_cost)))
            payload.append('subscription_free', assetForm.subscription_free ? '1' : '0')
            payload.append('publish_public', assetForm.publish_public ? '1' : '0')
            assetForm.images.forEach((file, index) => {
                payload.append('images[]', file)
                payload.append('sticker_names[]', assetForm.sticker_names[index]?.trim() ?? stickerNameFromFile(file))
            })
        } else {
            if (designType) {
                payload.append('type', designType)
            }
            payload.append('name', assetForm.name.trim())
            payload.append('description', assetForm.description.trim())
            payload.append('image', assetForm.images[0])
            payload.append('publish_public', assetForm.publish_public ? '1' : '0')
            payload.append('subscription_free', assetForm.subscription_free ? '1' : '0')
        }
        createAsset.mutate(payload)
    }

    const submitReward = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!rewardForm.name.trim()) {
            toast.error('Reward name is required.')
            return
        }
        saveReward.mutate(rewardForm)
    }

    const submitPlan = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!planForm.name.trim()) {
            toast.error('Subscription name is required.')
            return
        }
        savePlan.mutate(planForm)
    }

    const submitGift = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!giftForm.recipient_username.trim()) {
            toast.error('Recipient username is required.')
            return
        }
        sendGift.mutate(giftForm)
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <Link
                        to="/admin"
                        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Admin
                    </Link>
                    <div className="flex items-center gap-2">
                        <Crown className="h-6 w-6 text-amber-500" />
                        <h1 className="text-2xl font-bold tracking-tight">Noble Royalty</h1>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage default stickers, profile borders, rewards, and picture-based designs.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        if (tab === 'rewards') {
                            setRewardForm(EMPTY_REWARD)
                            setRewardOpen(true)
                        } else if (tab === 'subscriptions') {
                            setPlanForm(EMPTY_PLAN)
                            setPlanOpen(true)
                        } else {
                            openAddAsset()
                        }
                    }}
                >
                    <PlusCircle className="h-4 w-4" />
                    Add {singularTitle(tab)}
                </Button>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
                {TABS.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => setTab(item)}
                        className={`rounded-lg border px-4 py-2 text-sm capitalize ${
                            tab === item ? 'bg-foreground text-background' : 'bg-background'
                        }`}
                    >
                        {TAB_LABELS[item]}
                    </button>
                ))}
            </div>

            {tab === 'stickers' && (
                <AssetGrid
                    items={stickers.data ?? []}
                    loading={stickers.isLoading}
                    empty="No admin stickers yet."
                    assetType="sticker"
                    onDelete={(id) => deleteSticker.mutate(id)}
                    onGift={(item) => openGift('sticker', item)}
                    deleting={deleteSticker.isPending}
                />
            )}

            {tab === 'borders' && (
                <AssetGrid
                    items={borders.data ?? []}
                    loading={borders.isLoading}
                    empty="No default borders yet."
                    assetType="border"
                    onDelete={(id) => deleteBorder.mutate(id)}
                    onGift={(item) => openGift('border', item)}
                    deleting={deleteBorder.isPending}
                />
            )}

            {tab === 'subscriptions' && (
                <PlansTable
                    plans={plans.data ?? []}
                    loading={plans.isLoading}
                    onEdit={(plan) => {
                        setPlanForm(planToForm(plan))
                        setPlanOpen(true)
                    }}
                />
            )}

            {tab === 'rewards' && (
                <RewardsTable
                    rewards={rewards.data ?? []}
                    loading={rewards.isLoading}
                    onEdit={(reward) => {
                        setRewardForm({
                            id: reward.id,
                            name: reward.name,
                            icon: reward.icon,
                            credit_cost: reward.credit_cost,
                            is_active: Boolean(reward.is_active ?? true),
                            sort_order: reward.sort_order ?? 0,
                        })
                        setRewardOpen(true)
                    }}
                    onDelete={(id) => deleteReward.mutate(id)}
                    deleting={deleteReward.isPending}
                />
            )}

            {designType && (
                <AssetGrid
                    items={designAssets.data ?? []}
                    loading={designAssets.isLoading}
                    empty={`No ${title.toLowerCase()} yet.`}
                    assetType="design"
                    onDelete={(id) => deleteDesign.mutate(id)}
                    onGift={(item) => openGift('design', item)}
                    deleting={deleteDesign.isPending}
                />
            )}

            <Dialog open={assetOpen} onOpenChange={setAssetOpen}>
                <DialogContent className={designType ? 'sm:max-w-2xl' : undefined}>
                    <form onSubmit={submitAsset}>
                        <DialogHeader>
                            <DialogTitle>Add {singularTitle(tab)}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {tab !== 'stickers' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={assetForm.name}
                                            onChange={(event) => setAssetForm((current) => ({ ...current, name: event.target.value }))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={assetForm.description}
                                            onChange={(event) => setAssetForm((current) => ({ ...current, description: event.target.value }))}
                                        />
                                    </div>
                                </>
                            )}
                            {tab === 'stickers' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label>Bundle name, optional</Label>
                                        <Input
                                            value={assetForm.bundle_name}
                                            onChange={(event) => setAssetForm((current) => ({ ...current, bundle_name: event.target.value }))}
                                            placeholder="Leave blank for solo stickers"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={assetForm.is_free}
                                            onChange={(event) =>
                                                setAssetForm((current) => ({
                                                    ...current,
                                                    is_free: event.target.checked,
                                                    credit_cost: event.target.checked ? 0 : Math.max(1, current.credit_cost || 1),
                                                }))
                                            }
                                        />
                                        Free sticker
                                    </label>
                                    <div className="grid gap-2">
                                        <Label>Credit cost</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={1000}
                                            value={assetForm.credit_cost}
                                            disabled={assetForm.is_free}
                                            onChange={(event) => setAssetForm((current) => ({ ...current, credit_cost: Number(event.target.value) || 0 }))}
                                        />
                                    </div>
                                </>
                            )}
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={assetForm.publish_public}
                                    onChange={(event) =>
                                        setAssetForm((current) => ({
                                            ...current,
                                            publish_public: event.target.checked,
                                        }))
                                    }
                                />
                                Public asset
                            </label>
                            {(tab === 'stickers' || tab === 'borders' || Boolean(designType)) && (
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={assetForm.subscription_free}
                                        onChange={(event) =>
                                            setAssetForm((current) => ({
                                                ...current,
                                                subscription_free: event.target.checked,
                                            }))
                                        }
                                    />
                                    Free for active subscriptions
                                </label>
                            )}
                            <div className="grid gap-2">
                                <Label>{tab === 'stickers' ? 'Sticker images or GIFs' : 'Image or animated GIF'}</Label>
                                <Input
                                    type="file"
                                    accept="image/png,image/webp,image/gif,image/jpeg"
                                    multiple={tab === 'stickers'}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                        setAssetForm((current) => {
                                            current.preview_urls.forEach((url) => URL.revokeObjectURL(url))
                                            const images = Array.from(event.target.files ?? [])
                                            return {
                                                ...current,
                                                images,
                                                sticker_names: images.map((file) => stickerNameFromFile(file)),
                                                preview_urls: images.map((file) => URL.createObjectURL(file)),
                                            }
                                        })
                                    }
                                />
                                {tab === 'stickers' && assetForm.images.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {assetForm.images.length} file{assetForm.images.length === 1 ? '' : 's'} selected
                                    </p>
                                )}
                            </div>
                            {designType && (
                                <DesignPreview
                                    tab={tab}
                                    previewUrl={assetForm.preview_urls[0] ?? null}
                                />
                            )}
                            {tab === 'stickers' && assetForm.images.length > 0 && (
                                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
                                    {assetForm.images.map((file, index) => (
                                        <div
                                            key={`${file.name}-${index}`}
                                            className="grid grid-cols-[64px_1fr_auto] items-end gap-3 rounded-md bg-muted/30 p-2"
                                        >
                                            <div className="h-16 w-16 overflow-hidden rounded-md border bg-[linear-gradient(45deg,var(--muted)_25%,transparent_25%),linear-gradient(-45deg,var(--muted)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,var(--muted)_75%),linear-gradient(-45deg,transparent_75%,var(--muted)_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0] p-1">
                                                <img
                                                    src={assetForm.preview_urls[index]}
                                                    alt=""
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label>Sticker {index + 1} name, optional</Label>
                                                <Input
                                                    value={assetForm.sticker_names[index] ?? ''}
                                                    onChange={(event) =>
                                                        setAssetForm((current) => ({
                                                            ...current,
                                                            sticker_names: current.images.map((_, itemIndex) =>
                                                                itemIndex === index
                                                                    ? event.target.value
                                                                    : current.sticker_names[itemIndex] ?? ''
                                                            ),
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => removeAssetImage(index)}
                                                aria-label={`Remove sticker ${index + 1}`}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={createAsset.isPending}>
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={rewardOpen} onOpenChange={setRewardOpen}>
                <DialogContent>
                    <form onSubmit={submitReward}>
                        <DialogHeader>
                            <DialogTitle>{rewardForm.id ? 'Edit Reward' : 'Add Reward'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <Input
                                    value={rewardForm.name}
                                    onChange={(event) => setRewardForm((current) => ({ ...current, name: event.target.value }))}
                                    placeholder="Star"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Icon</Label>
                                <Input
                                    value={rewardForm.icon}
                                    onChange={(event) => setRewardForm((current) => ({ ...current, icon: event.target.value }))}
                                    placeholder="star"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Credit cost</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={rewardForm.credit_cost}
                                    onChange={(event) => setRewardForm((current) => ({ ...current, credit_cost: Number(event.target.value) || 1 }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Sort order</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={rewardForm.sort_order}
                                    onChange={(event) => setRewardForm((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={rewardForm.is_active}
                                    onChange={(event) => setRewardForm((current) => ({ ...current, is_active: event.target.checked }))}
                                />
                                Active
                            </label>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={saveReward.isPending}>
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={planOpen} onOpenChange={setPlanOpen}>
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                    <form onSubmit={submitPlan}>
                        <DialogHeader>
                            <DialogTitle>{planForm.id ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <Input
                                    value={planForm.name}
                                    onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value }))}
                                    placeholder="Noble Plus"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Slug</Label>
                                <Input
                                    value={planForm.slug}
                                    onChange={(event) => setPlanForm((current) => ({ ...current, slug: event.target.value }))}
                                    placeholder="noble-plus"
                                />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Audience</Label>
                                    <select
                                        value={planForm.audience}
                                        onChange={(event) =>
                                            setPlanForm((current) => ({
                                                ...current,
                                                audience: event.target.value as PlanForm['audience'],
                                            }))
                                        }
                                        className="h-10 rounded-md border bg-background px-3 text-sm"
                                    >
                                        <option value="wanderer">Wanderer</option>
                                        <option value="storyteller">Artist</option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tier</Label>
                                    <select
                                        value={planForm.tier_key}
                                        onChange={(event) =>
                                            setPlanForm((current) => ({
                                                ...current,
                                                tier_key: event.target.value as PlanForm['tier_key'],
                                            }))
                                        }
                                        className="h-10 rounded-md border bg-background px-3 text-sm"
                                    >
                                        <option value="starter">Noble Starter</option>
                                        <option value="plus">Noble Plus</option>
                                        <option value="atelier">Royal Atelier</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={planForm.description}
                                    onChange={(event) => setPlanForm((current) => ({ ...current, description: event.target.value }))}
                                />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label>Monthly credits</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={planForm.monthly_credit_cost}
                                        onChange={(event) => setPlanForm((current) => ({ ...current, monthly_credit_cost: Number(event.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Board limit</Label>
                                    <Input
                                        type="number"
                                        min={10}
                                        value={planForm.board_limit}
                                        onChange={(event) => setPlanForm((current) => ({ ...current, board_limit: Number(event.target.value) || 10 }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Free boost days</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={31}
                                        value={planForm.free_boost_days}
                                        onChange={(event) => setPlanForm((current) => ({ ...current, free_boost_days: Number(event.target.value) || 0 }))}
                                    />
                                </div>
                            </div>
                            <div className="rounded-lg border bg-muted/20 p-3">
                                <h3 className="mb-3 text-sm font-semibold">Promo</h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Promo label</Label>
                                        <Input
                                            value={planForm.promo_label}
                                            onChange={(event) =>
                                                setPlanForm((current) => ({ ...current, promo_label: event.target.value }))
                                            }
                                            placeholder="Launch promo"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Promo credit cost</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={planForm.promo_credit_cost}
                                            onChange={(event) =>
                                                setPlanForm((current) => ({
                                                    ...current,
                                                    promo_credit_cost: event.target.value === '' ? '' : Number(event.target.value) || 0,
                                                }))
                                            }
                                            placeholder="Leave empty for no promo"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Promo start</Label>
                                        <Input
                                            type="datetime-local"
                                            value={planForm.promo_start_at}
                                            onChange={(event) =>
                                                setPlanForm((current) => ({ ...current, promo_start_at: event.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Promo end</Label>
                                        <Input
                                            type="datetime-local"
                                            value={planForm.promo_end_at}
                                            onChange={(event) =>
                                                setPlanForm((current) => ({ ...current, promo_end_at: event.target.value }))
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Perks, one per line</Label>
                                <Textarea
                                    value={planForm.perks}
                                    onChange={(event) => setPlanForm((current) => ({ ...current, perks: event.target.value }))}
                                    rows={6}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Sort order</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={planForm.sort_order}
                                    onChange={(event) => setPlanForm((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))}
                                />
                            </div>
                            <div className="grid gap-2 text-sm sm:grid-cols-2">
                                {[
                                    ['is_active', 'Active'],
                                    ['is_recommended', 'Recommended'],
                                    ['unlimited_board', 'Unlimited My Board'],
                                    ['early_access', 'Early access'],
                                ].map(([key, label]) => (
                                    <label key={key} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(planForm[key as keyof PlanForm])}
                                            onChange={(event) =>
                                                setPlanForm((current) => ({
                                                    ...current,
                                                    [key]: event.target.checked,
                                                }))
                                            }
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={savePlan.isPending}>
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={giftOpen} onOpenChange={setGiftOpen}>
                <DialogContent>
                    <form onSubmit={submitGift}>
                        <DialogHeader>
                            <DialogTitle>Send Noble Royalty Gift</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="rounded-lg border bg-muted/25 p-3 text-sm">
                                <p className="font-medium">{giftForm.asset_name || 'Select an asset'}</p>
                                <p className="capitalize text-muted-foreground">{giftForm.asset_type}</p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Recipient username</Label>
                                <Input
                                    value={giftForm.recipient_username}
                                    onChange={(event) => setGiftForm((current) => ({ ...current, recipient_username: event.target.value }))}
                                    placeholder="storyteller"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Note, optional</Label>
                                <Textarea
                                    value={giftForm.note}
                                    onChange={(event) => setGiftForm((current) => ({ ...current, note: event.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={sendGift.isPending}>
                                <Gift className="h-4 w-4" />
                                Send Gift
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function stickerNameFromFile(file: File) {
    return file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim()
}

function singularTitle(tab: Tab) {
    if (tab === 'stickers') return 'Sticker'
    if (tab === 'borders') return 'Border'
    if (tab === 'rewards') return 'Reward'
    if (tab === 'subscriptions') return 'Subscription'
    if (tab === 'message_designs') return 'Message Design'
    if (tab === 'comment_borders') return 'Comment Border'
    return 'Board Button Design'
}

function planToForm(plan: SubscriptionPlan): PlanForm {
    return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        audience: plan.audience ?? 'wanderer',
        tier_key: plan.tier_key ?? 'starter',
        description: plan.description ?? '',
        monthly_credit_cost: plan.monthly_credit_cost,
        promo_label: plan.promo_label ?? '',
        promo_credit_cost: plan.promo_credit_cost ?? '',
        promo_start_at: toDateTimeLocalValue(plan.promo_start_at),
        promo_end_at: toDateTimeLocalValue(plan.promo_end_at),
        is_recommended: plan.is_recommended,
        is_active: plan.is_active,
        unlimited_board: plan.unlimited_board,
        board_limit: plan.board_limit,
        free_boost_days: plan.free_boost_days,
        early_access: plan.early_access,
        perks: (plan.perks ?? []).join('\n'),
        sort_order: plan.sort_order,
    }
}

function planPayload(plan: PlanForm) {
    return {
        ...plan,
        promo_credit_cost: plan.promo_credit_cost === '' ? null : plan.promo_credit_cost,
        promo_start_at: plan.promo_start_at || null,
        promo_end_at: plan.promo_end_at || null,
    }
}

function toDateTimeLocalValue(value?: string | null) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 16)
}

function DesignPreview({ tab, previewUrl }: { tab: Tab; previewUrl: string | null }) {
    return (
        <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-3">
                <Label>Preview before saving</Label>
                <span className="text-xs text-muted-foreground">
                    {previewUrl ? 'Using selected file' : 'Default preview'}
                </span>
            </div>
            <div className="overflow-hidden rounded-lg border bg-[linear-gradient(45deg,var(--muted)_25%,transparent_25%),linear-gradient(-45deg,var(--muted)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,var(--muted)_75%),linear-gradient(-45deg,transparent_75%,var(--muted)_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0] p-4">
                {tab === 'comment_borders' && <CommentDesignPreview previewUrl={previewUrl} />}
                {tab === 'message_designs' && <MessageDesignPreview previewUrl={previewUrl} />}
                {tab === 'board_buttons' && <BoardButtonDesignPreview previewUrl={previewUrl} />}
            </div>
        </div>
    )
}

function CommentDesignPreview({ previewUrl }: { previewUrl: string | null }) {
    return (
        <div className="relative mx-auto min-h-[220px] max-w-xl">
            <div className="relative z-10 mx-auto mt-8 rounded-xl border bg-background px-6 pb-10 pt-7 text-foreground shadow-sm">
                <div className="flex gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border bg-muted">
                        <div className="grid h-full w-full place-items-center text-lg font-bold">N</div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-3">
                            <strong className="text-lg">test3@mykiller</strong>
                            <span className="text-sm text-muted-foreground">Jul 13, 2023, 3:30 PM</span>
                        </div>
                        <p className="mt-3 text-base font-medium">amazingusualfaverch</p>
                        <div className="mt-5 flex flex-wrap gap-2 text-sm">
                            {['heart 5', 'like 2', 'reply', 'gift 0'].map((label) => (
                                <span key={label} className="rounded-md border bg-muted/30 px-4 py-2">
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <button type="button" className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-md border bg-background px-5 py-2 font-semibold shadow-sm">
                    Reply
                </button>
            </div>
            {previewUrl && (
                <img
                    src={previewUrl}
                    alt=""
                    className="pointer-events-none absolute inset-0 z-20 h-full w-full object-contain"
                />
            )}
        </div>
    )
}

function MessageDesignPreview({ previewUrl }: { previewUrl: string | null }) {
    return (
        <div className="relative mx-auto flex min-h-40 max-w-md items-end justify-end p-5">
            <div className="relative rounded-xl border bg-background px-5 py-4 text-sm text-foreground shadow-sm">
                <p className="font-semibold">Nor</p>
                <p className="mt-1">Here is the commission update and image reference.</p>
            </div>
            {previewUrl && (
                <img
                    src={previewUrl}
                    alt=""
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                />
            )}
        </div>
    )
}

function BoardButtonDesignPreview({ previewUrl }: { previewUrl: string | null }) {
    return (
        <div className="relative mx-auto grid min-h-32 max-w-sm place-items-center p-4">
            <button type="button" className="rounded-full border border-foreground/20 bg-background px-6 py-3 font-semibold shadow-sm">
                My Board
            </button>
            {previewUrl && (
                <img
                    src={previewUrl}
                    alt=""
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                />
            )}
        </div>
    )
}

function AssetGrid({
    items,
    loading,
    empty,
    assetType,
    onDelete,
    onGift,
    deleting,
}: {
    items: Array<ArtistSticker | ProfileBorder | RoyaltyDesignAsset>
    loading: boolean
    empty: string
    assetType: GiftAssetType
    onDelete: (id: string) => void
    onGift: (item: ArtistSticker | ProfileBorder | RoyaltyDesignAsset) => void
    deleting: boolean
}) {
    if (loading) return <div className="rounded-lg border p-8 text-sm text-muted-foreground">Loading...</div>
    if (items.length === 0) return <div className="rounded-lg border p-8 text-sm text-muted-foreground">{empty}</div>

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-lg border bg-background">
                    <div className="flex h-52 items-center justify-center bg-muted/30 p-4">
                        <img
                            src={storageUrl(item.image_path)!}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain"
                        />
                    </div>
                    <div className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="font-semibold">{item.name}</h2>
                                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                                    {item.description || 'No description.'}
                                </p>
                                {'bundle_name' in item && (
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                        {item.bundle_name && (
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                                                {item.bundle_name}
                                            </span>
                                        )}
                                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300">
                                            {item.is_free ? 'Free' : `${item.credit_cost ?? item.purchase_cost ?? 1} credits`}
                                        </span>
                                    </div>
                                )}
                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    {'is_public' in item && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                                            {item.is_public === false ? 'Private' : 'Public'}
                                        </span>
                                    )}
                                    {'subscription_free' in item && item.subscription_free && (
                                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300">
                                            Subscription
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                onClick={() => onGift(item)}
                                aria-label={`Gift ${item.name}`}
                            >
                                <Gift className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-red-500 hover:text-red-500"
                                onClick={() => onDelete(item.id)}
                                disabled={deleting}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <p className="px-4 pb-4 text-[11px] capitalize text-muted-foreground">
                        {assetType}
                    </p>
                </article>
            ))}
        </div>
    )
}

function RewardsTable({
    rewards,
    loading,
    onEdit,
    onDelete,
    deleting,
}: {
    rewards: SuperLikeAward[]
    loading: boolean
    onEdit: (reward: SuperLikeAward) => void
    onDelete: (id: string) => void
    deleting: boolean
}) {
    if (loading) return <div className="rounded-lg border p-8 text-sm text-muted-foreground">Loading...</div>

    return (
        <div className="overflow-hidden rounded-lg border bg-background">
            <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Icon</th>
                        <th className="px-4 py-3">Credits</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {rewards.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                No rewards yet.
                            </td>
                        </tr>
                    ) : (
                        rewards.map((reward) => (
                            <tr key={reward.id}>
                                <td className="px-4 py-3 font-medium">{reward.name}</td>
                                <td className="px-4 py-3">{reward.icon}</td>
                                <td className="px-4 py-3">{reward.credit_cost}</td>
                                <td className="px-4 py-3">{reward.is_active ? 'active' : 'inactive'}</td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(reward)}>
                                            <Edit className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-500"
                                            onClick={() => onDelete(reward.id)}
                                            disabled={deleting}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}

function PlansTable({
    plans,
    loading,
    onEdit,
}: {
    plans: SubscriptionPlan[]
    loading: boolean
    onEdit: (plan: SubscriptionPlan) => void
}) {
    if (loading) return <div className="rounded-lg border p-8 text-sm text-muted-foreground">Loading...</div>

    return (
        <div className="overflow-hidden rounded-lg border bg-background">
            <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                        <th className="px-4 py-3">Plan</th>
                        <th className="px-4 py-3">Credits</th>
                        <th className="px-4 py-3">Promo</th>
                        <th className="px-4 py-3">Audience</th>
                        <th className="px-4 py-3">Board</th>
                        <th className="px-4 py-3">Boost</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {plans.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                No subscription plans yet.
                            </td>
                        </tr>
                    ) : (
                        plans.map((plan) => (
                            <tr key={plan.id}>
                                <td className="px-4 py-3">
                                    <div className="font-medium">{plan.name}</div>
                                    <div className="text-xs text-muted-foreground">{plan.slug}</div>
                                </td>
                                <td className="px-4 py-3">{plan.monthly_credit_cost}</td>
                                <td className="px-4 py-3">
                                    {plan.promo_credit_cost !== null ? (
                                        <div>
                                            <div className="font-medium">{plan.promo_credit_cost} credits</div>
                                            <div className="text-xs text-muted-foreground">
                                                {plan.promo_active ? 'active' : 'scheduled/inactive'}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 capitalize">
                                    <div>{plan.audience === 'storyteller' ? 'Artist' : 'Wanderer'}</div>
                                    <div className="text-xs text-muted-foreground">{plan.tier_key}</div>
                                </td>
                                <td className="px-4 py-3">
                                    {plan.unlimited_board ? 'Unlimited' : `${plan.board_limit} pieces`}
                                </td>
                                <td className="px-4 py-3">{plan.free_boost_days} days</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                            {plan.is_active ? 'active' : 'inactive'}
                                        </span>
                                        {plan.is_recommended && (
                                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">
                                                recommended
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Button type="button" variant="outline" size="sm" onClick={() => onEdit(plan)}>
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
