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
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[1050px] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-3rem)] sm:max-w-[1050px]">
                {item && (
                    <div className="grid min-w-0 max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto md:grid-cols-[minmax(0,3fr)_minmax(19rem,2fr)]">
                        <div className="flex min-h-0 items-center justify-center overflow-hidden bg-[var(--surface-muted)] md:h-[min(72vh,640px)]">
                            <img
                                src={item.image!}
                                alt={item.title}
                                className="h-auto max-h-[48vh] w-full object-contain md:h-full md:max-h-none"
                            />
                        </div>

                        <div className="flex min-w-0 flex-col overflow-hidden p-5 sm:p-7 md:max-h-[min(72vh,640px)]">
                            <DialogHeader className="min-w-0 pr-5 text-left">
                                <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                                    {isAnnouncement
                                        ? (item.announcement?.tag ?? 'Announcement')
                                        : item.type === 'work'
                                          ? item.work?.type === 'art'
                                              ? 'Art'
                                              : item.work?.type === 'wattpad'
                                                ? 'Novel'
                                                : 'Webcomic'
                                          : item.type}
                                </p>
                                <DialogTitle className="max-w-full break-words text-2xl leading-tight [overflow-wrap:anywhere] sm:text-3xl">
                                    {item.title}
                                </DialogTitle>
                                <DialogDescription>
                                    {item.artist ? `By ${item.artist}` : 'Featured details'}
                                </DialogDescription>
                            </DialogHeader>

                            {item.description && (
                                <p className="mt-5 max-h-44 overflow-y-auto whitespace-pre-line break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                                    {item.description}
                                </p>
                            )}

                            <div className="mt-5 flex flex-wrap gap-2">
                                {item.labels?.map((label) => (
                                    <span
                                        key={label}
                                        className="rounded-full bg-[var(--category)] px-3 py-1 text-xs font-bold text-[var(--selected-foreground)]"
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
                                    variant="selected"
                                    className="mt-8 w-full md:mt-auto"
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
