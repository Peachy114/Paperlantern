import { useEffect } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import AppRoutes from '@/routes'

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
        </BrowserRouter>
    )
}

function ScrollToTop() {
    const { pathname, search } = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname, search])

    return null
}

export default App
