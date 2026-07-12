import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import { useState, useRef, useEffect } from 'react'
import NavbarView from '@/components/navbar/NavbarView'

export default function NavbarWrapper() {
    const { user, token } = useAuthStore()
    const { openLogin } = useModalStore()
    const location = useLocation()
    const [profileOpen, setProfileOpen] = useState(false)
    const profileButtonRef = useRef<HTMLButtonElement>(null)
    const [navbarHidden, setNavbarHidden] = useState(false)

    const lastScrollY = useRef(0)
    const scrollLock = useRef(false)
    const navbarHiddenRef = useRef(false)
    const isChapterPageRef = useRef(false)

    const isChapterPage = /\/comics\/\d+\/chapters\/\d+/.test(location.pathname)
    const isComixActive = location.pathname.startsWith('/comix')
    const isArtistsActive = location.pathname.startsWith('/explore/arts')

    useEffect(() => {
        isChapterPageRef.current = isChapterPage
        if (isChapterPage) return

        navbarHiddenRef.current = false
        const resetTimer = window.setTimeout(() => setNavbarHidden(false), 0)

        return () => window.clearTimeout(resetTimer)
    }, [isChapterPage])

    useEffect(() => {
        let ticking = false
        const handleScroll = () => {
            if (ticking) return
            ticking = true
            requestAnimationFrame(() => {
                ticking = false
                if (scrollLock.current) return
                const current = window.scrollY
                const prev = lastScrollY.current
                const diff = current - prev
                lastScrollY.current = current
                if (isChapterPageRef.current) {
                    if (diff > 0 && current > 100 && !navbarHiddenRef.current) {
                        scrollLock.current = true
                        navbarHiddenRef.current = true
                        setNavbarHidden(true)
                        setTimeout(() => {
                            scrollLock.current = false
                        }, 500)
                    } else if (diff < 0 && navbarHiddenRef.current) {
                        scrollLock.current = true
                        navbarHiddenRef.current = false
                        setNavbarHidden(false)
                        setTimeout(() => {
                            scrollLock.current = false
                        }, 500)
                    }
                }
            })
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleProfileClick = () => {
        if (!token) {
            openLogin()
        } else {
            setProfileOpen(!profileOpen)
        }
    }

    return (
        <NavbarView
            user={user}
            token={token}
            isChapterPage={isChapterPage}
            isComicsActive={isComixActive}
            isNovelsActive={isArtistsActive}
            navbarHidden={navbarHidden}
            profileOpen={profileOpen}
            profileButtonRef={profileButtonRef}
            onProfileClick={handleProfileClick}
            setProfileOpen={setProfileOpen}
        />
    )
}
