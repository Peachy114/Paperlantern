import { useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRef } from 'react'
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
import { Move } from 'lucide-react'

interface CreateWorkFirstStoryContentProps {
    type: string
    chapterImages: File[]
    chapterImagePreviews: string[]
    chapterContent: string
    onImagesChange: (e: any) => void
    onImageRemove: (index: number) => void
    onImagesReorder: (from: number, to: number) => void
    onContentChange: (e: any) => void
    chapterFieldErrors: Record<string, string>
}

// SORTED IMAGES
function SortableImage({
    src,
    index,
    onRemove,
}: {
    src: string
    index: number
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
            className="group relative rounded-lg overflow-hidden border border-border aspect-[3/4]"
        >
            <img
                src={src}
                alt={`Page ${index + 1}`}
                className="w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">
                {index + 1}
            </div>
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

export default function CreateWorkFirstStoryContent({
    type,
    chapterImages,
    chapterImagePreviews,
    chapterContent,
    onImagesChange,
    onImageRemove,
    onImagesReorder,
    onContentChange,
    chapterFieldErrors,
}: CreateWorkFirstStoryContentProps) {
    const dragIndex = useRef<number | null>(null)
    const imageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
    const touchStartY = useRef<number>(0)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // must drag 8px before activating
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        })
    )
    // Register non-passive touch listeners — same as sticky notes
    useEffect(() => {
        const listeners: Array<{ el: HTMLDivElement; fn: (e: TouchEvent) => void }> = []

        chapterImagePreviews.forEach((_, i) => {
            const el = imageRefs.current.get(i)
            if (!el) return

            const fn = (e: TouchEvent) => {
                if (e.cancelable) e.preventDefault() // ← blocks page scroll
                dragIndex.current = i
                touchStartY.current = e.touches[0].clientY
            }

            el.addEventListener('touchstart', fn, { passive: false })
            listeners.push({ el, fn })
        })

        return () => {
            listeners.forEach(({ el, fn }) => el.removeEventListener('touchstart', fn))
        }
    }, [chapterImagePreviews])

    // IF WEBTOOOOOOOOOON -----------------------------------------------
    if (type === 'webtoon') {
        const handleDragEnd = (event: DragEndEvent) => {
            const { active, over } = event
            if (!over || active.id === over.id) return
            const from = chapterImagePreviews.indexOf(active.id as string)
            const to = chapterImagePreviews.indexOf(over.id as string)
            if (from !== -1 && to !== -1) onImagesReorder(from, to)
        }

        return (
            <div className="flex flex-col gap-2">
                <Label>
                    Chapter pages <span className="text-red-400">*</span>
                </Label>
                {chapterFieldErrors._images && (
                    <p className="text-xs text-red-400">{chapterFieldErrors._images}</p>
                )}
                <label className="flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-border bg-muted cursor-pointer hover:border-foreground/40 transition-colors text-sm text-muted-foreground">
                    <span>+</span>
                    <span>{chapterImages.length > 0 ? 'Add more pages' : 'Add pages'}</span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={onImagesChange}
                        className="sr-only"
                    />
                </label>

                {chapterImagePreviews.length > 0 && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={chapterImagePreviews}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-3 gap-2 mt-1">
                                {chapterImagePreviews.map((src, i) => (
                                    <SortableImage
                                        key={src}
                                        src={src}
                                        index={i}
                                        onRemove={() => onImageRemove(i)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        )
    }

    if (type === 'wattpad') {
        return (
            <div className="flex flex-col gap-1.5">
                <Label>
                    Story content <span className="text-red-400">*</span>
                </Label>
                {chapterFieldErrors.content && (
                    <p className="text-xs text-red-400">{chapterFieldErrors.content}</p>
                )}
                <Textarea
                    name="content"
                    value={chapterContent}
                    onChange={onContentChange}
                    rows={12}
                    placeholder="Write your story here..."
                    className="resize-none leading-relaxed font-[Georgia,serif]"
                />
            </div>
        )
    }

    return null
}
