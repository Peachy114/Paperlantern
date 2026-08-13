import { ArrowRight, Eye, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { HeroItem } from './types'

// Featured hero image-and-information detail modal ----
export function FeaturedHeroDetailsDialog({
    item,
    onClose,
    onViewDetails,
}: {
    item: HeroItem | null
    onClose: () => void
    onViewDetails: (item: HeroItem) => void
}) {
    const isAnnouncement = item?.type === 'announcement'

    return (
        <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[min(96vw,1050px)] max-w-none overflow-hidden p-0 sm:max-w-[1050px]">
                {item && (
                    <div className="grid max-h-[90vh] overflow-y-auto md:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                        <div className="flex min-h-[320px] items-center justify-center bg-zinc-950 p-4 md:min-h-[620px]">
                            <img
                                src={item.image!}
                                alt={item.title}
                                className="max-h-[76vh] w-full object-contain"
                            />
                        </div>

                        <div className="flex flex-col p-6 sm:p-8">
                            <DialogHeader className="text-left">
                                <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                                    {isAnnouncement
                                        ? item.announcement?.tag ?? 'Announcement'
                                        : item.type === 'work'
                                          ? item.work?.type === 'art'
                                              ? 'Art'
                                              : item.work?.type === 'wattpad'
                                              ? 'Novel'
                                              : 'Webcomic'
                                          : item.type}
                                </p>
                                <DialogTitle className="text-2xl sm:text-3xl">
                                    {item.title}
                                </DialogTitle>
                                <DialogDescription>
                                    {item.artist ? `By ${item.artist}` : 'Featured details'}
                                </DialogDescription>
                            </DialogHeader>

                            {item.description && (
                                <p className="mt-6 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                                    {item.description}
                                </p>
                            )}

                            <div className="mt-5 flex flex-wrap gap-2">
                                {item.labels?.map((label) => (
                                    <span
                                        key={label}
                                        className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-600 dark:text-orange-400"
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {typeof item.views === 'number' && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Eye className="h-4 w-4" />
                                        {item.views.toLocaleString()} views
                                    </span>
                                )}
                                {typeof item.likes === 'number' && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Heart className="h-4 w-4" />
                                        {item.likes.toLocaleString()} likes
                                    </span>
                                )}
                            </div>

                            {!isAnnouncement && item.href && (
                                <Button
                                    type="button"
                                    size="lg"
                                    className="mt-auto w-full bg-orange-500 text-white hover:bg-orange-600"
                                    onClick={() => onViewDetails(item)}
                                >
                                    View details
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
