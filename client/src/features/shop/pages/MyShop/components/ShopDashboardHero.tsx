// export function ShopDashboardHero({
//     items,
//     featuredItem,
//     publishedItems,
//     paidItems,
//     freeItems,
//     draftItems,
//     totalDownloads,
//     totalLikes,
//     workspaceBannerImage,
//     onWorkspaceBannerChange,
// }: {
//     items: ShopItem[]
//     featuredItem: ShopItem | null
//     publishedItems: number
//     paidItems: number
//     freeItems: number
//     draftItems: number
//     totalDownloads: number
//     totalLikes: number
//     workspaceBannerImage: string | null
//     onWorkspaceBannerChange: (image: string | null) => void
// }) {
//     const featuredImage = storageUrl(featuredItem?.image_path ?? null)
//     const activeBannerImage = workspaceBannerImage ?? featuredImage
//     const chartPoints = items.slice(0, 7).map((item) => ({
//         label: item.title.length > 10 ? `${item.title.slice(0, 9)}…` : item.title,
//         fullLabel: item.title,
//         downloads: Number(item.downloads_count) || 0,
//         likes: Number(item.likes_count) || 0,
//     }))
//     const downloadProducts = items.filter((item) => item.type === 'download').length
//     const adoptables = items.filter((item) => item.type === 'adoptable').length
//     const stickers = items.filter((item) => item.type === 'sticker').length

//     return (
//         <div className="space-y-4">
//             <section className="overflow-hidden rounded-[28px] border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-background to-orange-50/40 p-2.5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-3">
//                 <div className="grid gap-3 xl:grid-cols-[190px_minmax(0,1fr)]">
//                     <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
//                         <div className="relative min-h-56 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
//                             {activeBannerImage ? (
//                                 <img
//                                     src={activeBannerImage}
//                                     alt={featuredItem?.title ?? 'Featured shop product'}
//                                     className="absolute inset-0 h-full w-full object-cover"
//                                 />
//                             ) : (
//                                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 via-rose-50 to-sky-100 text-center">
//                                     <Store className="h-12 w-12 text-sky-500" />
//                                     <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
//                                         Your Shop
//                                     </p>
//                                 </div>
//                             )}

//                             <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 pb-3 pt-12 text-white">
//                                 <p className="line-clamp-1 text-sm font-bold">
//                                     {featuredItem?.title ?? 'Add your first product'}
//                                 </p>
//                                 <p className="mt-0.5 text-[10px] text-white/80">
//                                     {items.length} product{items.length === 1 ? '' : 's'} in your
//                                     shop
//                                 </p>
//                             </div>
//                         </div>

//                         <div className="rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
//                             <div className="flex items-center justify-between gap-3">
//                                 <div>
//                                     <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
//                                         Shop status
//                                     </p>
//                                     <p className="mt-1 text-sm font-bold">
//                                         {publishedItems > 0 ? 'Live' : 'Not published'}
//                                     </p>
//                                 </div>
//                                 <span
//                                     className={`h-2.5 w-2.5 rounded-full ${
//                                         publishedItems > 0
//                                             ? 'bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]'
//                                             : 'bg-slate-300 shadow-[0_0_0_5px_rgba(148,163,184,0.12)]'
//                                     }`}
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     <div className="rounded-2xl border border-border bg-background p-4 shadow-sm sm:p-5">
//                         <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
//                             <div>
//                                 <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-500">
//                                     Product Activity
//                                 </p>
//                                 <p className="mt-1 text-[11px] text-muted-foreground">
//                                     Downloads and likes across your shop products
//                                 </p>
//                             </div>
//                             <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
//                                 {totalDownloads.toLocaleString()} downloads ·{' '}
//                                 {totalLikes.toLocaleString()} likes
//                             </span>
//                         </div>

//                         <ShopPerformanceChart points={chartPoints} />

