import type { WorkItem } from '@/features/work/hooks/useHome'

export function labelItemsFromWorks(works: WorkItem[]) {
    const counts = new Map<string, number>()

    works.forEach((work) => {
        ;(work.genres ?? []).forEach((label) => {
            const clean = label.trim()
            if (!clean) return
            counts.set(clean, (counts.get(clean) ?? 0) + 1)
        })
    })

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([label, count]) => ({ label, count }))
}