// features/studio/components/work-view/WorkViewHeader.tsx
import { useState } from 'react'
import { Menu, X, PlusCircle, Trash2 } from 'lucide-react'

interface WorkViewHeaderProps {
    onNew: () => void
    onNavigate: (path: string) => void
}

export default function WorkViewHeader({ onNew, onNavigate }: WorkViewHeaderProps) {
    const [open, setOpen] = useState(false)

    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Your Studio</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your works</p>
            </div>

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
                <button
                    onClick={onNew}
                    className="text-sm px-3 py-1.5 bg-foreground text-background rounded-md hover:opacity-80 transition-opacity inline-flex items-center gap-2"
                >
                    <PlusCircle size={15} />
                    New Work
                </button>
                <button
                    onClick={() => onNavigate('/studio/trash')}
                    className="text-sm px-3 py-1.5 border rounded-md hover:bg-accent transition-colors text-muted-foreground"
                >
                    Trash
                </button>
            </div>

            {/* Mobile hamburger */}
            <div className="relative sm:hidden">
                <button
                    onClick={() => setOpen((prev) => !prev)}
                    className="w-9 h-9 flex items-center justify-center rounded-md border hover:bg-accent transition-colors"
                >
                    {open ? <X size={18} /> : <Menu size={18} />}
                </button>

                {open && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <div className="absolute right-0 top-11 z-20 bg-background border rounded-lg shadow-lg overflow-hidden min-w-[160px]">
                            <button
                                onClick={() => {
                                    onNew()
                                    setOpen(false)
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center gap-2.5"
                            >
                                <PlusCircle size={15} className="text-muted-foreground" />
                                New Work
                            </button>
                            <button
                                onClick={() => {
                                    onNavigate('/studio/trash')
                                    setOpen(false)
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center gap-2.5 border-t text-muted-foreground"
                            >
                                <Trash2 size={15} />
                                Trash
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
