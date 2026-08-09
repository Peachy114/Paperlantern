import { Edit, Gift, Trash2 } from 'lucide-react'
import type { SubscriptionPlan } from '@/api/nobleRoyalty'
import { Button } from '@/components/ui/button'
import { RoyaltyMessageBubble } from '@/components/royalty/RoyaltyDesignRenderer'
import type { ArtistSticker, ProfileBorder, RoyaltyDesignAsset } from '@/types/artistProfile'
import type { SuperLikeAward } from '@/types/comment'
import { storageUrl } from '@/utils/storage'
import type { DesignStyleSettings, GiftAssetType } from '@/features/admin/noble-royalty/model/editor'
import {
    draftDesignAsset,
    normalizeDesignSettings,
} from '@/features/admin/noble-royalty/utils/editor'

// Noble Royalty tables ----
export function AssetGrid({
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

export function RewardsTable({
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

export function PlansTable({
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
