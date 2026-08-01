import type { WorkItem } from '@/features/work/hooks/useHome'

export type TabCardItem = WorkItem & {
    type: 'webtoon' | 'wattpad' | 'art'
}