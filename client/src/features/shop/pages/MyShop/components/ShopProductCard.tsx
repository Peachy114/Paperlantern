import { Badge } from "@/components/ui/badge"
import { storageUrl } from "@/utils/storage"
import type { ShopItem } from "../types"
import { Download, Edit2, Heart, Package, Trash2 } from "lucide-react"

export function ShopProductCard({
    item,
    selected,
    onSelect,
    onEdit,
    onDelete,
    deleting,
}: {
    item: ShopItem
    selected: boolean
    onSelect: (id: string) => void
    onEdit: (item: ShopItem) => void
    onDelete: (id: string) => void
    deleting: boolean
}) {
    const image = storageUrl(item.image_path ?? null)
    const labels = item.labels ?? []

    return (
        <article
            className={`group overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                selected ? 'border-sky-400 ring-2 ring-sky-200' : 'border-border'
            }`}
        >
            <div className="relative aspect-square overflow-hidden bg-muted">
                {image ? (
                    <img
                        src={image}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 via-rose-100 to-sky-100">
                        <Package className="h-9 w-9 text-muted-foreground" />
                    </div>
                )}

                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    <span className="rounded-full bg-background/90 px-2 py-1 text-[9px] font-bold capitalize text-foreground shadow-sm backdrop-blur">
                        {item.type}
                    </span>
                    <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold capitalize text-white shadow-sm ${
                            item.status === 'published'
                                ? 'bg-emerald-500'
                                : item.status === 'draft'
                                  ? 'bg-slate-500'
                                  : 'bg-amber-500'
                        }`}
                    >
                        {item.status}
                    </span>
                </div>

                <label className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onSelect(item.id)}
                        className="h-4 w-4 accent-sky-500"
                        aria-label={`Select ${item.title}`}
                    />
                </label>
            </div>

            <div className="p-2.5">
                <h3 className="line-clamp-2 min-h-8 text-xs font-black leading-[1.35]">
                    {item.title}
                </h3>
                <p className="mt-1 text-[10px] font-black text-orange-500">
                    {item.download_policy === 'free'
                        ? 'Free'
                        : `${item.credit_cost.toLocaleString()} credits`}
                </p>

                {item.description ? (
                    <p className="mt-2 line-clamp-2 min-h-7 text-[9px] leading-relaxed text-muted-foreground">
                        {item.description}
                    </p>
                ) : null}

                {labels.length > 0 ? (
                    <div className="mt-2 flex min-h-4 flex-wrap gap-1">
                        {labels.slice(0, 2).map((label) => (
                            <Badge
                                key={label}
                                variant="secondary"
                                className="h-4 rounded-full px-1.5 text-[8px] font-normal"
                            >
                                #{label}
                            </Badge>
                        ))}
                    </div>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[8px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Download className="h-2.5 w-2.5" />
                        {item.downloads_count.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-500">
                        <Heart className="h-2.5 w-2.5 fill-current" />
                        {item.likes_count.toLocaleString()}
                    </span>
                    <span>{item.files?.length ?? 0} files</span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="inline-flex h-7 items-center justify-center gap-1 rounded-full bg-rose-400 text-[9px] font-bold text-white transition hover:bg-rose-500"
                    >
                        <Edit2 className="h-2.5 w-2.5" />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        disabled={deleting}
                        className="inline-flex h-7 items-center justify-center gap-1 rounded-full bg-sky-400 text-[9px] font-bold text-white transition hover:bg-sky-500 disabled:opacity-40"
                    >
                        <Trash2 className="h-2.5 w-2.5" />
                        Delete
                    </button>
                </div>
            </div>
        </article>
    )
}