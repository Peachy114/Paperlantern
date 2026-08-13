import { useRef, useState, type WheelEvent as ReactWheelEvent } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, type PercentCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export interface ImageCropDialogProps {
    open: boolean
    source: string | null
    aspect: number
    title: string
    description?: string
    outputName: string
    outputWidth?: number
    outputHeight?: number
    originalFile?: File | null
    allowFullImage?: boolean
    onClose: () => void
    onComplete: (file: File, mode: 'cover' | 'contain', placement?: { x: number; y: number; zoom: number }) => void
}

export default function ImageCropDialog({
    open,
    source,
    aspect,
    title,
    description,
    outputName,
    outputWidth,
    outputHeight,
    originalFile,
    allowFullImage = false,
    onClose,
    onComplete,
}: ImageCropDialogProps) {
    const imageRef = useRef<HTMLImageElement>(null)
    const [crop, setCrop] = useState<PercentCrop>()
    const [completedCrop, setCompletedCrop] = useState<PercentCrop>()
    const [zoom, setZoom] = useState(1)
    const [baseSize, setBaseSize] = useState<{ width: number; height: number } | null>(null)
    const preserveAnimation = originalFile?.type === 'image/gif'

    const reset = () => {
        setZoom(1)
        const image = imageRef.current
        if (!image) return
        const initial = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, image.width, image.height), image.width, image.height) as PercentCrop
        setCrop(initial)
        setCompletedCrop(initial)
    }

    const onImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        const image = event.currentTarget
        const rendered = image.getBoundingClientRect()
        setBaseSize({ width: rendered.width, height: rendered.height })
        const initial = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, rendered.width, rendered.height), rendered.width, rendered.height) as PercentCrop
        setCrop(initial)
        setCompletedCrop(initial)
        setZoom(1)
    }

    const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
        const direction = event.deltaY < 0 ? 1 : -1
        setZoom((current) => Math.min(4, Math.max(1, current + direction * 0.15)))
    }

    const applyCrop = () => {
        const placement = completedCrop ? {
            x: completedCrop.x + completedCrop.width / 2,
            y: completedCrop.y + completedCrop.height / 2,
            zoom: Math.max(1, 100 / Math.max(completedCrop.width, 1)),
        } : undefined
        if (preserveAnimation && originalFile) {
            onComplete(originalFile, 'cover', placement)
            onClose()
            return
        }
        const image = imageRef.current
        if (!image || !completedCrop) return
        const sourceX = image.naturalWidth * completedCrop.x / 100
        const sourceY = image.naturalHeight * completedCrop.y / 100
        const sourceWidth = image.naturalWidth * completedCrop.width / 100
        const sourceHeight = image.naturalHeight * completedCrop.height / 100
        const canvas = document.createElement('canvas')
        canvas.width = outputWidth ?? Math.max(1, Math.round(sourceWidth))
        canvas.height = outputHeight ?? Math.max(1, Math.round(sourceHeight))
        const context = canvas.getContext('2d')
        if (!context) return
        context.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height
        )
        canvas.toBlob((blob) => {
            if (!blob) return
            onComplete(new File([blob], outputName, { type: 'image/jpeg' }), 'cover')
            onClose()
        }, 'image/jpeg', 0.9)
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="z-[13000] w-[95vw] max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {preserveAnimation
                            ? 'Animated GIFs are kept in their original format so their animation continues to play. The frame will crop it visually.'
                            : description ?? 'Use the mouse wheel over the image to zoom, then move or resize the crop.'}
                    </DialogDescription>
                </DialogHeader>
                <div
                    onWheelCapture={handleWheel}
                    className="relative max-h-[65vh] overscroll-contain overflow-auto rounded-lg bg-muted/40 p-2"
                >
                    <div className="flex min-h-48 items-center justify-center">
                        {source && (
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
                                aspect={aspect}
                                keepSelection
                            >
                                <img
                                    ref={imageRef}
                                    src={source}
                                    alt="Crop preview"
                                    onLoad={onImageLoad}
                                    className="max-h-[58vh] max-w-full select-none"
                                    style={baseSize ? {
                                        width: `${baseSize.width * zoom}px`,
                                        height: `${baseSize.height * zoom}px`,
                                        maxWidth: 'none',
                                        maxHeight: 'none',
                                    } : undefined}
                                    draggable={false}
                                />
                            </ReactCrop>
                        )}
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button type="button" size="sm" variant="ghost" onClick={reset}>
                        <RotateCcw className="h-4 w-4" /> Reset zoom
                    </Button>
                </div>
                <DialogFooter className="gap-2 sm:justify-between">
                    {allowFullImage && originalFile ? (
                        <Button type="button" variant="outline" onClick={() => { onComplete(originalFile, 'contain'); onClose() }}>
                            Use full image
                        </Button>
                    ) : <span />}
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="button" onClick={applyCrop}>Apply crop</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
