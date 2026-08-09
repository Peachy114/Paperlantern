import type { ArtStatus } from '@/types/art'
import type { MyArtsFormState } from '@/features/arts/types/myArts'

// Form defaults ----
export const EMPTY_ART_FORM: MyArtsFormState = {
    title: '',
    description: '',
    labels: [],
    labelInput: '',
    status: 'published',
    applyWatermark: true,
    images: [],
}

// Presentation ----
export const ART_STATUS_COLOR: Record<ArtStatus, string> = {
    draft: 'text-gray-400',
    published: 'text-green-500',
    archived: 'text-yellow-500',
}
