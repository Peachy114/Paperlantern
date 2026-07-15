import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface Props {
    title: string
    status: string
    scheduledAt?: string
    onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onStatusChange: (value: string) => void
    onScheduledAtChange: (value: string) => void
    onOpenScheduled: () => void
}

export default function ChapterCreateStatus({
    title,
    status,
    scheduledAt,
    onTitleChange,
    onStatusChange,
    onScheduledAtChange,
    onOpenScheduled,
}: Props) {
    const statuses = [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Publish' },
        { value: 'scheduled', label: 'Scheduled' },
    ]

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="title">
                        Episode title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="title"
                        name="title"
                        value={title}
                        onChange={onTitleChange}
                        placeholder="Episode title"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="status">Status</Label>
                    <div className="flex flex-wrap gap-2">
                        {statuses.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onStatusChange(option.value)}
                                className={cn(
                                    'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                                    status === option.value
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={onOpenScheduled}
                            className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                            Check scheduled episodes
                        </button>
                    </div>
                </div>
            </div>

            {status === 'scheduled' && (
                <div className="flex flex-col gap-2">
                    <Label>Scheduled date &amp; time</Label>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-44 justify-start font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                    {scheduledAt ? (
                                        format(new Date(scheduledAt), 'MM/dd/yyyy')
                                    ) : (
                                        <span className="text-muted-foreground">Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={scheduledAt ? new Date(scheduledAt) : undefined}
                                    onSelect={(date) => {
                                        if (!date) return
                                        const time = scheduledAt?.slice(11, 16) || '00:00'
                                        onScheduledAtChange(`${format(date, 'yyyy-MM-dd')}T${time}`)
                                    }}
                                    disabled={(date) => date < new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                        <Input
                            type="time"
                            value={scheduledAt?.slice(11, 16) ?? ''}
                            onChange={(e) => {
                                const date =
                                    scheduledAt?.slice(0, 10) ?? format(new Date(), 'yyyy-MM-dd')
                                onScheduledAtChange(`${date}T${e.target.value}`)
                            }}
                            className="w-32"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
