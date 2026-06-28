import { Moon, Sun } from 'lucide-react'

interface Props {
    dark: boolean
    toggle: () => void
}

export default function ProfileToggleMode({ dark, toggle }: Props) {
    return (
        <div className="flex gap-2">
            <button
                onClick={() => !dark && toggle()}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm transition-colors ${
                    dark ? 'bg-muted font-semibold' : 'text-muted-foreground hover:bg-muted/50'
                }`}
            >
                <Moon className="w-4 h-4" />
                Dark
            </button>
            <button
                onClick={() => dark && toggle()}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm transition-colors ${
                    !dark ? 'bg-muted font-semibold' : 'text-muted-foreground hover:bg-muted/50'
                }`}
            >
                <Sun className="w-4 h-4" />
                Light
            </button>
        </div>
    )
}