//                         <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
//                             <ShopDashboardStat
//                                 icon={<Store className="h-4 w-4" />}
//                                 label="Products"
//                                 value={items.length}
//                             />
//                             <ShopDashboardStat
//                                 icon={<Package className="h-4 w-4 text-emerald-500" />}
//                                 label="Published"
//                                 value={publishedItems}
//                             />
//                             <ShopDashboardStat
//                                 icon={<PackagePlus className="h-4 w-4 text-violet-500" />}
//                                 label="Paid"
//                                 value={paidItems}
//                             />
//                             <ShopDashboardStat
//                                 icon={<Package className="h-4 w-4 text-sky-500" />}
//                                 label="Free"
//                                 value={freeItems}
//                             />
//                             <ShopDashboardStat
//                                 icon={<Download className="h-4 w-4 text-sky-500" />}
//                                 label="Downloads"
//                                 value={totalDownloads}
//                             />
//                             <ShopDashboardStat
//                                 icon={<Heart className="h-4 w-4 fill-rose-500 text-rose-500" />}
//                                 label="Likes"
//                                 value={totalLikes}
//                             />
//                         </div>
//                     </div>
//                 </div>
//             </section>

//             <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
//                 <section className="rounded-[24px] border border-border bg-muted/35 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
//                     <div className="flex items-center gap-2">
//                         <Package className="h-4 w-4 text-orange-500" />
//                         <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
//                             Product mix
//                         </p>
//                     </div>

//                     <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
//                         <ShopMiniMetric label="Downloads" value={downloadProducts} />
//                         <ShopMiniMetric label="Adoptables" value={adoptables} />
//                         <ShopMiniMetric label="Stickers" value={stickers} />
//                         <ShopMiniMetric label="Paid products" value={paidItems} />
//                         <ShopMiniMetric label="Free products" value={freeItems} />
//                         <ShopMiniMetric label="Drafts" value={draftItems} />
//                     </div>
//                 </section>

//                 <section className="relative min-h-44 overflow-hidden rounded-[24px] border border-border bg-gradient-to-r from-rose-100 via-orange-50 to-sky-100 shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:from-rose-500/15 dark:via-orange-500/10 dark:to-sky-500/15">
//                     <div className="absolute right-3 top-3 z-20">
//                         <WorkspaceBannerPicker
//                             audience="studio"
//                             storageKey="workspace-banner-my-shop"
//                             pageTarget="my_shop"
//                             fallbackImage={featuredImage}
//                             onImageChange={onWorkspaceBannerChange}
//                         />
//                     </div>
//                     {activeBannerImage ? (
//                         <img
//                             src={activeBannerImage}
//                             alt="Shop banner"
//                             className="absolute inset-0 h-full w-full object-cover object-center"
//                         />
//                     ) : (
//                         <div className="absolute inset-0 flex items-center justify-center">
//                             <Store className="h-20 w-20 text-sky-400/70" />
//                         </div>
//                     )}
//                     <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
//                     {featuredItem ? (
//                         <div className="absolute bottom-4 right-4 max-w-[60%] rounded-full bg-black/45 px-4 py-2 text-right text-[10px] font-bold text-white backdrop-blur">
//                             {featuredItem.title}
//                         </div>
//                     ) : null}
//                 </section>
//             </div>
//         </div>
//     )
// }


import { Download, Heart, Package, PackagePlus, Store } from 'lucide-react'
import { storageUrl } from '@/utils/storage'
import WorkspaceBannerPicker from '@/features/announcements/components/WorkspaceBannerPicker'
import { ShopPerformanceChart, type ShopPerformancePoint } from './ShopPerformanceChart'
import { ShopDashboardStat, ShopMiniMetric } from './ShopStats'
import type { ShopItem, ShopStats } from '../types'

