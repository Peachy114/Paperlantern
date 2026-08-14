import type { CommissionOrder } from '@/features/commissions/types/studioCommission'

export type ProductionColumn = 'todo' | 'in_progress' | 'done'

// Production board state ----
export function isProductionOrder(order: CommissionOrder) {
    return ['awaiting_payment', 'in_progress', 'delivered', 'completed', 'disputed'].includes(order.status)
}

export function productionColumnForOrder(order: CommissionOrder): ProductionColumn | null {
    if (!isProductionOrder(order)) return null
    if (['delivered', 'completed'].includes(order.status)) return 'done'
    if (order.status === 'disputed') return 'in_progress'
    const manualColumn = boardColumn(order)
    if (manualColumn) return manualColumn
    if (isActiveCreativeStage(order)) return 'in_progress'
    return 'todo'
}

export function isActiveCreativeStage(order: CommissionOrder) {
    const step = order.flow_snapshot?.[order.current_step_index]
    if (!['sketch', 'revision', 'draft', 'add'].includes(step?.type ?? '')) return false
    return Boolean(order.stage_notes?.[String(order.current_step_index)])
}

export function productionProgressLabel(order: CommissionOrder) {
    if (order.status === 'delivered') return 'Waiting for acceptance'
    if (order.status === 'completed') return 'Paid'
    if (order.status === 'awaiting_payment') return 'Waiting for payment'
    if (order.status === 'disputed') return 'In progress - disputed'
    const step = order.flow_snapshot?.[order.current_step_index]
    if (step?.type && ['sketch', 'revision', 'draft', 'add'].includes(step.type)) {
        return `In progress - ${step.label || step.type}`
    }
    return 'In progress'
}

export function boardColumn(order: CommissionOrder): ProductionColumn | null {
    const value = order.stage_notes?._production_board?.column
    if (value === 'todo' || value === 'in_progress' || value === 'done') return value
    return null
}
