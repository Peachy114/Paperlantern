import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, Minus, Plus, Sparkles } from 'lucide-react'
import { boostApi, type BoostKind, type BoostTargetType } from '@/api/boosts'
import { useWallet } from '@/hooks/useWallet'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BoostModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    kind: BoostKind
    targetType: BoostTargetType
    targetId?: string
    title: string
    placement: string
    onBoosted?: () => void
}

export default function BoostModal({
    open,
    onOpenChange,
    kind,
    targetType,
    targetId,
    title,
    placement,
    onBoosted,
}: BoostModalProps) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { wallet, refetch } = useWallet()
    const [days, setDays] = useState(1)

    const prices = useQuery({
        queryKey: ['boost-prices'],
        queryFn: () => boostApi.prices().then((res) => res.data),
        staleTime: 5 * 60 * 1000,
    })

    const pricePerDay = prices.data?.[kind] ?? 0
    const totalCost = useMemo(() => days * pricePerDay, [days, pricePerDay])
    const balance = wallet?.balance ?? 0
    const canAfford = balance >= totalCost

    const boost = useMutation({
        mutationFn: () =>
            boostApi.create({
                target_type: targetType,
                target_id: targetId,
                days,
            }),
        onSuccess: () => {
            toast.success('Boost activated.')
            refetch()
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
            onBoosted?.()
            onOpenChange(false)
            setDays(1)
        },
        onError: () => {
            toast.error('Could not activate boost. Check your credits and try again.')
        },
    })

    const updateDays = (value: number) => {
        setDays(Math.min(30, Math.max(1, value || 1)))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Boost {title}
                    </DialogTitle>
                    <DialogDescription>
                        This boost places it near the top of {placement} while the boost is active.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="boost-days">Days to boost</Label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => updateDays(days - 1)}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                id="boost-days"
                                type="number"
                                min={1}
                                max={30}
                                value={days}
                                onChange={(event) => updateDays(Number(event.target.value))}
                                className="text-center"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => updateDays(days + 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Price per day</span>
                            <span>{pricePerDay.toLocaleString()} credits</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between font-medium">
                            <span>Total</span>
                            <span>{totalCost.toLocaleString()} credits</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Your balance</span>
                            <span>{balance.toLocaleString()} credits</span>
                        </div>
                    </div>

                    {!canAfford && totalCost > 0 && (
                        <p className="text-xs text-red-500">
                            You need {(totalCost - balance).toLocaleString()} more credits.
                        </p>
                    )}
                </div>

                <DialogFooter>
                    {!canAfford ? (
                        <Button type="button" onClick={() => navigate('/credits')}>
                            Top up credits
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            disabled={boost.isPending || prices.isLoading || totalCost === 0}
                            onClick={() => boost.mutate()}
                        >
                            {boost.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Boost for {totalCost.toLocaleString()} credits
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
