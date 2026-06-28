import { Trash2 } from 'lucide-react'

export default function StudioTrashEmpty() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <Trash2 className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Your trash is empty.</p>
        </div>
    )
}
