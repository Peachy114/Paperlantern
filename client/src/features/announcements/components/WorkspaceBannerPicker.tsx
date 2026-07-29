import { useEffect, useMemo } from 'react'
import { ImagePlus } from 'lucide-react'
import { useAnnouncements } from '@/features/announcements/hooks/useAnnouncements'
import { storageUrl } from '@/utils/storage'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

type WorkspaceBannerPickerProps = {
    audience?: 'public' | 'artist' | 'studio'
    storageKey: string
    pageTarget?: string
    fallbackImage?: string | null
    onImageChange: (image: string | null) => void
}

export default function WorkspaceBannerPicker({
    audience = 'studio',
    storageKey,
    pageTarget,
    fallbackImage = null,
    onImageChange,
}: WorkspaceBannerPickerProps) {
    const { announcements } = useAnnouncements(audience)

    const bannerAnnouncements = useMemo(
        () =>
            announcements
                .filter((announcement) => Boolean(announcement.image))
                .filter((announcement) => {
                    const placement = announcement.placement ?? 'banner'
                    return placement === 'banner' || placement === 'hero' || placement === 'both'
                })
                .filter((announcement) => {
                    if (!pageTarget) return true
                    const targets = announcement.page_targets ?? []
                    return targets.length === 0 || targets.includes(pageTarget)
                })
                .sort((a, b) => {
                    const aEvent = a.is_event || a.tag === 'event'
                    const bEvent = b.is_event || b.tag === 'event'
                    if (aEvent !== bEvent) return aEvent ? -1 : 1
                    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                }),
        [announcements, pageTarget]
    )

    useEffect(() => {
        if (typeof window === 'undefined') return

        const selectedId = window.localStorage.getItem(storageKey)
        const selected = bannerAnnouncements.find((announcement) => announcement.id === selectedId)
        onImageChange(selected?.image ? storageUrl(selected.image) : null)
    }, [bannerAnnouncements, onImageChange, storageKey])

    const selectBanner = (id: string | null) => {
        if (typeof window === 'undefined') return

        if (id) {
            window.localStorage.setItem(storageKey, id)
            const selected = bannerAnnouncements.find((announcement) => announcement.id === id)
            onImageChange(selected?.image ? storageUrl(selected.image) : null)
            return
        }

        window.localStorage.removeItem(storageKey)
        onImageChange(null)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8 gap-1.5 rounded-full bg-background/90 px-3 text-xs font-bold shadow-sm backdrop-blur hover:bg-background"
                >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Change banner
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Change banner</DialogTitle>
                    <DialogDescription>
                        Pick an announcement or event image for this workspace banner.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => selectBanner(null)}
                        className="overflow-hidden rounded-2xl border border-dashed bg-muted/35 text-left transition hover:border-sky-300"
                    >
                        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-orange-100 via-rose-50 to-sky-100">
                            {fallbackImage ? (
                                <img src={fallbackImage} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <ImagePlus className="h-10 w-10 text-muted-foreground" />
                            )}
                        </div>
                        <div className="p-3">
                            <p className="text-sm font-black">Use automatic banner</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Uses the featured item from this workspace.
                            </p>
                        </div>
                    </button>

                    {bannerAnnouncements.map((announcement) => (
                        <button
                            key={announcement.id}
                            type="button"
                            onClick={() => selectBanner(announcement.id)}
                            className="overflow-hidden rounded-2xl border bg-background text-left transition hover:border-sky-300 hover:shadow-sm"
                        >
                            <div className="relative h-36 bg-muted">
                                <img
                                    src={storageUrl(announcement.image)!}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black uppercase text-orange-600 shadow-sm">
                                    {announcement.is_event || announcement.tag === 'event'
                                        ? 'Event'
                                        : 'Announcement'}
                                </span>
                            </div>
                            <div className="p-3">
                                <p className="line-clamp-1 text-sm font-black">
                                    {announcement.title}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {(announcement.page_targets?.length
                                        ? announcement.page_targets.join(', ')
                                        : 'All pages')}{' '}
                                    - {(announcement.placement ?? 'banner').toUpperCase()}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                {bannerAnnouncements.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Add an announcement image first, then return here to use it as a banner.
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
