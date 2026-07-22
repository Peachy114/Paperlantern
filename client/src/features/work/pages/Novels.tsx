import { useQuery } from '@tanstack/react-query'
import { pageLayoutApi } from '@/api/pageLayouts'
import { DiscoveryPageWidgets } from '@/features/page-builder/DiscoveryPageWidgets'
import type { PageLayout } from '@/types/pageLayout'
import { useHome } from '../hooks/useHome'
import ComixLists from '../components/ComixListSection'

export default function Novels() {
    const homeData = useHome()
    const layout = useQuery<PageLayout>({
        queryKey: ['public-page-layout', 'novels'],
        queryFn: () => pageLayoutApi.publicShow('comix').then((res) => res.data),
    })

    return (
        <div>
            {layout.data?.widgets?.length ? (
                <DiscoveryPageWidgets widgets={layout.data.widgets} data={homeData} />
            ) : null}
            <ComixLists fixedType="novel" />
        </div>
    )
}
