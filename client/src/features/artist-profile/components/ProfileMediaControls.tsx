import { useRef, useState, type ChangeEvent, type PointerEvent } from 'react'
import { Gift, Image as ImageIcon, ImageOff, Images as ImagesIcon } from 'lucide-react'
import { storageUrl } from '@/utils/storage'
import type { ArtistProfileResponse, ArtistSticker } from '@/types/artistProfile'
import type { ArtImageOption } from '@/features/artist-profile/types/profileEditor'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

// Profile awards ----
export function AwardChips({ awards }: {
    awards: NonNullable<NonNullable<ArtistProfileResponse['comments']>[number]['awards']>
}) {
    return (
        <div className="mt-2 flex flex-wrap gap-1.5">
            {awards.map((award) => (
                <span key={award.id ?? award.name} className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                    <Gift className="h-3 w-3" />
                    {award.name} x{award.count}
                </span>
            ))}
        </div>
    )
}

// Profile sticker source ----
export function StickerPicker({ value, stickers, onChange, onDragStart }: {
    value: string
    stickers: ArtistSticker[]
    onChange: (value: string) => void
    onDragStart?: (event: PointerEvent<HTMLElement>, sticker: ArtistSticker) => void
}) {
    return (
        <div className="grid gap-2">
            <Label>Sticker</Label>
            {onDragStart && <p className="text-xs text-muted-foreground">Drag a sticker onto the board.</p>}
            {stickers.length === 0 ? (
                <p className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">Add stickers in My Stickers.</p>
            ) : (
                <div className="flex max-w-full gap-2 overflow-x-auto pb-2">
                    {stickers.map((sticker) => (
                        <button key={sticker.id} type="button" onPointerDown={(event) => onDragStart?.(event, sticker)} onClick={() => onChange(sticker.id)} className={`w-24 shrink-0 cursor-grab rounded-lg border bg-background p-2 text-left active:cursor-grabbing ${value === sticker.id ? 'ring-2 ring-foreground' : ''}`}>
                            <span className="block aspect-square rounded-md bg-muted/50 p-2">
                                <img src={storageUrl(sticker.image_path)!} alt={sticker.name} className="h-full w-full object-contain" />
                            </span>
                            <span className="mt-1 block truncate text-xs">{sticker.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// Profile art source ----
export function ImageSourceControls({ id, value, artImages, onUpload, onSelect }: {
    id: string
    value: string
    artImages: ArtImageOption[]
    onUpload: (file: File | null) => void
    onSelect: (value: string) => void
}) {
    const fileRef = useRef<HTMLInputElement | null>(null)
    const [open, setOpen] = useState(false)

    return (
        <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><ImageIcon className="h-4 w-4" />Upload Image</Button>
                {artImages.length > 0 && <Button type="button" variant="outline" onClick={() => setOpen(true)}><ImagesIcon className="h-4 w-4" />Select from My Arts</Button>}
            </div>
            <input ref={fileRef} id={id} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => onUpload(event.target.files?.[0] ?? null)} />
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader><DialogTitle>Select from My Arts</DialogTitle><DialogDescription>Choose one of your posted art images for this board block.</DialogDescription></DialogHeader>
                    {artImages.length === 0 ? (
                        <div className="rounded-lg border py-12 text-center"><ImageOff className="mx-auto mb-3 h-6 w-6 text-muted-foreground" /><p className="text-sm text-muted-foreground">No art images yet</p></div>
                    ) : (
                        <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
                            {artImages.map((item) => (
                                <button key={item.id} type="button" onClick={() => { onSelect(item.id); setOpen(false) }} className={`rounded-lg border bg-background p-2 text-left transition-colors hover:bg-muted/40 ${value === item.id ? 'ring-2 ring-foreground' : ''}`}>
                                    <span className="block aspect-square overflow-hidden rounded-md bg-muted"><img src={storageUrl(item.image.image_path)!} alt={item.title} className="h-full w-full object-cover" /></span>
                                    <span className="mt-2 block truncate text-xs font-medium">{item.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
