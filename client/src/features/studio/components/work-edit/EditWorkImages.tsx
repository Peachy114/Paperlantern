import { useState, useRef } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import FieldError from '@/components/ui/FieldError'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'

interface EditWorkImagesProps {
    coverPreview: string | null
    bannerPreview: string | null
    onCroppedFile: (file: File, field: 'cover' | 'banner') => void
    coverError: boolean
    bannerError: boolean
    fieldErrors: Record<string, string>
}

const ASPECTS = { cover: 3 / 4, banner: 16 / 9 } as const
const IDEAL = { cover: '400 × 600px', banner: '1280 × 720px' } as const

function centerAspectCrop(w: number, h: number, aspect: number): Crop {
    return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, w, h), w, h)
}

type CropField = 'cover' | 'banner'
type CropModal = { field: CropField; src: string } | null

export default function EditWorkImages({
    coverPreview,
    bannerPreview,
    onCroppedFile,
    coverError,
    bannerError,
    fieldErrors,
}: EditWorkImagesProps) {
    const previews: Record<CropField, string | null> = {
        cover: coverPreview,
        banner: bannerPreview,
    }
    const errors: Record<CropField, boolean> = { cover: coverError, banner: bannerError }

    const [cropModal, setCropModal] = useState<CropModal>(null)
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<Crop>()
    const imgRef = useRef<HTMLImageElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: CropField) => {
        const file = e.target.files?.[0]
        if (!file) return
        setCropModal({ field, src: URL.createObjectURL(file) })
        setCrop(undefined)
        setCompletedCrop(undefined)
    }

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget
        setCrop(centerAspectCrop(width, height, ASPECTS[cropModal!.field]))
    }

    const handleCropConfirm = () => {
        if (!imgRef.current || !completedCrop || !cropModal) return
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
            onCroppedFile(
                new File([blob], `${cropModal.field}.jpg`, { type: 'image/jpeg' }),
                cropModal.field
            )
            setCropModal(null)
        }, 'image/jpeg')
    }

    return (
        <>
            <Card>
                <CardContent className="pt-5 flex flex-col gap-5">
                    {(['cover', 'banner'] as const).map((field) => (
                        <div key={field} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="capitalize">{field} image</Label>
                                <span className="text-xs text-muted-foreground">
                                    Ideal: {IDEAL[field]}
                                </span>
                            </div>
                            <label
                                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden bg-muted ${
                                    field === 'cover' ? 'h-[400px]' : 'aspect-[16/9]'
                                } ${
                                    errors[field]
                                        ? 'border-red-400'
                                        : 'border-border hover:border-foreground/40'
                                }`}
                            >
                                {previews[field] ? (
                                    <img
                                        src={previews[field]!}
                                        alt={`${field} preview`}
                                        className={`absolute inset-0 w-full h-full ${
                                            field === 'cover' ? 'object-contain' : 'object-cover'
                                        }`}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                        <span className="text-2xl">
                                            {field === 'cover' ? '🖼' : '🏞'}
                                        </span>
                                        <span className="text-xs">Click to upload</span>
                                        <span className="text-[10px] text-muted-foreground/60">
                                            {field === 'cover' ? '3:4 ratio' : '16:9 ratio'}
                                        </span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, field)}
                                    className="sr-only"
                                />
                            </label>
                            <FieldError fieldErrors={fieldErrors} field={field} />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Dialog open={!!cropModal} onOpenChange={(o) => !o && setCropModal(null)}>
                <DialogContent className="max-w-2xl w-[95vw]">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-medium">
                            Crop {cropModal?.field} image
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Crop and confirm your {cropModal?.field} image
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-auto min-h-[60vh] flex items-center justify-center">
                        {cropModal && (
                            <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={ASPECTS[cropModal.field]}
                                keepSelection
                            >
                                <img
                                    ref={imgRef}
                                    src={cropModal.src}
                                    onLoad={onImageLoad}
                                    className="max-w-full w-full"
                                />
                            </ReactCrop>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setCropModal(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCropConfirm}>Apply crop</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
