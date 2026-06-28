// components/ui/UnlockModal.tsx
import { useNavigate } from 'react-router-dom'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface Props {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    chapterTitle: string
    creditsRequired: number
    userBalance: number
    unlocking: boolean
}

export default function UnlockModal({
    open,
    onClose,
    onConfirm,
    chapterTitle,
    creditsRequired,
    userBalance,
    unlocking,
}: Props) {
    const navigate = useNavigate()
    const canAfford = userBalance >= creditsRequired
    const shortfall = creditsRequired - userBalance

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-xs gap-0 p-0 overflow-hidden">
                <DialogHeader className="px-5 py-4 border-b">
                    <DialogTitle className="text-sm font-medium">Unlock chapter</DialogTitle>
                    <DialogDescription className="truncate text-xs">
                        {chapterTitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 p-5">
                    {/* Cost row */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Cost</span>
                        <span className="text-sm font-medium text-amber-500">
                            ₵ {creditsRequired}
                        </span>
                    </div>

                    <Separator />

                    {/* Balance row */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Your balance</span>
                        <span className="text-sm font-medium">₵ {userBalance}</span>
                    </div>

                    {canAfford ? (
                        /* Balance after row */
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Balance after</span>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                ₵ {userBalance - creditsRequired}
                            </span>
                        </div>
                    ) : (
                        /* Shortfall banner */
                        <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800/40 dark:bg-red-950/30">
                            <span className="text-xs text-red-600 dark:text-red-400">Short by</span>
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                ₵ {shortfall} credits
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-1">
                        {canAfford ? (
                            <Button className="w-full" onClick={onConfirm} disabled={unlocking}>
                                {unlocking ? 'Unlocking…' : 'Confirm unlock'}
                            </Button>
                        ) : (
                            <Button
                                className="w-full"
                                onClick={() => {
                                    onClose()
                                    navigate('/credits')
                                }}
                            >
                                Buy credits
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={onClose}
                            disabled={unlocking}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
