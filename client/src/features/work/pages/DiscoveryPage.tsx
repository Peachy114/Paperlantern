import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { pageLayoutApi } from '@/api/pageLayouts'
import { DiscoveryPageWidgets } from '@/features/page-builder/DiscoveryPageWidgets'
import type { PageKey, PageLayout } from '@/types/pageLayout'
import ComixLists from '../components/ComixListSection'
import { useHome } from '../hooks/useHome'

const PAGE_TITLES: Partial<Record<PageKey, string>> = {
    daily: 'Daily',
    rankings: 'Rankings',
    genre: 'Genre',
}

export default function DiscoveryPage() {
    const location = useLocation()
    const page = useMemo<PageKey>(() => {
        if (location.pathname.startsWith('/rankings')) return 'rankings'
        if (location.pathname.startsWith('/genre')) return 'genre'
        return 'daily'
    }, [location.pathname])
    const homeData = useHome()
    const layout = useQuery<PageLayout>({
        queryKey: ['public-page-layout', page],
        queryFn: () => pageLayoutApi.publicShow(page).then((res) => res.data),
    })

    return (
        <div>
            {/* <div className="mx-auto max-w-[1360px] px-5 pt-8">
                <h1 className="text-3xl font-bold tracking-tight">{PAGE_TITLES[page]}</h1>
            </div> */}
            {layout.data?.widgets?.length ? (
                <DiscoveryPageWidgets widgets={layout.data.widgets} data={homeData} />
            ) : null}
            <ComixLists />
        </div>
    )
}
