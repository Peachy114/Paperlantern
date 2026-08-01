import { Download } from "lucide-react"
import type { ReactNode } from "react"

export function ShopSection({
    title,
    description,
    empty,
    loading,
    count,
    children,
}: {
    title: string
    description?: string
    empty: string
    loading: boolean
    count: number
    children: ReactNode
}) {
    return (
        <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    {description ? (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    ) : null}
                </div>
                <Download className="h-5 w-5 text-muted-foreground" />
            </div>
            {loading ? (
                <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                    Loading shop...
                </div>
            ) : count === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    {empty}
                </div>
            ) : (
                children
            )}
        </section>
    )
}