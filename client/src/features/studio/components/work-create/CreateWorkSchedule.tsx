import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FieldError from '@/components/ui/FieldError'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface CreateWorkScheduleProps {
    status: string
    schedule: string
    scheduleTime: string
    scheduleMode: string
    selectValue: string
    selectedDays: string[]
    days: readonly { readonly value: string; readonly label: string }[]
    recurring: readonly string[]
    onStatusChange: (e: any) => void
    onScheduleModeChange: (mode: string) => void
    onRecurringChange: (val: string) => void
    onDayToggle: (day: string) => void
    onScheduleTimeChange: (e: any) => void
    statusError: boolean
    scheduleTimeError: boolean
    fieldErrors: Record<string, string>
}

export default function CreateWorkSchedule({
    status,
    schedule,
    scheduleTime,
    scheduleMode,
    selectValue,
    selectedDays,
    days,
    recurring,
    onStatusChange,
    onScheduleModeChange,
    onRecurringChange,
    onDayToggle,
    onScheduleTimeChange,
    statusError,
    scheduleTimeError,
    fieldErrors,
}: CreateWorkScheduleProps) {
    return (
        <>
            {/* Status + Schedule */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status */}
                <div className="flex flex-col gap-1.5">
                    <Label>Status</Label>
                    <Select
                        value={status}
                        onValueChange={(val) =>
                            onStatusChange({
                                target: { name: 'status', value: val },
                            })
                        }
                    >
                        <SelectTrigger className={statusError ? 'border-red-400' : ''}>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="ongoing">Ongoing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="hiatus">Hiatus</SelectItem>
                        </SelectContent>
                    </Select>
                    <FieldError fieldErrors={fieldErrors} field="status" />
                </div>

                {/* Update Schedule */}
                <div className="flex flex-col gap-1.5">
                    <Label>Update schedule</Label>
                    <Select
                        value={selectValue}
                        onValueChange={(val) => {
                            if (val === '__none__') {
                                onStatusChange({
                                    target: { name: 'schedule', value: '' },
                                })
                            } else if (val === 'days') {
                                onScheduleModeChange('days')
                            } else {
                                onRecurringChange(val)
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="No schedule" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">No schedule</SelectItem>
                            <SelectItem value="days">Specific days</SelectItem>
                            <Separator className="my-1" />
                            {recurring.map((r) => (
                                <SelectItem key={r} value={r}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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

            {/* Day picker — shows when "Specific days" selected */}
            {scheduleMode === 'days' && (
                <div className="flex flex-col gap-2">
                    <Label className="text-sm text-muted-foreground">Pick days</Label>
                    <div className="flex flex-wrap gap-2">
                        {days.map((d) => (
                            <button
                                key={d.value}
                                type="button"
                                onClick={() => onDayToggle(d.value)}
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
