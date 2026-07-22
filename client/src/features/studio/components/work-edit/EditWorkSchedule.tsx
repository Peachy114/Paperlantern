import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import FieldError from '@/components/ui/FieldError'

const DAYS = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
    { value: 'sun', label: 'Sun' },
] as const

const RECURRING = ['daily', 'weekly', 'biweekly', 'monthly'] as const

interface EditWorkScheduleProps {
    status: string
    schedule: string
    scheduleTime: string
    onStatusChange: (e: any) => void
    onScheduleChange: (e: any) => void
    onScheduleTimeChange: (e: any) => void
    statusError: boolean
    scheduleError: boolean
    scheduleTimeError: boolean
    fieldErrors: Record<string, string>
}

export default function EditWorkSchedule({
    status,
    schedule,
    scheduleTime,
    onStatusChange,
    onScheduleChange,
    onScheduleTimeChange,
    statusError,
    scheduleError,
    scheduleTimeError,
    fieldErrors,
}: EditWorkScheduleProps) {
    // Mirror the same schedule mode logic as CreateWork
    const scheduleMode = DAYS.some((d) => d.value === schedule)
        ? 'days'
        : RECURRING.includes(schedule as (typeof RECURRING)[number])
          ? 'recurring'
          : ''

    const selectValue =
        scheduleMode === 'days' ? 'days' : scheduleMode === 'recurring' ? schedule : '__none__'

    const selectedDays = scheduleMode === 'days' ? [schedule] : []

    const handleDayToggle = (day: string) => {
        const newVal = schedule === day ? '' : day
        onScheduleChange({ target: { name: 'schedule', value: newVal } })
    }

    const handleRecurringChange = (val: string) => {
        onScheduleChange({ target: { name: 'schedule', value: val } })
    }

    const handleScheduleModeChange = (mode: string) => {
        if (mode === 'days') {
            onScheduleChange({ target: { name: 'schedule', value: 'mon' } })
        } else {
            onScheduleChange({ target: { name: 'schedule', value: '' } })
        }
    }

    return (
        <>
            {/* Completion + Schedule */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label>Series completion</Label>
                    <label
                        className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm ${
                            statusError ? 'border-red-400' : 'border-input'
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={status === 'completed'}
                            onChange={(event) =>
                                onStatusChange({
                                    target: {
                                        name: 'status',
                                        value: event.target.checked ? 'completed' : 'ongoing',
                                    },
                                })
                            }
                            className="h-4 w-4"
                        />
                        Completed
                    </label>
                    <FieldError fieldErrors={fieldErrors} field="status" />
                </div>

                {/* Update schedule */}
                <div className="flex flex-col gap-1.5">
                    <Label>Update schedule</Label>
                    <Select
                        value={selectValue}
                        onValueChange={(val) => {
                            if (val === '__none__') {
                                onScheduleChange({ target: { name: 'schedule', value: '' } })
                            } else if (val === 'days') {
                                handleScheduleModeChange('days')
                            } else {
                                handleRecurringChange(val)
                            }
                        }}
                    >
                        <SelectTrigger className={scheduleError ? 'border-red-400' : ''}>
                            <SelectValue placeholder="No schedule" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">No schedule</SelectItem>
                            <SelectItem value="days">Specific days</SelectItem>
                            <Separator className="my-1" />
                            {RECURRING.map((r) => (
                                <SelectItem key={r} value={r}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldError fieldErrors={fieldErrors} field="schedule" />
                </div>

                {/* Schedule time */}
                {schedule && (
                    <div className="flex flex-col gap-1.5 max-w-[200px]">
                        <Label>Preferred update time</Label>
                        <Input
                            type="time"
                            name="schedule_time"
                            value={scheduleTime}
                            onChange={onScheduleTimeChange}
                            className={scheduleTimeError ? 'border-red-400' : ''}
                        />
                        <FieldError fieldErrors={fieldErrors} field="schedule_time" />
                    </div>
                )}
            </div>

            {/* Day picker */}
            {scheduleMode === 'days' && (
                <div className="flex flex-col gap-2">
                    <Label className="text-sm text-muted-foreground">Pick days</Label>
                    <div className="flex flex-wrap gap-2">
                        {DAYS.map((d) => (
                            <button
                                key={d.value}
                                type="button"
                                onClick={() => handleDayToggle(d.value)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                    selectedDays.includes(d.value)
                                        ? 'bg-foreground text-background border-foreground'
                                        : 'bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground'
                                }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}
