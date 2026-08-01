import type { PageWidget } from '@/types/pageLayout'

export function matchesDateWindow(value: string | undefined, widget: PageWidget) {
    const mode = widget.settings.date_mode ?? 'all'
    const dateValue = widget.settings.date_value || widget.settings.daily_date
    if (mode === 'all' || !value) return true

    const date = new Date(value)
    const base = dateValue ? new Date(dateValue) : new Date()
    if (Number.isNaN(date.getTime()) || Number.isNaN(base.getTime())) return true

    if (mode === 'daily') return date.toISOString().slice(0, 10) === base.toISOString().slice(0, 10)
    if (mode === 'weekly')
        return Math.abs(date.getTime() - base.getTime()) <= 7 * 24 * 60 * 60 * 1000
    if (mode === 'monthly') {
        return (
            date.getUTCFullYear() === base.getUTCFullYear() &&
            date.getUTCMonth() === base.getUTCMonth()
        )
    }

    return true
}