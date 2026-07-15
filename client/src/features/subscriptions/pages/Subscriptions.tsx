import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Crown, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { nobleRoyaltyApi, type SubscriptionPlan } from '@/api/nobleRoyalty'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function Subscriptions() {
    const queryClient = useQueryClient()
    const royalty = useQuery({
        queryKey: ['noble-royalty'],
        queryFn: () => nobleRoyaltyApi.browse().then((res) => res.data),
    })

    const subscribe = useMutation({
        mutationFn: (id: string) => nobleRoyaltyApi.subscribe(id),
        onSuccess: (res) => {
            toast.success(res.data.message)
            queryClient.invalidateQueries({ queryKey: ['noble-royalty'] })
        },
        onError: (error: any) => toast.error(error?.response?.data?.message ?? 'Could not start subscription.'),
    })

    const currentPlan = royalty.data?.current_subscription?.plan
    const plans = royalty.data?.plans ?? []

    return (
        <main className="mx-auto max-w-[1360px] px-4 py-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-amber-500" />
                        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        View your current plan and choose the subscription that fits your account.
                    </p>
                </div>
                {currentPlan ? (
                    <Badge variant="secondary" className="w-fit">
                        Current: {currentPlan.name}
                    </Badge>
                ) : (
                    <Badge variant="outline" className="w-fit">
                        No active plan
                    </Badge>
                )}
            </div>

            {royalty.isLoading ? (
                <div className="rounded-lg border p-8 text-sm text-muted-foreground">Loading subscriptions...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-3">
                    {plans.map((plan) => (
                        <SubscriptionCard
                            key={plan.id}
                            plan={plan}
                            active={currentPlan?.id === plan.id}
                            busy={subscribe.isPending}
                            onSubscribe={() => subscribe.mutate(plan.id)}
                        />
                    ))}
                    {plans.length === 0 && (
                        <div className="rounded-lg border p-8 text-sm text-muted-foreground md:col-span-3">
                            No subscription plans are available for this account yet.
                        </div>
                    )}
                </div>
            )}
        </main>
    )
}

function SubscriptionCard({
    plan,
    active,
    busy,
    onSubscribe,
}: {
    plan: SubscriptionPlan
    active: boolean
    busy: boolean
    onSubscribe: () => void
}) {
    return (
        <article className={`rounded-lg border bg-background p-4 ${plan.is_recommended ? 'ring-2 ring-amber-300' : ''}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold">{plan.name}</h2>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {plan.audience === 'storyteller' ? 'Artist' : 'Wanderer'} / {plan.tier_key}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {active && <Badge variant="secondary">Current</Badge>}
                    {plan.is_recommended && <Badge>Recommended</Badge>}
                </div>
            </div>
            {plan.description && <p className="mb-4 text-sm text-muted-foreground">{plan.description}</p>}
            {plan.promo_active && plan.promo_credit_cost !== null && (
                <Badge variant="secondary" className="mb-2 w-fit">
                    {plan.promo_label || 'Promo'}
                </Badge>
            )}
            <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{plan.effective_credit_cost} credits</p>
                {plan.promo_active && (
                    <p className="pb-1 text-sm text-muted-foreground line-through">{plan.monthly_credit_cost}</p>
                )}
            </div>
            <p className="text-xs text-muted-foreground">per 30 days</p>
            <div className="mt-4 grid gap-1.5 text-sm">
                <p>{plan.unlimited_board ? 'Unlimited My Board pieces' : `${plan.board_limit} My Board pieces`}</p>
                <p>
                    {plan.free_boost_days} free boost day{plan.free_boost_days === 1 ? '' : 's'} monthly
                </p>
                {plan.early_access && <p>Early access enabled</p>}
                {plan.perks.slice(0, 5).map((perk) => (
                    <p key={perk} className="text-muted-foreground">
                        {perk}
                    </p>
                ))}
            </div>
            <Button className="mt-4 w-full" disabled={active || busy} onClick={onSubscribe}>
                <Crown className="h-4 w-4" />
                {active ? 'Current Plan' : 'Subscribe'}
            </Button>
        </article>
    )
}
