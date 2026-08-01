import type {  WorkItem } from '@/features/work/hooks/useHome'

export function labelFor(work: WorkItem, metric?: 'views' | 'likes') {
    if (work.content_type === 'chapter' && metric === 'likes') {
        return `Ch. ${work.chapter_order ?? ''} - ${work.period_likes ?? work.likes ?? 0} likes today`
    }
    if (work.content_type === 'chapter' && metric === 'views') {
        return `Ch. ${work.chapter_order ?? ''} - ${work.period_views ?? work.views ?? 0} views today`
    }
    if (work.content_type === 'chapter') return `Ch. ${work.chapter_order ?? ''}`
    if (metric === 'likes') return `${work.period_likes ?? work.likes ?? 0} likes`
    if (metric === 'views') return `${work.period_views ?? work.views ?? 0} views`
    return work.type === 'art' ? 'Art' : work.type === 'webtoon' ? 'Webtoon' : 'Novel'
}
