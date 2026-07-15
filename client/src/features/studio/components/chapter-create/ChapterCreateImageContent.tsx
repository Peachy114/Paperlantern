import { Move, Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Props {
    imagePreviews: string[]
    imageNames?: string[]
    onImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemoveImage: (index: number) => void
    onReorderImages: (from: number, to: number) => void
}

function SortableImage({
    src,
    index,
    fileName,
    onRemove,
}: {
    src: string
    index: number
    fileName?: string
    onRemove: () => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: src,
    })
    return (
        <div
            ref={setNodeRef}
            {...attributes}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1,
                touchAction: 'none',
            }}
            className="group relative rounded-md overflow-hidden border border-border bg-muted aspect-[3/4]"
        >
            <img
                src={src}
                alt={`Page ${index + 1}`}
                className="w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
            <div className="absolute top-1.5 left-1.5 h-5 min-w-5 px-1 rounded text-[10px] font-semibold bg-black/60 text-white flex items-center justify-center">
                {index + 1}
            </div>
            {fileName && (
                <div className="absolute bottom-1.5 left-1.5 right-14 truncate rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                    {fileName}
                </div>
            )}
            <button
                type="button"
                {...listeners}
                onPointerDown={(event) => {
                    event.stopPropagation()
                    listeners?.onPointerDown?.(event)
                }}
                className="absolute top-1.5 right-1.5 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity cursor-grab active:cursor-grabbing group-hover:opacity-100"
                title="Drag to reorder"
                aria-label={`Reorder page ${index + 1}`}
            >
                <Move className="h-3 w-3" />
            </button>
            <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                }}
                className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500 hover:bg-red-600 text-white"
            >
                Remove
            </button>
        </div>
    )
}

export default function ChapterCreateImageContent({
    imagePreviews,
    imageNames = [],
    onImagesChange,
    onRemoveImage,
    onReorderImages,
}: Props) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const from = imagePreviews.indexOf(active.id as string)
        const to = imagePreviews.indexOf(over.id as string)
        if (from !== -1 && to !== -1) onReorderImages(from, to)
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Upload pages</Label>
                {imagePreviews.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {imagePreviews.length} page{imagePreviews.length !== 1 ? 's' : ''} · hold to
                        reorder
                    </span>
                )}
            </div>
            <label className="flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-border bg-muted/20 cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors text-sm text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4" />
                Upload pages
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onImagesChange}
                    className="sr-only"
                />
            </label>
            {imagePreviews.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={imagePreviews} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {imagePreviews.map((src, i) => (
                                <SortableImage
                                    key={src}
                                    src={src}
                                    index={i}
                                    fileName={imageNames[i]}
                                    onRemove={() => onRemoveImage(i)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
            {imagePreviews.length > 0 && (
                <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            PC preview
                        </p>
                        <div className="mx-auto max-w-xl overflow-hidden rounded-md bg-background">
                            {imagePreviews.map((src, index) => (
                                <img
                                    key={`pc-${src}`}
                                    src={src}
                                    alt={`Desktop page ${index + 1}`}
                                    className="block w-full"
                                />
                            ))}
                        </div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Mobile preview
                        </p>
                        <div className="mx-auto max-w-[210px] overflow-hidden rounded-[1.5rem] border-4 border-foreground bg-background">
                            {imagePreviews.map((src, index) => (
                                <img
                                    key={`mobile-${src}`}
                                    src={src}
                                    alt={`Mobile page ${index + 1}`}
                                    className="block w-full"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
