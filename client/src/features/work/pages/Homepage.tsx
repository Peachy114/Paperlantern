import { useHome } from '@/features/work/hooks/useHome'
import Welcome from '@/components/pages/Welcome'
import HeroSection from '../components/HeroSection'
import WeeklyChartSection from '../components/WeeklyChartSection'
import FreshReleasesSection from '../components/FreshReleasesSection'
import LatestChaptersSection from '../components/LatestChaptersSection'

export default function Homepage() {
    const { hero, weeklyChart, freshReleases, latestChapters, cover } = useHome()

    const isEmpty =
        weeklyChart.length === 0 &&
        freshReleases.length === 0 &&
        latestChapters.length === 0 &&
        hero.length === 0

    return (
        <>
            {isEmpty ? (
                <Welcome />
            ) : (
                <div className="w-full">
                    <HeroSection audience="public" />
                    <WeeklyChartSection weeklyChart={weeklyChart} cover={cover} />
                    <FreshReleasesSection freshReleases={freshReleases} cover={cover} />
                    <LatestChaptersSection latestChapters={latestChapters} cover={cover} />
                </div>
            )}
        </>
    )
}
