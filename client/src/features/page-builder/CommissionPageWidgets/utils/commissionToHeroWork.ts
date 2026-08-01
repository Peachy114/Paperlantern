import type { CommissionService } from '@/types/commission'
import type { WorkItem } from '@/features/work/hooks/useHome'

export function commissionToHeroWork(commission: CommissionService): WorkItem {
    const image = commission.image_path ?? commission.artist?.avatar ?? null

    return {
        id: commission.id,
        slug: commission.slug,
        title: commission.title,
        description: commission.description ?? '',
        cover: image,
        banner: image,

        type: 'art',
        content_type: 'art',

        views: commission.views_count ?? 0,
        likes: commission.likes_count ?? 0,
        period_views: commission.views_count ?? 0,
        period_likes: commission.likes_count ?? 0,

        created_at: commission.created_at,
        updated_at: commission.updated_at,

        is_featured: Boolean(commission.is_featured),
    } as WorkItem
}
