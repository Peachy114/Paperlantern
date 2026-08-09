import type { CommissionOrder } from '@/features/commissions/types/studioCommission'

// Chart data ----
export interface CommissionChartPoint {
    label: string
    fullLabel: string
    total: number
    cancelled: number
}

export function buildCommissionChartPoints(orders: CommissionOrder[]): CommissionChartPoint[] {
    const days = Array.from({ length: 7 }, (_, index) => {
        const day = new Date()
        day.setHours(0, 0, 0, 0)
        day.setDate(day.getDate() - (6 - index))
        return day
    })

    return days.map((day) => {
        const next = new Date(day)
        next.setDate(day.getDate() + 1)

        const dayOrders = orders.filter((order) => {
            const created = new Date(order.created_at)
            return created >= day && created < next
        })

        return {
            label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            fullLabel: day.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
            total: dayOrders.length,
            cancelled: dayOrders.filter((order) => order.status === 'cancelled').length,
        }
    })
}

export function createSmoothChartPath(points: Array<{ x: number; y: number }>) {
    if (points.length === 0) return ''
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

    return points.reduce((path, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`

        const previous = points[index - 1]
        const controlX = (previous.x + point.x) / 2

        return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
    }, '')
}

// Metric formatting ----
export function formatCompactMetric(value: number) {
    return Intl.NumberFormat(undefined, {
        notation: value >= 1000 ? 'compact' : 'standard',
        maximumFractionDigits: 1,
    }).format(value)
}
