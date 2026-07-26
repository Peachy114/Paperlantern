import { useState } from 'react'
import { Menu, Plus, Trash2, X } from 'lucide-react'

interface WorkViewHeaderProps {
    onNew: () => void
    onNavigate: (path: string) => void
}

export default function WorkViewHeader({ onNew, onNavigate }: WorkViewHeaderProps) {
    const [open, setOpen] = useState(false)

    return (
        <div className="flex items-center">
            <div className="hidden items-center gap-2 sm:flex">
                <button
                    type="button"
                    onClick={onNew}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-sky-400 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-sky-500"
                >
                    <Plus size={14} strokeWidth={3} />
                    New Work
                </button>
                <button
                    type="button"
                    onClick={() => onNavigate('/studio/trash')}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-sky-400 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-sky-500"
                >
                    <Trash2 size={13} />
                    Trash
                </button>
            </div>

            <div className="relative sm:hidden">
                <button
                    type="button"
                    onClick={() => setOpen((current) => !current)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-400 text-white shadow-sm transition hover:bg-sky-500"
                    aria-label="Open workspace actions"
                >
                    {open ? <X size={18} /> : <Menu size={18} />}
                </button>

                {open ? (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <div className="absolute right-0 top-11 z-20 min-w-[160px] overflow-hidden rounded-xl border bg-background shadow-lg">
                            <button
                                type="button"
                                onClick={() => {
                                    onNew()
                                    setOpen(false)
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition hover:bg-accent"
                            >
                                <Plus size={15} className="text-sky-500" />
                                New Work
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onNavigate('/studio/trash')
                                    setOpen(false)
                                }}
                                className="flex w-full items-center gap-2.5 border-t px-4 py-2.5 text-left text-sm text-muted-foreground transition hover:bg-accent"
                            >
                                <Trash2 size={15} />
                                Trash
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    )
}
