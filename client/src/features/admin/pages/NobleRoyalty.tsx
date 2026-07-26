import { useMemo, useState, type CSSProperties, type ChangeEvent, type FormEvent, type PointerEvent, type ReactNode } from 'react'
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
import { LayeredNameText as LiveLayeredNameText, RoyaltyDesignSurface, RoyaltyMessageBackgroundPreview as LiveMessageBackgroundPreview, RoyaltyMessageBubble } from '@/components/royalty/RoyaltyDesignRenderer'
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
type DesignPieceKey =
    | 'top_left'
    | 'top'
    | 'top_right'
    | 'left'
    | 'center'
    | 'right'
    | 'bottom_left'
    | 'bottom'
    | 'bottom_right'

type DesignPieceSettings = {
    id?: string
    label: string
    enabled: boolean
    source_x: number
    source_y: number
    source_w: number
    source_h: number
    x: number
    y: number
    w: number
    h: number
    move_x: number
    move_y: number
    fit_mode: 'cover' | 'stretch' | 'stay'
    position_x: number
    position_y: number
    background_color: string
    border_radius: number
    opacity: number
    rotation: number
    z_index: number
}

type DesignImageLayer = {
    id: string
    name: string
    preview_url: string
    x: number
    y: number
    w: number
    h: number
    fit_mode: 'cover' | 'stretch' | 'stay'
    position_x: number
    position_y: number
    move_x: number
    move_y: number
    rotation: number
    opacity: number
    z_index: number
}

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
    style_settings: DesignStyleSettings
}

type DesignStyleSettings = {
    design_source: 'simple' | 'image' | 'gif'
    simple_theme: 'classic' | 'comic' | 'glass' | 'pixel' | 'svg' | 'image_card'
    simple_tail: 'straight' | 'curve' | 'none'
    simple_accent: string
    simple_received_bg: string
    simple_sent_bg: string
    simple_border_width: number
    simple_border_color: string
    simple_radius: number
    simple_bg_mode: 'color' | 'image'
    simple_bg_image: string
    simple_bg_fit: 'cover' | 'contain' | 'stretch'
    simple_background: string
    font_url: string
    text_transform: 'none' | 'uppercase' | 'lowercase'
    design_mode: 'slice' | 'custom'
    sample_text: string
    font_family: string
    font_size: number
    font_weight: 'normal' | 'medium' | 'bold'
    font_style: 'normal' | 'italic'
    text_align: 'left' | 'center' | 'right'
    content_align_y: 'start' | 'center' | 'end'
    content_x: number
    content_y: number
    content_w: number
    content_h: number
    name_layer: number
    text_layer: number
    content_layer: number
    text_name_combined_layer: boolean
    preview_width: number
    preview_height: number
    fit_mode: 'cover' | 'stretch' | 'stay'
    position_x: number
    position_y: number
    move_x: number
    move_y: number
    slice_top: number
    slice_right: number
    slice_bottom: number
    slice_left: number
    clip_to_parent: boolean
    trim_transparent_padding: boolean
    show_grid: boolean
    allow_overlap: boolean
    custom_parts: Record<DesignPieceKey, DesignPieceSettings>
    custom_extra_pieces: DesignPieceSettings[]
    image_layers: DesignImageLayer[]
}

const DESIGN_PIECES: Array<{ key: DesignPieceKey; label: string; x: number; y: number; w: number; h: number }> = [
    { key: 'top_left', label: 'Top left', x: 0, y: 0, w: 24, h: 24 },
    { key: 'top', label: 'Top side', x: 24, y: 0, w: 312, h: 24 },
    { key: 'top_right', label: 'Top right', x: 336, y: 0, w: 24, h: 24 },
    { key: 'left', label: 'Left side', x: 0, y: 24, w: 24, h: 72 },
    { key: 'center', label: 'Text center', x: 24, y: 24, w: 312, h: 72 },
    { key: 'right', label: 'Right side', x: 336, y: 24, w: 24, h: 72 },
    { key: 'bottom_left', label: 'Bottom left', x: 0, y: 96, w: 24, h: 24 },
    { key: 'bottom', label: 'Bottom side', x: 24, y: 96, w: 312, h: 24 },
    { key: 'bottom_right', label: 'Bottom right', x: 336, y: 96, w: 24, h: 24 },
]

function defaultPiece(seed: (typeof DESIGN_PIECES)[number], width: number, height: number): DesignPieceSettings {
    const scaleX = width / 360
    const scaleY = height / 120

    return {
        label: seed.label,
        enabled: true,
        source_x: Math.round(seed.x * scaleX),
        source_y: Math.round(seed.y * scaleY),
        source_w: Math.max(8, Math.round(seed.w * scaleX)),
        source_h: Math.max(8, Math.round(seed.h * scaleY)),
        x: Math.round(seed.x * scaleX),
        y: Math.round(seed.y * scaleY),
        w: Math.max(8, Math.round(seed.w * scaleX)),
        h: Math.max(8, Math.round(seed.h * scaleY)),
        move_x: 0,
        move_y: 0,
        fit_mode: seed.key === 'center' || seed.key === 'top' || seed.key === 'bottom' || seed.key === 'left' || seed.key === 'right' ? 'stretch' : 'stay',
        position_x: 50,
        position_y: 50,
        background_color: seed.key === 'center' ? 'transparent' : '',
        border_radius: 0,
        opacity: 100,
        rotation: 0,
        z_index: seed.key === 'center' ? 1 : 0,
    }
}

