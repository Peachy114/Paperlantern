// features/studio/components/work-view/WorkTypeSelectModal.tsx

interface WorkTypeSelectModalProps {
    open: boolean
    selectedType: 'webtoon' | 'wattpad'
    onSelectType: (type: 'webtoon' | 'wattpad') => void
    onCancel: () => void
    onConfirm: () => void
}

export default function WorkTypeSelectModal({
    open,
    selectedType,
    onSelectType,
    onCancel,
    onConfirm,
}: WorkTypeSelectModalProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-background border rounded-lg w-full max-w-xs overflow-hidden shadow-lg">
                <div className="px-5 py-4 border-b">
                    <h2 className="font-semibold">New Work</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">What are you making?</p>
                </div>
                <div className="p-5">
                    <div className="flex gap-3 mb-5">
                        {(['webtoon', 'wattpad'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => onSelectType(type)}
                                className={`flex-1 py-2.5 text-sm border rounded-md transition-colors cursor-pointer ${
                                    selectedType === type
                                        ? 'bg-foreground text-background border-foreground'
                                        : 'text-muted-foreground hover:border-foreground/40'
                                }`}
                            >
                                {type === 'webtoon' ? 'Webtoon' : 'Novel'}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-2 text-sm border rounded-md text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
