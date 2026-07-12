import { lazy, Suspense } from 'react'
import { useHome } from '@/features/work/hooks/useHome'
import Welcome from '@/features/work/components/Welcome'
import HeroSection from '../components/HeroSection'

const WeeklyChartSection = lazy(() => import('../components/WeeklyChartSection'))
const FreshReleasesSection = lazy(() => import('../components/FreshReleasesSection'))
const LatestChaptersSection = lazy(() => import('../components/LatestChaptersSection'))

export default function Homepage() {
    const { hero, weeklyChart, freshReleases, latestChapters, cover, isLoading } = useHome()

    const isEmpty =
        weeklyChart.length === 0 &&
        freshReleases.length === 0 &&
        latestChapters.length === 0 &&
        hero.length === 0

    return (
        <>
            {!isLoading && isEmpty ? (
                <Welcome />
            ) : (
                <div className="w-full">
                    <HeroSection audience="public" />
                    <Suspense fallback={null}>
                        <WeeklyChartSection weeklyChart={weeklyChart} cover={cover} />
                        <FreshReleasesSection freshReleases={freshReleases} cover={cover} />
                        <LatestChaptersSection latestChapters={latestChapters} cover={cover} />
                    </Suspense>
                </div>
            )}
        </>
    )
}
