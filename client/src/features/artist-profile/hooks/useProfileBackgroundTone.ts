import { useEffect, useState } from 'react'

export type ProfileBackgroundTone = 'light' | 'dark'

// Profile background brightness detection ----
function currentThemeTone(): ProfileBackgroundTone {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function useProfileBackgroundTone(backgroundImage: string | null) {
    const [tone, setTone] = useState<ProfileBackgroundTone>(() =>
        typeof document === 'undefined' ? 'light' : currentThemeTone()
    )

    useEffect(() => {
        if (!backgroundImage) {
            setTone(currentThemeTone())
            return
        }

        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                canvas.width = 24
                canvas.height = 24
                const context = canvas.getContext('2d', { willReadFrequently: true })
                if (!context) return
                context.drawImage(image, 0, 0, 24, 24)
                const pixels = context.getImageData(0, 0, 24, 24).data
                let luminance = 0
                let samples = 0
                for (let index = 0; index < pixels.length; index += 16) {
                    if (pixels[index + 3] < 32) continue
                    luminance += 0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2]
                    samples += 1
                }
                if (samples) setTone(luminance / samples < 140 ? 'dark' : 'light')
            } catch {
                setTone(currentThemeTone())
            }
        }
        image.onerror = () => setTone(currentThemeTone())
        image.src = backgroundImage
    }, [backgroundImage])

    return tone
}
