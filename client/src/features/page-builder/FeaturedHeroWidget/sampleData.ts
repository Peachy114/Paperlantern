import type { ShopHeroItem } from './types'
import { sampleHeroImage } from './utils/sampleHeroImage'

export const SAMPLE_SHOP_HERO_ITEMS: ShopHeroItem[] = Array.from({ length: 10 }, (_, index) => ({
    id: `sample-shop-hero-${index + 1}`,
    slug: `sample-shop-hero-${index + 1}`,
    title: `Sample Shop Product ${index + 1}`,
    labels: ['Shop', index % 2 === 0 ? 'By Artist' : 'By Admin'],
    image_path: sampleHeroImage(
        `Shop ${index + 1}`,
        index % 2 === 0 ? '#ff8a00' : '#56b6ff',
        '#ff477e'
    ),
    downloads_count: 120 + index * 12,
    likes: 40 + index * 8,
    is_featured: index < 4,
    source_label: index % 2 === 0 ? 'By Artist' : 'By Admin',
    artist: index % 2 === 0 ? { name: 'Preview Artist', username: 'preview_artist' } : null,
}))