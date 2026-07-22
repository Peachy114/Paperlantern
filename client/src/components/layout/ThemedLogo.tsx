import { useEffect, useState, type ImgHTMLAttributes } from 'react'

type ThemedLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
    darkSrc?: string
    lightSrc?: string
    borderRadius?: number
}

const isDarkMode = () => document.documentElement.classList.contains('dark')

export default function ThemedLogo({
    darkSrc = '/new_logo.png',
    lightSrc = '/new_logo.png',
    alt = 'logo',
    borderRadius = 10,
    ...props
}: ThemedLogoProps) {
    const [dark, setDark] = useState(isDarkMode)

    useEffect(() => {
        const observer = new MutationObserver(() => setDark(isDarkMode()))

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        })

        return () => observer.disconnect()
    }, [])

    return (
        <img
            src={dark ? darkSrc : lightSrc}
            alt={alt}
            style={{ borderRadius: `${borderRadius}px` }}
            {...props}
        />
    )
}
