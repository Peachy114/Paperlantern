import type { ChapterItem } from '@/features/work/hooks/useHome'
import type { PageWidget } from '@/types/pageLayout'
import { matchesDateWindow } from './matchesDateWindow'

export function filterChapters(chapters: ChapterItem[], widget: PageWidget) {
    const source = widget.settings.filter_cards_data ?? 'mixed'

    return chapters.filter((chapter) => {
        if (!matchesDateWindow(chapter.created_at, widget)) return false
        if (source === 'comix') return chapter.work.type === 'webtoon'
        if (source === 'novels') return chapter.work.type === 'wattpad'
        return true
    })
}