export function ShopDashboardHero({
    items,
    stats,
    workspaceBannerImage,
    onWorkspaceBannerChange,
}: {
    items: ShopItem[]
    stats: ShopStats
    workspaceBannerImage: string | null
    onWorkspaceBannerChange: (image: string | null) => void
}) {
    const {
        featuredItem,
        publishedItems,
        paidItems,
        freeItems,
        draftItems,
        totalDownloads,
        totalLikes,
        downloadProducts,
        adoptables,
        stickers,
    } = stats

    const featuredImage = storageUrl(featuredItem?.image_path ?? null)
    const activeBannerImage = workspaceBannerImage ?? featuredImage

    const chartPoints: ShopPerformancePoint[] = items.slice(0, 7).map((item) => ({
        label: item.title.length > 10 ? `${item.title.slice(0, 9)}…` : item.title,
        fullLabel: item.title,
        downloads: Number(item.downloads_count) || 0,
        likes: Number(item.likes_count) || 0,
    }))

    return (
        <div className="space-y-4">
            <section className="overflow-hidden rounded-[28px] border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-background to-orange-50/40 p-2.5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-3">
                <div className="grid gap-3 xl:grid-cols-[190px_minmax(0,1fr)]">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="relative min-h-56 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            {activeBannerImage ? (
                                <img
                                    src={activeBannerImage}
                                    alt={featuredItem?.title ?? 'Featured shop product'}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 via-rose-50 to-sky-100 text-center">
                                    <Store className="h-12 w-12 text-sky-500" />
                                    <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                                        Your Shop
                                    </p>
                                </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 pb-3 pt-12 text-white">
                                <p className="line-clamp-1 text-sm font-bold">
                                    {featuredItem?.title ?? 'Add your first product'}
                                </p>
                                <p className="mt-0.5 text-[10px] text-white/80">
                                    {items.length} product{items.length === 1 ? '' : 's'} in your
                                    shop
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                        Shop status
                                    </p>
                                    <p className="mt-1 text-sm font-bold">
                                        {publishedItems > 0 ? 'Live' : 'Not published'}
                                    </p>
                                </div>
                                <span
                                    className={`h-2.5 w-2.5 rounded-full ${
                                        publishedItems > 0
                                            ? 'bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]'
                                            : 'bg-slate-300 shadow-[0_0_0_5px_rgba(148,163,184,0.12)]'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm sm:p-5">
                        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-500">
                                    Product Activity
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    Downloads and likes across your shop products
                                </p>
                            </div>
                            <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                                {totalDownloads.toLocaleString()} downloads ·{' '}
                                {totalLikes.toLocaleString()} likes
                            </span>
                        </div>

                        <ShopPerformanceChart points={chartPoints} />

                        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
                            <ShopDashboardStat
                                icon={<Store className="h-4 w-4" />}
                                label="Products"
                                value={items.length}
                            />
                            <ShopDashboardStat
                                icon={<Package className="h-4 w-4 text-emerald-500" />}
                                label="Published"
                                value={publishedItems}
                            />
                            <ShopDashboardStat
                                icon={<PackagePlus className="h-4 w-4 text-violet-500" />}
                                label="Paid"
                                value={paidItems}
                            />
                            <ShopDashboardStat
                                icon={<Package className="h-4 w-4 text-sky-500" />}
                                label="Free"
                                value={freeItems}
                            />
                            <ShopDashboardStat
                                icon={<Download className="h-4 w-4 text-sky-500" />}
                                label="Downloads"
                                value={totalDownloads}
                            />
                            <ShopDashboardStat
                                icon={<Heart className="h-4 w-4 fill-rose-500 text-rose-500" />}
                                label="Likes"
                                value={totalLikes}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <section className="rounded-[24px] border border-border bg-muted/35 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                            Product mix
                        </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
                        <ShopMiniMetric label="Downloads" value={downloadProducts} />
                        <ShopMiniMetric label="Adoptables" value={adoptables} />
                        <ShopMiniMetric label="Stickers" value={stickers} />
                        <ShopMiniMetric label="Paid products" value={paidItems} />
                        <ShopMiniMetric label="Free products" value={freeItems} />
                        <ShopMiniMetric label="Drafts" value={draftItems} />
                    </div>
                </section>

                <section className="relative min-h-44 overflow-hidden rounded-[24px] border border-border bg-gradient-to-r from-rose-100 via-orange-50 to-sky-100 shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:from-rose-500/15 dark:via-orange-500/10 dark:to-sky-500/15">
                    <div className="absolute right-3 top-3 z-20">
                        <WorkspaceBannerPicker
                            audience="studio"
                            storageKey="workspace-banner-my-shop"
                            pageTarget="my_shop"
                            fallbackImage={featuredImage}
                            onImageChange={onWorkspaceBannerChange}
                        />
                    </div>
                    {activeBannerImage ? (
                        <img
                            src={activeBannerImage}
                            alt="Shop banner"
                            className="absolute inset-0 h-full w-full object-cover object-center"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Store className="h-20 w-20 text-sky-400/70" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
                    {featuredItem ? (
                        <div className="absolute bottom-4 right-4 max-w-[60%] rounded-full bg-black/45 px-4 py-2 text-right text-[10px] font-bold text-white backdrop-blur">
                            {featuredItem.title}
                        </div>
                    ) : null}
                </section>
            </div>
        </div>
    )
}