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
import type { ConfirmAction } from './StudioTrashView'

interface Props {
    confirm: ConfirmAction
    acting: boolean
    onConfirm: () => void
    onClose: () => void
}

export default function StudioTrashConfirmDialog({ confirm, acting, onConfirm, onClose }: Props) {
    const isRestore = confirm?.type.startsWith('restore')

    return (
        <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isRestore ? 'Restore this item?' : 'Permanently delete?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isRestore
                            ? `"${confirm?.title}" will be restored and visible again.`
                            : `"${confirm?.title}" will be permanently deleted and cannot be recovered.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={acting}
                        className={isRestore ? '' : 'bg-red-500 text-white hover:bg-red-600'}
                    >
                        {acting ? '...' : isRestore ? 'Restore' : 'Delete forever'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
