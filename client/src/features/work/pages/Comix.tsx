import { useQuery } from '@tanstack/react-query'
import { pageLayoutApi } from '@/api/pageLayouts'
import DiscoveryPageWidgets  from '@/features/page-builder/DiscoveryPageWidgets'
import type { PageLayout } from '@/types/pageLayout'
import { useHome } from '../hooks/useHome'
import ComixLists from '../components/ComixListSection'
import BannerComixList from '../components/BannerComixSection'

const SHOW_LEGACY_NON_PAGE_CUSTOMIZE_DEFAULTS = false

export default function Comix() {
    const homeData = useHome()
    const layout = useQuery<PageLayout>({
        queryKey: ['public-page-layout', 'comix'],
        queryFn: () => pageLayoutApi.publicShow('comix').then((res) => res.data),
    })

    return (
        <div>
            {layout.data?.widgets?.length ? (
                <DiscoveryPageWidgets widgets={layout.data.widgets} data={homeData} />
            ) : null}
            {SHOW_LEGACY_NON_PAGE_CUSTOMIZE_DEFAULTS ? (
                <>
                    {/* Old non-PageCustomize Comix defaults kept intentionally. */}
                    <BannerComixList />
                    <ComixLists fixedType="comic" />
                </>
            ) : null}
        </div>
    )
}
