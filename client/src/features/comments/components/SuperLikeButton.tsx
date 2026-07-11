import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { commentsApi } from '@/api/comments'
import type { CommentTargetType } from '@/types/comment'
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
    const { token, user } = useAuthStore()
    const { openLogin } = useModalStore()
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: () => commentsApi.superLike(targetType, targetId).then((res) => res.data),
        onSuccess: (result) => {
            setCount(result.super_likes_count)
            queryClient.invalidateQueries({ queryKey: ['wallet'] })
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
                            Super Like costs 1 credit. The creator receives 80% and the website
                            receives 20%.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={mutation.isPending}
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
