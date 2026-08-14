import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import ImageCropDialog from '@/components/shared/ImageCropDialog'

interface CreateWorkImagesProps {
    coverPreview: string | null
    bannerPreview: string | null
    fieldErrors: Record<string, string>
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: 'cover' | 'banner') => void
    onCroppedFile: (file: File, field: 'cover' | 'banner') => void
}

const ASPECTS = { cover: 3 / 4, banner: 16 / 9 }
const IDEAL = { cover: '400 × 600px', banner: '1280 × 720px' }

export default function CreateWorkImages({
    coverPreview,
    bannerPreview,
    fieldErrors,
    onCroppedFile,
}: CreateWorkImagesProps) {
    const previews = { cover: coverPreview, banner: bannerPreview }

    const [cropModal, setCropModal] = useState<{
        field: 'cover' | 'banner'
        src: string
    } | null>(null)

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: 'cover' | 'banner'
    ) => {
        const file = e.target.files?.[0]
        if (!file) return
        const src = URL.createObjectURL(file)
        setCropModal({ field, src })
    }

    return (
        <>
            <Card>
                <CardContent className="pt-5 flex flex-col gap-5">
                    {(['cover', 'banner'] as const).map((field) => (
                        <div key={field} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="capitalize text-sm font-medium">
                                    {field} image
                                </label>
                                <span className="text-xs text-muted-foreground">
                                    Ideal: {IDEAL[field]}
                                </span>
                            </div>

                            <label
                                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden bg-muted ${
                                    field === 'cover' ? 'h-[360px]' : 'aspect-[16/9]'
                                } ${
                                    fieldErrors[field]
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

                            {fieldErrors[field] && (
                                <p className="text-xs text-red-400">{fieldErrors[field]}</p>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            <ImageCropDialog
                key={cropModal?.src ?? 'work-create-crop'}
                open={Boolean(cropModal)}
                source={cropModal?.src ?? null}
                aspect={cropModal ? ASPECTS[cropModal.field] : 1}
                title={`Crop ${cropModal?.field ?? 'work'} image`}
                outputName={`${cropModal?.field ?? 'work'}.jpg`}
                onClose={() => setCropModal(null)}
                onComplete={(file) => { if (cropModal) onCroppedFile(file, cropModal.field) }}
            />
        </>
    )
}
