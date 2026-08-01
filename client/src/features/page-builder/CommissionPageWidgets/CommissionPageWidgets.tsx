import { Suspense } from 'react'
import type { PageWidget } from '@/types/pageLayout'
import CommissionWidget from './CommissionWidget'
import type { CommissionWidgetData } from './types'

export function CommissionPageWidgets({
    widgets,
    data,
    preview = false,
}: {
    widgets: PageWidget[]
    data: CommissionWidgetData
    preview?: boolean
}) {
    return (
        <Suspense fallback={null}>
            {widgets
                .filter((widget) => widget.enabled)
                .map((widget) => (
                    <CommissionWidget
                        key={widget.id}
                        widget={widget}
                        widgets={widgets}
                        data={data}
                        preview={preview}
                    />
                ))}
        </Suspense>
    )
}
