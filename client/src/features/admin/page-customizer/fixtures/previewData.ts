import type { Art } from '@/types/art'
import type { CommissionService } from '@/types/commission'
import type { ChapterItem, WorkItem } from '@/features/work/hooks/useHome'
import type { ArtsPreviewData, CommissionPreviewData, HomePreviewData } from '../types/preview'

// Preview fixtures ----
const SAMPLE_NOW = '2026-07-28T10:00:00.000Z'

function sampleImage(label: string, from = '#56b6ff', to = '#ff8a00') {
    const safeLabel = label.replace(/[<>&"']/g, '')
    return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 860"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="640" height="860" rx="54" fill="url(#g)"/><circle cx="500" cy="160" r="88" fill="rgba(255,255,255,.35)"/><circle cx="140" cy="700" r="120" fill="rgba(255,255,255,.22)"/><text x="50%" y="50%" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="54" font-weight="800" fill="white">${safeLabel}</text><text x="50%" y="58%" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="24" fill="rgba(255,255,255,.82)">Preview sample</text></svg>`
    )}`
}

function sampleUpTo<T extends { id: string; slug?: string; title?: string }>(
    items: T[],
    count = 10
): T[] {
    if (items.length >= count) return items.slice(0, count)

    return Array.from({ length: count }, (_, index) => {
        const source = items[index % Math.max(items.length, 1)]
        const cycle = Math.floor(index / Math.max(items.length, 1)) + 1

        return {
            ...source,
            id: index < items.length ? source.id : `${source.id}-preview-${cycle}`,
            slug: source.slug
                ? index < items.length
                    ? source.slug
                    : `${source.slug}-preview-${cycle}`
                : source.slug,
            title: source.title
                ? index < items.length
                    ? source.title
                    : `${source.title} ${cycle}`
                : source.title,
        }
    })
}

const SAMPLE_WORKS: WorkItem[] = [
    {
        id: 'sample-comix-1',
        slug: 'sample-comix',
        title: 'Sample Comix Feature',
        cover: sampleImage('Comix', '#54b6ff', '#ff477e'),
        banner: sampleImage('Comix Hero', '#0ea5e9', '#f97316'),
        type: 'webtoon',
        content_type: 'work',
        genres: ['Action', 'Fantasy'],
        views: 13200,
        likes: 920,
        period_views: 320,
        period_likes: 52,
        weekly_views: 1880,
        created_at: SAMPLE_NOW,
        status: 'ongoing',
        is_featured: true,
    },
    {
        id: 'sample-comix-2',
        slug: 'sample-romance-comix',
        title: 'Sample Romance Comix',
        cover: sampleImage('Romance', '#fb7185', '#fbbf24'),
        banner: sampleImage('Romance Hero', '#f472b6', '#38bdf8'),
        type: 'webtoon',
        content_type: 'work',
        genres: ['Romance', 'Drama'],
        views: 7600,
        likes: 640,
        period_views: 180,
        period_likes: 31,
        weekly_views: 1140,
        created_at: SAMPLE_NOW,
        status: 'ongoing',
        is_featured: false,
    },
    {
        id: 'sample-novel-1',
        slug: 'sample-novel',
        title: 'Sample Novel Spotlight',
        cover: sampleImage('Novel', '#8b5cf6', '#06b6d4'),
        banner: sampleImage('Novel Hero', '#6366f1', '#ec4899'),
        type: 'wattpad',
        content_type: 'work',
        genres: ['Mystery', 'Sci-Fi'],
        views: 9800,
        likes: 810,
        period_views: 240,
        period_likes: 45,
        weekly_views: 1410,
        created_at: SAMPLE_NOW,
        status: 'ongoing',
        is_featured: true,
    },
    {
        id: 'sample-art-1',
        slug: 'sample-art',
        title: 'Sample Art Preview',
        cover: sampleImage('Art', '#22c55e', '#f97316'),
        banner: sampleImage('Art Hero', '#14b8a6', '#f43f5e'),
        type: 'art',
        content_type: 'art',
        genres: ['Fanart', 'Original'],
        views: 5600,
        likes: 430,
        period_views: 95,
        period_likes: 22,
        created_at: SAMPLE_NOW,
        status: 'published',
        is_featured: true,
    },
]

const SAMPLE_CHAPTERS: ChapterItem[] = [
    {
        id: 'sample-chapter-1',
        work_id: 'sample-comix-1',
        title: 'Chapter 1: Preview Opening',
        cover: sampleImage('Ch. 1', '#54b6ff', '#ff477e'),
        order: 1,
        created_at: SAMPLE_NOW,
        work: {
            id: 'sample-comix-1',
            slug: 'sample-comix',
            title: 'Sample Comix Feature',
            cover: sampleImage('Comix', '#54b6ff', '#ff477e'),
            type: 'webtoon',
        },
    },
    {
        id: 'sample-chapter-2',
        work_id: 'sample-novel-1',
        title: 'Episode 2: The Quiet Signal',
        cover: sampleImage('Ep. 2', '#8b5cf6', '#06b6d4'),
        order: 2,
        created_at: SAMPLE_NOW,
        work: {
            id: 'sample-novel-1',
            slug: 'sample-novel',
            title: 'Sample Novel Spotlight',
            cover: sampleImage('Novel', '#8b5cf6', '#06b6d4'),
            type: 'wattpad',
        },
    },
]

const SAMPLE_ARTS: Art[] = [
    {
        id: 'sample-art-post-1',
        slug: 'sample-art-post',
        title: 'Sample Character Sheet',
        description: 'Preview art used only inside Page Customize.',
        labels: ['Fanart', 'Character Design'],
        image_path: sampleImage('Sheet', '#0ea5e9', '#f97316'),
        images: [],
        status: 'published',
        moderation_status: 'approved',
        download_policy: 'disabled',
        download_credits: 0,
        downloads_count: 0,
        apply_watermark: false,
        views: 4200,
        likes: 610,
        comments_count: 18,
        super_likes_count: 4,
        super_like_credits: 12,
        is_featured: true,
        user: {
            id: 'sample-artist',
            name: 'Preview Artist',
            username: 'preview_artist',
            role: 'storyteller',
            avatar: sampleImage('A', '#111827', '#f59e0b'),
            artist_verified: true,
        },
        created_at: SAMPLE_NOW,
        updated_at: SAMPLE_NOW,
    },
    {
        id: 'sample-art-post-2',
        slug: 'sample-background-art',
        title: 'Sample Background Art',
        description: 'A second art sample for grids.',
        labels: ['Background', 'Original'],
        image_path: sampleImage('BG', '#22c55e', '#06b6d4'),
        images: [],
        status: 'published',
        moderation_status: 'approved',
        download_policy: 'disabled',
        download_credits: 0,
        downloads_count: 0,
        apply_watermark: false,
        views: 3100,
        likes: 390,
        comments_count: 9,
        super_likes_count: 2,
        super_like_credits: 6,
        is_featured: false,
        user: {
            id: 'sample-artist',
            name: 'Preview Artist',
            username: 'preview_artist',
            role: 'storyteller',
            avatar: sampleImage('A', '#111827', '#f59e0b'),
            artist_verified: true,
        },
        created_at: SAMPLE_NOW,
        updated_at: SAMPLE_NOW,
    },
]

const SAMPLE_COMMISSIONS: CommissionService[] = [
    {
        id: 'sample-commission-1',
        title: 'Sample Character Commission',
        slug: 'sample-character-commission',
        description: 'Preview commission service for layout testing.',
        image_path: sampleImage('Commission', '#fb7185', '#8b5cf6'),
        status: 'open',
        boosted_until: SAMPLE_NOW,
        base_price_credits: 30,
        min_price_credits: 30,
        delivery_days: 14,
        slots_available: 3,
        is_featured: true,
        views_count: 880,
        likes_count: 140,
        created_at: SAMPLE_NOW,
        updated_at: SAMPLE_NOW,
        flow: [
            { type: 'quote', label: 'Artist quote' },
            { type: 'pay', label: 'Deposit', percent: 50 },
            { type: 'process', label: 'Sketch' },
            { type: 'pay', label: 'Final pay', percent: 50 },
        ],
        terms: 'Sample terms for preview.',
        quote_rules: 'Quote starts from 30 credits.',
        refund_policy: 'Preview refund policy.',
        required_references: 'Character references and notes.',
        request_questions: [],
        info_questions: [],
        client_fields: {
            name: { collect: true, required: true },
            username: { collect: true, required: false },
            email: { collect: true, required: true },
            discord: { collect: true, required: false },
            twitter: { collect: false, required: false },
            instagram: { collect: false, required: false },
            facebook: { collect: false, required: false },
            tiktok: { collect: false, required: false },
        },
        promo_discounts: [],
        setup_options: {
            visibility: 'discoverable',
            service_type: 'custom',
            communication_style: 'open',
            requesting_process: 'custom_proposal',
            notify_followers_on_status_change: false,
            sensitive: false,
            display_service_stats: true,
            guaranteed_delivery_days: 14,
        },
        artist_terms: 'Preview artist terms.',
        platform_terms: ['Payments stay inside LaterNComix credits.'],
        rating_average: 5,
        ratings_count: 12,
        customers_count: 24,
        category: { id: 'sample-category', name: 'Illustration', slug: 'illustration' },
        artist: {
            id: 'sample-artist',
            name: 'Preview Artist',
            username: 'preview_artist',
            avatar: sampleImage('A', '#111827', '#f59e0b'),
            artist_title: 'Commission Artist',
            artist_verified: true,
            commission_status: 'open',
        },
        recent_ratings: [],
    },
]

export function withSampleHomeData(data?: HomePreviewData): HomePreviewData {
    const sampleWorks = sampleUpTo(SAMPLE_WORKS)
    const sampleChapters = sampleUpTo(SAMPLE_CHAPTERS)

    return {
        weeklyChart: data?.weeklyChart?.length ? data.weeklyChart : sampleWorks,
        todayReleases: data?.todayReleases?.length ? data.todayReleases : sampleWorks,
        todayTopViews: data?.todayTopViews?.length ? data.todayTopViews : sampleWorks,
        todayTopLikes: data?.todayTopLikes?.length ? data.todayTopLikes : sampleWorks,
        freshReleases: data?.freshReleases?.length ? data.freshReleases : sampleWorks,
        latestChapters: data?.latestChapters?.length ? data.latestChapters : sampleChapters,
        dailyWorks: data?.dailyWorks?.length ? data.dailyWorks : sampleWorks,
        popularWorks: data?.popularWorks?.length ? data.popularWorks : sampleWorks,
        topLikedWorks: data?.topLikedWorks?.length ? data.topLikedWorks : sampleWorks,
    }
}

export function withSampleArtsData(data?: ArtsPreviewData): ArtsPreviewData {
    return {
        featured_artists: data?.featured_artists?.length
            ? data.featured_artists
            : [
                  {
                      id: 'sample-artist',
                      name: 'Preview Artist',
                      username: 'preview_artist',
                      avatar: sampleImage('A', '#111827', '#f59e0b'),
                      artist_title: 'Commission Artist',
                  },
              ],
        tags: data?.tags?.length
            ? data.tags
            : [
                  { label: 'Fanart', artists_count: 24 },
                  { label: 'Original', artists_count: 18 },
                  { label: 'Character Design', artists_count: 12 },
              ],
        arts: { data: data?.arts?.data?.length ? data.arts.data : sampleUpTo(SAMPLE_ARTS) },
    }
}

export function withSampleCommissionData(data?: CommissionPreviewData): CommissionPreviewData {
    return {
        commissions: {
            data: data?.commissions?.data?.length
                ? data.commissions.data
                : sampleUpTo(SAMPLE_COMMISSIONS),
        },
    }
}

// ============================================================================
// SECTION 3: MAIN PAGE BUILDER STATE, QUERIES, SAVE, RESET, AND LAYOUT ----
// ============================================================================
