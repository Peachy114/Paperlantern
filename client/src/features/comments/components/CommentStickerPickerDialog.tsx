import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Gift, ImageOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { commentsApi } from '@/api/comments'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ArtistSticker } from '@/types/artistProfile'
import { storageUrl } from '@/utils/storage'

// Comment sticker picker ----
export function CommentStickerPickerDialog({
    open,
    onOpenChange,
    artistUsername,
    onSelect,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    artistUsername?: string | null
    onSelect: (sticker: ArtistSticker) => void
}) {
    const queryClient = useQueryClient()
    const [accessSticker, setAccessSticker] = useState<ArtistSticker | null>(null)

    const { data: library, isLoading: libraryLoading } = useQuery({
        queryKey: ['comment-sticker-library'],
        queryFn: () => commentsApi.stickerLibrary().then((res) => res.data.data),
        enabled: open,
    })
    const { data: store, isLoading: storeLoading } = useQuery({
        queryKey: ['artist-sticker-store', artistUsername],
        queryFn: () => commentsApi.artistStickers(artistUsername!).then((res) => res.data.data),
        enabled: open && Boolean(artistUsername),
    })

    const refreshStickerData = () => {
        queryClient.invalidateQueries({ queryKey: ['comment-sticker-library'] })
        queryClient.invalidateQueries({ queryKey: ['artist-sticker-store', artistUsername] })
        queryClient.invalidateQueries({ queryKey: ['wallet'] })
    }

    const finishStickerAccess = (sticker: ArtistSticker, message: string) => {
        refreshStickerData()
        setAccessSticker(null)
        onSelect({
            ...sticker,
            can_use: true,
        })
        onOpenChange(false)
        toast.success(message)
    }

    const purchaseMutation = useMutation({
        mutationFn: (sticker: ArtistSticker) =>
            commentsApi.purchaseSticker(sticker.id).then((res) => res.data),
        onSuccess: (sticker) => {
            finishStickerAccess(
                sticker,
                sticker.is_free ? 'Sticker added and selected.' : 'Sticker bought and selected.'
            )
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not buy sticker.')
        },
    })

    const subscribeMutation = useMutation({
        mutationFn: (sticker: ArtistSticker) =>
            commentsApi.subscribeSticker(sticker.id).then((res) => res.data),
        onSuccess: (sticker) => {
            finishStickerAccess(sticker, 'Sticker subscribed and selected.')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not subscribe to sticker.')
        },
    })

    const myStickers = useMemo(() => library ?? [], [library])
    const artistStickers = useMemo(() => store ?? [], [store])
    const accessCost =
        accessSticker?.purchase_cost ?? accessSticker?.credit_cost ?? 1
    const accessBusy = purchaseMutation.isPending || subscribeMutation.isPending

    const handleArtistStickerSelect = (sticker: ArtistSticker) => {
        const canUse = sticker.can_use ?? sticker.library_status !== undefined

        if (canUse) {
            onSelect(sticker)
            onOpenChange(false)
            return
        }

        setAccessSticker(sticker)
    }

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) setAccessSticker(null)
                    onOpenChange(nextOpen)
                }}
            >
                <DialogContent className="w-[min(96vw,1100px)] max-w-none sm:max-w-[1100px]">
                    <DialogHeader>
                        <DialogTitle>Stickers</DialogTitle>
                        <DialogDescription>
                            Pick from your library or get a sticker directly from the artist.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="library">
                        <TabsList>
                            <TabsTrigger value="library">My Library</TabsTrigger>
                            <TabsTrigger value="artist" disabled={!artistUsername}>
                                Artist Stickers
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="library">
                            <StickerGrid
                                stickers={myStickers}
                                loading={libraryLoading}
                                empty="No stickers in your library yet"
                                onSelect={(sticker) => {
                                    onSelect(sticker)
                                    onOpenChange(false)
                                }}
                            />
                        </TabsContent>

                        <TabsContent value="artist">
                            <StickerGrid
                                stickers={artistStickers}
                                loading={storeLoading}
                                empty="No artist stickers yet"
                                onSelect={handleArtistStickerSelect}
                                onRequestAccess={setAccessSticker}
                                busy={accessBusy}
                            />
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(accessSticker)}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen && !accessBusy) setAccessSticker(null)
                }}
            >
                <DialogContent className="w-[min(94vw,460px)]">
                    <DialogHeader>
                        <DialogTitle>Get this sticker?</DialogTitle>
                        <DialogDescription>
                            Buy or subscribe here. You do not need to leave the comment section or
                            open the Shop.
                        </DialogDescription>
                    </DialogHeader>

                    {accessSticker && (
                        <div className="grid gap-4">
                            <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl border bg-muted/20 p-3">
                                <img
                                    src={storageUrl(accessSticker.image_path)!}
                                    alt={accessSticker.name}
                                    draggable={false}
                                    onContextMenu={(event) => event.preventDefault()}
                                    className="h-full w-full select-none object-contain"
                                />
                            </div>

                            <div className="rounded-lg border bg-muted/20 p-3 text-center">
                                <p className="font-semibold">{accessSticker.name}</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {accessCost <= 0 || accessSticker.is_free
                                        ? 'Free sticker'
                                        : `${accessCost} credits`}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={accessBusy}
                            onClick={() => setAccessSticker(null)}
                        >
                            Cancel
                        </Button>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={!accessSticker || accessBusy}
                                onClick={() => {
                                    if (accessSticker) subscribeMutation.mutate(accessSticker)
                                }}
                            >
                                {subscribeMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Gift className="h-4 w-4" />
                                )}
                                Subscribe
                            </Button>

                            <Button
                                type="button"
                                disabled={!accessSticker || accessBusy}
                                onClick={() => {
                                    if (accessSticker) purchaseMutation.mutate(accessSticker)
                                }}
                            >
                                {purchaseMutation.isPending && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                {accessCost <= 0 || accessSticker?.is_free
                                    ? 'Get free'
                                    : `Buy for ${accessCost} credits`}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function StickerGrid({
    stickers,
    loading,
    empty,
    onSelect,
    onRequestAccess,
    busy = false,
}: {
    stickers: ArtistSticker[]
    loading: boolean
    empty: string
    onSelect: (sticker: ArtistSticker) => void
    onRequestAccess?: (sticker: ArtistSticker) => void
    busy?: boolean
}) {
    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (stickers.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center">
                <ImageOff className="mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{empty}</p>
            </div>
        )
    }

    return (
        <div className="grid max-h-[70vh] grid-cols-2 gap-4 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
            {stickers.map((sticker) => {
                const canUse = sticker.can_use ?? sticker.library_status !== undefined
                const cost = sticker.purchase_cost ?? sticker.credit_cost ?? 1
                const chooseSticker = () => {
                    if (canUse) {
                        onSelect(sticker)
                        return
                    }

                    onRequestAccess?.(sticker)
                }

                return (
                    <div
                        key={sticker.id}
                        className="flex min-h-[220px] flex-col rounded-xl border bg-muted/10 p-3"
                    >
                        <button
                            type="button"
                            disabled={busy}
                            onClick={chooseSticker}
                            className="relative flex aspect-square min-h-[170px] flex-1 items-center justify-center rounded-lg bg-transparent p-2 transition hover:bg-muted/30 disabled:opacity-60 sm:min-h-[190px]"
                            title={
                                canUse
                                    ? `Use ${sticker.name}`
                                    : `Get ${sticker.name} without leaving comments`
                            }
                        >
                            <img
                                src={storageUrl(sticker.image_path)!}
                                alt={sticker.name}
                                draggable={false}
                                onContextMenu={(event) => event.preventDefault()}
                                className="h-full max-h-[220px] w-full select-none object-contain"
                            />

                            {!canUse && (
                                <span className="absolute bottom-2 right-2 rounded-full bg-background/95 px-2 py-1 text-[10px] font-semibold shadow">
                                    {cost <= 0 || sticker.is_free ? 'FREE' : `${cost} CR`}
                                </span>
                            )}
                        </button>

                        <Button
                            type="button"
                            size="sm"
                            variant={canUse ? 'ghost' : 'default'}
                            className="mt-3 h-9 w-full"
                            disabled={busy}
                            onClick={chooseSticker}
                        >
                            {canUse
                                ? 'Use'
                                : cost <= 0 || sticker.is_free
                                  ? 'Get free'
                                  : 'Buy / Subscribe'}
                        </Button>
                    </div>
                )
            })}
        </div>
    )
}
