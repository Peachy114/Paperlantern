import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

interface ChapterEditStatusProps {
    title: string
    status: string
    scheduledAt?: string
    onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onStatusChange: (value: string) => void
    onScheduledAtChange: (value: string) => void
}

export function ChapterEditStatus({
    title,
    status,
    scheduledAt,
    onTitleChange,
    onStatusChange,
    onScheduledAtChange,
}: ChapterEditStatusProps) {
    return (
        <div className="flex flex-col gap-6">
            {/* Title + Status */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="title">
                        Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="title"
                        name="title"
                        value={title}
                        onChange={onTitleChange}
                        placeholder="Chapter title"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={onStatusChange}>
                        <SelectTrigger id="status">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Scheduled date & time */}
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
                                    selected={(() => {
                                        if (!scheduledAt) return undefined
                                        const d = new Date(scheduledAt)
                                        return isNaN(d.getTime()) ? undefined : d
                                    })()}
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
