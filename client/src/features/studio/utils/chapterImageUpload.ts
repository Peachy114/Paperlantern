import { studioApi } from '@/api/studio'

const MAX_CHAPTER_IMAGE_BATCH_FILES = 5
const MAX_CHAPTER_IMAGE_BATCH_BYTES = 6 * 1024 * 1024

export async function uploadChapterImagesInBatches(
    workSlug: string,
    chapterSlug: string,
    images: File[]
) {
    for (const batch of createChapterImageBatches(images)) {
        const formData = new FormData()
        batch.forEach((image) => formData.append('images[]', image))
        await studioApi.uploadChapterImages(workSlug, chapterSlug, formData)
    }
}

function createChapterImageBatches(images: File[]) {
    const batches: File[][] = []
    let currentBatch: File[] = []
    let currentBytes = 0

    images.forEach((image) => {
        const wouldExceedFiles = currentBatch.length >= MAX_CHAPTER_IMAGE_BATCH_FILES
        const wouldExceedBytes =
            currentBatch.length > 0 &&
            currentBytes + image.size > MAX_CHAPTER_IMAGE_BATCH_BYTES

        if (wouldExceedFiles || wouldExceedBytes) {
            batches.push(currentBatch)
            currentBatch = []
            currentBytes = 0
        }

        currentBatch.push(image)
        currentBytes += image.size
    })

    if (currentBatch.length > 0) batches.push(currentBatch)

    return batches
}
