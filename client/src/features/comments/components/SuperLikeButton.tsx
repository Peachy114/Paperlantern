import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Glasses, Rocket, Sparkles, Star } from 'lucide-react'
import { commentsApi } from '@/api/comments'
import type { CommentTargetType, SuperLikeAward } from '@/types/comment'
import { useAuthStore } from '@/store/authStore'
import { useModalStore } from '@/store/modalStore'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SuperLikeButtonProps {
    targetType: CommentTargetType
    targetId: string
    initialCount?: number
    label?: string
    size?: 'sm' | 'default'
    ownerUserId?: string | null
    className?: string
}

export default function SuperLikeButton({
    targetType,
    targetId,
    initialCount = 0,
    label = 'Super Like',
    size = 'sm',
    ownerUserId,
    className,
}: SuperLikeButtonProps) {
    const [count, setCount] = useState(initialCount)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [selectedAwardId, setSelectedAwardId] = useState<string | null>(null)
    const { token, user } = useAuthStore()
    const { openLogin } = useModalStore()
    const queryClient = useQueryClient()

    const { data: awards = [] } = useQuery({
        queryKey: ['super-like-awards'],
        queryFn: () => commentsApi.awards().then((res) => res.data.data),
        enabled: confirmOpen,
    })

    const selectedAward = awards.find((award) => award.id === selectedAwardId) ?? awards[0] ?? null

    const mutation = useMutation({
        mutationFn: () => commentsApi.superLike(targetType, targetId, selectedAward?.id).then((res) => res.data),
        onSuccess: (result) => {
            setCount(result.super_likes_count)
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
            if (targetType === 'comment') {
                queryClient.invalidateQueries({ queryKey: ['comments'] })
            }
            toast.success('Super Like sent.')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message ?? 'Could not send Super Like.')
        },
    })

    const click = () => {
        if (!token) {
            openLogin()
            return
        }

        if (ownerUserId && user?.id === ownerUserId) {
            toast.error('Cannot Super Like your own content.')
            return
        }

        setConfirmOpen(true)
    }

    return (
        <>
            <Button
                type="button"
                size={size}
                variant="outline"
                onClick={click}
                disabled={mutation.isPending}
                className={className}
            >
                <Sparkles className="h-4 w-4 text-amber-500" />
                {label ? <span>{label}</span> : null}
                <span className="text-xs text-muted-foreground">{count.toLocaleString()}</span>
            </Button>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send Super Like?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedAward
                                ? `${selectedAward.name} costs ${selectedAward.credit_cost} credit${selectedAward.credit_cost === 1 ? '' : 's'}.`
                                : 'Super Like costs credits.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-2 sm:grid-cols-3">
                        {(awards.length > 0 ? awards : []).map((award) => (
                            <AwardOption
                                key={award.id}
                                award={award}
                                selected={(selectedAward?.id ?? null) === award.id}
                                onSelect={() => setSelectedAwardId(award.id)}
                            />
                        ))}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={mutation.isPending || !selectedAward}
                            onClick={(event) => {
                                event.preventDefault()
                                mutation.mutate(undefined, {
                                    onSettled: () => setConfirmOpen(false),
                                })
                            }}
                        >
                            Yes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function AwardOption({
    award,
    selected,
    onSelect,
}: {
    award: SuperLikeAward
    selected: boolean
    onSelect: () => void
}) {
    const Icon = iconForAward(award.icon)

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`rounded-lg border p-3 text-left transition ${
                selected ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:bg-muted'
            }`}
        >
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{award.name}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
                {award.credit_cost} credit{award.credit_cost === 1 ? '' : 's'}
            </p>
        </button>
    )
}

function iconForAward(icon: string) {
    if (icon === 'rocket') return Rocket
    if (icon === 'glasses') return Glasses
    if (icon === 'star') return Star

    return Sparkles
}
