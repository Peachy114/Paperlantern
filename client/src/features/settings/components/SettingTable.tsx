import { Separator } from '@/components/ui/separator'
import SettingRow from './SettingRow'

interface RowItem {
    label: string
    to: string
}

interface Props {
    rows: RowItem[]
}

export default function SettingTable({ rows }: Props) {
    return (
        <div className="rounded-lg border bg-card">
            {rows.map((row, i) => (
                <div key={row.label}>
                    <SettingRow label={row.label} to={row.to} />
                    {i < rows.length - 1 && <Separator />}
                </div>
            ))}
        </div>
    )
}
