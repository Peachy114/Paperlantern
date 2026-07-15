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
    schedule: string
    scheduleTime: string
    scheduleMode: string
    selectValue: string
    selectedDays: string[]
    monthlyDay: string
    days: readonly { readonly value: string; readonly label: string }[]
    recurring: readonly string[]
    onScheduleClear: () => void
    onScheduleModeChange: (mode: string) => void
    onDayToggle: (day: string) => void
    onMonthlyDayChange: (day: string) => void
    onScheduleTimeChange: (e: any) => void
    scheduleTimeError: boolean
    fieldErrors: Record<string, string>
}

export default function CreateWorkSchedule({
    schedule,
    scheduleTime,
    scheduleMode,
    selectValue,
    selectedDays,
    monthlyDay,
    days,
    onScheduleClear,
    onScheduleModeChange,
    onDayToggle,
    onMonthlyDayChange,
    onScheduleTimeChange,
    scheduleTimeError,
    fieldErrors,
}: CreateWorkScheduleProps) {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Update Schedule */}
                <div className="flex flex-col gap-1.5">
                    <Label>Update schedule</Label>
                    <Select
                        value={selectValue}
                        onValueChange={(val) => {
                            if (val === '__none__') {
                                onScheduleClear()
                            } else if (['daily', 'weekly', 'biweekly', 'monthly'].includes(val)) {
                                onScheduleModeChange(val)
                            } else {
                                onScheduleClear()
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="No schedule" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__none__">No schedule</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <Separator className="my-1" />
                            <SelectItem value="__none__">Clear schedule</SelectItem>
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
            {(scheduleMode === 'weekly' || scheduleMode === 'biweekly') && (
                <div className="flex flex-col gap-2">
                    <Label className="text-sm text-muted-foreground">
                        {scheduleMode === 'weekly'
                            ? 'Pick one weekly update day'
                            : 'Pick two bi-weekly update days'}
                    </Label>
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

            {scheduleMode === 'monthly' && (
                <div className="flex flex-col gap-2 max-w-[220px]">
                    <Label className="text-sm text-muted-foreground">Monthly update date</Label>
                    <Select value={monthlyDay || '1'} onValueChange={onMonthlyDayChange}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 31 }, (_, index) => String(index + 1)).map(
                                (day) => (
                                    <SelectItem key={day} value={day}>
                                        Day {day}
                                    </SelectItem>
                                )
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </>
    )
}
