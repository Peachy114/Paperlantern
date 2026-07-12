import { useEffect, useState, type ImgHTMLAttributes } from 'react'

type ThemedLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
    darkSrc?: string
    lightSrc?: string
}

const isDarkMode = () => document.documentElement.classList.contains('dark')

export default function ThemedLogo({
    darkSrc = '/logo_white_nav.png',
    lightSrc = '/logo_black_nav.png',
    alt = 'logo',
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

    return <img src={dark ? darkSrc : lightSrc} alt={alt} {...props} />
}
