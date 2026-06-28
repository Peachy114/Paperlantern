// components/LowCreditModal.tsx
import { useNavigate } from 'react-router-dom'
import { Coins } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
    isOpen: boolean
    onClose: () => void
    balance: number
}

export function LowCreditModal({ isOpen, onClose, balance }: Props) {
    const navigate = useNavigate()

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xs gap-5">
                <DialogHeader className="gap-1">
                    <DialogTitle className="text-sm font-medium">Not enough credits</DialogTitle>
                    <DialogDescription className="text-sm">
                        You have{' '}
                        <span className="font-medium text-foreground">
                            {balance} {balance === 1 ? 'credit' : 'credits'}
                        </span>{' '}
                        remaining. Top up to keep reading.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800/40 dark:bg-amber-950/30">
                    <Coins className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                        Credits balance is low
                    </span>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        className="w-full"
                        onClick={() => {
                            onClose()
                            navigate('/credits')
                        }}
                    >
                        Buy credits
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={onClose}
                    >
                        Maybe later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
