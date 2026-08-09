import type { SubscriptionPlan } from '@/api/nobleRoyalty'
import type { RoyaltyDesignAsset, RoyaltyDesignType } from '@/types/artistProfile'
import {
    DESIGN_PIECES,
    EMPTY_ASSET,
    defaultPiece,
    type DesignPieceSettings,
    type DesignPieceKey,
    type DesignStyleSettings,
    type PlanForm,
    type Tab,
} from '@/features/admin/noble-royalty/model/editor'

// Noble Royalty editor utilities ----
export function stickerNameFromFile(file: File) {
    return file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim()
}

export function singularTitle(tab: Tab) {
    if (tab === 'stickers') return 'Sticker'
    if (tab === 'borders') return 'Border'
    if (tab === 'rewards') return 'Reward'
    if (tab === 'subscriptions') return 'Subscription'
    if (tab === 'message_designs') return 'Message Design'
    if (tab === 'message_backgrounds') return 'Message Background'
    if (tab === 'comment_borders') return 'Comment Border'
    return 'Board Button Design'
}

export function planToForm(plan: SubscriptionPlan): PlanForm {
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

export function planPayload(plan: PlanForm) {
    return {
        ...plan,
        promo_credit_cost: plan.promo_credit_cost === '' ? null : plan.promo_credit_cost,
        promo_start_at: plan.promo_start_at || null,
        promo_end_at: plan.promo_end_at || null,
    }
}

export function toDateTimeLocalValue(value?: string | null) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 16)
}

export function clampNumber(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

export function normalizePiece(
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

export function normalizeDesignSettings(value: Partial<DesignStyleSettings>): DesignStyleSettings {
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

export function draftDesignAsset(type: RoyaltyDesignType, settings: DesignStyleSettings, previewUrl: string | null): RoyaltyDesignAsset {
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
