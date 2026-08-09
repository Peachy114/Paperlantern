import { useState, type DragEvent, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ConfirmAction, FlowStep, FlowType } from '@/features/commissions/types/studioCommission'
import { ConfirmActionDialog } from '@/features/commissions/components/CommissionDashboard'

// Commission flow editor ----
export function FlowEditor({
    flow,
    setFlow,
    onUpdate,
    onMove,
}: {
    flow: FlowStep[]
    setFlow: Dispatch<SetStateAction<FlowStep[]>>
    onUpdate: (index: number, patch: Partial<FlowStep>) => void
    onMove: (index: number, target: number) => void
}) {
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
    const handleDragStart = (event: DragEvent<HTMLDivElement>, index: number) => {
        event.dataTransfer.setData('text/plain', String(index))
        event.dataTransfer.effectAllowed = 'move'
    }

    const handleDrop = (event: DragEvent<HTMLDivElement>, targetIndex: number) => {
        event.preventDefault()
        const sourceIndex = Number(event.dataTransfer.getData('text/plain'))
        if (Number.isInteger(sourceIndex) && sourceIndex !== targetIndex)
            onMove(sourceIndex, targetIndex)
    }

    const confirmRemoveStep = (index: number) => {
        setConfirmAction({
            title: 'Delete flow step?',
            description: `Remove "${flow[index]?.label || 'this step'}" from the commission flow?`,
            confirmLabel: 'Delete step',
            destructive: true,
            onConfirm: () =>
                setFlow((current) => current.filter((_, stepIndex) => stepIndex !== index)),
        })
    }

    return (
        <div className="rounded-lg border p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold">Default commission flow</h3>
                    <p className="text-xs text-muted-foreground">
                        Drag payment, sketch, revision, custom, and delivery steps into the order
                        you use most.
                    </p>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                        setFlow((current) => [...current, { type: 'add', label: 'Custom step' }])
                    }
                >
                    Add step
                </Button>
            </div>
            <div className="grid gap-2">
                {flow.map((step, index) => (
                    <div
                        key={`${step.label}-${index}`}
                        draggable
                        onDragStart={(event) => handleDragStart(event, index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleDrop(event, index)}
                        className="grid cursor-grab gap-2 rounded-lg border p-2 active:cursor-grabbing md:grid-cols-[34px_110px_1fr_90px_90px_auto]"
                    >
                        <div className="flex h-9 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                            {index + 1}
                        </div>
                        <select
                            value={step.type}
                            onChange={(event) =>
                                onUpdate(index, { type: event.target.value as FlowType })
                            }
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                        >
                            <option value="pay">Pay</option>
                            <option value="sketch">Sketch</option>
                            <option value="revision">Revision</option>
                            <option value="add">Add</option>
                            <option value="done">Done</option>
                        </select>
                        <Input
                            value={step.label}
                            onChange={(event) => onUpdate(index, { label: event.target.value })}
                            placeholder="Step label"
                        />
                        <Input
                            type="number"
                            value={step.percent ?? 0}
                            disabled={step.type !== 'pay'}
                            onChange={(event) =>
                                onUpdate(index, { percent: Number(event.target.value) })
                            }
                            placeholder="%"
                        />
                        <Input
                            type="number"
                            value={step.rounds ?? 0}
                            disabled={!['sketch', 'revision', 'add'].includes(step.type)}
                            onChange={(event) =>
                                onUpdate(index, { rounds: Number(event.target.value) })
                            }
                            placeholder="Count"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => confirmRemoveStep(index)}
                        >
                            Delete
                        </Button>
                    </div>
                ))}
            </div>
            <ConfirmActionDialog
                action={confirmAction}
                busy={false}
                onOpenChange={(open) => {
                    if (!open) setConfirmAction(null)
                }}
            />
        </div>
    )
}



