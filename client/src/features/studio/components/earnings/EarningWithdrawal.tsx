import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

const PAYOUT_METHODS = ['gcash', 'maya', 'bank'] as const
type PayoutMethod = (typeof PAYOUT_METHODS)[number]

const METHOD_LABEL: Record<PayoutMethod, string> = {
    gcash: 'GCash',
    maya: 'Maya',
    bank: 'Bank Transfer',
}

const METHOD_PLACEHOLDER: Record<PayoutMethod, string> = {
    gcash: 'GCash number (e.g. 09171234567)',
    maya: 'Maya number (e.g. 09171234567)',
    bank: 'Bank name · Account number · Account name',
}

interface Props {
    open: boolean
    balancePhp: number
    method: PayoutMethod
    details: string
    amount: string
    submitting: boolean
    error?: string | null
    onClose: () => void
    onMethodChange: (m: PayoutMethod) => void
    onDetailsChange: (v: string) => void
    onAmountChange: (v: string) => void
    onSubmit: () => void
}

export default function EarningWithdrawal({
    open,
    balancePhp,
    method,
    details,
    amount,
    submitting,
    error,
    onClose,
    onMethodChange,
    onDetailsChange,
    onAmountChange,
    onSubmit,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Withdraw Earnings</DialogTitle>
                    <DialogDescription>
                        Available: ₱{balancePhp.toFixed(2)} · Min. withdrawal ₱200
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <Label>Amount (PHP)</Label>
                        <Input
                            type="number"
                            min={200}
                            max={balancePhp}
                            value={amount}
                            onChange={(e) => onAmountChange(e.target.value)}
                            placeholder="e.g. 500"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>Payout method</Label>
                        <div className="flex gap-2">
                            {PAYOUT_METHODS.map((m) => (
                                <Button
                                    key={m}
                                    type="button"
                                    variant={method === m ? 'default' : 'outline'}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                        onMethodChange(m)
                                        onDetailsChange('')
                                    }}
                                >
                                    {METHOD_LABEL[m]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>{METHOD_LABEL[method]} details</Label>
                        <Input
                            value={details}
                            onChange={(e) => onDetailsChange(e.target.value)}
                            placeholder={METHOD_PLACEHOLDER[method]}
                        />
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Processing takes 3–5 business days. You'll be notified once approved.
                    </p>

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            disabled={submitting || !amount || !details || parseFloat(amount) < 200}
                            onClick={onSubmit}
                        >
                            {submitting ? 'Submitting…' : 'Submit request'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
