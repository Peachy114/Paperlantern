import { useHome } from '@/features/work/hooks/useHome'
import News from '@/components/layout/News'
import Welcome from '@/components/pages/Welcome'
import HeroSection from '../components/ui/HeroSection'
import WeeklyChartSection from '../components/ui/WeeklyChartSection'
import FreshReleasesSection from '../components/ui/FreshReleasesSection'
import LatestChaptersSection from '../components/ui/LatestChaptersSection'

export default function Homepage() {
    const { hero, weeklyChart, freshReleases, latestChapters, cover } = useHome()

    const isEmpty =
        weeklyChart.length === 0 &&
        freshReleases.length === 0 &&
        latestChapters.length === 0 &&
        hero.length === 0

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
                rel="stylesheet"
            />

            {isEmpty ? (
                <Welcome />
            ) : (
                <div className="w-full">
                    <HeroSection hero={hero} cover={cover} />

                    <div className="px-6">
                        <WeeklyChartSection weeklyChart={weeklyChart} cover={cover} />
                        <News audience="public" />
                        <FreshReleasesSection freshReleases={freshReleases} cover={cover} />
                        <LatestChaptersSection latestChapters={latestChapters} cover={cover} />
                    </div>
                </div>
            )}
        </>
    )
}