function defaultCustomParts(width = 360, height = 120): Record<DesignPieceKey, DesignPieceSettings> {
    return DESIGN_PIECES.reduce((parts, seed) => {
        parts[seed.key] = defaultPiece(seed, width, height)
        return parts
    }, {} as Record<DesignPieceKey, DesignPieceSettings>)
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
    style_settings: {
        design_source: 'image',
        simple_theme: 'classic',
        simple_tail: 'curve',
        simple_accent: '#7c3aed',
        simple_received_bg: '#e2e8f0',
        simple_sent_bg: '#7c3aed',
        simple_border_width: 0,
        simple_border_color: '#111827',
        simple_radius: 18,
        simple_bg_mode: 'color',
        simple_bg_image: '',
        simple_bg_fit: 'cover',
        simple_background: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
        font_url: '',
        text_transform: 'none',
        design_mode: 'slice',
        sample_text: 'Preview text that can become longer',
        font_family: '',
        font_size: 14,
        font_weight: 'medium',
        font_style: 'normal',
        text_align: 'center',
        content_align_y: 'center',
        content_x: 20,
        content_y: 28,
        content_w: 320,
        content_h: 64,
        name_layer: 4,
        text_layer: 5,
        content_layer: 3,
        text_name_combined_layer: false,
        preview_width: 360,
        preview_height: 120,
        fit_mode: 'stretch',
        position_x: 50,
        position_y: 50,
        move_x: 0,
        move_y: 0,
        slice_top: 24,
        slice_right: 24,
        slice_bottom: 24,
        slice_left: 24,
        clip_to_parent: true,
        trim_transparent_padding: false,
        show_grid: true,
        allow_overlap: true,
        custom_parts: defaultCustomParts(360, 120),
        custom_extra_pieces: [],
        image_layers: [],
    },
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
    const [editingDesignId, setEditingDesignId] = useState<string | null>(null)
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
            if (editingDesignId) return adminArtsApi.updateRoyaltyDesign(editingDesignId, payload)
            return adminArtsApi.createRoyaltyDesign(payload)
        },
        onSuccess: () => {
            toast.success(editingDesignId ? `${singularTitle(tab)} updated.` : `${singularTitle(tab)} added.`)
            queryClient.invalidateQueries({ queryKey: ['admin-royalty-stickers'] })
            queryClient.invalidateQueries({ queryKey: ['page-builder-sticker-library'] })
            queryClient.invalidateQueries({ queryKey: ['admin-profile-borders'] })
            queryClient.invalidateQueries({ queryKey: ['admin-royalty-designs'] })
            setAssetForm((current) => {
                current.preview_urls.forEach((url) => URL.revokeObjectURL(url))
                return EMPTY_ASSET
            })
            setEditingDesignId(null)
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
    const designSources = tab === 'message_designs' ? (['simple', 'image', 'gif'] as const) : (['image', 'gif'] as const)
    const canUseMultipleDesignImages = tab === 'comment_borders' || tab === 'board_buttons'

    const openAddAsset = () => {
        setAssetForm((current) => {
            current.preview_urls.forEach((url) => URL.revokeObjectURL(url))
            return EMPTY_ASSET
        })
        setEditingDesignId(null)
        setAssetOpen(true)
    }

    const openEditDesign = (item: RoyaltyDesignAsset) => {
        setAssetForm((current) => {
            current.preview_urls.forEach((url) => URL.revokeObjectURL(url))
            const imageUrl = item.image_path ? storageUrl(item.image_path) : ''
            return {
                ...EMPTY_ASSET,
                name: item.name,
                description: item.description ?? '',
                publish_public: item.is_public !== false,
                subscription_free: Boolean(item.subscription_free),
                images: [],
                preview_urls: imageUrl ? [imageUrl] : [],
                style_settings: normalizeDesignSettings((item.style_settings ?? {}) as Partial<DesignStyleSettings>),
            }
        })
        setEditingDesignId(item.id)
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
        const needsImage = !designType || !(tab === 'message_designs' && assetForm.style_settings.design_source === 'simple')
        if (assetForm.images.length === 0 && !editingDesignId && needsImage) {
            toast.error('Image is required.')
            return
        }

        if (tab !== 'stickers' && !assetForm.name.trim()) {
            toast.error(needsImage ? 'Name and image are required.' : 'Name is required.')
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
            if (assetForm.images[0]) {
                payload.append('image', assetForm.images[0])
            }
            payload.append('publish_public', assetForm.publish_public ? '1' : '0')
            payload.append('subscription_free', assetForm.subscription_free ? '1' : '0')
            payload.append('style_settings', JSON.stringify(normalizeDesignSettings(assetForm.style_settings)))
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
                    onEdit={(item) => openEditDesign(item as RoyaltyDesignAsset)}
                    deleting={deleteDesign.isPending}
                />
            )}

            <Dialog open={assetOpen} onOpenChange={setAssetOpen}>
                <DialogContent className={designType ? 'sm:max-w-2xl' : undefined}>
                    <form onSubmit={submitAsset}>
                        <DialogHeader>
                            <DialogTitle>{editingDesignId ? 'Edit' : 'Add'} {singularTitle(tab)}</DialogTitle>
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
            {designType && (
                <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
                    <Label>Design source</Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                        {designSources.map((source) => (
                            <button
                                key={source}
                                type="button"
                                className={`rounded-lg border px-3 py-2 text-left text-sm capitalize ${assetForm.style_settings.design_source === source ? 'border-primary bg-primary/10' : 'bg-background'}`}
                                onClick={() =>
                                    setAssetForm((current) => ({
                                        ...current,
                                        style_settings: {
                                            ...current.style_settings,
                                            design_source: source,
                                        },
                                    }))
                                }
                            >
                                {source}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {(!designType || assetForm.style_settings.design_source !== 'simple') && (
                <div className="grid gap-2">
                    <Label>{tab === 'stickers' ? 'Sticker images or GIFs' : assetForm.style_settings.design_source === 'gif' ? 'Animated GIF' : 'Image'}</Label>
                    <Input
                        type="file"
                        accept={assetForm.style_settings.design_source === 'gif' ? 'image/gif' : 'image/png,image/webp,image/jpeg,image/gif'}
                        multiple={tab === 'stickers' || canUseMultipleDesignImages}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setAssetForm((current) => {
                                current.preview_urls.forEach((url) => URL.revokeObjectURL(url))
                                const images = Array.from(event.target.files ?? [])
                                const previewUrls = images.map((file) => URL.createObjectURL(file))
                                return {
                                    ...current,
                                    images,
                                    sticker_names: images.map((file) => stickerNameFromFile(file)),
                                    preview_urls: previewUrls,
                                    style_settings: {
                                        ...current.style_settings,
                                        image_layers: canUseMultipleDesignImages
                                            ? previewUrls.map((url, index) => ({
                                                  id: `upload-${Date.now()}-${index}`,
                                                  name: stickerNameFromFile(images[index]),
                                                  preview_url: url,
                                                  x: 24 + index * 16,
                                                  y: 24 + index * 16,
                                                  w: 120,
                                                  h: 72,
                                                  fit_mode: 'cover',
                                                  position_x: 50,
                                                  position_y: 50,
                                                  move_x: 0,
                                                  move_y: 0,
                                                  rotation: 0,
                                                  opacity: 100,
                                                  z_index: index + 1,
                                              }))
                                            : current.style_settings.image_layers,
                                    },
                                }
                            })
                        }
                    />
                    {(tab === 'stickers' || canUseMultipleDesignImages) && assetForm.images.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                    {assetForm.images.length} file{assetForm.images.length === 1 ? '' : 's'} selected
                        </p>
                    )}
                </div>
            )}
            {canUseMultipleDesignImages && assetForm.style_settings.image_layers.length > 0 && (
                <ImageLayerControls
                    layers={assetForm.style_settings.image_layers}
                    onChange={(image_layers) =>
                        setAssetForm((current) => ({
                            ...current,
                            style_settings: {
                                ...current.style_settings,
                                image_layers,
                            },
                        }))
                    }
                />
            )}
            {designType && (
                <>
                    {tab === 'message_backgrounds' ? (
                        <BackgroundImageControls
                            value={assetForm.style_settings}
                            onChange={(patch) =>
                                setAssetForm((current) => ({
                                    ...current,
                                    style_settings: {
                                        ...current.style_settings,
                                        ...patch,
                                    },
                                }))
                            }
                        />
                    ) : assetForm.style_settings.design_source === 'simple' ? (
                        <SimpleDesignControls
                            value={assetForm.style_settings}
                            onChange={(patch) =>
                                setAssetForm((current) => ({
                                    ...current,
                                    style_settings: {
                                        ...current.style_settings,
                                        ...patch,
                                    },
                                }))
                            }
                        />
                    ) : (
                        <DesignStyleControls
                            value={assetForm.style_settings}
                            onChange={(patch) =>
                                setAssetForm((current) => ({
                                    ...current,
                                    style_settings: {
                                        ...current.style_settings,
                                        ...patch,
                                    },
                                }))
                            }
                        />
                    )}
                    <DesignPreview
                        tab={tab}
                                        previewUrl={assetForm.preview_urls[0] ?? null}
                                        settings={assetForm.style_settings}
                                        onChange={(patch) =>
                                            setAssetForm((current) => ({
                                                ...current,
                                                style_settings: {
                                                    ...current.style_settings,
                                                    ...patch,
                                                },
                                            }))
                                        }
                                    />
                                </>
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
    if (tab === 'message_backgrounds') return 'Message Background'
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

function clampNumber(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function normalizePiece(
    raw: boolean | Partial<DesignPieceSettings> | undefined,
    seed: (typeof DESIGN_PIECES)[number],
    width: number,
    height: number
): DesignPieceSettings {
    const fallback = defaultPiece(seed, width, height)
    if (typeof raw === 'boolean') return { ...fallback, enabled: raw }
    if (!raw || typeof raw !== 'object') return fallback

    return {
        ...fallback,
        ...raw,
        label: raw.label || fallback.label,
        enabled: raw.enabled ?? true,
        source_x: Number.isFinite(raw.source_x) ? Number(raw.source_x) : fallback.source_x,
        source_y: Number.isFinite(raw.source_y) ? Number(raw.source_y) : fallback.source_y,
        source_w: Math.max(1, Number.isFinite(raw.source_w) ? Number(raw.source_w) : fallback.source_w),
        source_h: Math.max(1, Number.isFinite(raw.source_h) ? Number(raw.source_h) : fallback.source_h),
        x: Number.isFinite(raw.x) ? Number(raw.x) : fallback.x,
        y: Number.isFinite(raw.y) ? Number(raw.y) : fallback.y,
        w: Math.max(1, Number.isFinite(raw.w) ? Number(raw.w) : fallback.w),
        h: Math.max(1, Number.isFinite(raw.h) ? Number(raw.h) : fallback.h),
        rotation: Number.isFinite(raw.rotation) ? Number(raw.rotation) : fallback.rotation,
        opacity: clampNumber(Number.isFinite(raw.opacity) ? Number(raw.opacity) : fallback.opacity, 0, 100),
        z_index: Number.isFinite(raw.z_index) ? Number(raw.z_index) : fallback.z_index,
    }
}

function normalizeDesignSettings(value: Partial<DesignStyleSettings>): DesignStyleSettings {
    const preview_width = Number.isFinite(value.preview_width) ? Number(value.preview_width) : EMPTY_ASSET.style_settings.preview_width
    const preview_height = Number.isFinite(value.preview_height) ? Number(value.preview_height) : EMPTY_ASSET.style_settings.preview_height
    const rawParts = (value.custom_parts ?? {}) as Partial<Record<DesignPieceKey, boolean | Partial<DesignPieceSettings>>>
    const parts = DESIGN_PIECES.reduce((next, seed) => {
        next[seed.key] = normalizePiece(rawParts[seed.key], seed, preview_width, preview_height)
        return next
    }, {} as Record<DesignPieceKey, DesignPieceSettings>)

    return {
        ...EMPTY_ASSET.style_settings,
        ...value,
        preview_width,
        preview_height,
        custom_parts: parts,
        custom_extra_pieces: (value.custom_extra_pieces ?? []).map((piece, index) => ({
            ...defaultPiece({ key: 'center', label: `Extra ${index + 1}`, x: 24, y: 24, w: 96, h: 48 }, preview_width, preview_height),
            ...piece,
            id: piece.id ?? `extra-${index + 1}`,
            label: piece.label || `Extra ${index + 1}`,
        })),
        image_layers: (value.image_layers ?? []).map((layer, index) => ({
            id: layer.id ?? `layer-${index + 1}`,
            name: layer.name || `Image ${index + 1}`,
            preview_url: layer.preview_url || '',
            x: Number.isFinite(layer.x) ? Number(layer.x) : 24 + index * 16,
            y: Number.isFinite(layer.y) ? Number(layer.y) : 24 + index * 16,
            w: Math.max(1, Number.isFinite(layer.w) ? Number(layer.w) : 120),
            h: Math.max(1, Number.isFinite(layer.h) ? Number(layer.h) : 72),
            fit_mode: layer.fit_mode ?? 'cover',
            position_x: Number.isFinite(layer.position_x) ? Number(layer.position_x) : 50,
            position_y: Number.isFinite(layer.position_y) ? Number(layer.position_y) : 50,
            move_x: Number.isFinite(layer.move_x) ? Number(layer.move_x) : 0,
            move_y: Number.isFinite(layer.move_y) ? Number(layer.move_y) : 0,
            rotation: Number.isFinite(layer.rotation) ? Number(layer.rotation) : 0,
            opacity: clampNumber(Number.isFinite(layer.opacity) ? Number(layer.opacity) : 100, 0, 100),
            z_index: Number.isFinite(layer.z_index) ? Number(layer.z_index) : index + 1,
        })),
    }
}

function draftDesignAsset(type: RoyaltyDesignType, settings: DesignStyleSettings, previewUrl: string | null): RoyaltyDesignAsset {
    return {
        id: 'draft',
        type,
        name: 'Draft preview',
        description: null,
        image_path: previewUrl ?? null,
        style_settings: settings,
        is_active: true,
        is_public: true,
        subscription_free: false,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
}

function SimpleDesignControls({
    value,
    onChange,
}: {
    value: DesignStyleSettings
    onChange: (patch: Partial<DesignStyleSettings>) => void
}) {
    return (
        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
            <Label>Simple design</Label>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                    <Label>Theme</Label>
                    <select
                        value={value.simple_theme}
                        onChange={(event) => onChange({ simple_theme: event.target.value as DesignStyleSettings['simple_theme'] })}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="classic">Classic Rounded</option>
                        <option value="comic">Comic Bubble</option>
                        <option value="glass">Glassmorphism</option>
                        <option value="pixel">Pixel / Game UI</option>
                        <option value="svg">SVG Shape</option>
                        <option value="image_card">Image Texture</option>
                    </select>
                </div>
                <div className="grid gap-1.5">
                    <Label>Sample text</Label>
                    <Input value={value.sample_text} onChange={(event) => onChange({ sample_text: event.target.value })} />
                </div>
                <div className="grid gap-1.5">
                    <Label>Tail</Label>
                    <select
                        value={value.simple_tail}
                        onChange={(event) => onChange({ simple_tail: event.target.value as DesignStyleSettings['simple_tail'] })}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="curve">Curve</option>
                        <option value="straight">Straight</option>
                        <option value="none">None</option>
                    </select>
                </div>
                <div className="grid gap-1.5">
                    <Label>Accent color</Label>
                    <Input type="color" value={value.simple_accent} onChange={(event) => onChange({ simple_accent: event.target.value })} />
                </div>
                <div className="grid gap-1.5">
                    <Label>Received background</Label>
                    <Input value={value.simple_received_bg} onChange={(event) => onChange({ simple_received_bg: event.target.value })} />
                </div>
                <div className="grid gap-1.5">
                    <Label>Sent background</Label>
                    <Input value={value.simple_sent_bg} onChange={(event) => onChange({ simple_sent_bg: event.target.value })} />
                </div>
                <div className="grid gap-1.5">
                    <Label>Bubble background</Label>
                    <select
                        value={value.simple_bg_mode}
                        onChange={(event) => onChange({ simple_bg_mode: event.target.value as DesignStyleSettings['simple_bg_mode'] })}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="color">Color</option>
                        <option value="image">Image URL</option>
                    </select>
                </div>
                {value.simple_bg_mode === 'image' && (
                    <>
                        <div className="grid gap-1.5">
                            <Label>Bubble image URL</Label>
                            <Input value={value.simple_bg_image} onChange={(event) => onChange({ simple_bg_image: event.target.value })} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Bubble image fit</Label>
                            <select
                                value={value.simple_bg_fit}
                                onChange={(event) => onChange({ simple_bg_fit: event.target.value as DesignStyleSettings['simple_bg_fit'] })}
                                className="h-10 rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="cover">Cover</option>
                                <option value="contain">Contain</option>
                                <option value="stretch">Stretch</option>
                            </select>
                        </div>
                    </>
                )}
                <NumberSetting label="Border width" value={value.simple_border_width} min={0} max={16} onChange={(simple_border_width) => onChange({ simple_border_width })} />
                <div className="grid gap-1.5">
                    <Label>Border color</Label>
                    <Input type="color" value={value.simple_border_color} onChange={(event) => onChange({ simple_border_color: event.target.value })} />
                </div>
                <NumberSetting label="Border radius" value={value.simple_radius} min={0} max={64} onChange={(simple_radius) => onChange({ simple_radius })} />
                <div className="grid gap-1.5">
                    <Label>Page/message background</Label>
                    <Input value={value.simple_background} onChange={(event) => onChange({ simple_background: event.target.value })} />
                </div>
                <div className="grid gap-1.5">
                    <Label>Font family</Label>
                    <Input value={value.font_family} placeholder="Inter, sans-serif" onChange={(event) => onChange({ font_family: event.target.value })} />
                </div>
                <div className="grid gap-1.5">
                    <Label>Font URL</Label>
                    <Input value={value.font_url} placeholder="https://fonts.googleapis.com/css2?family=Comic+Relief..." onChange={(event) => onChange({ font_url: event.target.value })} />
                </div>
                <NumberSetting label="Font size" value={value.font_size} min={8} max={48} onChange={(font_size) => onChange({ font_size })} />
                <div className="grid gap-1.5">
                    <Label>Text case</Label>
                    <select
                        value={value.text_transform}
                        onChange={(event) => onChange({ text_transform: event.target.value as DesignStyleSettings['text_transform'] })}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="none">Normal</option>
                        <option value="uppercase">All capital</option>
                        <option value="lowercase">All small letters</option>
                    </select>
                </div>
            </div>
        </div>
    )
}

function BackgroundImageControls({
    value,
    onChange,
}: {
    value: DesignStyleSettings
    onChange: (patch: Partial<DesignStyleSettings>) => void
}) {
    return (
        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
            <Label>Message background cover</Label>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                    <Label>Fit</Label>
                    <select
                        value={value.fit_mode}
                        onChange={(event) => onChange({ fit_mode: event.target.value as DesignStyleSettings['fit_mode'] })}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="cover">Cover</option>
                        <option value="stretch">Stretch</option>
                        <option value="stay">Stay natural size</option>
                    </select>
                </div>
                <NumberSetting label="Preview width" value={value.preview_width} min={280} max={900} onChange={(preview_width) => onChange({ preview_width })} />
                <NumberSetting label="Preview height" value={value.preview_height} min={140} max={420} onChange={(preview_height) => onChange({ preview_height })} />
                <NumberSetting label="Position X %" value={value.position_x} min={0} max={100} onChange={(position_x) => onChange({ position_x })} />
                <NumberSetting label="Position Y %" value={value.position_y} min={0} max={100} onChange={(position_y) => onChange({ position_y })} />
                <NumberSetting label="Move X" value={value.move_x} min={-500} max={500} onChange={(move_x) => onChange({ move_x })} />
                <NumberSetting label="Move Y" value={value.move_y} min={-500} max={500} onChange={(move_y) => onChange({ move_y })} />
            </div>
        </div>
    )
}

function ImageLayerControls({
    layers,
    onChange,
}: {
    layers: DesignImageLayer[]
    onChange: (layers: DesignImageLayer[]) => void
}) {
    const updateLayer = (index: number, patch: Partial<DesignImageLayer>) => {
        onChange(layers.map((layer, layerIndex) => (layerIndex === index ? { ...layer, ...patch } : layer)))
    }

    return (
        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
            <Label>Image canvas layers</Label>
            <div className="grid gap-3">
                {layers.map((layer, index) => (
                    <div key={layer.id} className="grid gap-3 rounded-md border bg-background/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 overflow-hidden rounded border bg-muted">
                                    <img src={layer.preview_url} alt="" className="h-full w-full object-contain" />
                                </div>
                                <Input value={layer.name} onChange={(event) => updateLayer(index, { name: event.target.value })} />
                            </div>
                            <Button type="button" size="sm" variant="outline" onClick={() => onChange(layers.filter((_, layerIndex) => layerIndex !== index))}>
                                Delete
                            </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <NumberSetting label="X" value={layer.x} min={-800} max={1600} onChange={(x) => updateLayer(index, { x })} />
                            <NumberSetting label="Y" value={layer.y} min={-800} max={1200} onChange={(y) => updateLayer(index, { y })} />
                            <NumberSetting label="Width" value={layer.w} min={1} max={1600} onChange={(w) => updateLayer(index, { w })} />
                            <NumberSetting label="Height" value={layer.h} min={1} max={1200} onChange={(h) => updateLayer(index, { h })} />
                            <div className="grid gap-1.5 text-sm">
                                <Label>Fit</Label>
                                <select value={layer.fit_mode} onChange={(event) => updateLayer(index, { fit_mode: event.target.value as DesignImageLayer['fit_mode'] })} className="h-10 rounded-md border bg-background px-3 text-sm">
                                    <option value="cover">Cover</option>
                                    <option value="stretch">Stretch</option>
                                    <option value="stay">Stay</option>
                                </select>
                            </div>
                            <NumberSetting label="Image X %" value={layer.position_x} min={0} max={100} onChange={(position_x) => updateLayer(index, { position_x })} />
                            <NumberSetting label="Image Y %" value={layer.position_y} min={0} max={100} onChange={(position_y) => updateLayer(index, { position_y })} />
                            <NumberSetting label="Rotate" value={layer.rotation} min={-360} max={360} onChange={(rotation) => updateLayer(index, { rotation })} />
                            <NumberSetting label="Opacity" value={layer.opacity} min={0} max={100} onChange={(opacity) => updateLayer(index, { opacity })} />
                            <NumberSetting label="Layer" value={layer.z_index} min={-50} max={100} onChange={(z_index) => updateLayer(index, { z_index })} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function DesignStyleControls({
    value,
    onChange,
}: {
    value: DesignStyleSettings
    onChange: (patch: Partial<DesignStyleSettings>) => void
}) {
    const [selectedPiece, setSelectedPiece] = useState<DesignPieceKey | `extra:${number}`>('center')
    const updatePart = (key: DesignPieceKey, patch: Partial<DesignPieceSettings>) => {
        onChange({
            custom_parts: {
                ...value.custom_parts,
                [key]: {
                    ...value.custom_parts[key],
                    ...patch,
                },
            },
        })
    }
    const updateExtra = (index: number, patch: Partial<DesignPieceSettings>) => {
        onChange({
            custom_extra_pieces: value.custom_extra_pieces.map((piece, pieceIndex) =>
                pieceIndex === index ? { ...piece, ...patch } : piece
            ),
        })
    }
    const addExtraPiece = () => {
        const nextIndex = value.custom_extra_pieces.length + 1
        onChange({
            custom_extra_pieces: [
                ...value.custom_extra_pieces,
                {
                    id: `extra-${Date.now()}`,
                    label: `Extra ${nextIndex}`,
                    enabled: true,
                    source_x: 32,
                    source_y: 32,
                    source_w: 96,
                    source_h: 48,
                    x: 32,
                    y: 32,
                    w: 96,
                    h: 48,
                    move_x: 0,
                    move_y: 0,
                    fit_mode: 'stay',
                    position_x: 50,
                    position_y: 50,
                    background_color: 'transparent',
                    border_radius: 0,
                    opacity: 100,
                    rotation: 0,
                    z_index: nextIndex + 2,
                },
            ],
        })
        setSelectedPiece(`extra:${value.custom_extra_pieces.length}`)
    }

    const selectedExtraIndex = typeof selectedPiece === 'string' && selectedPiece.startsWith('extra:')
        ? Number(selectedPiece.split(':')[1])
        : -1
    const selectedPart =
        selectedExtraIndex >= 0
            ? value.custom_extra_pieces[selectedExtraIndex]
            : value.custom_parts[selectedPiece as DesignPieceKey]

    return (
        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
            <Label>Design behavior</Label>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                    <Label>Design mode</Label>
                    <select
                        value={value.design_mode}
                        onChange={(event) =>
                            onChange({ design_mode: event.target.value as DesignStyleSettings['design_mode'] })
                        }
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="slice">Slice stretch</option>
                        <option value="custom">Custom pieces</option>
                    </select>
                </div>
                <div className="grid gap-1.5">
                    <Label>Sample text</Label>
                    <Input
                        value={value.sample_text}
                        onChange={(event) => onChange({ sample_text: event.target.value })}
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label>Fit</Label>
                    <select
                        value={value.fit_mode}
                        onChange={(event) =>
                            onChange({ fit_mode: event.target.value as DesignStyleSettings['fit_mode'] })
                        }
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="stretch">Stretch</option>
                        <option value="cover">Cover</option>
                        <option value="stay">Stay</option>
                    </select>
                </div>
                <div className="grid gap-1.5">
                    <Label>Font family</Label>
                    <Input
                        value={value.font_family}
                        placeholder="Comic Relief, Inter, sans-serif"
                        onChange={(event) => onChange({ font_family: event.target.value })}
                    />
                </div>
                <NumberSetting label="Font size" value={value.font_size} min={8} max={48} onChange={(font_size) => onChange({ font_size })} />
                <div className="grid gap-1.5">
                    <Label>Font weight</Label>
                    <select
                        value={value.font_weight}
                        onChange={(event) =>
                            onChange({ font_weight: event.target.value as DesignStyleSettings['font_weight'] })
                        }
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="normal">Normal</option>
                        <option value="medium">Medium</option>
                        <option value="bold">Bold</option>
                    </select>
                </div>
                <div className="grid gap-1.5">
                    <Label>Font style</Label>
                    <select
                        value={value.font_style}
                        onChange={(event) =>
                            onChange({ font_style: event.target.value as DesignStyleSettings['font_style'] })
                        }
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="normal">Normal</option>
                        <option value="italic">Italic</option>
                    </select>
                </div>
                <div className="grid gap-1.5">
                    <Label>Text align</Label>
                    <select
                        value={value.text_align}
                        onChange={(event) =>
                            onChange({ text_align: event.target.value as DesignStyleSettings['text_align'] })
                        }
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="left">Start</option>
                        <option value="center">Center</option>
                        <option value="right">End</option>
                    </select>
                </div>
                <NumberSetting label="Preview width" value={value.preview_width} min={120} max={900} onChange={(preview_width) => onChange({ preview_width })} />
                <NumberSetting label="Preview height" value={value.preview_height} min={48} max={420} onChange={(preview_height) => onChange({ preview_height })} />
                <NumberSetting label="Position X %" value={value.position_x} min={0} max={100} onChange={(position_x) => onChange({ position_x })} />
                <NumberSetting label="Position Y %" value={value.position_y} min={0} max={100} onChange={(position_y) => onChange({ position_y })} />
                <NumberSetting label="Move X" value={value.move_x} min={-240} max={240} onChange={(move_x) => onChange({ move_x })} />
                <NumberSetting label="Move Y" value={value.move_y} min={-240} max={240} onChange={(move_y) => onChange({ move_y })} />
                <NumberSetting label="Content layer" value={value.content_layer} min={-20} max={80} onChange={(content_layer) => onChange({ content_layer })} />
                <NumberSetting label="Name layer" value={value.name_layer} min={-20} max={80} onChange={(name_layer) => onChange({ name_layer })} />
                <NumberSetting label="Text layer" value={value.text_layer} min={-20} max={80} onChange={(text_layer) => onChange({ text_layer })} />
                <label className="flex items-center gap-2 self-end text-sm">
                    <input
                        type="checkbox"
                        checked={value.text_name_combined_layer}
                        onChange={(event) => onChange({ text_name_combined_layer: event.target.checked })}
                    />
                    Name + text use one layer
                </label>
            </div>
            <div className="grid gap-3 rounded-md border bg-background/60 p-3 sm:grid-cols-4">
                <NumberSetting label="Slice top" value={value.slice_top} min={0} max={160} onChange={(slice_top) => onChange({ slice_top })} />
                <NumberSetting label="Slice right" value={value.slice_right} min={0} max={160} onChange={(slice_right) => onChange({ slice_right })} />
                <NumberSetting label="Slice bottom" value={value.slice_bottom} min={0} max={160} onChange={(slice_bottom) => onChange({ slice_bottom })} />
                <NumberSetting label="Slice left" value={value.slice_left} min={0} max={160} onChange={(slice_left) => onChange({ slice_left })} />
            </div>
            {(value.design_mode === 'custom' || value.design_mode === 'slice') && (
                <div className="grid gap-2 rounded-md border bg-background/60 p-3">
                    <Label>{value.design_mode === 'slice' ? 'Slice piece behavior' : 'Custom pieces'}</Label>
                    <div className="flex flex-wrap gap-2 text-xs">
                        {DESIGN_PIECES.map((piece) => (
                            <button
                                key={piece.key}
                                type="button"
                                onClick={() => setSelectedPiece(piece.key)}
                                className={`rounded-md border px-2.5 py-1.5 ${selectedPiece === piece.key ? 'border-primary bg-primary/10' : 'bg-background'}`}
                            >
                                {value.custom_parts[piece.key].enabled ? '' : 'Hidden: '}
                                {value.custom_parts[piece.key].label}
                            </button>
                        ))}
                        {value.design_mode === 'custom' && (
                            <>
                                {value.custom_extra_pieces.map((piece, index) => (
                                    <button
                                        key={piece.id ?? index}
                                        type="button"
                                        onClick={() => setSelectedPiece(`extra:${index}`)}
                                        className={`rounded-md border px-2.5 py-1.5 ${selectedPiece === `extra:${index}` ? 'border-primary bg-primary/10' : 'bg-background'}`}
                                    >
                                        {piece.enabled ? '' : 'Hidden: '}
                                        {piece.label}
                                    </button>
                                ))}
                                <Button type="button" size="sm" variant="outline" onClick={addExtraPiece}>
                                    Add piece
                                </Button>
                            </>
                        )}
                    </div>
                    {selectedPart && (
                        <PieceSettingsPanel
                            piece={selectedPart}
                            isExtra={selectedExtraIndex >= 0}
                            onChange={(patch) =>
                                selectedExtraIndex >= 0
                                    ? updateExtra(selectedExtraIndex, patch)
                                    : updatePart(selectedPiece as DesignPieceKey, patch)
                            }
                            onDelete={
                                selectedExtraIndex >= 0
                                    ? () => {
                                          onChange({
                                              custom_extra_pieces: value.custom_extra_pieces.filter((_, index) => index !== selectedExtraIndex),
                                          })
                                          setSelectedPiece('center')
                                      }
                                    : undefined
                            }
                        />
                    )}
                    <p className="text-xs text-muted-foreground">
                        {value.design_mode === 'slice'
                            ? 'Set each slice to Stretch, Cover, or Stay. Corners usually look best as Stay; the center can Stretch.'
                            : 'The center piece is the text/content area. Other pieces decorate around it and can be moved, resized, or hidden.'}
                    </p>
                </div>
            )}
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={value.show_grid}
                    onChange={(event) => onChange({ show_grid: event.target.checked })}
                />
                Show design grid
            </label>
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={value.allow_overlap}
                    onChange={(event) => onChange({ allow_overlap: event.target.checked })}
                />
                Allow pieces to overlap
            </label>
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={value.clip_to_parent}
                    onChange={(event) => onChange({ clip_to_parent: event.target.checked })}
                />
                Clip image/GIF inside parent width and height
            </label>
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={value.trim_transparent_padding}
                    onChange={(event) => onChange({ trim_transparent_padding: event.target.checked })}
                />
                Treat transparent padding as visual trim
            </label>
        </div>
    )
}

function NumberSetting({
    label,
    value,
    min,
    max,
    onChange,
}: {
    label: string
    value: number
    min: number
    max: number
    onChange: (value: number) => void
}) {
    return (
        <label className="grid gap-1.5 text-sm">
            <span>{label}</span>
            <Input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(Number(event.target.value) || 0)}
            />
        </label>
    )
}

function PieceSettingsPanel({
    piece,
    isExtra,
    onChange,
    onDelete,
}: {
    piece: DesignPieceSettings
    isExtra: boolean
    onChange: (patch: Partial<DesignPieceSettings>) => void
    onDelete?: () => void
}) {
    return (
        <div className="grid gap-3 rounded-md border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                        type="checkbox"
                        checked={piece.enabled}
                        onChange={(event) => onChange({ enabled: event.target.checked })}
                    />
                    Show piece
                </label>
                {onDelete && (
                    <Button type="button" size="sm" variant="outline" onClick={onDelete}>
                        Delete piece
                    </Button>
                )}
                {!onDelete && (
                    <Button type="button" size="sm" variant="outline" onClick={() => onChange({ enabled: false })}>
                        Hide piece
                    </Button>
                )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-1.5 text-sm">
                    <span>Name</span>
                    <Input value={piece.label} onChange={(event) => onChange({ label: event.target.value })} />
                </label>
                <label className="grid gap-1.5 text-sm">
                    <span>Fit</span>
                    <select
                        value={piece.fit_mode}
                        onChange={(event) => onChange({ fit_mode: event.target.value as DesignPieceSettings['fit_mode'] })}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="stretch">Stretch</option>
                        <option value="cover">Cover</option>
                        <option value="stay">Stay</option>
                    </select>
                </label>
                <label className="grid gap-1.5 text-sm">
                    <span>Background color</span>
                    <Input
                        value={piece.background_color}
                        placeholder="transparent or #ffffff"
                        onChange={(event) => onChange({ background_color: event.target.value })}
                    />
                </label>
                <NumberSetting label="Layer" value={piece.z_index} min={-20} max={50} onChange={(z_index) => onChange({ z_index })} />
                <NumberSetting label="Cut X" value={piece.source_x} min={0} max={1400} onChange={(source_x) => onChange({ source_x })} />
                <NumberSetting label="Cut Y" value={piece.source_y} min={0} max={900} onChange={(source_y) => onChange({ source_y })} />
                <NumberSetting label="Cut Width" value={piece.source_w} min={1} max={1400} onChange={(source_w) => onChange({ source_w })} />
                <NumberSetting label="Cut Height" value={piece.source_h} min={1} max={900} onChange={(source_h) => onChange({ source_h })} />
                <NumberSetting label="X" value={piece.x} min={-500} max={1000} onChange={(x) => onChange({ x })} />
                <NumberSetting label="Y" value={piece.y} min={-500} max={1000} onChange={(y) => onChange({ y })} />
                <NumberSetting label="Width" value={piece.w} min={1} max={1400} onChange={(w) => onChange({ w })} />
                <NumberSetting label="Height" value={piece.h} min={1} max={900} onChange={(h) => onChange({ h })} />
                <NumberSetting label="Move X" value={piece.move_x} min={-500} max={500} onChange={(move_x) => onChange({ move_x })} />
                <NumberSetting label="Move Y" value={piece.move_y} min={-500} max={500} onChange={(move_y) => onChange({ move_y })} />
                <NumberSetting label="Image X %" value={piece.position_x} min={0} max={100} onChange={(position_x) => onChange({ position_x })} />
                <NumberSetting label="Image Y %" value={piece.position_y} min={0} max={100} onChange={(position_y) => onChange({ position_y })} />
                <NumberSetting label="Radius" value={piece.border_radius} min={0} max={120} onChange={(border_radius) => onChange({ border_radius })} />
                <NumberSetting label="Rotate" value={piece.rotation} min={-360} max={360} onChange={(rotation) => onChange({ rotation })} />
                <NumberSetting label="Opacity" value={piece.opacity} min={0} max={100} onChange={(opacity) => onChange({ opacity })} />
            </div>
            {isExtra && (
                <p className="text-xs text-muted-foreground">
                    Extra pieces can be placed anywhere on top of or behind the main frame.
                </p>
            )}
        </div>
    )
}

function DesignPreview({
    tab,
    previewUrl,
    settings,
    onChange,
}: {
    tab: Tab
    previewUrl: string | null
    settings: DesignStyleSettings
    onChange: (patch: Partial<DesignStyleSettings>) => void
}) {
    const [zoom, setZoom] = useState(1.5)

    return (
        <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-3">
                <Label>Preview before saving</Label>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {previewUrl ? 'Using selected file' : 'Default preview'}
                    </span>
                    {[1, 1.5, 2].map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setZoom(value)}
                            className={`rounded border px-2 py-1 text-[11px] ${zoom === value ? 'border-primary bg-primary/10' : 'bg-background'}`}
                        >
                            {Math.round(value * 100)}%
                        </button>
                    ))}
                </div>
            </div>
            <div className="max-h-[520px] overflow-auto rounded-lg border bg-[linear-gradient(45deg,var(--muted)_25%,transparent_25%),linear-gradient(-45deg,var(--muted)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,var(--muted)_75%),linear-gradient(-45deg,transparent_75%,var(--muted)_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0] p-6">
                <div
                    className="mx-auto origin-top-left"
                    style={{
                        width: settings.preview_width * zoom,
                        height: settings.preview_height * zoom,
                    }}
                >
                    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                        {tab === 'comment_borders' && (
                            <CommentDesignPreview previewUrl={previewUrl} settings={settings} onChange={onChange} />
                        )}
                        {tab === 'message_designs' && (
                            <MessageDesignPreview previewUrl={previewUrl} settings={settings} onChange={onChange} />
                        )}
                        {tab === 'message_backgrounds' && (
                            <MessageBackgroundPreview previewUrl={previewUrl} settings={settings} />
                        )}
                        {tab === 'board_buttons' && (
                            <BoardButtonDesignPreview previewUrl={previewUrl} settings={settings} onChange={onChange} />
                        )}
                    </div>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                Drag purple lines to set slices. Drag green pieces to place custom parts.
            </p>
        </div>
    )
}

function SliceEditorOverlay({
    settings,
    onChange,
}: {
    settings: DesignStyleSettings
    onChange: (patch: Partial<DesignStyleSettings>) => void
}) {
    const maxX = Math.max(0, settings.preview_width)
    const maxY = Math.max(0, settings.preview_height)
    const left = clampNumber(settings.slice_left, 0, maxX)
    const right = clampNumber(settings.slice_right, 0, maxX)
    const top = clampNumber(settings.slice_top, 0, maxY)
    const bottom = clampNumber(settings.slice_bottom, 0, maxY)

    const beginDrag = (event: PointerEvent<HTMLButtonElement>, edge: 'top' | 'right' | 'bottom' | 'left') => {
        event.preventDefault()
        event.stopPropagation()
        const rect = event.currentTarget.parentElement?.getBoundingClientRect()
        if (!rect) return

        const handleMove = (moveEvent: globalThis.PointerEvent) => {
            const x = clampNumber(moveEvent.clientX - rect.left, 0, rect.width)
            const y = clampNumber(moveEvent.clientY - rect.top, 0, rect.height)

            if (edge === 'left') {
                onChange({ slice_left: Math.round((x / rect.width) * settings.preview_width) })
            }

            if (edge === 'right') {
                onChange({ slice_right: Math.round(((rect.width - x) / rect.width) * settings.preview_width) })
            }

            if (edge === 'top') {
                onChange({ slice_top: Math.round((y / rect.height) * settings.preview_height) })
            }

            if (edge === 'bottom') {
                onChange({ slice_bottom: Math.round(((rect.height - y) / rect.height) * settings.preview_height) })
            }
        }

        window.addEventListener('pointermove', handleMove)
        window.addEventListener(
            'pointerup',
            () => {
                window.removeEventListener('pointermove', handleMove)
            },
            { once: true }
        )
    }

    return (
        <div className="pointer-events-none absolute inset-0 z-40">
            <button
                type="button"
                className="pointer-events-auto absolute left-0 right-0 h-1 cursor-ns-resize bg-purple-700 shadow-[0_0_0_1px_white]"
                style={{ top }}
                onPointerDown={(event) => beginDrag(event, 'top')}
                aria-label="Drag top slice"
                title="Top slice"
            />
            <button
                type="button"
                className="pointer-events-auto absolute left-0 right-0 h-1 cursor-ns-resize bg-purple-700 shadow-[0_0_0_1px_white]"
                style={{ bottom }}
                onPointerDown={(event) => beginDrag(event, 'bottom')}
                aria-label="Drag bottom slice"
                title="Bottom slice"
            />
            <button
                type="button"
                className="pointer-events-auto absolute bottom-0 top-0 w-1 cursor-ew-resize bg-purple-700 shadow-[0_0_0_1px_white]"
                style={{ left }}
                onPointerDown={(event) => beginDrag(event, 'left')}
                aria-label="Drag left slice"
                title="Left slice"
            />
            <button
                type="button"
                className="pointer-events-auto absolute bottom-0 top-0 w-1 cursor-ew-resize bg-purple-700 shadow-[0_0_0_1px_white]"
                style={{ right }}
                onPointerDown={(event) => beginDrag(event, 'right')}
                aria-label="Drag right slice"
                title="Right slice"
            />
            <span className="absolute left-1 top-1 rounded bg-purple-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                slice
            </span>
        </div>
    )
}

function DesignGridOverlay({ settings }: { settings: DesignStyleSettings }) {
    if (!settings.show_grid) return null

    return (
        <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
                backgroundImage:
                    'linear-gradient(to right, rgba(34,197,94,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,197,94,0.28) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
            }}
        />
    )
}

function designTextStyle(settings: DesignStyleSettings) {
    return {
        fontFamily: settings.font_family || undefined,
        fontSize: settings.font_size,
        fontWeight:
            settings.font_weight === 'bold'
                ? 700
                : settings.font_weight === 'medium'
                  ? 500
                  : 400,
        fontStyle: settings.font_style,
        textAlign: settings.text_align,
    } as const
}

function CustomPiecesOverlay({
    settings,
    previewUrl,
    onChange,
    children,
}: {
    settings: DesignStyleSettings
    previewUrl: string | null
    onChange: (patch: Partial<DesignStyleSettings>) => void
    children?: ReactNode
}) {
    if (settings.design_mode !== 'custom') return null

    const center = settings.custom_parts.center
    const beginPieceDrag = (
        event: PointerEvent<HTMLDivElement>,
        piece: DesignPieceSettings,
        ref: DesignPieceKey | `extra:${number}`
    ) => {
        event.preventDefault()
        event.stopPropagation()
        const canvas = event.currentTarget.parentElement?.getBoundingClientRect()
        if (!canvas) return
        const startOffsetX = (event.clientX - canvas.left) / canvas.width * settings.preview_width - piece.x
        const startOffsetY = (event.clientY - canvas.top) / canvas.height * settings.preview_height - piece.y

        const handleMove = (moveEvent: globalThis.PointerEvent) => {
            const x = (moveEvent.clientX - canvas.left) / canvas.width * settings.preview_width - startOffsetX
            const y = (moveEvent.clientY - canvas.top) / canvas.height * settings.preview_height - startOffsetY
            const nextX = Math.round(settings.allow_overlap ? x : clampNumber(x, 0, settings.preview_width - piece.w))
            const nextY = Math.round(settings.allow_overlap ? y : clampNumber(y, 0, settings.preview_height - piece.h))

            if (typeof ref === 'string' && ref.startsWith('extra:')) {
                const index = Number(ref.split(':')[1])
                onChange({
                    custom_extra_pieces: settings.custom_extra_pieces.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, x: nextX, y: nextY } : item
                    ),
                })
                return
            }

            onChange({
                custom_parts: {
                    ...settings.custom_parts,
                    [ref]: {
                        ...settings.custom_parts[ref as DesignPieceKey],
                        x: nextX,
                        y: nextY,
                    },
                },
            })
        }

        window.addEventListener('pointermove', handleMove)
        window.addEventListener(
            'pointerup',
            () => {
                window.removeEventListener('pointermove', handleMove)
            },
            { once: true }
        )
    }

    return (
        <div className="absolute inset-0 z-30">
            {DESIGN_PIECES.map((seed) => (
                <DesignPieceView
                    key={seed.key}
                    piece={settings.custom_parts[seed.key]}
                    settings={settings}
                    previewUrl={previewUrl}
                    onPointerDown={(event) => beginPieceDrag(event, settings.custom_parts[seed.key], seed.key)}
                />
            ))}
            {settings.custom_extra_pieces.map((piece, index) => (
                <DesignPieceView
                    key={piece.id ?? `${piece.label}-${index}`}
                    piece={piece}
                    settings={settings}
                    previewUrl={previewUrl}
                    onPointerDown={(event) => beginPieceDrag(event, piece, `extra:${index}`)}
                />
            ))}
            {center.enabled && (
                <div
                    className="pointer-events-none absolute grid min-h-0 min-w-0"
                    style={{
                        left: center.x,
                        top: center.y,
                        width: center.w,
                        height: center.h,
                        transform: `translate(${center.move_x}px, ${center.move_y}px)`,
                        zIndex: settings.content_layer,
                        alignItems:
                            settings.content_align_y === 'start'
                                ? 'start'
                                : settings.content_align_y === 'end'
                                  ? 'end'
                                  : 'center',
                        justifyItems:
                            settings.text_align === 'left'
                                ? 'start'
                                : settings.text_align === 'right'
                                  ? 'end'
                                  : 'center',
                    }}
                >
                    <div className="relative z-10 max-w-full break-words px-3 py-2" style={designTextStyle(settings)}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    )
}

function DesignPieceView({
    piece,
    settings,
    previewUrl,
    onPointerDown,
}: {
    piece: DesignPieceSettings
    settings: DesignStyleSettings
    previewUrl: string | null
    onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void
}) {
    if (!piece.enabled) return null
    const backgroundStyle = previewUrl ? customPieceImageStyle(previewUrl, piece, settings) : undefined

    return (
        <div
            className="pointer-events-auto absolute cursor-move overflow-hidden border border-dashed border-green-500/80"
            onPointerDown={onPointerDown}
            style={{
                left: piece.x,
                top: piece.y,
                width: piece.w,
                height: piece.h,
                transform: `translate(${piece.move_x}px, ${piece.move_y}px) rotate(${piece.rotation}deg)`,
                background: piece.background_color || 'transparent',
                borderRadius: piece.border_radius,
                opacity: piece.opacity / 100,
                zIndex: piece.z_index,
                ...backgroundStyle,
            }}
        />
    )
}

function customPieceImageStyle(image: string, piece: DesignPieceSettings, settings: DesignStyleSettings): CSSProperties {
    const sourceX = Math.max(0, piece.source_x)
    const sourceY = Math.max(0, piece.source_y)
    const sourceW = Math.max(1, piece.source_w)
    const sourceH = Math.max(1, piece.source_h)

    if (piece.fit_mode === 'cover') {
        return {
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: `${piece.position_x}% ${piece.position_y}%`,
            backgroundRepeat: 'no-repeat',
        }
    }

    const scaleX = piece.fit_mode === 'stretch' ? piece.w / sourceW : 1
    const scaleY = piece.fit_mode === 'stretch' ? piece.h / sourceH : 1

    return {
        backgroundImage: `url(${image})`,
        backgroundSize: `${settings.preview_width * scaleX}px ${settings.preview_height * scaleY}px`,
        backgroundPosition: `${-sourceX * scaleX}px ${-sourceY * scaleY}px`,
        backgroundRepeat: 'no-repeat',
    }
}

function CommentDesignPreview({
    previewUrl,
    settings,
    onChange,
}: {
    previewUrl: string | null
    settings: DesignStyleSettings
    onChange: (patch: Partial<DesignStyleSettings>) => void
}) {
    const draft = draftDesignAsset('comment_border', settings, previewUrl)

    return (
        <div className="mx-auto rounded-xl bg-[#eef3f8] p-4" style={{ width: Math.max(360, settings.preview_width + 48) }}>
            <div className="relative rounded-xl bg-background shadow-sm">
                <RoyaltyDesignSurface design={draft} previewImageUrl={previewUrl}>
                    <div className="space-y-2">
                        <LiveLayeredNameText settings={settings} name="test3@mykiller" text={settings.sample_text} />
                        <div className="text-xs opacity-75">heart 5 - like 2 - reply - gift 0</div>
                    </div>
                </RoyaltyDesignSurface>
                <DesignGridOverlay settings={settings} />
                <CustomPiecesOverlay previewUrl={previewUrl} settings={settings} onChange={onChange}>
                    <div className="space-y-2">
                        <LiveLayeredNameText settings={settings} name="test3@mykiller" text={settings.sample_text} />
                        <div className="text-xs opacity-75">heart 5 - like 2 - reply - gift 0</div>
                    </div>
                </CustomPiecesOverlay>
                <SliceEditorOverlay settings={settings} onChange={onChange} />
            </div>
        </div>
    )
}

function MessageDesignPreview({
    previewUrl,
    settings,
    onChange,
}: {
    previewUrl: string | null
    settings: DesignStyleSettings
    onChange: (patch: Partial<DesignStyleSettings>) => void
}) {
    const draft = draftDesignAsset('message_design', settings, previewUrl)
    const simple = settings.design_source === 'simple'
    if (simple) {
        return (
            <div className="mx-auto space-y-3 rounded-2xl bg-muted/40 p-5" style={{ width: Math.max(320, settings.preview_width) }}>
                <RoyaltyMessageBubble mine={false} design={draft} previewImageUrl={previewUrl}>
                    Hello! This is the received style.
                </RoyaltyMessageBubble>
                <div className="flex justify-end">
                    <RoyaltyMessageBubble mine design={draft} previewImageUrl={previewUrl}>
                        {settings.sample_text}
                        <div className="mt-1 text-right text-[10px] opacity-70">7:19 PM</div>
                    </RoyaltyMessageBubble>
                </div>
            </div>
        )
    }

    return (
        <div className="relative mx-auto">
            <RoyaltyDesignSurface design={draft} previewImageUrl={previewUrl}>
                <LiveLayeredNameText settings={settings} name="Nor" text={settings.sample_text} />
            </RoyaltyDesignSurface>
            <DesignGridOverlay settings={settings} />
            {settings.design_mode === 'custom' && (
                <CustomPiecesOverlay previewUrl={previewUrl} settings={settings} onChange={onChange}>
                    <LiveLayeredNameText settings={settings} name="Nor" text={settings.sample_text} />
                </CustomPiecesOverlay>
            )}
            <SliceEditorOverlay settings={settings} onChange={onChange} />
        </div>
    )
}

function MessageBackgroundPreview({
    previewUrl,
    settings,
}: {
    previewUrl: string | null
    settings: DesignStyleSettings
}) {
    return <LiveMessageBackgroundPreview design={draftDesignAsset('message_background', settings, previewUrl)} previewImageUrl={previewUrl} />
}

function BoardButtonDesignPreview({
    previewUrl,
    settings,
    onChange,
}: {
    previewUrl: string | null
    settings: DesignStyleSettings
    onChange: (patch: Partial<DesignStyleSettings>) => void
}) {
    const draft = draftDesignAsset('board_button', settings, previewUrl)

    return (
        <div className="mx-auto grid place-items-center rounded-xl bg-muted/40 p-8">
            <div className="relative">
                <RoyaltyDesignSurface design={draft} previewImageUrl={previewUrl}>
                    <span className="relative font-semibold" style={{ zIndex: settings.text_layer }}>{settings.sample_text || 'My Board'}</span>
                </RoyaltyDesignSurface>
                <DesignGridOverlay settings={settings} />
                <CustomPiecesOverlay previewUrl={previewUrl} settings={settings} onChange={onChange}>
                    <span className="relative font-semibold" style={{ zIndex: settings.text_layer }}>{settings.sample_text || 'My Board'}</span>
                </CustomPiecesOverlay>
                <SliceEditorOverlay settings={settings} onChange={onChange} />
            </div>
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
    onEdit,
    deleting,
}: {
    items: Array<ArtistSticker | ProfileBorder | RoyaltyDesignAsset>
    loading: boolean
    empty: string
    assetType: GiftAssetType
    onDelete: (id: string) => void
    onGift: (item: ArtistSticker | ProfileBorder | RoyaltyDesignAsset) => void
    onEdit?: (item: ArtistSticker | ProfileBorder | RoyaltyDesignAsset) => void
    deleting: boolean
}) {
    if (loading) return <div className="rounded-lg border p-8 text-sm text-muted-foreground">Loading...</div>
    if (items.length === 0) return <div className="rounded-lg border p-8 text-sm text-muted-foreground">{empty}</div>

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-lg border bg-background">
                    <div className="flex h-52 items-center justify-center bg-muted/30 p-4">
                        {item.image_path ? (
                            <img
                                src={storageUrl(item.image_path)!}
                                alt={item.name}
                                className="max-h-full max-w-full object-contain"
                            />
                        ) : 'style_settings' in item ? (
                            <RoyaltyMessageBubble
                                mine
                                design={draftDesignAsset(
                                    'message_design',
                                    normalizeDesignSettings((item.style_settings ?? {}) as Partial<DesignStyleSettings>),
                                    null
                                )}
                            >
                                {normalizeDesignSettings((item.style_settings ?? {}) as Partial<DesignStyleSettings>).sample_text}
                            </RoyaltyMessageBubble>
                        ) : (
                            <div className="w-full max-w-[260px] rounded-2xl bg-muted px-4 py-3 text-sm shadow-sm">
                                {item.name}
                            </div>
                        )}
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
                            <div className="flex shrink-0 gap-1">
                                {onEdit && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={() => onEdit(item)}
                                        aria-label={`Edit ${item.name}`}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}
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
