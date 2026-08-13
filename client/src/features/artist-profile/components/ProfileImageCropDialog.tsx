import { useMemo } from 'react'
import ImageCropDialog from '@/components/shared/ImageCropDialog'

type ProfileMediaField = 'cover' | 'avatar' | 'background_image'

export interface ProfileCropRequest {
    field: ProfileMediaField
    file: File
    width: number
    height: number
}

export function ProfileImageCropDialog({
    request,
    onClose,
    onComplete,
}: {
    request: ProfileCropRequest | null
    onClose: () => void
    onComplete: (file: File, fit: 'cover' | 'contain', placement?: { x: number; y: number; zoom: number }) => void
}) {
    // The keyed parent remounts this wrapper for every selected file. Avoid effect
    // cleanup here because React Strict Mode would revoke the preview during its
    // development remount check.
    const source = useMemo(() => request ? URL.createObjectURL(request.file) : null, [request])

    return (
        <ImageCropDialog
            open={Boolean(request)}
            source={source}
            aspect={request ? request.width / request.height : 1}
            title={`Adjust ${request?.field === 'avatar' ? 'profile image' : request?.field === 'background_image' ? 'background image' : 'cover image'}`}
            description={`Crop to the current ${request?.width ?? 0} × ${request?.height ?? 0}px frame. Scroll over the image to zoom.`}
            outputName={`profile-${request?.field ?? 'image'}.jpg`}
            outputWidth={request?.width}
            outputHeight={request?.height}
            originalFile={request?.file}
            allowFullImage
            onClose={onClose}
            onComplete={onComplete}
        />
    )
}
