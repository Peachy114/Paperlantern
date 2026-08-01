import type { WorkItem } from "@/features/work/hooks/useHome"
import LabelRailWidget from "../LabelRailWidget"
import type { PageWidget } from "@/types/pageLayout"
import { labelContinuationOffset } from "../continuation"
import TabCardsWidget from "../TabsCardsWidgets/TabCardsWidget"
import { labelItemsFromWorks } from "./utils/labelItemsFromWorks"
import { sourceFilteredWorks } from "./utils/sourceFilteredWorks"

export default function LabelWidgetBundle({
    widget,
    widgets,
    works,
}: {
    widget: PageWidget
    widgets: PageWidget[]
    works: WorkItem[]
}) {
    const display = widget.settings.labels_display ?? 'labels'
    const labels = labelItemsFromWorks(sourceFilteredWorks(works, widget))

    if (display === 'menu_label') {
        return (
            <LabelRailWidget
                widget={widget}
                labels={[
                    { label: 'Main' },
                    { label: 'Comix' },
                    { label: 'Novel' },
                    { label: 'Arts' },
                ]}
            />
        )
    }

    if (display === 'labels_cards') {
        return (
            <div>
                <LabelRailWidget
                    widget={widget}
                    labels={labels}
                    offset={labelContinuationOffset(widgets, widget)}
                />
                <TabCardsWidget widget={widget} works={works} />
            </div>
        )
    }

    return (
        <LabelRailWidget
            widget={widget}
            labels={labels}
            offset={labelContinuationOffset(widgets, widget)}
        />
    )
}