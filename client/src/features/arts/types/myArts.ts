import type { Art, ArtStatus } from '@/types/art'

// Form models ----
export interface ImageDraft {
    file: File
    preview: string
    description: string
}

export interface MyArtsFormState {
    title: string
    description: string
    labels: string[]
    labelInput: string
    status: ArtStatus
    applyWatermark: boolean
    images: ImageDraft[]
}

export type ArtConfirmation =
    | { type: 'trash'; art: Art }
    | { type: 'bulk-trash'; count: number }
    | { type: 'restore'; art: Art }
    | { type: 'force'; art: Art }
    | null
