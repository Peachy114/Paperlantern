import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ChapterImagePreviewDialogProps {
    open: boolean
    mode: 'pc' | 'mobile'
    images: string[]
    onOpenChange: (open: boolean) => void
}

export default function ChapterImagePreviewDialog({
    open,
    mode,
    images,
    onOpenChange,
}: ChapterImagePreviewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="h-[96dvh] w-[min(96vw,1180px)] max-w-none overflow-hidden p-0 sm:max-w-none">
                <DialogHeader className="border-b px-5 py-4">
                    <DialogTitle>{mode === 'mobile' ? 'Mobile Preview' : 'PC Preview'}</DialogTitle>
                    <DialogDescription>
                        This shows the uploaded pages as a scrollable public chapter preview.
                    </DialogDescription>
                </DialogHeader>

                {/* reader viewport section ---- */}
                <div className="min-h-0 overflow-auto bg-muted/40 px-4 py-5">
                    <div
                        className={cn(
                            'mx-auto h-[calc(96dvh-8rem)] overflow-hidden bg-zinc-950 shadow-xl',
                            mode === 'mobile'
                                ? 'w-[390px] max-w-full rounded-[2rem] border-[10px] border-zinc-950'
                                : 'w-[min(920px,calc(100vw-6rem))] rounded-xl'
                        )}
                    >
                        <div className="h-full overflow-y-auto">
                            {images.length === 0 ? (
                                <div className="flex min-h-full items-center justify-center px-6 py-24 text-center text-sm text-zinc-400">
                                    No pages uploaded yet.
                                </div>
                            ) : (
                                images.map((src, index) => (
                                    <img
                                        key={`${src}-${index}`}
                                        src={src}
                                        alt={`Preview page ${index + 1}`}
                                        className="block w-full select-none"
                                        draggable={false}
                                        loading={index < 2 ? 'eager' : 'lazy'}
                                        decoding="async"
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
