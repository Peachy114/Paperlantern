import { useState, useRef } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { ImageIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'

interface ImageItem {
    preview: string
    file?: File
}

interface ChapterEditImagesProps {
    workType: 'webtoon' | 'wattpad'
    coverPreview: string | null
    imageItems: ImageItem[]
    onCroppedFile: (file: File) => void
    onImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemoveImage: (index: number) => void
    onReorderImages: (from: number, to: number) => void
}

function centerAspectCrop(w: number, h: number, aspect: number): Crop {
    return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, w, h), w, h)
}

export function ChapterEditImages({ coverPreview, onCroppedFile }: ChapterEditImagesProps) {
    const [src, setSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<Crop>()
    const imgRef = useRef<HTMLImageElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setSrc(URL.createObjectURL(file))
        setCrop(undefined)
        setCompletedCrop(undefined)
    }

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget
        setCrop(centerAspectCrop(width, height, 3 / 4))
    }

    const handleConfirm = () => {
        if (!imgRef.current || !completedCrop) return
        const canvas = document.createElement('canvas')
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height
        canvas.width = completedCrop.width * scaleX
        canvas.height = completedCrop.height * scaleY
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(
            imgRef.current,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        )
        canvas.toBlob((blob) => {
            if (!blob) return
            onCroppedFile(new File([blob], 'chapter-cover.jpg', { type: 'image/jpeg' }))
            setSrc(null)
        }, 'image/jpeg')
    }

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium">Chapter cover</Label>
                    <label
                        className={cn(
                            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors overflow-hidden',
                            'border-border hover:border-muted-foreground/50 bg-muted/20 h-36'
                        )}
                    >
                        {coverPreview ? (
                            <img
                                src={coverPreview}
                                alt="Cover"
                                className="absolute inset-0 w-full h-full object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImageIcon className="h-6 w-6 opacity-40" />
                                <span className="text-xs">Click to upload cover</span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="sr-only"
                        />
                    </label>
                </div>
            </div>

            <Dialog open={!!src} onOpenChange={(o) => !o && setSrc(null)}>
                <DialogContent className="max-w-2xl w-[95vw]">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-medium">
                            Crop chapter cover
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Crop and confirm your chapter cover image
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-auto min-h-[60vh] flex items-center justify-center">
                        {src && (
                            <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={3 / 4}
                                keepSelection
                            >
                                <img
                                    ref={imgRef}
                                    src={src}
                                    onLoad={onImageLoad}
                                    className="max-w-full w-full"
                                />
                            </ReactCrop>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSrc(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirm}>Apply crop</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
